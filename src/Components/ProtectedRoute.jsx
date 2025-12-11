import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useContext(ShopContext);
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
