import { useEffect, useRef } from 'react'

export function useFeedInfiniteScroll({ ptrRef, posts, hasMore, loading, fetchPosts, firstBatchReady }) {
  const sentinelRef = useRef(null)

  const postsLenRef = useRef(0)
  postsLenRef.current = posts.length
  const hasMoreRef = useRef(true)
  hasMoreRef.current = hasMore
  const loadingRef = useRef(false)
  loadingRef.current = loading
  const fetchPostsRef = useRef(fetchPosts)
  fetchPostsRef.current = fetchPosts

  useEffect(() => {
    const root = ptrRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    let locked = false

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (
          first?.isIntersecting &&
          postsLenRef.current > 0 &&
          hasMoreRef.current &&
          !loadingRef.current &&
          !locked
        ) {
          locked = true
          fetchPostsRef.current(false).finally(() => {
            locked = false
          })
        }
      },
      { root, rootMargin: '0px 0px 600px 0px', threshold: 0.01 }
    )

    io.observe(sentinel)
    return () => io.disconnect()
    // Only reconnect when the scroll container or sentinel element changes
    // (effectively once on mount). State checks use refs to avoid churn.
  }, [firstBatchReady, ptrRef])

  return { sentinelRef }
}
