// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Layout
import Layout from '@/components/Layout';

// ------- Helpers -------
function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="bg-black text-white min-h-[100dvh] overflow-y-auto flex items-center justify-center">
      {label}
    </div>
  );
}

// Auth guards
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function RedirectIfAuth() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ✅ Legacy redirect that actually substitutes :id
function VPortLegacyRedirect() {
  const { id } = useParams();
  const target = id ? `/vports/${id}` : '/vports';
  return <Navigate to={target} replace />;
}

// ------- Lazy screens -------
// Public
const LoginScreen = lazy(() => import('@/features/auth/screens/LoginScreen'));
const RegisterScreen = lazy(() => import('@/features/auth/screens/RegisterScreen'));
const ResetPasswordScreen = lazy(() => import('@/features/auth/screens/ResetPasswordScreen'));

// Core App
const CentralFeed = lazy(() => import('@/features/feed/screens/CentralFeed'));
const ProfileScreen = lazy(() => import('@/features/profile/screens/ProfileScreen'));
const UploadScreen = lazy(() => import('@/features/posts/screens/UploadScreen'));
const ChatRoutes = lazy(() => import('@/features/chat/ChatRoutes'));
const SettingsScreen = lazy(() => import('@/features/settings/screens/SettingsScreen'));
const VoidScreen = lazy(() => import('@/TheVoid/VoidScreen.jsx'));
const ExploreScreen = lazy(() => import('@/features/explore/ExploreScreen'));
const SingleVideoEntryScreen = lazy(() => import('@/features/profile/tabs/SingleVideoEntryScreen'));

// Notifications
const Notifications = lazy(() => import('@/features/notificationcenter/Notifications'));
const NotiViewStoryScreen = lazy(() => import('@/features/notificationcenter/NotiViewStoryScreen'));
const NotiViewPostScreen = lazy(() => import('@/features/notificationcenter/NotiViewPostScreen'));
const NotiViewMessageScreen = lazy(() => import('@/features/notificationcenter/NotiViewMessageScreen'));

// VGrid
const VGridScreen = lazy(() => import('@/features/vgrid/VGridScreen'));

// ✅ VPorts — import each file directly
const VPortList   = lazy(() => import('@/features/vport/VPortList'));
const VPortCreate = lazy(() => import('@/features/vport/VPortCreate'));
const VPortDetail = lazy(() => import('@/features/vport/VPortDetail'));
const VPortEdit   = lazy(() => import('@/features/vport/VPortEdit'));

// 404
function NotFoundScreen() {
  return (
    <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-bold">404 — Not Found</h1>
        <p className="opacity-80">The page you’re looking for doesn’t exist.</p>
        <a
          href="/"
          className="inline-block rounded-xl px-4 py-2 bg-white text-black hover:opacity-90 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<RedirectIfAuth />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/reset" element={<ResetPasswordScreen />} />
        </Route>

        {/* Protected routes — keep Layout wrapping each screen (no Outlet in Layout required) */}
        <Route element={<RequireAuth />}>
          {/* Core */}
          <Route path="/" element={<Layout><CentralFeed /></Layout>} />
          <Route path="/me" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
          <Route path="/profile/:userId" element={<Layout><ProfileScreen /></Layout>} />

          {/* Posts / Upload */}
          <Route path="/upload" element={<Layout><UploadScreen /></Layout>} />
          <Route path="/video/:videoId" element={<Layout><SingleVideoEntryScreen /></Layout>} />

          {/* Chat */}
          <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />

          {/* Settings + Explore + Void */}
          <Route path="/settings" element={<Layout><SettingsScreen /></Layout>} />
          <Route path="/explore" element={<Layout><ExploreScreen /></Layout>} />
          <Route path="/void" element={<Layout><VoidScreen /></Layout>} />

          {/* Notifications */}
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/noti/story/:storyId" element={<Layout><NotiViewStoryScreen /></Layout>} />
          <Route path="/noti/post/:postId" element={<Layout><NotiViewPostScreen /></Layout>} />
          <Route path="/noti/message/:conversationId" element={<Layout><NotiViewMessageScreen /></Layout>} />

          {/* VGrid */}
          <Route path="/vgrid" element={<Layout><VGridScreen /></Layout>} />

          {/* ✅ VPorts */}
          <Route path="/vports" element={<Layout><VPortList /></Layout>} />
          <Route path="/vports/new" element={<Layout><VPortCreate /></Layout>} />
          <Route path="/vports/:id" element={<Layout><VPortDetail /></Layout>} />
          <Route path="/vports/:id/edit" element={<Layout><VPortEdit /></Layout>} />

          {/* ✅ Legacy singular -> plural redirect that substitutes :id */}
          <Route path="/vport/:id" element={<VPortLegacyRedirect />} />

          {/* 404 inside auth */}
          <Route path="*" element={<Layout><NotFoundScreen /></Layout>} />
        </Route>

        {/* Catch-all for unauthenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
