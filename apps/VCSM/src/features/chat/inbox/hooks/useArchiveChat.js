// src/features/chat/inbox/hooks/useArchiveChat.js
// ============================================================
// useArchiveChat
// ------------------------------------------------------------
// React Query mutation: archive a conversation for the actor.
// On success: invalidates inbox and unread count query caches.
// Does NOT invalidate the whole app — only scoped chat keys.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveConversationForActor } from '@chat'
import { queryKeys } from '@/queries/queryKeys'

export function useArchiveChat(actorId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId) =>
      archiveConversationForActor({ actorId, conversationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnreadCount(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
    },
  })
}
