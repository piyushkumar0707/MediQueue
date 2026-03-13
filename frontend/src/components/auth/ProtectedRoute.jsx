import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, accessToken, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isTokenExpired(accessToken)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/${user?.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
