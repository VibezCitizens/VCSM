// src/features/chat/inbox/hooks/useInbox.js
// ============================================================
// useInbox - VCSM inbox hook
// ------------------------------------------------------------
// Delegates to useChatInbox (React Query).
// React Query owns all server data (inbox_entries).
// Polling/refetch owns freshness while realtime is disabled.
// No direct Supabase calls from this hook.
//
// Return contract: { entries, loading, error, refresh, hideConversation }
// Entry shape matches what CardInbox / InboxList / buildInboxPreview expect.
// ============================================================

import { useChatInbox } from '@/features/chat/inbox/hooks/useChatInbox'

export default function useInbox({
  actorId,
  includeArchived = false,
  folder = 'inbox',
}) {
  return useChatInbox(actorId, { folder, includeArchived })
}
