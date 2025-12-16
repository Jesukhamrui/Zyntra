import { useContext, useState } from 'react';
import Title from '../Components/Title';
import { ShopContext } from '../Context/ShopContext';

const Orders = () => {
  const { orders, currency } = useContext(ShopContext);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openOrderModal = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="pt-16 border-t">
      <div className="mb-8 text-2xl">
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-10">You have no orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b">
                <div>
                  <p className="font-semibold text-lg">Order #{index + 1}</p>
                  <p className="text-gray-600 text-sm">
                    {order.date || 'N/A'} {order.time ? `at ${order.time}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <p className="min-w-2 h-2 rounded-full bg-green-400"></p>
                  <p className="text-sm font-medium">{order.status || 'Ready to ship'}</p>
                </div>
              </div>

              {/* Product Details */}
              <div className="flex gap-4 sm:gap-6 mb-4 pb-4 border-b">
                {order.image && (
                  <img
                    src={order.image}
                    alt={order.name}
                    className="w-16 sm:w-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-base sm:text-lg">{order.name || 'Product'}</p>
                  <div className="grid grid-cols-2 sm:flex sm:gap-6 gap-2 text-sm text-gray-600 mt-2">
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">
                        {currency}
                        {order.price || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">{order.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Size</p>
                      <p className="font-semibold">{order.size || 'N/A'}</p>
                    </div>
                    {order.paymentMethod && (
                      <div>
                        <p className="text-gray-500">Payment</p>
                        <p className="font-semibold capitalize">
                          {order.paymentMethod === 'cod'
                            ? 'Cash on Delivery'
                            : order.paymentMethod}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {order.deliveryInfo ? (
                <div className="mb-4 pb-4 border-b">
                  <p className="font-medium text-sm text-gray-700 mb-2">
                    Delivery Address
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryInfo.firstName} {order.deliveryInfo.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryInfo.street}, {order.deliveryInfo.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryInfo.state} - {order.deliveryInfo.zipcode},
                    {order.deliveryInfo.country}
                  </p>
                  <p className="text-sm text-gray-600">Ph: {order.deliveryInfo.phone}</p>
                </div>
              ) : null}

              {/* Order Total */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Order Total</p>
                  <p className="text-lg font-semibold">
                    {currency}
                    {(order.price || 0) * (order.quantity || 1)}
                  </p>
                </div>
                <button
                  onClick={() => openOrderModal(order)}
                  className="border border-gray-400 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition"
                >
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Track Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-100 border-b p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-semibold">Order Tracking</h2>
              <button
                onClick={closeOrderModal}
                className="text-2xl font-bold text-gray-600 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Number and Status */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-600 text-sm">Order ID</p>
                    <p className="font-semibold text-lg">{selectedOrder._id || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Order Date</p>
                    <p className="font-semibold">
                      {selectedOrder.date || 'N/A'} {selectedOrder.time ? `at ${selectedOrder.time}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <p className="min-w-2 h-2 rounded-full bg-green-400"></p>
                  <p className="font-medium">{selectedOrder.status || 'Ready to ship'}</p>
                </div>
              </div>

              {/* Product Information */}
              <div className="border rounded p-4">
                <h3 className="font-semibold text-lg mb-4">Product Information</h3>
                <div className="flex gap-4">
                  {selectedOrder.image && (
                    <img
                      src={selectedOrder.image}
                      alt={selectedOrder.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-lg">{selectedOrder.name || 'Product'}</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-semibold">
                          {currency}
                          {selectedOrder.price || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <p className="font-semibold">{selectedOrder.quantity || 1}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Size</p>
                        <p className="font-semibold">{selectedOrder.size || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-semibold">
                          {currency}
                          {(selectedOrder.price || 0) * (selectedOrder.quantity || 1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.deliveryInfo && (
                <div className="border rounded p-4">
                  <h3 className="font-semibold text-lg mb-3">Delivery Address</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Name:</span> {selectedOrder.deliveryInfo.firstName}{' '}
                      {selectedOrder.deliveryInfo.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {selectedOrder.deliveryInfo.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {selectedOrder.deliveryInfo.phone}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span> {selectedOrder.deliveryInfo.street}
                    </p>
                    <p>
                      {selectedOrder.deliveryInfo.city}, {selectedOrder.deliveryInfo.state}{' '}
                      {selectedOrder.deliveryInfo.zipcode}
                    </p>
                    <p>{selectedOrder.deliveryInfo.country}</p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {selectedOrder.paymentMethod && (
                <div className="border rounded p-4">
                  <h3 className="font-semibold text-lg mb-3">Payment Method</h3>
                  <p className="text-sm capitalize">
                    {selectedOrder.paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : selectedOrder.paymentMethod}
                  </p>
                </div>
              )}

              {/* Order Status Timeline */}
              <div className="border rounded p-4">
                <h3 className="font-semibold text-lg mb-4">Order Status</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.date} {selectedOrder.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="min-w-4 h-4 rounded-full bg-green-500 mt-1"></div>
                    <div>
                      <p className="font-medium">Ready to Ship</p>
                      <p className="text-sm text-gray-600">Processing your order</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="min-w-4 h-4 rounded-full bg-gray-300 mt-1"></div>
                    <div>
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="min-w-4 h-4 rounded-full bg-gray-300 mt-1"></div>
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-100 border-t p-4 sm:p-6 flex gap-3 justify-end">
              <button
                onClick={closeOrderModal}
                className="border border-gray-400 px-6 py-2 rounded font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
