import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, refreshAccessToken, logout } = useAuthStore();

  // Step 1 — wait for Zustand to finish reading from localStorage
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  // Step 2 — track whether we've finished the silent token refresh
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    }
  }, [hydrated]);

  // After hydration: if authenticated but no in-memory token (page was refreshed),
  // do a silent refresh using the httpOnly cookie before rendering any children.
  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      // Not logged in — no need to refresh; the redirect handles it.
      setTokenReady(true);
      return;
    }

    // Tokens are stored in memory only (not persisted) — they're lost on every
    // page reload. Check if we already have one (SPA navigation won't need refresh).
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      setTokenReady(true);
      return;
    }

    // No in-memory token → attempt silent refresh via httpOnly cookie.
    refreshAccessToken()
      .then(() => setTokenReady(true))
      .catch(() => {
        // Cookie expired / invalid — clean logout then redirect.
        logout();
        setTokenReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Show spinner while hydrating or during silent refresh
  if (!hydrated || !tokenReady) return <Spinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role && user?.role !== role) return <Navigate to={`/${user?.role}`} replace />;

  return children;
};

export default ProtectedRoute;

