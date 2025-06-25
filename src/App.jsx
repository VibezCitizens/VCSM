import { Routes, Route } from 'react-router-dom';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import CentralFeed from '@/features/feed/screens/CentralFeed';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import UploadScreen from '@/features/posts/screens/UploadScreen'; // ✅ Updated
import Layout from '@/components/Layout';
import ChatRoutes from '@/features/chat/ChatRoutes';

export default function App() {
  return (
    <Routes>
      {/* Auth Screens (No layout) */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Main Routes (With Layout) */}
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
    </Routes>
  );
}
