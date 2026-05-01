import { useQuery } from '@tanstack/react-query'
import { useChatUnreadOps } from '@/features/chat/adapters/chat.adapter'
import { queryKeys } from '@/queries/queryKeys'

const CHAT_UNREAD_REFETCH_MS = 30_000

function toRefetchInterval(refreshMs) {
  if (refreshMs === false || refreshMs === 0) return false
  const next = Number(refreshMs)
  return Number.isFinite(next) && next > 0 ? next : CHAT_UNREAD_REFETCH_MS
}

export default function useUnreadBadge({ actorId, refreshMs = CHAT_UNREAD_REFETCH_MS } = {}) {
  const { getUnreadBadgeCount } = useChatUnreadOps()
  const canQuery = typeof actorId === 'string' && actorId.length >= 32

  const query = useQuery({
    queryKey: queryKeys.chatUnread(actorId),
    queryFn: () => getUnreadBadgeCount(actorId),
    enabled: canQuery,
    staleTime: CHAT_UNREAD_REFETCH_MS,
    gcTime: 5 * 60_000,
    refetchInterval: toRefetchInterval(refreshMs),
    refetchIntervalInBackground: false,
    retry: 1,
    placeholderData: 0,
  })

  return {
    count: canQuery ? query.data ?? 0 : 0,
    loading: canQuery ? query.isPending || query.isFetching : false,
    refresh: query.refetch,
  }
}
