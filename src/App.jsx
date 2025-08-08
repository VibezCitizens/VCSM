// src/App.jsx
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
import SingleVideoEntryScreen from '@/features/profile/tabs/SingleVideoEntryScreen';
import Notifications from '@/features/notificationcenter/Notifications';
import NotiViewStoryScreen from '@/features/notificationcenter/NotiViewStoryScreen';
import NotiViewPostScreen from '@/features/notificationcenter/NotiViewPostScreen';
import NotiViewMessageScreen from '@/features/notificationcenter/NotiViewMessageScreen';

// VGrid (map) Screen
import VGridScreen from '@/features/vgrid/VGridScreen';

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
          {/* Core App Screens */}
          <Route path="/" element={<Layout><CentralFeed /></Layout>} />
          <Route path="/me" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/profile/:userId" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/upload" element={<Layout><UploadScreen /></Layout>} />

          {/* Chat */}
          <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />

          <Route path="/settings" element={<Layout><SettingsScreen /></Layout>} />
          <Route path="/explore" element={<Layout><ExploreScreen /></Layout>} />
          <Route path="/void" element={<Layout><VoidScreen /></Layout>} />
          <Route path="/video/:videoId" element={<Layout><SingleVideoEntryScreen /></Layout>} />

          {/* Notifications */}
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/noti/story/:storyId" element={<Layout><NotiViewStoryScreen /></Layout>} />
          <Route path="/noti/post/:postId" element={<Layout><NotiViewPostScreen /></Layout>} />
          <Route path="/noti/message/:conversationId" element={<Layout><NotiViewMessageScreen /></Layout>} />

          {/* VGrid Map */}
          <Route path="/vgrid" element={<Layout><VGridScreen /></Layout>} />
        </>
      ) : (
        // If not authenticated, redirect everything to login
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
