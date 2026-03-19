import { useContext, useMemo, useState } from 'react';
import { ShopContext } from '../../Context/ShopContext.jsx';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const {
    products,
    orders,
    logoutAdmin,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    currency,
  } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'add'
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: [],
    category: '',
    subCategory: '',
    sizes: [],
    bestseller: false,
  });

  const categories = ['Men', 'Women', 'Kids'];
  const subCategories = ['Topwear', 'Bottomwear', 'Winterwear'];
  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const statusOptions = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

  const groupedOrders = useMemo(() => {
    const orderMap = new Map();

    orders.forEach((item, index) => {
      const key = item.orderId || `${item.date}-${item.time}-${index}`;
      if (!orderMap.has(key)) {
        const normalizedStatus = item.status === 'Order Confirmed' ? 'Confirmed' : item.status;

        orderMap.set(key, {
          key,
          orderId: item.orderId || 'N/A',
          date: item.date || 'N/A',
          time: item.time || 'N/A',
          status: normalizedStatus || 'Confirmed',
          paymentMethod: item.paymentMethod || 'N/A',
          deliveryInfo: item.deliveryInfo,
          items: [],
          totalAmount: 0,
        });
      }

      const orderGroup = orderMap.get(key);
      orderGroup.items.push(item);
      orderGroup.totalAmount += (item.price || 0) * (item.quantity || 0);
    });

    return Array.from(orderMap.values()).reverse();
  }, [orders]);

  const handleOrderStatusChange = (orderGroup, status) => {
    updateOrderStatus(orderGroup.orderId, orderGroup.date, orderGroup.time, status);
    toast.success(`Order status updated to ${status}`);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleImageInput = (e) => {
    const value = e.target.value;
    const urls = value.split(',').map((url) => url.trim()).filter((url) => url);
    setFormData((prev) => ({ ...prev, image: urls }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image: [],
      category: '',
      subCategory: '',
      sizes: [],
      bestseller: false,
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category || formData.sizes.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    const productData = {
      ...formData,
      price: Number(formData.price),
      date: Date.now(),
    };

    if (editingProduct) {
      updateProduct(editingProduct._id, productData);
      toast.success('Product updated successfully');
    } else {
      addProduct(productData);
      toast.success('Product added successfully');
    }

    resetForm();
    setActiveTab('products');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image || [],
      category: product.category,
      subCategory: product.subCategory,
      sizes: product.sizes || [],
      bestseller: product.bestseller || false,
    });
    setActiveTab('add');
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
      toast.success('Product deleted successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded shadow">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => {
            logoutAdmin();
            toast.info('Logged out successfully');
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-gray-900">{products ? products.length : 0}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Orders</h2>
          <p className="text-3xl font-bold text-gray-900">{groupedOrders.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Revenue</h2>
          <p className="text-3xl font-bold text-gray-900">
            {currency}
            {orders ? orders.reduce((sum, order) => sum + (order.price * order.quantity), 0) : 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'products'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
            className={`px-6 py-3 font-medium ${
              activeTab === 'add'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">All Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Image</th>
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Category</th>
                      <th className="border p-2 text-left">Price</th>
                      <th className="border p-2 text-left">Sizes</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products && products.length > 0 ? (
                      products.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="border p-2">
                            {product.image && product.image[0] ? (
                              <img
                                src={product.image[0]}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="border p-2 font-medium">{product.name}</td>
                          <td className="border p-2">
                            {product.category} / {product.subCategory}
                          </td>
                          <td className="border p-2">
                            {currency}
                            {product.price}
                          </td>
                          <td className="border p-2">{product.sizes?.join(', ')}</td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="border p-4 text-center text-gray-500">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">All Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Order ID</th>
                      <th className="border p-2 text-left">Items</th>
                      <th className="border p-2 text-left">Customer</th>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Payment</th>
                      <th className="border p-2 text-left">Status</th>
                      <th className="border p-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedOrders.length > 0 ? (
                      groupedOrders.map((orderGroup) => (
                        <tr key={orderGroup.key} className="hover:bg-gray-50">
                          <td className="border p-2">{orderGroup.orderId}</td>
                          <td className="border p-2">
                            {orderGroup.items.length} item{orderGroup.items.length > 1 ? 's' : ''}
                          </td>
                          <td className="border p-2">
                            {orderGroup.deliveryInfo
                              ? `${orderGroup.deliveryInfo.firstName} ${orderGroup.deliveryInfo.lastName}`
                              : 'N/A'}
                          </td>
                          <td className="border p-2">
                            {orderGroup.date} · {orderGroup.time}
                          </td>
                          <td className="border p-2">{orderGroup.paymentMethod}</td>
                          <td className="border p-2">
                            <select
                              value={orderGroup.status}
                              onChange={(event) => handleOrderStatusChange(orderGroup, event.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              {statusOptions.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                  {statusOption}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border p-2 font-semibold">
                            {currency}
                            {orderGroup.totalAmount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="border p-4 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add/Edit Product Tab */}
          {activeTab === 'add' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows="4"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sub Category</label>
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sizes <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`px-4 py-2 border rounded ${
                          formData.sizes.includes(size)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Image URLs (comma separated)
                  </label>
                  <textarea
                    value={formData.image.join(', ')}
                    onChange={handleImageInput}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows="3"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter multiple image URLs separated by commas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="bestseller"
                    checked={formData.bestseller}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Mark as Bestseller</label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
