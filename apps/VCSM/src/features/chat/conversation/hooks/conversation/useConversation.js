// src/features/chat/conversation/hooks/conversation/useConversation.js
// ============================================================
// useConversation — VCSM conversation metadata hook
// ------------------------------------------------------------
// MIGRATED (Slice 3): Delegates to shared chat engine for reads.
// Authority: chat.conversations (via engine)
//
// The engine hook handles:
//   - openConversationController (chat.* schema)
//   - markConversationRead (chat.* read pointer)
//   - realtime subscription (chat.conversations UPDATE)
//
// Return contract is identical to the previous VCSM-local hook:
//   { conversation, loading, error, refresh }
// ============================================================

import { useConversation as useEngineConversation } from '@chat'

export default function useConversation({ conversationId, actorId }) {
  return useEngineConversation({ conversationId, actorId })
}
