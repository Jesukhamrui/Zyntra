import { Navigate } from 'react-router-dom';

const CustomerRoute = ({ children }) => {
  try {
    const isLoggedIn = localStorage.getItem('isCustomerLoggedIn') === '1';
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default CustomerRoute;
