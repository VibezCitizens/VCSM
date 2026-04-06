// src/features/chat/inbox/hooks/useInboxFolder.js
import useInbox from '@/features/chat/inbox/hooks/useInbox'

/**
 * useInboxFolder
 * folder: 'inbox' | 'spam' | 'requests' | 'archived'
 *
 * Source of truth: vc.inbox_entries.folder
 */
export default function useInboxFolder({ actorId, folder = 'inbox' }) {
  const includeArchived = folder === 'archived'
  return useInbox({ actorId, folder, includeArchived })
}
