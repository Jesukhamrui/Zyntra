import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import { toast } from 'react-toastify';

const mockUser = {
  name: 'Guest User',
  location: 'Bangalore, India',
  email: 'guest@example.com',
  nationality: 'Indian',
  dateOfBirth: '01 Jan 1998',
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    wishlistProducts,
    currency,
    toggleWishlist,
    orders,
    getOrderStatus,
    updateOrderDeliveryInfo,
    updateOrderPaymentMethod,
    cancelOrder,
  } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [statusTick, setStatusTick] = useState(0);
  const [expandedOrderKey, setExpandedOrderKey] = useState('');
  const [editingOrderKey, setEditingOrderKey] = useState('');
  const [orderEditForm, setOrderEditForm] = useState({
    phone: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });
  const currentStatusTime = Date.now();
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('customerProfile');
      if (!saved) return mockUser;
      return { ...mockUser, ...JSON.parse(saved) };
    } catch {
      return mockUser;
    }
  });
  const [editData, setEditData] = useState(userData);

  useEffect(() => {
    try {
      if (localStorage.getItem('isCustomerLoggedIn') !== '1') {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'orders') {
      setActiveTab('orders');
    }
  }, [location.search]);

  useEffect(() => {
    const syncProfileData = (event) => {
      if (event.key !== 'customerProfile') return;
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : mockUser;
        const updated = { ...mockUser, ...parsed };
        setUserData(updated);
        setEditData(updated);
      } catch {
        // ignore malformed storage values
      }
    };

    window.addEventListener('storage', syncProfileData);
    return () => window.removeEventListener('storage', syncProfileData);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusTick((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const groupedOrders = useMemo(() => {
    const groupMap = new Map();

    orders.forEach((item, index) => {
      const key = item.orderId || `${item.date}-${item.time}-${index}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          orderId: item.orderId || key,
          orderKey: key,
          date: item.date,
          time: item.time,
          paymentMethod: item.paymentMethod,
          status: item.status,
          placedAt: Number(item.placedAt) || Number((item.orderId || '').replace('ORD-', '')) || Date.now(),
          deliveryInfo: item.deliveryInfo,
          items: [],
          totalAmount: 0,
        });
      }

      const group = groupMap.get(key);
      group.items.push(item);
      group.totalAmount += item.price * item.quantity;
    });

    return Array.from(groupMap.values()).reverse();
  }, [orders]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    const updatedProfile = {
      ...userData,
      ...editData,
      name: editData.name.trim() || userData.name,
      email: editData.email.trim() || userData.email,
      location: editData.location.trim() || userData.location,
      nationality: editData.nationality.trim() || userData.nationality,
      dateOfBirth: editData.dateOfBirth.trim() || userData.dateOfBirth,
    };

    setUserData(updatedProfile);
    setEditData(updatedProfile);
    setIsEditing(false);

    try {
      localStorage.setItem('customerProfile', JSON.stringify(updatedProfile));
    } catch {
      // ignore storage errors
    }
  };

  const handleCancelEdit = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const startOrderEdit = (order) => {
    setEditingOrderKey(order.orderKey);
    setOrderEditForm({
      phone: order.deliveryInfo?.phone || '',
      street: order.deliveryInfo?.street || '',
      city: order.deliveryInfo?.city || '',
      state: order.deliveryInfo?.state || '',
      zipcode: order.deliveryInfo?.zipcode || '',
      country: order.deliveryInfo?.country || '',
    });
  };

  const handleOrderEditChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue =
      name === 'zipcode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : name === 'phone'
          ? value.replace(/\D/g, '').slice(0, 10)
          : value;

    setOrderEditForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const saveOrderEdit = (order) => {
    if (!/^[6-9]\d{9}$/.test(orderEditForm.phone) || /^(\d)\1{9}$/.test(orderEditForm.phone)) {
      toast.error('Enter a valid authentic 10-digit phone number');
      return;
    }
    if (!/^\d{6}$/.test(orderEditForm.zipcode)) {
      toast.error('Zipcode must be exactly 6 digits');
      return;
    }
    if (!orderEditForm.street.trim() || !orderEditForm.city.trim() || !orderEditForm.state.trim() || !orderEditForm.country.trim()) {
      toast.error('All address fields are required');
      return;
    }

    updateOrderDeliveryInfo(order.orderId, order.date, order.time, {
      phone: orderEditForm.phone,
      street: orderEditForm.street.trim(),
      city: orderEditForm.city.trim(),
      state: orderEditForm.state.trim(),
      zipcode: orderEditForm.zipcode,
      country: orderEditForm.country.trim(),
    });

    setEditingOrderKey('');
    toast.success('Order details updated');
  };

  const handlePayOnline = (order) => {
    updateOrderPaymentMethod(order.orderId, order.date, order.time, 'Online Paid');
    toast.success('Payment updated to Online Paid');
  };

  const handleCancelOrder = (order) => {
    cancelOrder(order.orderId, order.date, order.time);
    setExpandedOrderKey('');
    setEditingOrderKey('');
    toast.success('Order cancelled and removed');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('isCustomerLoggedIn');
    } catch {
      // ignore storage errors
    }
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 border rounded-2xl p-4 h-fit">
          <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'personal' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Personal Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'wishlist' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Wishlist
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'help' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Help Center
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'personal' && (
            <div className="border rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-2">Personal details</h2>
              <p className="text-gray-600 mb-6">Edit your personal details</p>

              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">👤</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Full name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="mt-1 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="font-medium">{userData.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Location</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={editData.location}
                        onChange={handleEditChange}
                        className="mt-1 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="font-medium">{userData.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Email</span>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        className="mt-1 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="font-medium">{userData.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Nationality</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nationality"
                        value={editData.nationality}
                        onChange={handleEditChange}
                        className="mt-1 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="font-medium">{userData.nationality}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <span className="text-gray-500 text-sm">Date of birth</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="dateOfBirth"
                        value={editData.dateOfBirth}
                        onChange={handleEditChange}
                        className="mt-1 border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <p className="font-medium">{userData.dateOfBirth}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border rounded text-sm"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-black text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="border rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-2">Saved properties</h2>
              <p className="text-gray-600 mb-6">Manage your wishlist</p>

              {wishlistProducts.length === 0 && (
                <div className="rounded-2xl border bg-gray-50 p-6 text-gray-600">
                  No saved items yet. Explore products and tap the heart icon to save.
                </div>
              )}

              {wishlistProducts.length > 0 && (
                <div className="space-y-4">
                  {wishlistProducts.map((product) => (
                    <div key={product._id} className="rounded-2xl border p-4 flex items-center gap-4">
                      <div className="w-28 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={product.image[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.category} · {product.subCategory} · {currency}
                          {product.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/product/${product._id}`}
                          className="px-4 py-2 rounded-full border hover:bg-gray-100 transition text-sm"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product._id)}
                          className="px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="border rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-2">My Orders</h2>
              <p className="text-gray-600 mb-6">Track your recent purchases</p>

              {groupedOrders.length === 0 && (
                <div className="rounded-2xl border bg-gray-50 p-6 text-gray-600">
                  <p className="mb-4">You have not placed any orders yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/collection')}
                    className="bg-black text-white px-5 py-2 text-sm hover:bg-gray-800 transition"
                  >
                    SHOP NOW
                  </button>
                </div>
              )}

              {groupedOrders.length > 0 && (
                <div className="space-y-4">
                  {groupedOrders.map((order) => (
                    <div
                      key={order.orderKey}
                      className="rounded-2xl border p-4"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedOrderKey((prev) => (prev === order.orderKey ? '' : order.orderKey))}
                        className="w-full text-left border-b pb-3 mb-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex gap-3 items-start">
                            <div className="flex -space-x-2 pt-1">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <img
                                  key={`${item._id}-${idx}`}
                                  src={item.image}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-full border-2 border-white object-cover bg-white"
                                />
                              ))}
                            </div>

                            <div>
                              <p className="text-sm text-gray-700">
                                Order ID: <span className="font-medium">{order.orderId}</span>
                              </p>
                              <p className="text-sm text-gray-600">{order.date} · {order.time}</p>
                              <p className="text-sm text-gray-600">Payment: {order.paymentMethod}</p>
                              <p className="text-sm text-gray-600">
                                Items: {order.items.length} · Status: {getOrderStatus(order.placedAt, currentStatusTime + statusTick) || order.status}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm text-gray-700 text-right">
                            <p>
                              Total: <span className="font-semibold">{currency}{order.totalAmount}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {expandedOrderKey === order.orderKey ? 'Hide options' : 'Tap to view options'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-600">
                          <p>
                            {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName} · {order.deliveryInfo?.phone}
                          </p>
                          <p className="truncate">
                            {order.deliveryInfo?.street}, {order.deliveryInfo?.city}, {order.deliveryInfo?.state}
                          </p>
                        </div>
                      </button>

                      {expandedOrderKey === order.orderKey && (
                        <>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-4">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">{item.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {currency}
                                    {item.price} · Qty: {item.quantity} · Size: {item.size}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.deliveryInfo && (
                            <div className="text-sm text-gray-600 mt-3 space-y-1">
                              <p>Customer: {order.deliveryInfo.firstName} {order.deliveryInfo.lastName}</p>
                              <p>Email: {order.deliveryInfo.email}</p>

                              {editingOrderKey !== order.orderKey ? (
                                <>
                                  <p>Phone: {order.deliveryInfo.phone}</p>
                                  <p>
                                    Address: {order.deliveryInfo.street}, {order.deliveryInfo.city}, {order.deliveryInfo.state}, {order.deliveryInfo.country} - {order.deliveryInfo.zipcode}
                                  </p>
                                </>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  <input
                                    name="phone"
                                    value={orderEditForm.phone}
                                    onChange={handleOrderEditChange}
                                    placeholder="Phone"
                                    className="border rounded px-3 py-2"
                                  />
                                  <input
                                    name="zipcode"
                                    value={orderEditForm.zipcode}
                                    onChange={handleOrderEditChange}
                                    placeholder="Zipcode"
                                    className="border rounded px-3 py-2"
                                  />
                                  <input
                                    name="street"
                                    value={orderEditForm.street}
                                    onChange={handleOrderEditChange}
                                    placeholder="Street"
                                    className="border rounded px-3 py-2 sm:col-span-2"
                                  />
                                  <input
                                    name="city"
                                    value={orderEditForm.city}
                                    onChange={handleOrderEditChange}
                                    placeholder="City"
                                    className="border rounded px-3 py-2"
                                  />
                                  <input
                                    name="state"
                                    value={orderEditForm.state}
                                    onChange={handleOrderEditChange}
                                    placeholder="State"
                                    className="border rounded px-3 py-2"
                                  />
                                  <input
                                    name="country"
                                    value={orderEditForm.country}
                                    onChange={handleOrderEditChange}
                                    placeholder="Country"
                                    className="border rounded px-3 py-2 sm:col-span-2"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm mt-3">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>{getOrderStatus(order.placedAt, currentStatusTime + statusTick) || order.status}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {editingOrderKey !== order.orderKey ? (
                              <button
                                type="button"
                                onClick={() => startOrderEdit(order)}
                                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                              >
                                Update Phone & Address
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => saveOrderEdit(order)}
                                  className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
                                >
                                  Save Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOrderKey('')}
                                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {String(order.paymentMethod).toLowerCase() === 'cod' && (
                              <button
                                type="button"
                                onClick={() => handlePayOnline(order)}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Pay Online Instead
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                            >
                              Cancel Order
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="border rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-2">Help Center</h2>
              <p className="text-gray-600 mb-6">Get quick support for orders, returns, and account issues</p>

              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold mb-2">Quick Help</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Where is my order? Check status in My Orders.</li>
                    <li>• Need a return? Contact support within 7 days of delivery.</li>
                    <li>• Payment issue? Share order ID for faster resolution.</li>
                  </ul>
                </div>

                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold mb-2">Contact Support</h3>
                  <p className="text-sm text-gray-600">Email: support@zyntra.com</p>
                  <p className="text-sm text-gray-600">Phone: +91 98765 43210</p>
                  <p className="text-sm text-gray-600">Hours: Mon - Sat, 9:00 AM - 7:00 PM</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    View Full Orders Page
                  </button>
                  <a
                    href="mailto:support@zyntra.com"
                    className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
