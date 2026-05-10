import { useInfiniteQuery } from '@tanstack/react-query'
import { getActorPostsController } from '@/features/profiles/controller/post/getActorPosts.controller'
import { queryKeys } from '@/queries/queryKeys'

const PAGE_SIZE = 20

/**
 * Paginated posts for the Vibes tab.
 *
 * React Query (useInfiniteQuery) replaces the previous manual useState/useRef
 * pagination so that:
 * - staleTime 60s: switching tabs and returning renders cached posts instantly
 * - gcTime 300s: cache survives route switches
 * - Concurrent callers for the same actorId share one in-flight request
 *
 * Accepts actorId directly (no reset/loadInitial calls needed in the consumer).
 * Invalidate via queryKeys.actorPosts(actorId) on post delete.
 */
export function useActorPosts(actorId, canViewContent) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.actorPosts(actorId),
    queryFn: ({ pageParam = 0 }) =>
      getActorPostsController({ actorId, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.done ? undefined : pages.length,
    enabled: !!actorId && canViewContent !== false,
    staleTime: 60_000,
    gcTime: 300_000,
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []

  return {
    posts,
    loading: isLoading,
    hasMore: hasNextPage ?? false,
    loadMore: fetchNextPage,
    loadingMore: isFetchingNextPage,
  }
}
