// src/features/chat/inbox/hooks/useInboxActions.js
// ============================================================
// MIGRATED: Delegates to shared chat engine.
// Authority: chat.inbox_entries (via engine)
// Return contract identical: { ready, pin, unpin, mute, unmute,
//   archive, unarchive, leave, ignoreRequest, deleteThreadForMe }
// ============================================================

import { useInboxActions as useEngineInboxActions } from '@chat'

export default function useInboxActions({ actorId }) {
  return useEngineInboxActions({ actorId })
}
