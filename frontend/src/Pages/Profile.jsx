import { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';

const mockUser = {
  name: 'Guest User',
  location: 'Bangalore, India',
  email: 'guest@example.com',
  nationality: 'Indian',
  dateOfBirth: '01 Jan 1998',
};

const Profile = () => {
  const navigate = useNavigate();
  const { wishlistProducts, currency, toggleWishlist } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const userData = useMemo(() => {
    try {
      const saved = localStorage.getItem('customerProfile');
      if (!saved) return mockUser;
      const parsed = JSON.parse(saved);
      return {
        ...mockUser,
        ...parsed,
      };
    } catch {
      return mockUser;
    }
  }, []);

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
                    <p className="font-medium">{userData.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-gray-500 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Location</span>
                    <p className="font-medium">{userData.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-gray-500 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Email</span>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-gray-500 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <span className="text-gray-500 text-sm">Nationality</span>
                    <p className="font-medium">{userData.nationality}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-gray-500 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <span className="text-gray-500 text-sm">Date of birth</span>
                    <p className="font-medium">{userData.dateOfBirth}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="text-gray-500 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {isEditing && (
                <p className="text-sm text-gray-500 mt-4">
                  Basic profile page is enabled. Edit mode UI can be expanded next.
                </p>
              )}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
