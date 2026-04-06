// ============================================================
// Chat Feature Entry (STABLE MODE)
// ------------------------------------------------------------
// This is the ONLY entry point Wentrex screens/components should
// use for chat functionality. No direct @chat imports allowed
// outside this feature boundary.
// ============================================================

import '@/features/communication/styles/chat-modern.css'

/* =========================
   SCREENS
   ========================= */

export { default as InboxScreen }
  from './inbox/screens/InboxScreen'

export { default as ConversationScreen }
  from './conversation/screen/ConversationScreen'

/* =========================
   ADAPTER — Wentrex conversation lifecycle
   ========================= */

export {
  createWentrexAnnouncementConversation,
  createWentrexConversation,
  evaluateWentrexMessagingPermission,
} from './adapters/chatEngine.adapter'

/* =========================
   HOOKS — re-exported from chat engine
   These are the approved chat hooks for Wentrex screens.
   ========================= */

export {
  useConversation,
  useConversationMessages,
  useConversationMembers,
  useInbox,
  startDirectConversation,
} from '@chat'

