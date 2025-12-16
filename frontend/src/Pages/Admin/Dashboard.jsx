import { useContext } from 'react';
import { ShopContext } from '../../Context/ShopContext.jsx';

const AdminDashboard = () => {
  const { products, orders, logoutAdmin } = useContext(ShopContext);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>
          <button
            onClick={logoutAdmin}
            className="px-3 py-1 bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Products</h2>
          <p>{products ? products.length : 0} items</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Orders</h2>
          <p>{orders ? orders.length : 0} entries</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
