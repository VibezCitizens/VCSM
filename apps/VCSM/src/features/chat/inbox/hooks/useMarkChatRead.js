// src/features/chat/inbox/hooks/useMarkChatRead.js
// ============================================================
// useMarkChatRead
// ------------------------------------------------------------
// React Query mutation: mark a conversation as read for actor.
//
// onMutate:
//   - Zeros the unread count in the cached inbox list (optimistic)
//   - Subtracts that conversation's unread count from the badge
//     cache immediately so the badge clears without waiting for
//     the next poll cycle
//   - Snapshots both caches for rollback
//
// onSuccess:
//   - Invalidates both unread query keys to refetch from DB
//
// onError:
//   - Rolls back both optimistic cache updates
//   - Invalidates both unread query keys to restore from DB
//
// Wire this in ConversationView when a conversation is opened.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markConversationRead } from '@chat'
import { queryKeys } from '@/queries/queryKeys'

export function useMarkChatRead(actorId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId) =>
      markConversationRead({ actorId, conversationId }),

    onMutate: async (conversationId) => {
      // Snapshot current cache state for rollback on error
      const prevInbox = queryClient.getQueryData(queryKeys.chatInbox(actorId))
      const prevBadge = queryClient.getQueryData(queryKeys.chatUnread(actorId))

      // Find how many unreads this conversation held
      const conversationRow = Array.isArray(prevInbox)
        ? prevInbox.find((row) => row.conversation_id === conversationId)
        : null
      const removedUnread = conversationRow?.unread_count ?? 0

      // Optimistic: zero the unread count in the inbox list
      queryClient.setQueryData(queryKeys.chatInbox(actorId), (prev) => {
        if (!Array.isArray(prev)) return prev
        return prev.map((row) =>
          row.conversation_id === conversationId
            ? { ...row, unread_count: 0 }
            : row
        )
      })

      // Optimistic: subtract this conversation's unreads from the badge
      // immediately so the nav badge clears on tap, not on next poll
      if (removedUnread > 0) {
        queryClient.setQueryData(queryKeys.chatUnread(actorId), (prev) =>
          Math.max(0, (prev ?? 0) - removedUnread)
        )
      }

      return { prevInbox, prevBadge }
    },

    onSuccess: () => {
      // DB updated — refetch to sync authoritative count
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnreadCount(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
    },

    onError: (_err, _conversationId, context) => {
      // Roll back both optimistic updates so stale UI doesn't persist
      if (context?.prevInbox !== undefined) {
        queryClient.setQueryData(queryKeys.chatInbox(actorId), context.prevInbox)
      }
      if (context?.prevBadge !== undefined) {
        queryClient.setQueryData(queryKeys.chatUnread(actorId), context.prevBadge)
      }
      // Refetch to confirm true DB state
      queryClient.invalidateQueries({ queryKey: queryKeys.chatInbox(actorId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
    },
  })
}
