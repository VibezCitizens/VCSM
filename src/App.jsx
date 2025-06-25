import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import CentralFeed from '@/features/feed/screens/CentralFeed';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import UploadScreen from '@/features/posts/screens/UploadScreen';
import Layout from '@/components/Layout';
import ChatRoutes from '@/features/chat/ChatRoutes';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center text-white">Loading...</div>;

  return (
    <Routes>
      {/* Public: Auth Screens */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Protected Routes */}
      {user ? (
        <>
          <Route
            path="/"
            element={
              <Layout>
                <CentralFeed />
              </Layout>
            }
          />
          <Route
            path="/me"
            element={
              <Layout title={false}>
                <ProfileScreen />
              </Layout>
            }
          />
          <Route
            path="/u/:username"
            element={
              <Layout>
                <ProfileScreen />
              </Layout>
            }
          />
          <Route
            path="/upload"
            element={
              <Layout title="New Post">
                <UploadScreen />
              </Layout>
            }
          />
          <Route
            path="/chat/*"
            element={
              <Layout>
                <ChatRoutes />
              </Layout>
            }
          />
        </>
      ) : (
        // Redirect to login if not authenticated
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
