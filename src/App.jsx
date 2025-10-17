// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/app/ProtectedRoute';

/* Auth */
const LoginScreen         = lazy(() => import('@/features/auth/screens/LoginScreen'));
const RegisterScreen      = lazy(() => import('@/features/auth/screens/RegisterScreen'));
const ResetPasswordScreen = lazy(() => import('@/features/auth/screens/ResetPasswordScreen'));
const OnboardingScreen    = lazy(() => import('@/features/auth/screens/Onboarding'));

/* App screens */
const CentralFeed         = lazy(() => import('@/features/feed/screens/CentralFeed.jsx'));

const ExploreScreen       = lazy(() => import('@/features/explore/ExploreScreen'));
const ConversationList    = lazy(() => import('@/features/chat/ConversationList')); // user inbox (full page)
const ChatScreen          = lazy(() => import('@/features/chat/ChatScreen'));       // user convo (full page)
const NotificationsScreen = lazy(() => import('@/features/notifications/NotificationsScreen'));
const UploadScreen        = lazy(() => import('@/features/post/UploadScreen'));
const MeScreen            = lazy(() => import('@/features/profiles/screens/MeScreen'));
const SettingsScreen      = lazy(() => import('@/features/settings/SettingsScreen'));
const VoidScreen          = lazy(() => import('@/features/void/VoidScreen'));

/* Notifications deep-link */
const NotiViewPostScreen  = lazy(() =>
  import('@/features/notifications/notificationcenter/NotiViewPostScreen')
);

/* VPORT profile screen */
const VportProfileScreen  = lazy(() =>
  import('@/features/vport/vprofile/VportProfileScreen')
);

/* VPORT notifications */
const VportNotificationsScreen = lazy(() =>
  import('@/features/notifications/vnotificationcenter/VportNotificationsScreen')
);

/* 💬 VPORT chat (full page list + full page thread) */
const VConversationList   = lazy(() => import('@/features/chat/vchat/VConversationList'));
const VChatScreen         = lazy(() => import('@/features/chat/vchat/VChatScreen'));

export default function App() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-white">Loading…</div>}>
      <Routes>
        {/* Public/auth */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reset" element={<ResetPasswordScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route path="/feed" element={<CentralFeed />} />
            <Route path="/explore" element={<ExploreScreen />} />

            {/* 💬 User chat (full pages) */}
            <Route path="/chat" element={<ConversationList />} />
            <Route path="/chat/:id" element={<ChatScreen />} />

            {/* 💬 VPORT chat (full pages, no split) */}
            <Route path="/vport/chat" element={<VConversationList />} />
            <Route path="/vport/chat/:id" element={<VChatScreen />} />

            {/* 🔔 User notifications */}
            <Route path="/notifications" element={<NotificationsScreen />} />
            {/* 🔔 VPORT notifications */}
            <Route path="/vport/notifications" element={<VportNotificationsScreen />} />

            <Route path="/upload" element={<UploadScreen />} />
            <Route path="/me" element={<MeScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/void" element={<VoidScreen />} />

            {/* Other users → MeScreen */}
            <Route path="/u/:username" element={<MeScreen />} />
            <Route path="/profile/:id" element={<MeScreen />} />

            {/* VPORT profiles */}
            <Route path="/vport/:id" element={<VportProfileScreen />} />
            <Route path="/vport/slug/:slug" element={<VportProfileScreen />} />

            {/* Notifications deep-link to post */}
            <Route path="/noti/post/:postId" element={<NotiViewPostScreen />} />

            {/* App fallback */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        </Route>

        {/* Public catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
