import { useContext, useMemo, useState } from 'react';
import { ShopContext } from '../Context/ShopContext';
import Title from '../Components/Title';
import { toast } from 'react-toastify';

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
  const [editingOrderKey, setEditingOrderKey] = useState('');
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [editForm, setEditForm] = useState({
    phone: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });

  const groupedOrders = useMemo(() => {
    const map = new Map();

    orders.forEach((item, index) => {
      const key = item.orderId || `${item.date}-${item.time}-${index}`;
      if (!map.has(key)) {
        const normalizedStatus = item.status === 'Order Confirmed' ? 'Confirmed' : item.status;
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

  const startEdit = (order) => {
    setEditingOrderKey(order.key);
    setEditForm({
      phone: order.deliveryInfo?.phone || '',
      street: order.deliveryInfo?.street || '',
      city: order.deliveryInfo?.city || '',
      state: order.deliveryInfo?.state || '',
      zipcode: order.deliveryInfo?.zipcode || '',
      country: order.deliveryInfo?.country || '',
    });
  };

  const cancelEdit = () => {
    setEditingOrderKey('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === 'zipcode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : name === 'phone'
          ? value.replace(/\D/g, '').slice(0, 10)
          : value;

    setEditForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const saveEdit = (order) => {
    if (!/^[6-9]\d{9}$/.test(editForm.phone) || /^(\d)\1{9}$/.test(editForm.phone)) {
      toast.error('Enter a valid authentic 10-digit phone number');
      return;
    }

    if (!/^\d{6}$/.test(editForm.zipcode)) {
      toast.error('Zipcode must be exactly 6 digits');
      return;
    }

    if (!editForm.street.trim() || !editForm.city.trim() || !editForm.state.trim() || !editForm.country.trim()) {
      toast.error('Address fields are required');
      return;
    }

    updateOrderDeliveryInfo(order.orderId, order.date, order.time, {
      phone: editForm.phone,
      street: editForm.street.trim(),
      city: editForm.city.trim(),
      state: editForm.state.trim(),
      zipcode: editForm.zipcode,
      country: editForm.country.trim(),
    });

    toast.success('Order contact details updated');
    setEditingOrderKey('');
  };

  const handlePaymentDraftChange = (orderKey, value) => {
    setPaymentDrafts((prev) => ({
      ...prev,
      [orderKey]: value,
    }));
  };

  const handleUpdatePaymentMethod = (order) => {
    const selectedPaymentMethod = paymentDrafts[order.key] || order.paymentMethod;

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    updateOrderPaymentMethod(order.orderId, order.date, order.time, selectedPaymentMethod);
    toast.success('Payment method updated');
  };

  const handleCancelOrder = (order) => {
    const isConfirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!isConfirmed) {
      return;
    }

    cancelOrder(order.orderId, order.date, order.time);
    toast.success('Order cancelled successfully');
  };

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
        {groupedOrders.map((order) => {
          const liveStatus = getOrderStatus(order.placedAt);
          const displayStatus = order.status || liveStatus;
          const isEditing = editingOrderKey === order.key;
          const selectedPaymentMethod = paymentDrafts[order.key] || order.paymentMethod;

          return (
            <div key={order.key} className="border rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                <div>
                  <p className="text-sm text-gray-700">Order ID: <span className="font-medium">{order.orderId}</span></p>
                  <p className="text-sm text-gray-600">{order.date} · {order.time}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="font-medium">{displayStatus}</span>
                </div>
              </div>

              <div className="space-y-3 mt-3">
                {order.items.map((item, idx) => (
                  <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">{currency}{item.price} · Qty {item.quantity} · Size {item.size}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p>Customer: {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}</p>
                <p>Email: {order.deliveryInfo?.email}</p>
                {!isEditing ? (
                  <>
                    <p>Phone: {order.deliveryInfo?.phone}</p>
                    <p>
                      Address: {order.deliveryInfo?.street}, {order.deliveryInfo?.city}, {order.deliveryInfo?.state}, {order.deliveryInfo?.country} - {order.deliveryInfo?.zipcode}
                    </p>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="Phone"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      name="zipcode"
                      value={editForm.zipcode}
                      onChange={handleEditChange}
                      placeholder="Zipcode"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      name="street"
                      value={editForm.street}
                      onChange={handleEditChange}
                      placeholder="Street"
                      className="border rounded px-3 py-2 sm:col-span-2"
                    />
                    <input
                      name="city"
                      value={editForm.city}
                      onChange={handleEditChange}
                      placeholder="City"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      name="state"
                      value={editForm.state}
                      onChange={handleEditChange}
                      placeholder="State"
                      className="border rounded px-3 py-2"
                    />
                    <input
                      name="country"
                      value={editForm.country}
                      onChange={handleEditChange}
                      placeholder="Country"
                      className="border rounded px-3 py-2 sm:col-span-2"
                    />
                  </div>
                )}
                <p>Payment: {order.paymentMethod}</p>
                <p>Total: {currency}{order.totalAmount}</p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPaymentMethod}
                    onChange={(event) => handlePaymentDraftChange(order.key, event.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="cod">Cash on Delivery</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="razorpay">Paytm</option>
                  </select>
                  <button
                    onClick={() => handleUpdatePaymentMethod(order)}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    Update Payment
                  </button>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => startEdit(order)}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    Update Phone & Address
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => saveEdit(order)}
                      className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
                    >
                      Save Details
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleCancelOrder(order)}
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
