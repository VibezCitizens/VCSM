import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

import CentralFeed from '@/features/feed/screens/CentralFeed';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import UploadScreen from '@/features/posts/screens/UploadScreen';
import ChatRoutes from '@/features/chat/ChatRoutes';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';

import VoidScreen from '@/TheVoid/VoidScreen';

import Layout from '@/components/Layout';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center text-white">Loading...</div>;

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/reset" element={<ResetPasswordScreen />} />

      {/* Protected Routes */}
      {user ? (
        <>
          <Route path="/" element={<Layout><CentralFeed /></Layout>} />
          <Route path="/me" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/upload" element={<Layout><UploadScreen /></Layout>} />
          <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />
          <Route path="/settings" element={<Layout><SettingsScreen /></Layout>} />

          {/* The Void */}
          <Route path="/void" element={<Layout><VoidScreen /></Layout>} />
        </>
      ) : (
        // Redirect if not authenticated
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
