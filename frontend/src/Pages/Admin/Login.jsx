import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext.jsx';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginAdmin } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = loginAdmin(password);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full border px-3 py-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
        <p className="mt-3 text-sm text-gray-600">Default dev password: <strong>admin123</strong></p>
      </form>
    </div>
  );
};

export default AdminLogin;
