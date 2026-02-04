// src/app/routes/index.jsx
// ============================================================================
// APP ROUTES — ACTOR-BASED (LOCKED, NO BLOCKGATE, NO MeScreen)
// ============================================================================

import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import ProtectedRoute from '@/app/guards/ProtectedRoute'
import RootLayout from '@/app/layout/RootLayout'
import { resolveRealm } from '@/features/upload/model/resolveRealm'

// ----------------------------------------------------------------------------
// Lazy helper with debugging
// ----------------------------------------------------------------------------
function lazyWithLog(label, importer) {
  return lazy(() =>
    importer().catch((e) => {
      console.error(`[lazy import] ${label} failed`, e)
      throw e
    })
  )
}

const UsernameProfileRedirect = lazyWithLog(
  'UsernameProfileRedirect',
  () => import('@/features/profiles/screens/UsernameProfileRedirect')
)

/* ================= AUTH ================= */
const LoginScreen         = lazyWithLog('LoginScreen', () => import('@/features/auth/screens/LoginScreen'))
const RegisterScreen      = lazyWithLog('RegisterScreen', () => import('@/features/auth/screens/RegisterScreen'))
const ResetPasswordScreen = lazyWithLog('ResetPasswordScreen', () => import('@/features/auth/screens/ResetPasswordScreen'))
const OnboardingScreen    = lazyWithLog('OnboardingScreen', () => import('@/features/auth/screens/Onboarding'))

/* ================= MAIN APP ================= */
const CentralFeed   = lazyWithLog('CentralFeed', () => import('@/features/feed/screens/CentralFeed'))
const ExploreScreen = lazyWithLog('Explore', () => import('@/features/explore/screens/ExploreScreen'))

/* ================= NOTIFICATIONS ================= */
const NotificationsScreen = lazyWithLog(
  'Notifications',
  () => import('@/features/notifications/screen/NotificationsScreen')
)

/* ================= UPLOAD ================= */
const UploadScreen = lazyWithLog(
  'UploadScreen',
  () => import('@/features/upload/screens/UploadScreen')
)

/* ================= PROFILES ================= */
const ActorProfileScreen = lazyWithLog(
  'ActorProfileScreen',
  () => import('@/features/profiles/screens/ActorProfileScreen')
)

const TopFriendsRankEditor = lazyWithLog(
  'TopFriendsRankEditor',
  () => import('@/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor')
)

/* ================= VPORTS ================= */
const VportScreen = lazyWithLog(
  'VportScreen',
  () => import('@/features/vport/screens/VportScreen')
)

const SettingsScreen = lazyWithLog(
  'Settings',
  () => import('@/features/settings/screen/SettingsScreen')
)

const VoidScreen = lazyWithLog(
  'VoidScreen',
  () => import('@/features/void/VoidScreen')
)

/* ================= POSTS ================= */
const PostFeedScreen = lazyWithLog(
  'PostFeedScreen',
  () => import('@/features/post/screens/PostFeed.screen')
)

const PostDetailScreen = lazyWithLog(
  'PostDetailScreen',
  () => import('@/features/post/screens/PostDetail.screen')
)

const EditPostScreen = lazyWithLog(
  'EditPostScreen',
  () => import('@/features/post/postcard/ui/EditPost')
)

/* ================= CHAT ================= */
const ChatInboxScreen = lazyWithLog(
  'ChatInbox',
  () => import('@/features/chat').then(m => ({ default: m.InboxScreen }))
)

const ChatConversationScreen = lazyWithLog(
  'ChatConversation',
  () => import('@/features/chat').then(m => ({ default: m.ConversationScreen }))
)

const NewChatScreen = lazyWithLog(
  'NewChat',
  () => import('@/features/chat').then(m => ({ default: m.NewConversationScreen }))
)

const InboxChatSettingsScreen = lazyWithLog(
  'InboxChatSettingsScreen',
  () => import('@/features/chat/inbox/screens/InboxChatSettingsScreen')
)

// ✅ NEW: Inbox settings screen
const InboxSettingsScreen = lazyWithLog(
  'InboxSettingsScreen',
  () => import('@/features/chat/inbox/screens/InboxSettingsScreen')
)

const MessagePrivacyScreen = lazyWithLog(
  'MessagePrivacyScreen',
  () => import('@/features/chat/inbox/screens/settings/MessagePrivacyScreen')
)

// ✅ NEW: folder screens
const SpamInboxScreen = lazyWithLog(
  'SpamInboxScreen',
  () => import('@/features/chat/inbox/screens/SpamInboxScreen')
)

const RequestsInboxScreen = lazyWithLog(
  'RequestsInboxScreen',
  () => import('@/features/chat/inbox/screens/RequestsInboxScreen')
)

const ArchivedInboxScreen = lazyWithLog(
  'ArchivedInboxScreen',
  () => import('@/features/chat/inbox/screens/ArchivedInboxScreen')
)

const BlockedUsersScreen = lazyWithLog(
  'BlockedUsersScreen',
  () => import('@/features/chat/inbox/screens/settings/BlockedUsersScreen')
)

/* ================= NOTIFICATION DEEP LINKS ================= */
const NotiViewPostScreen = lazyWithLog(
  'NotiViewPost',
  () => import('@/features/notifications/screen/NotiViewPostScreen')
)

/* ================= DEV / PREVIEW ================= */
const NurseHomeScreen = lazyWithLog(
  'NurseHomeScreen',
  () => import('@/features/professional/professional-nurse/screens/NurseHomeScreen')
)

/* ================= LOVEDROP (PUBLIC) ================= */
const LovedropCreateScreen = lazyWithLog(
  'LovedropCreateScreen',
  () => import('@/season/lovedrop/screens/LovedropCreate.screen')
)

const LovedropShareScreen = lazyWithLog(
  'LovedropShareScreen',
  () => import('@/season/lovedrop/screens/LovedropShare.screen')
)

const LovedropViewScreen = lazyWithLog(
  'LovedropViewScreen',
  () => import('@/season/lovedrop/screens/LovedropView.screen')
)

// ============================================================================
// ROUTES
// ============================================================================
export default function AppRoutes() {
  const baseUrl = window.location.origin
  const lovedropRealmId = resolveRealm(false) // false = PUBLIC realm, true = VOID realm

  return (
    <Suspense fallback={<div className="text-center p-10">Loading…</div>}>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reset" element={<ResetPasswordScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />

        {/* ================= LOVEDROP (PUBLIC) ================= */}
        <Route
          path="/lovedrop"
          element={
            <LovedropCreateScreen
              realmId={lovedropRealmId}
              baseUrl={baseUrl}
            />
          }
        />
        <Route
          path="/lovedrop/created/:publicId"
          element={<LovedropShareScreen baseUrl={baseUrl} />}
        />
        <Route
          path="/lovedrop/v/:publicId"
          element={<LovedropViewScreen baseUrl={baseUrl} />}
        />

        {/* ================= PROTECTED ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            {/* MAIN */}
            <Route path="/feed" element={<CentralFeed />} />
            <Route path="/explore" element={<ExploreScreen />} />

            {/* POSTS */}
            <Route path="/posts" element={<PostFeedScreen />} />
            <Route path="/posts/:postId" element={<PostDetailScreen />} />
            <Route path="/post/:postId" element={<PostDetailScreen />} />
            <Route path="/posts/:postId/edit" element={<EditPostScreen />} />
            <Route path="/post/:postId/edit" element={<EditPostScreen />} />

            {/* CHAT */}
            <Route path="/chat" element={<ChatInboxScreen />} />
            <Route path="/chat/new" element={<NewChatScreen />} />

            <Route path="/chat/spam" element={<SpamInboxScreen />} />
            <Route path="/chat/requests" element={<RequestsInboxScreen />} />
            <Route path="/chat/archived" element={<ArchivedInboxScreen />} />

            {/* ✅ SETTINGS ROUTES MUST COME BEFORE /chat/:conversationId */}
            <Route path="/chat/settings" element={<InboxChatSettingsScreen />} />
            <Route path="/chat/settings/inbox" element={<InboxSettingsScreen />} />
            <Route path="/chat/settings/privacy" element={<MessagePrivacyScreen />} />
            <Route path="/chat/settings/blocked" element={<BlockedUsersScreen />} />

            {/* Conversation route AFTER settings */}
            <Route path="/chat/:conversationId" element={<ChatConversationScreen />} />

            {/* Legacy vport URLs */}
            <Route path="/vport/inbox" element={<Navigate to="/chat" replace />} />
            <Route path="/vport/chat/:conversationId" element={<ChatConversationScreen />} />
            <Route path="/vport/chat" element={<Navigate to="/chat" replace />} />

            {/* NOTIFICATIONS */}
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/vport/notifications" element={<Navigate to="/notifications" replace />} />
            <Route path="/noti/post/:postId" element={<NotiViewPostScreen />} />

            {/* ACCOUNT */}
            <Route path="/upload" element={<UploadScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/void" element={<VoidScreen />} />

            {/* PROFILES */}
            <Route path="/me" element={<Navigate to="/profile/self" replace />} />
            <Route path="/u/:username" element={<UsernameProfileRedirect />} />
            <Route path="/profile/:actorId" element={<ActorProfileScreen />} />
            <Route path="/profile/:id/friends/top/edit" element={<TopFriendsRankEditor />} />

            {/* VPORTS */}
            <Route path="/vport/:vportId" element={<VportScreen />} />
            <Route path="/v/id/:vportId" element={<VportScreen />} />
            <Route path="/v/:vportId" element={<VportScreen />} />

            {/* DEV PREVIEW */}
            <Route path="/_dev/nurse-home" element={<NurseHomeScreen />} />

            {/* DEFAULTS */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        </Route>

        {/* PUBLIC FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
