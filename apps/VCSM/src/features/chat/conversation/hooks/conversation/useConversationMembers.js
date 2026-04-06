// src/features/chat/conversation/hooks/conversation/useConversationMembers.js
// ============================================================
// useConversationMembers — VCSM conversation members hook
// ------------------------------------------------------------
// MIGRATED (Slice 3): Delegates to shared chat engine for reads.
// Authority: chat.conversation_members (via engine)
//
// Return contract is identical to the previous VCSM-local hook:
//   { members, me, loading, error, refresh }
// ============================================================

import { useConversationMembers as useEngineMembers } from '@chat'

export default function useConversationMembers({ conversationId, actorId }) {
  return useEngineMembers({ conversationId, actorId })
}
