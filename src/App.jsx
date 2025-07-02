// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

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
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/reset" element={<ResetPasswordScreen />} />

      {user ? (
        <>
          <Route path="/" element={<Layout><CentralFeed /></Layout>} />
          <Route path="/me" element={<Layout title={false}><ProfileScreen /></Layout>} />
          <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/upload" element={<Layout title="New Post"><UploadScreen /></Layout>} />
          <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
