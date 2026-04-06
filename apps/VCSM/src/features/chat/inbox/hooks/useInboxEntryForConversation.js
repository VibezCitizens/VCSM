// src/features/chat/inbox/hooks/useInboxEntryForConversation.js
// ============================================================
// MIGRATED: Delegates to shared chat engine.
// Authority: chat.inbox_entries (via engine)
// Return contract identical: { entry, loading, error, refresh, setEntry }
// ============================================================

import { useInboxEntryForConversation as useEngineEntry } from '@chat'

export default function useInboxEntryForConversation({ actorId, conversationId }) {
  return useEngineEntry({ actorId, conversationId })
}
