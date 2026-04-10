import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

const TIMELINE_STEPS = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

const PAYMENT_METHODS = {
  cod: 'Cash on Delivery',
  phonepe: 'PhonePe',
  paytm: 'Paytm',
  razorpay: 'Razorpay',
  card: 'Card',
  upi: 'UPI',
};

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

const statusRank = (status) => {
  const ranks = {
    Confirmed: 0,
    Packed: 1,
    Shipped: 2,
    'Out for Delivery': 3,
    Delivered: 4,
    Cancelled: 5,
  };
  return ranks[normalizeStatus(status)] ?? 0;
};

const getTimelineIndex = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'Cancelled') return -1;
  if (normalized === 'Out for Delivery') return 2;
  return Math.max(0, TIMELINE_STEPS.indexOf(normalized));
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getEstimatedDeliveryDate = (placedAt, status) => {
  const base = new Date(Number(placedAt) || Date.now());
  if (Number.isNaN(base.getTime())) return 'N/A';

  const normalized = normalizeStatus(status);
  let days = 5;
  if (normalized === 'Packed') days = 4;
  if (normalized === 'Shipped') days = 2;
  if (normalized === 'Out for Delivery') days = 1;
  if (normalized === 'Delivered') days = 0;

  base.setDate(base.getDate() + days);
  return formatDate(base);
};

const normalizePaymentMethod = (method = '') => {
  const value = String(method).trim().toLowerCase();
  if (!value) return 'cod';
  if (value === 'cash on delivery') return 'cod';
  if (value === 'phone pe') return 'phonepe';
  if (value === 'razor pay') return 'razorpay';
  return value;
};

const paymentMethodLabel = (method = '') => {
  const normalized = normalizePaymentMethod(method);
  return PAYMENT_METHODS[normalized] || String(method || 'Unknown').toUpperCase();
};

const validateByCountry = (countryRaw, phoneRaw, zipcodeRaw) => {
  const country = String(countryRaw || '').trim().toLowerCase();
  const phone = String(phoneRaw || '').trim();
  const zipcode = String(zipcodeRaw || '').trim();
  const errors = {};

  const digitsPhone = phone.replace(/\D/g, '');

  if (['india', 'in', 'bharat'].includes(country)) {
    if (!/^[6-9]\d{9}$/.test(digitsPhone) || /^(\d)\1{9}$/.test(digitsPhone)) {
      errors.phone = 'Enter a valid Indian 10-digit phone number';
    }
    if (!/^\d{6}$/.test(zipcode)) {
      errors.zipcode = 'Indian zipcode must be exactly 6 digits';
    }
    return errors;
  }

  if (['united states', 'usa', 'us'].includes(country)) {
    if (!/^\d{10}$/.test(digitsPhone)) {
      errors.phone = 'US phone number must be 10 digits';
    }
    if (!/^\d{5}(-\d{4})?$/.test(zipcode)) {
      errors.zipcode = 'US ZIP must be 5 digits or ZIP+4';
    }
    return errors;
  }

  if (['united kingdom', 'uk', 'great britain', 'england'].includes(country)) {
    if (!/^\d{10,11}$/.test(digitsPhone)) {
      errors.phone = 'UK phone number must be 10-11 digits';
    }
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(zipcode)) {
      errors.zipcode = 'Enter a valid UK postcode';
    }
    return errors;
  }

  if (!/^\d{7,15}$/.test(digitsPhone)) {
    errors.phone = 'Phone number must be 7-15 digits';
  }
  if (zipcode.length < 3 || zipcode.length > 10) {
    errors.zipcode = 'Zipcode must be 3-10 characters';
  }

  return errors;
};

const buildTimelineWithTimes = (placedAt) => {
  const base = Number(placedAt) || Date.now();
  const checkpoints = [
    { label: 'Confirmed', offsetHours: 0 },
    { label: 'Packed', offsetHours: 12 },
    { label: 'Shipped', offsetHours: 36 },
    { label: 'Delivered', offsetHours: 120 },
  ];

  return checkpoints.map((checkpoint) => ({
    ...checkpoint,
    dateText: formatDateTime(base + checkpoint.offsetHours * 60 * 60 * 1000),
  }));
};

const downloadReceipt = ({ order, currency, displayStatus, summary, paymentLabel }) => {
  const lines = [
    'ZYNTRA RECEIPT',
    '-------------------------------',
    `Order ID: ${order.orderId}`,
    `Placed: ${order.date} ${order.time}`,
    `Status: ${displayStatus}`,
    `Payment: ${paymentLabel}`,
    '',
    'Items:',
    ...order.items.map((item, index) => `${index + 1}. ${item.name} | Qty ${item.quantity} | ${currency}${item.price}`),
    '',
    `Subtotal: ${currency}${summary.subtotal.toFixed(2)}`,
    `Delivery Fee: ${currency}${summary.deliveryFee.toFixed(2)}`,
    `Tax (5%): ${currency}${summary.tax.toFixed(2)}`,
    `Grand Total: ${currency}${summary.grandTotal.toFixed(2)}`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${order.orderId || order.key}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const OrderCard = ({
  order,
  currency,
  getOrderStatus,
  updateOrderDeliveryInfo,
  updateOrderPaymentMethod,
  cancelOrder,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editForm, setEditForm] = useState({
    phone: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(normalizePaymentMethod(order.paymentMethod));
  const [loadingState, setLoadingState] = useState({
    edit: false,
    payment: false,
    cancel: false,
  });

  useEffect(() => {
    setSelectedPaymentMethod(normalizePaymentMethod(order.paymentMethod));
  }, [order.paymentMethod]);

  const liveStatus = normalizeStatus(getOrderStatus(order.placedAt));
  const displayStatus = normalizeStatus(order.status === 'Cancelled' ? order.status : (liveStatus || order.status));

  const cancelBlocked =
    displayStatus === 'Shipped' ||
    displayStatus === 'Out for Delivery' ||
    displayStatus === 'Delivered' ||
    displayStatus === 'Cancelled';

  const editBlocked =
    statusRank(displayStatus) >= statusRank('Out for Delivery') || displayStatus === 'Cancelled';

  const timelineIndex = getTimelineIndex(displayStatus);
  const eta = getEstimatedDeliveryDate(order.placedAt, displayStatus);
  const timelineWithTimes = buildTimelineWithTimes(order.placedAt);

  const summary = useMemo(() => {
    const subtotal = Number(order.totalAmount || 0);
    const deliveryFee = subtotal >= 999 ? 0 : 49;
    const tax = Number((subtotal * 0.05).toFixed(2));
    const grandTotal = Number((subtotal + deliveryFee + tax).toFixed(2));
    return { subtotal, deliveryFee, tax, grandTotal };
  }, [order.totalAmount]);

  const currentStageLabel = displayStatus === 'Out for Delivery' ? 'Out for Delivery' : TIMELINE_STEPS[Math.max(0, timelineIndex)] || 'Confirmed';

  const startEdit = () => {
    if (editBlocked) {
      toast.error('Address cannot be edited after out for delivery');
      return;
    }

    setIsEditing(true);
    setEditErrors({});
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
    setIsEditing(false);
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setEditErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const saveEdit = async () => {
    if (editBlocked) {
      toast.error('Address cannot be edited after out for delivery');
      return;
    }

    const errors = {};
    if (!editForm.street.trim()) errors.street = 'Street is required';
    if (!editForm.city.trim()) errors.city = 'City is required';
    if (!editForm.state.trim()) errors.state = 'State is required';
    if (!editForm.country.trim()) errors.country = 'Country is required';

    Object.assign(errors, validateByCountry(editForm.country, editForm.phone, editForm.zipcode));
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix highlighted fields');
      return;
    }

    setLoadingState((prev) => ({ ...prev, edit: true }));
    try {
      await Promise.resolve(
        updateOrderDeliveryInfo(order.orderId, order.date, order.time, {
          phone: editForm.phone.trim(),
          street: editForm.street.trim(),
          city: editForm.city.trim(),
          state: editForm.state.trim(),
          zipcode: editForm.zipcode.trim(),
          country: editForm.country.trim(),
        }),
      );

      toast.success('Order contact details updated');
      setIsEditing(false);
      setEditErrors({});
    } catch (error) {
      toast.error(error?.message || 'Failed to update address details');
    } finally {
      setLoadingState((prev) => ({ ...prev, edit: false }));
    }
  };

  const updatePayment = async () => {
    const currentNormalized = normalizePaymentMethod(order.paymentMethod);
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === currentNormalized) {
      toast.info('Payment method is already set to this option');
      return;
    }

    setLoadingState((prev) => ({ ...prev, payment: true }));
    try {
      await Promise.resolve(updateOrderPaymentMethod(order.orderId, order.date, order.time, selectedPaymentMethod));
      toast.success('Payment method updated');
    } catch (error) {
      toast.error(error?.message || 'Failed to update payment method');
    } finally {
      setLoadingState((prev) => ({ ...prev, payment: false }));
    }
  };

  const cancelOrderAction = async () => {
    if (cancelBlocked) {
      toast.error('Order cannot be cancelled after shipment');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!isConfirmed) return;

    setLoadingState((prev) => ({ ...prev, cancel: true }));
    try {
      await Promise.resolve(cancelOrder(order.orderId, order.date, order.time));
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error(error?.message || 'Failed to cancel the order');
    } finally {
      setLoadingState((prev) => ({ ...prev, cancel: false }));
    }
  };

  const isBusy = loadingState.edit || loadingState.payment || loadingState.cancel;

  return (
    <div className="border rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <div>
          <p className="text-sm text-gray-700">Order ID: <span className="font-medium">{order.orderId}</span></p>
          <p className="text-sm text-gray-600">{order.date} | {order.time}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="font-medium">{displayStatus}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border">Current: {currentStageLabel}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Order Tracker</p>
        {displayStatus === 'Cancelled' ? (
          <p className="text-sm text-red-600">This order has been cancelled.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {timelineWithTimes.map((step, index) => {
                const completed = index <= timelineIndex;
                const current = index === timelineIndex;
                return (
                  <div
                    key={step.label}
                    className={`rounded-md border p-2 ${completed ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'} ${current ? 'ring-1 ring-black' : ''}`}
                  >
                    <p className={`text-xs font-medium ${completed ? 'text-black' : 'text-gray-500'}`}>{step.label}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{step.dateText}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-600 mt-2">Estimated delivery: {eta}</p>
          </>
        )}
      </div>

      <div className="space-y-3 mt-3">
        {order.items.map((item, idx) => (
          <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-3">
            <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-gray-600">
                {currency}
                {item.price} | Qty {item.quantity} | Size {item.size}
              </p>
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
            <div>
              <input
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                placeholder="Phone"
                className={`border rounded px-3 py-2 w-full ${editErrors.phone ? 'border-red-500' : ''}`}
              />
              {editErrors.phone && <p className="text-xs text-red-600 mt-1">{editErrors.phone}</p>}
            </div>

            <div>
              <input
                name="zipcode"
                value={editForm.zipcode}
                onChange={handleEditChange}
                placeholder="Zipcode"
                className={`border rounded px-3 py-2 w-full ${editErrors.zipcode ? 'border-red-500' : ''}`}
              />
              {editErrors.zipcode && <p className="text-xs text-red-600 mt-1">{editErrors.zipcode}</p>}
            </div>

            <div className="sm:col-span-2">
              <input
                name="street"
                value={editForm.street}
                onChange={handleEditChange}
                placeholder="Street"
                className={`border rounded px-3 py-2 w-full ${editErrors.street ? 'border-red-500' : ''}`}
              />
              {editErrors.street && <p className="text-xs text-red-600 mt-1">{editErrors.street}</p>}
            </div>

            <div>
              <input
                name="city"
                value={editForm.city}
                onChange={handleEditChange}
                placeholder="City"
                className={`border rounded px-3 py-2 w-full ${editErrors.city ? 'border-red-500' : ''}`}
              />
              {editErrors.city && <p className="text-xs text-red-600 mt-1">{editErrors.city}</p>}
            </div>

            <div>
              <input
                name="state"
                value={editForm.state}
                onChange={handleEditChange}
                placeholder="State"
                className={`border rounded px-3 py-2 w-full ${editErrors.state ? 'border-red-500' : ''}`}
              />
              {editErrors.state && <p className="text-xs text-red-600 mt-1">{editErrors.state}</p>}
            </div>

            <div className="sm:col-span-2">
              <input
                name="country"
                value={editForm.country}
                onChange={handleEditChange}
                placeholder="Country"
                className={`border rounded px-3 py-2 w-full ${editErrors.country ? 'border-red-500' : ''}`}
              />
              {editErrors.country && <p className="text-xs text-red-600 mt-1">{editErrors.country}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
        <p className="font-medium text-gray-800 mb-2">Order Summary</p>
        <div className="flex items-center justify-between text-gray-700">
          <span>Subtotal</span>
          <span>{currency}{summary.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>Delivery Fee</span>
          <span>{currency}{summary.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>Tax (5%)</span>
          <span>{currency}{summary.tax.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-gray-900 border-t pt-2 mt-2">
          <span>Grand Total</span>
          <span>{currency}{summary.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPaymentMethod}
            onChange={(event) => setSelectedPaymentMethod(normalizePaymentMethod(event.target.value))}
            className="px-3 py-2 border rounded text-sm"
            disabled={loadingState.payment}
          >
            <option value="cod">Cash on Delivery</option>
            <option value="phonepe">PhonePe</option>
            <option value="paytm">Paytm</option>
            <option value="razorpay">Razorpay</option>
          </select>
          <button
            onClick={updatePayment}
            disabled={loadingState.payment || isBusy}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingState.payment ? 'Updating...' : 'Update Payment'}
          </button>
          <button
            onClick={() =>
              downloadReceipt({
                order,
                currency,
                displayStatus,
                summary,
                paymentLabel: paymentMethodLabel(order.paymentMethod),
              })
            }
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Download Receipt
          </button>
        </div>

        {!isEditing ? (
          <button
            onClick={startEdit}
            disabled={editBlocked || isBusy}
            className={`px-4 py-2 border rounded text-sm ${editBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Update Phone & Address
          </button>
        ) : (
          <>
            <button
              onClick={saveEdit}
              disabled={loadingState.edit}
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingState.edit ? 'Saving...' : 'Save Details'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={loadingState.edit}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </>
        )}

        <button
          onClick={cancelOrderAction}
          disabled={cancelBlocked || loadingState.cancel || isBusy}
          className={`px-4 py-2 text-white rounded text-sm ${cancelBlocked ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loadingState.cancel ? 'Cancelling...' : cancelBlocked ? 'Cannot Cancel' : 'Cancel Order'}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">Payment: {paymentMethodLabel(order.paymentMethod)}</p>
    </div>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    key: PropTypes.string.isRequired,
    orderId: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    placedAt: PropTypes.number,
    paymentMethod: PropTypes.string,
    totalAmount: PropTypes.number,
    status: PropTypes.string,
    deliveryInfo: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      street: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      country: PropTypes.string,
      zipcode: PropTypes.string,
    }),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        image: PropTypes.string,
        price: PropTypes.number,
        quantity: PropTypes.number,
        size: PropTypes.string,
      }),
    ).isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  getOrderStatus: PropTypes.func.isRequired,
  updateOrderDeliveryInfo: PropTypes.func.isRequired,
  updateOrderPaymentMethod: PropTypes.func.isRequired,
  cancelOrder: PropTypes.func.isRequired,
};

export default OrderCard;
