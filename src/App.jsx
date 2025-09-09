// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';

/* Lazy screens */
// Public
const LoginScreen            = lazy(() => import('@/features/auth/screens/LoginScreen'));
const RegisterScreen         = lazy(() => import('@/features/auth/screens/RegisterScreen'));
const ResetPasswordScreen    = lazy(() => import('@/features/auth/screens/ResetPasswordScreen'));

// Main
const CentralFeed            = lazy(() => import('@/features/feed/screens/CentralFeed'));
const ProfileScreen          = lazy(() => import('@/features/profile/screens/ProfileScreen'));
const UploadScreen           = lazy(() => import('@/features/posts/screens/UploadScreen'));
const ChatRoutes             = lazy(() => import('@/features/chat/ChatRoutes'));
const SettingsScreen         = lazy(() => import('@/features/settings/screens/SettingsScreen'));
const VoidScreen             = lazy(() => import('@/TheVoid/VoidScreen.jsx'));
const ExploreScreen          = lazy(() => import('@/features/explore/ExploreScreen'));
const SingleVideoEntryScreen = lazy(() => import('@/features/profile/tabs/SingleVideoEntryScreen'));

// Notifications (USER)
const Notifications          = lazy(() => import('@/features/notificationcenter/Notifications'));
const NotiViewStoryScreen    = lazy(() => import('@/features/notificationcenter/NotiViewStoryScreen'));
const NotiViewPostScreen     = lazy(() => import('@/features/notificationcenter/NotiViewPostScreen'));
const NotiViewMessageScreen  = lazy(() => import('@/features/notificationcenter/NotiViewMessageScreen'));

// Notifications (VPORT) — NEW
const VNotifications         = lazy(() => import('@/features/notificationcenter/VNotifications'));
const VNotiViewPostScreen    = lazy(() => import('@/features/notificationcenter/VNotiViewPostScreen'));
const VNotiViewMessageScreen = lazy(() => import('@/features/notificationcenter/VNotiViewMessageScreen'));

// VGrid / VPort
const VGridScreen            = lazy(() => import('@/features/vgrid/VGridScreen'));
const VportProfileScreen     = lazy(() => import('@/features/profile/screens/VportProfileScreen'));

// VPORT chat
const VChatRoutes            = lazy(() => import('@/features/chat/vport/VChatRoutes'));

/* Light placeholders */
function VPortsHomePlaceholder() {
  return (
    <div className="min-h-[100dvh] bg-black text-white p-6">
      <h1 className="text-2xl font-bold">VPORTs</h1>
      <p className="text-zinc-400 mt-2">Manage your VPORTs here. (Placeholder)</p>
    </div>
  );
}
function CreateVPortPlaceholder() {
  return (
    <div className="min-h-[100dvh] bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Create a VPORT</h1>
      <p className="text-zinc-400 mt-2">Form coming soon. (Placeholder)</p>
    </div>
  );
}
function SettingsSubPlaceholder({ title }) {
  return (
    <div className="min-h-[100dvh] bg-black text-white p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-zinc-400 mt-2">This page is a placeholder. Build me later.</p>
    </div>
  );
}

/** Splash while auth initializes and while lazy routes load.
 *  Place your image at: public/VCSM.jpg  (URL: /VCSM.jpg)
 */
function SplashFallback() {
  return (
    <div className="h-[100dvh] w-[100dvw] bg-black flex items-center justify-center">
      <img
        src="/VCSM.jpg"
        alt="Vibez Citizens"
        className="max-w-[80%] max-h-[80%] object-contain"
        loading="eager"
      />
    </div>
  );
}

export default function App() {
  // assume useAuth() returns { user, loading }; if not, loading defaults false
  const { user, loading } = useAuth() || {};

  // 1) Show splash while auth/session initializes (before we know user)
  if (loading) {
    return <SplashFallback />;
  }

  // 2) After auth is ready, keep showing splash during lazy chunk loads
  return (
    <Suspense fallback={<SplashFallback />}>
      <Routes>
        {/* Public */}
<Route
  path="/login"
  element={
    <Suspense fallback={<SplashFallback />}>
      <LoginScreen />
    </Suspense>
  }
/>
<Route
  path="/register"
  element={
    <Suspense fallback={<SplashFallback />}>
      <RegisterScreen />
    </Suspense>
  }
/>
<Route
  path="/reset"
  element={
    <Suspense fallback={<SplashFallback />}>
      <ResetPasswordScreen />
    </Suspense>
  }
/>


        {/* Protected */}
        {user ? (
          <>
            {/* Make CentralFeed the index + keep explicit "/" for clarity */}
            <Route
              index
              element={
                <Layout>
                  <CentralFeed />
                </Layout>
              }
            />
            <Route
              path="/"
              element={
                <Layout>
                  <CentralFeed />
                </Layout>
              }
            />

            {/* USER profiles */}
            <Route path="/me" element={<Layout><ProfileScreen /></Layout>} />
            <Route path="/u/:username" element={<Layout><ProfileScreen /></Layout>} />
            <Route path="/profile/:userId" element={<Layout><ProfileScreen /></Layout>} />
            <Route path="/uid/:userId" element={<Layout><ProfileScreen /></Layout>} />

            {/* VPORT profiles */}
            <Route path="/v/:vportId" element={<Layout><ProfileScreen isVportRoute /></Layout>} />
            <Route path="/vp/:vportSlug" element={<Layout><ProfileScreen isVportRoute isSlug /></Layout>} />

            {/* Upload */}
            <Route path="/upload" element={<Layout><UploadScreen /></Layout>} />

            {/* Chat */}
            <Route path="/chat/*" element={<Layout><ChatRoutes /></Layout>} />
            <Route path="/vchat/*" element={<Layout><VChatRoutes /></Layout>} />

            {/* Settings */}
            <Route path="/settings" element={<Layout><SettingsScreen /></Layout>} />
            <Route path="/settings/account" element={<Layout><SettingsSubPlaceholder title="Account" /></Layout>} />
            <Route path="/settings/privacy" element={<Layout><SettingsSubPlaceholder title="Privacy & Security" /></Layout>} />
            <Route path="/settings/notifications" element={<Layout><SettingsSubPlaceholder title="Notifications" /></Layout>} />
            <Route path="/settings/account-settings" element={<Layout><SettingsSubPlaceholder title="Account Settings" /></Layout>} />

            {/* Explore / Void / Single video */}
            <Route path="/explore" element={<Layout><ExploreScreen /></Layout>} />
            <Route path="/void" element={<Layout><VoidScreen /></Layout>} />
            <Route path="/video/:videoId" element={<Layout><SingleVideoEntryScreen /></Layout>} />

            {/* USER Notifications */}
            <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
            <Route path="/noti/story/:storyId" element={<Layout><NotiViewStoryScreen /></Layout>} />
            <Route path="/noti/post/:postId" element={<Layout><NotiViewPostScreen /></Layout>} />
            <Route path="/noti/message/:conversationId" element={<Layout><NotiViewMessageScreen /></Layout>} />

            {/* VPORT Notifications — NEW */}
            <Route path="/vnotifications" element={<Layout><VNotifications /></Layout>} />
            <Route path="/vnoti/post/:postId" element={<Layout><VNotiViewPostScreen /></Layout>} />
            <Route path="/vnoti/message/:conversationId" element={<Layout><VNotiViewMessageScreen /></Layout>} />

            {/* VGrid Map */}
            <Route path="/vgrid" element={<Layout><VGridScreen /></Layout>} />

            {/* VPORTs hub & create (placeholders) */}
            <Route path="/vports" element={<Layout><VPortsHomePlaceholder /></Layout>} />
            <Route path="/vports/new" element={<Layout><CreateVPortPlaceholder /></Layout>} />

            {/* Existing VPort page (map detail) */}
            <Route path="/vport/:id" element={<Layout><VportProfileScreen /></Layout>} />

            {/* Authenticated catch-all -> home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          // Not logged in -> login
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Suspense>
  );
}
