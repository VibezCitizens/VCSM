import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Public Screens
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';

// Main Screens
import CentralFeed from '@/features/feed/screens/CentralFeed';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import UploadScreen from '@/features/posts/screens/UploadScreen';
import ChatRoutes from '@/features/chat/ChatRoutes';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import VoidScreen from '@/TheVoid/VoidScreen.jsx';

import ExploreScreen from '@/features/explore/ExploreScreen';
import UploadVideoScreen from '@/features/explore/components/UploadVideoScreen';


// Layout
import Layout from '@/components/Layout';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-lg">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/reset" element={<ResetPasswordScreen />} />

      {/* Protected Routes */}
      {user ? (
        <>
          <Route path="/" element={<Layout><CentralFeed /></Layout>} />
          <Route path="/me" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/profile/:userId" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/upload" element={<Layout><UploadScreen /></Layout>} />
          <Route path="/upload/video" element={<Layout><UploadVideoScreen /></Layout>} /> {/* ✅ NEW */}
          <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />
          <Route path="/settings" element={<Layout><SettingsScreen /></Layout>} />
          <Route path="/explore" element={<Layout><ExploreScreen /></Layout>} />
          <Route path="/void" element={<Layout><VoidScreen /></Layout>} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
