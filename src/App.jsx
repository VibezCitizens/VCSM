﻿// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/app/ProtectedRoute';

// Small helper to log exactly which lazy import failed (no new files)
function lazyWithLog(label, importer) {
  return lazy(() =>
    importer().catch((e) => {
      console.error(`[lazy import] ${label} failed`, e);
      throw e;
    })
  );
}

/* Auth */
const LoginScreen         = lazyWithLog('LoginScreen',         () => import('@/features/auth/screens/LoginScreen'));
const RegisterScreen      = lazyWithLog('RegisterScreen',      () => import('@/features/auth/screens/RegisterScreen'));
const ResetPasswordScreen = lazyWithLog('ResetPasswordScreen', () => import('@/features/auth/screens/ResetPasswordScreen'));
const OnboardingScreen    = lazyWithLog('Onboarding',          () => import('@/features/auth/screens/Onboarding'));

/* App screens */
const CentralFeed         = lazy(() => import('@/features/feed/screens/CentralFeed.jsx'));
const ExploreScreen       = lazyWithLog('ExploreScreen',       () => import('@/features/explore/ExploreScreen'));
const NotificationsScreen = lazyWithLog('NotificationsScreen', () => import('@/features/notifications/NotificationsScreen'));
const UploadScreen        = lazyWithLog('UploadScreen',        () => import('@/features/post/UploadScreen'));
const MeScreen            = lazyWithLog('MeScreen',            () => import('@/features/profiles/screens/MeScreen.jsx'));
const SettingsScreen      = lazyWithLog('SettingsScreen',      () => import('@/features/settings/SettingsScreen'));
const VoidScreen          = lazyWithLog('VoidScreen',          () => import('@/features/void/VoidScreen'));

/* Chat screens (USER) */
const ChatInboxScreen     = lazyWithLog('ChatInbox',           () => import('@/features/chat/pages/Inbox.jsx'));
const ChatThreadScreen    = lazyWithLog('ChatThread',          () => import('@/features/chat/pages/ConversationView.jsx'));

/* Chat screens (VPORT) */
const VInboxScreen        = lazyWithLog('VInbox',              () => import('@/features/chat/pages/VInbox.jsx'));
const VChatThreadScreen   = lazyWithLog('VConversationView',   () => import('@/features/chat/pages/VConversationView.jsx'));

/* VPORT profile screen */
const VportProfileScreen  = lazyWithLog('VportProfileScreen',  () => import('@/features/vport/vprofile/VportProfileScreen.jsx'));

/* Notifications deep-link */
const NotiViewPostScreen  = lazyWithLog('NotiViewPostScreen',  () => import('@/features/notifications/notificationcenter/NotiViewPostScreen'));

/* VPORT notifications */
const VportNotificationsScreen = lazyWithLog(
  'VportNotificationsScreen',
  () => import('@/features/notifications/vnotificationcenter/VportNotificationsScreen')
);

/* 👥 Circle list screens */
const FansScreen          = lazyWithLog('FansScreen',          () => import('@/features/profiles/tabs/components/Fans.jsx'));
const ImaFanScreen        = lazyWithLog('ImaFanScreen',        () => import('@/features/profiles/tabs/components/ImaFan.jsx'));
const MutualFriendsScreen = lazyWithLog('MutualFriendsScreen', () => import('@/features/profiles/tabs/components/MutualFriends.jsx'));

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

            {/* 💬 Chat (USER) */}
            <Route path="/chat" element={<ChatInboxScreen />} />
            <Route path="/chat/:id" element={<ChatThreadScreen />} />

            {/* 💬 Chat (VPORT) */}
            <Route path="/vport/chat" element={<VInboxScreen />} />
            <Route path="/vport/chat/:id" element={<VChatThreadScreen />} />

            {/* 🔔 User notifications */}
            <Route path="/notifications" element={<NotificationsScreen />} />
            {/* 🔔 VPORT notifications */}
            <Route path="/vport/notifications" element={<VportNotificationsScreen />} />

            <Route path="/upload" element={<UploadScreen />} />
            <Route path="/me" element={<MeScreen />} />

            {/* 🔽 full circle lists for *current* user */}
            <Route path="/me/fans" element={<FansScreen />} />
            <Route path="/me/imafan" element={<ImaFanScreen />} />
            <Route path="/me/mutual-friends" element={<MutualFriendsScreen />} />

            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/void" element={<VoidScreen />} />

            {/* 👤 User profiles */}
            <Route path="/u/:username" element={<MeScreen />} />
            {/* full circle lists when viewing a profile by username */}
            <Route path="/u/:username/fans" element={<FansScreen />} />
            <Route path="/u/:username/imafan" element={<ImaFanScreen />} />
            <Route path="/u/:username/mutual-friends" element={<MutualFriendsScreen />} />

            <Route path="/profile/:id" element={<MeScreen />} />
            {/* full circle lists when viewing by profile id */}
            <Route path="/profile/:id/fans" element={<FansScreen />} />
            <Route path="/profile/:id/imafan" element={<ImaFanScreen />} />
            <Route path="/profile/:id/mutual-friends" element={<MutualFriendsScreen />} />

            {/* 🏢 VPORT profiles (slug first, then id route) */}
            <Route path="/vport/id/:id" element={<VportProfileScreen />} />
            <Route path="/vport/:slug" element={<VportProfileScreen />} />

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
