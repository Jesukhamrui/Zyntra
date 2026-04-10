import { useContext, useMemo } from 'react';
import { ShopContext } from '../Context/ShopContext';
import Title from '../Components/Title';
import OrderCard from '../Components/OrderCard';

const normalizeStatus = (status = '') => {
  const value = String(status).trim().toLowerCase();
  if (!value) return 'Confirmed';
  if (value === 'order confirmed') return 'Confirmed';
  if (value === 'out for delivery' || value === 'out-for-delivery') return 'Out for Delivery';
  if (value === 'canceled' || value === 'cancelled') return 'Cancelled';
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'packed') return 'Packed';
  if (value === 'shipped') return 'Shipped';
  if (value === 'delivered') return 'Delivered';
  return status;
};

const Orders = () => {
  const {
    orders,
    currency,
    getOrderStatus,
    updateOrderDeliveryInfo,
    updateOrderPaymentMethod,
    cancelOrder,
    navigate,
  } = useContext(ShopContext);

  const groupedOrders = useMemo(() => {
    const map = new Map();

    orders.forEach((item, index) => {
      const key = item.orderId || `${item.date}-${item.time}-${index}`;
      if (!map.has(key)) {
        const normalizedStatus = normalizeStatus(item.status);
        map.set(key, {
          key,
          orderId: item.orderId || 'N/A',
          date: item.date,
          time: item.time,
          placedAt: Number(item.placedAt) || Date.now(),
          paymentMethod: item.paymentMethod,
          status: normalizedStatus || 'Confirmed',
          deliveryInfo: item.deliveryInfo,
          items: [],
          totalAmount: 0,
        });
      }

      const group = map.get(key);
      group.items.push(item);
      group.totalAmount += item.price * item.quantity;
    });

    return Array.from(map.values()).reverse();
  }, [orders]);

  if (groupedOrders.length === 0) {
    return (
      <div className="border-t pt-16 min-h-[70vh]">
        <div className="text-2xl mb-6">
          <Title text1={'MY'} text2={'ORDERS'} />
        </div>
        <div className="border rounded-md p-6 text-center text-gray-600">
          <p className="mb-4">You have not placed any orders yet.</p>
          <button
            onClick={() => navigate('/collection')}
            className="bg-black text-white px-6 py-2 text-sm hover:bg-gray-800 transition"
          >
            SHOP NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-16">
      <div className="text-2xl mb-6">
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div className="space-y-5">
        {groupedOrders.map((order) => (
          <OrderCard
            key={order.key}
            order={order}
            currency={currency}
            getOrderStatus={getOrderStatus}
            updateOrderDeliveryInfo={updateOrderDeliveryInfo}
            updateOrderPaymentMethod={updateOrderPaymentMethod}
            cancelOrder={cancelOrder}
          />
        ))}
      </div>
    </div>
  );
};

export default Orders;
