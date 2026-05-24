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
import canReadConversation from '@/features/chat/conversation/permissions/canReadConversation'

export default function useConversationMembers({ conversationId, actorId }) {
  const result = useEngineMembers({ conversationId, actorId })
  // Derived access gate: true while members are still loading (no premature denial),
  // false only after server members confirm the actor is not an active member.
  const canRead = !result.members?.length
    ? true
    : canReadConversation({ actorId, members: result.members })
  return { ...result, canRead }
}
