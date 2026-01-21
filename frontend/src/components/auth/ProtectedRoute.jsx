import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
