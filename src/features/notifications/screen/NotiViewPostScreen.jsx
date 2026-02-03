// src/features/notifications/screen/NotiViewPostScreen.jsx
// ============================================================
// Notifications → View Post Screen
// - Deep-link target from notifications
// - Reuse PostDetailView so header/body/media/actions render
// ============================================================

import PostDetailView from '@/features/post/screens/PostDetail.view'

export default function NotiViewPostScreen() {
  return <PostDetailView />
}
