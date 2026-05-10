// src/features/feed/queries/fetchCentralFeedPage.js
// Pure async queryFn used by useCentralFeed's useInfiniteQuery.
// Mirrors the while-loop logic from useFeed.js — fetches up to
// MAX_EMPTY_PAGES_PER_FETCH DB pages per call to fill INITIAL_VISIBLE_TARGET
// visible posts on first load (post-visibility-filter pages can be sparse).

import { fetchFeedPagePipeline } from '@/features/feed/pipeline/fetchFeedPage.pipeline'

const PAGE_SIZE = 10
const MAX_EMPTY_PAGES_PER_FETCH = 2
const INITIAL_VISIBLE_TARGET = 3
const FEED_FETCH_TIMEOUT_MS = 15_000

function withTimeout(promise, ms = FEED_FETCH_TIMEOUT_MS) {
  let id
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error('Feed fetch timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id))
}

/**
 * Fetches one "logical page" of feed posts for useInfiniteQuery.
 *
 * pageParam === undefined  → first page (initial load)
 * pageParam === string     → cursor (created_at of last seen post)
 *
 * Returns: { posts, nextCursor, hasMore, hiddenIds, debugRows, actors, profileMap, vportMap }
 * nextCursor === undefined signals React Query there are no more pages.
 */
export async function fetchCentralFeedPage({
  actorId,
  realmId,
  pageParam,
  pageSize = PAGE_SIZE,
}) {
  // First page: fill up to INITIAL_VISIBLE_TARGET visible posts.
  // Pagination: one DB page is enough (targetVisibleCount = 1).
  const isInitial = pageParam === undefined
  const targetVisibleCount = isInitial ? INITIAL_VISIBLE_TARGET : 1

  const normalizedChunk = []
  const allDebugRows = []
  const allHiddenIds = []
  let mergedActors = []
  let mergedProfileMap = {}
  let mergedVportMap = {}

  let cursorCreatedAt = pageParam ?? null
  let hasMoreNow = true
  let pagesFetched = 0

  while (hasMoreNow && pagesFetched < MAX_EMPTY_PAGES_PER_FETCH) {
    pagesFetched++

    const res = await withTimeout(
      fetchFeedPagePipeline({
        viewerActorId: actorId,
        realmId,
        cursorCreatedAt,
        pageSize,
      })
    )

    const {
      normalized,
      debugRows,
      hasMoreNow: nextHasMore,
      nextCursorCreatedAt,
      hiddenByMeSet,
      actors,
      profileMap,
      vportMap,
    } = res

    normalizedChunk.push(...(normalized || []))
    if (Array.isArray(debugRows)) allDebugRows.push(...debugRows)
    if (hiddenByMeSet) hiddenByMeSet.forEach((id) => allHiddenIds.push(id))

    mergedActors = mergedActors.concat(actors || [])
    mergedProfileMap = { ...mergedProfileMap, ...profileMap }
    mergedVportMap = { ...mergedVportMap, ...vportMap }

    hasMoreNow = !!nextHasMore
    cursorCreatedAt = nextCursorCreatedAt ?? null

    if (!hasMoreNow || !nextCursorCreatedAt || normalizedChunk.length >= targetVisibleCount) {
      break
    }
  }

  // Drain cap: if we still have no visible posts after draining, stop pagination
  if (normalizedChunk.length === 0 && hasMoreNow && pagesFetched >= MAX_EMPTY_PAGES_PER_FETCH) {
    hasMoreNow = false
  }

  return {
    posts: normalizedChunk,
    // undefined signals getNextPageParam → no next page
    nextCursor: hasMoreNow ? cursorCreatedAt : undefined,
    hasMore: hasMoreNow,
    hiddenIds: allHiddenIds,
    debugRows: allDebugRows,
    actors: mergedActors,
    profileMap: mergedProfileMap,
    vportMap: mergedVportMap,
  }
}
