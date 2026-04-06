// src/features/chat/inbox/hooks/useInbox.js
// ============================================================
// useInbox — VCSM inbox hook
// ------------------------------------------------------------
// MIGRATED (Slice 2): Delegates to shared chat engine for reads.
// Authority: chat.inbox_entries (via engine)
//
// The engine hook handles:
//   - inbox loading from chat.* schema
//   - InboxEntryModel shaping
//   - realtime subscription (chat.inbox_entries)
//   - actor switch reset
//   - optimistic hide
//
// Return contract is identical to the previous VCSM-local hook:
//   { entries, loading, error, refresh, hideConversation }
//
// Entry shape matches what CardInbox / InboxList / buildInboxPreview expect.
// ============================================================

import { useInbox as useEngineInbox } from '@chat'

export default function useInbox({
  actorId,
  includeArchived = false,
  folder = 'inbox',
}) {
  return useEngineInbox({
    actorId,
    includeArchived,
    folder,
  })
}
