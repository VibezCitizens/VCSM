// src/features/CentralFeed/hooks/useCentralFeed.js
// React Query replacement for useFeed.js.
// Identical public API: { posts, viewerIsAdult, loading, hasMore, fetchPosts,
//   setPosts, hiddenPostIds, filterDebugRows, firstBatchReady }
//
// - useInfiniteQuery owns all server state (posts, pagination, reactions, counts)
// - Zustand actor store receives upserts after each page (same as useFeed.js)
// - staleTime:30s — navigator-away-and-back within 30s serves from cache

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useActorStore } from '@/state/actors/actorStore'
import { hydrateActorsByIds } from '@hydration'
import { fetchCentralFeedPage } from '@/features/CentralFeed/queries/fetchCentralFeedPage'
import { queryKeys } from '@/queries/queryKeys'
import { debugFeedEvent, debugFeedResult } from '@debuggers/feed'

// ─── Image preload helpers (identical to useFeed.js) ─────────────────────────

const INITIAL_VISIBLE_TARGET = 3
const FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS = 2_500

function collectInitialImageUrls(posts, postLimit = INITIAL_VISIBLE_TARGET) {
  return (Array.isArray(posts) ? posts : [])
    .slice(0, postLimit)
    .map((post) => {
      const media = Array.isArray(post?.media) ? post.media : []
      const firstImage = media.find((m) => m?.type === 'image' && typeof m?.url === 'string')
      return firstImage?.url ?? null
    })
    .filter(Boolean)
}

function preloadImage(src, timeoutMs = FIRST_BATCH_MEDIA_PRELOAD_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!src) { resolve(false); return }
    const img = new Image()
    let settled = false
    const finish = (ok) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      img.onload = null
      img.onerror = null
      resolve(ok)
    }
    const timeoutId = setTimeout(() => finish(false), timeoutMs)
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.decoding = 'async'
    img.src = src
    if (img.complete) { finish(true); return }
    if (typeof img.decode === 'function') img.decode().then(() => finish(true)).catch(() => {})
  })
}

async function preloadInitialMedia(posts) {
  const urls = collectInitialImageUrls(posts)
  if (urls.length === 0) return
  await Promise.allSettled(urls.map((src) => preloadImage(src)))
}

// ─────────────────────────────────────────────────────────────────────────────

export function useCentralFeed(viewerActorId, realmId, { viewerIsAdult: viewerIsAdultProp = null } = {}) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => queryKeys.centralFeed(viewerActorId, realmId),
    [viewerActorId, realmId]
  )

  // ── React Query infinite query ──────────────────────────────────────────────
  const {
    data,
    isFetchingNextPage,
    status,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchCentralFeedPage({ actorId: viewerActorId, realmId, pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(viewerActorId),
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // ── Derived state ───────────────────────────────────────────────────────────

  const posts = useMemo(() => {
    if (!data?.pages) return []
    const map = new Map()
    for (const page of data.pages) {
      for (const post of (page.posts || [])) map.set(post.id, post)
    }
    return Array.from(map.values())
  }, [data])

  const hiddenPostIds = useMemo(() => {
    if (!data?.pages) return new Set()
    const set = new Set()
    for (const page of data.pages) {
      for (const id of (page.hiddenIds || [])) set.add(id)
    }
    return set
  }, [data])

  const filterDebugRows = useMemo(() => {
    if (!data?.pages) return []
    const byPostId = new Map()
    for (const page of data.pages) {
      for (const row of (page.debugRows || [])) {
        if (row?.post_id) byPostId.set(row.post_id, row)
      }
    }
    return Array.from(byPostId.values())
  }, [data])

  // ── Actor store upsert + background hydration (same as useFeed.js) ──────────

  const upsertActors = useActorStore((s) => s.upsertActors)
  const getMissingOrStale = useActorStore((s) => s.getMissingOrStale)
  const upsertActorsRef = useRef(upsertActors)
  upsertActorsRef.current = upsertActors
  const getMissingOrStaleRef = useRef(getMissingOrStale)
  getMissingOrStaleRef.current = getMissingOrStale

  const pageCount = data?.pages?.length ?? 0

  useEffect(() => {
    if (!pageCount) return
    const lastPage = data.pages[pageCount - 1]
    const { actors, profileMap, vportMap } = lastPage
    if (!actors?.length) return

    upsertActorsRef.current(
      actors.map((a) => ({
        actor_id: a.id,
        kind: a.kind,
        display_name: a.profile_id ? profileMap[a.profile_id]?.display_name ?? null : null,
        username: a.profile_id ? profileMap[a.profile_id]?.username ?? null : null,
        photo_url: a.profile_id
          ? profileMap[a.profile_id]?.photo_url ?? null
          : vportMap[a.id]?.avatar_url ?? null,
        vport_name: a.kind === 'vport' ? vportMap[a.id]?.name ?? null : null,
        vport_slug: a.kind === 'vport' ? vportMap[a.id]?.slug ?? null : null,
      }))
    )

    const actorIds = actors.map((a) => a.id).filter(Boolean)
    const staleOrMissing = getMissingOrStaleRef.current(actorIds)
    if (staleOrMissing.length) {
      hydrateActorsByIds(staleOrMissing).catch(() => {})
    }

    const vportActorsWithNoName = actors
      .filter((a) => a.kind === 'vport' && !vportMap[a.id]?.name)
      .map((a) => a.id)
      .filter((id) => !staleOrMissing.includes(id))
    if (vportActorsWithNoName.length) {
      hydrateActorsByIds(vportActorsWithNoName, { force: true }).catch(() => {})
    }
  }, [pageCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image preload on first page ─────────────────────────────────────────────

  const didPreloadRef = useRef(false)
  const firstPage = data?.pages?.[0]

  useEffect(() => {
    if (didPreloadRef.current || !firstPage?.posts?.length) return
    didPreloadRef.current = true
    preloadInitialMedia(firstPage.posts)
  }, [firstPage])

  useEffect(() => {
    didPreloadRef.current = false
  }, [viewerActorId, realmId])

  // ── firstBatchReady ─────────────────────────────────────────────────────────

  const [firstBatchReady, setFirstBatchReady] = useState(false)

  useEffect(() => {
    setFirstBatchReady(false)
  }, [viewerActorId, realmId])

  useEffect(() => {
    if (firstBatchReady) return
    if (status === 'success' || status === 'error') setFirstBatchReady(true)
  }, [status, firstBatchReady])

  // ── Dev debug events ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (status === 'success' && pageCount > 0) {
      const lastPage = data.pages[pageCount - 1]
      debugFeedEvent('FEED_REQUEST_SUCCESS', {
        status: 'success',
        message: `${posts.length} visible post(s) across ${pageCount} page(s)`,
        payload: {
          viewerActorId,
          realmId,
          pageCount,
          visibleCount: posts.length,
          hasMore: !!hasNextPage,
        },
      })
      debugFeedResult({
        rawCount: (lastPage.debugRows?.length ?? 0) + (lastPage.posts?.length ?? 0),
        filteredCount: lastPage.posts?.length ?? 0,
        renderedCount: posts.length,
        debugRows: filterDebugRows,
        hiddenByMeCount: hiddenPostIds.size,
        hasMore: !!hasNextPage,
      })
    }
  }, [status, pageCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── loading ─────────────────────────────────────────────────────────────────
  // Exclude background refetches from the loading flag — only block IntersectionObserver
  // for initial load and explicit pagination, not silent background refreshes.
  const loading = isFetchingNextPage || status === 'pending'

  // ── fetchPosts ──────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (fresh = false) => {
      if (!viewerActorId) return
      if (fresh) {
        setFirstBatchReady(false)
        // resetQueries: clears pages back to page 1 and awaits the refetch
        await queryClient.resetQueries({ queryKey })
      } else {
        await fetchNextPage()
      }
    },
    [viewerActorId, queryClient, queryKey, fetchNextPage]
  )

  // ── setPosts (optimistic patch for useCentralFeedActions) ───────────────────
  // Functional updater: filter/map preserving page structure (e.g. block optimistic remove)
  // Array updater: snapshot restore (e.g. block error rollback) — collapses to page 0

  const setPosts = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.pages?.length) return old
        const currentPosts = old.pages.flatMap((p) => p.posts || [])
        const nextPosts =
          typeof updater === 'function' ? updater(currentPosts) : updater

        if (typeof updater !== 'function') {
          // Snapshot restore: replace page 0 posts, discard extra pages
          const firstPage = old.pages[0]
          return {
            ...old,
            pages: [{ ...firstPage, posts: nextPosts }],
            pageParams: old.pageParams.slice(0, 1),
          }
        }

        // Functional filter: apply across all pages preserving pagination structure
        const postSet = new Set(nextPosts.map((p) => p.id))
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: (page.posts || []).filter((p) => postSet.has(p.id)),
          })),
        }
      })
    },
    [queryClient, queryKey]
  )

  return {
    posts,
    viewerIsAdult: viewerIsAdultProp,
    loading,
    hasMore: !!hasNextPage,
    fetchPosts,
    setPosts,
    hiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  }
}
