// src/app/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    console.log('[Guard] loading… hold redirect');
    return <div className="flex items-center justify-center min-h-screen text-white">Loading…</div>;
  }

  if (!user) {
    console.log('[Guard] NO USER → redirect to /login from', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('[Guard] OK user=', user.id, '→ render outlet');
  return <Outlet />;
}
