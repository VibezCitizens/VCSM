// src/app/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Login from '@/features/auth/Login';
import Feed from '@/features/feed/FeedScreen';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import MeScreen from '@/features/profiles/screens/MeScreen';
import PublicProfile from '@/features/profiles/screens/PublicProfile';

// 🔔 Notifications (user)
import NotificationsScreen from '@/features/notifications/NotificationsScreen';
import NotiViewPostScreen from '@/features/notifications/notificationcenter/NotiViewPostScreen';

// 🔔 VPORT Notifications
import VportNotificationsScreen from '@/features/notifications/vnotificationcenter/VportNotificationsScreen';

// 💬 Chat (user)
import ChatLayout from '@/features/chat/ChatLayout';
import EmptyChat from '@/features/chat/EmptyChat';
import Chat from '@/features/chat/ChatScreen';

// 💬 Chat (VPORT) — ADD THESE TWO
import VChatLayout from '@/features/chat/vchat/VChatLayout';
import VChatScreen from '@/features/chat/vchat/VChatScreen';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Root */}
      <Route path="/" element={<Navigate to="/feed" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/me" element={<MeScreen />} />

        {/* 🔔 User Notifications */}
        <Route path="/notifications" element={<NotificationsScreen />} />

        {/* 🔔 VPORT Notifications */}
        <Route path="/vport/notifications" element={<VportNotificationsScreen />} />

        {/* Deep-link viewer */}
        <Route path="/noti/post/:postId" element={<NotiViewPostScreen />} />

        {/* 💬 Chat split-pane (user) */}
        <Route path="/chat" element={<ChatLayout />}>
          <Route index element={<EmptyChat />} />
          <Route path=":id" element={<Chat />} />
        </Route>

        {/* 💬 Chat split-pane (VPORT) — ADD THIS BLOCK */}
        <Route path="/vport/chat" element={<VChatLayout />}>
          <Route index element={<EmptyChat />} />
          <Route path=":id" element={<VChatScreen />} />
        </Route>
      </Route>

      {/* Public profile */}
      <Route path="/u/:username" element={<PublicProfile />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}
