// src/features/chat/inbox/hooks/useDeleteChat.js
// ============================================================
// useDeleteChat
// ------------------------------------------------------------
// React Query mutation: delete a thread for this actor only.
// Sets history_cutoff_at and archived_until_new so the thread
// stays hidden until a new message arrives.
// On success: invalidates inbox and unread count query caches.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteInboxThread } from '@chat'
import { queryKeys } from '@/queries/queryKeys'

export function useDeleteChat(actorId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId) =>
      deleteInboxThread({ actorId, conversationId, archiveUntilNew: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnreadCount(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
    },
  })
}
