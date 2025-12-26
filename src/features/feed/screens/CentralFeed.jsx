// src/features/feed/screens/CentralFeed.jsx

import { useEffect, useRef, useCallback } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

// ✅ USE ADAPTER (NOT VIEW)
import PostCard from '@/features/post/postcard/adapters/PostCard'

import PullToRefresh from '@/shared/components/PullToRefresh'
import { useFeed } from '@/features/feed/hooks/useFeed'

import DebugPrivacyPanel from './DebugPrivacyPanel'

export default function CentralFeed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { identity } = useIdentity()

  /* ============================================================
     🔎 HARD IDENTITY DEBUG
     ============================================================ */
  console.group('[CentralFeed][IDENTITY DEBUG]')
  console.log('raw identity:', identity)
  console.log('actorId:', identity?.actorId ?? null)
  console.log('realmId:', identity?.realmId ?? null)
  console.groupEnd()

  if (!user) return <Navigate to="/login" replace />

  const actorId = identity?.actorId ?? null
  const realmId = identity?.realmId ?? null

  const [search] = useSearchParams()
  const debugPrivacy =
    (search.get('debug') || '').toLowerCase() === 'privacy'

  const {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    fetchViewer,
  } = useFeed(actorId, realmId)

  /* ============================================================
     🔎 FEED STATE DEBUG
     ============================================================ */
  console.group('[CentralFeed][FEED STATE]')
  console.log({ actorId, realmId, postsCount: posts.length, loading, hasMore })
  console.groupEnd()

  const ptrRef = useRef(null)
  const sentinelRef = useRef(null)

  /* ============================================================
     VIEWER CONTEXT
     ============================================================ */
  useEffect(() => {
    if (!actorId) return
    fetchViewer()
  }, [actorId, fetchViewer])

  /* ============================================================
     INFINITE SCROLL
     ============================================================ */
  const observeMore = useCallback(() => {
    const root = ptrRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return () => {}

    let locked = false

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && hasMore && !loading && !locked) {
          locked = true
          fetchPosts(false).finally(() => {
            locked = false
          })
        }
      },
      { root, rootMargin: '0px 0px 600px 0px', threshold: 0.01 }
    )

    io.observe(sentinel)
    return () => io.disconnect()
  }, [hasMore, loading, fetchPosts])

  useEffect(() => observeMore(), [observeMore])

  /* ============================================================
     PULL TO REFRESH
     ============================================================ */
  const handleRefresh = useCallback(async () => {
    ptrRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    await fetchViewer()
    await fetchPosts(true)
  }, [fetchViewer, fetchPosts])

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <PullToRefresh
      ref={ptrRef}
      onRefresh={handleRefresh}
      threshold={70}
      maxPull={120}
      className="h-screen overflow-y-auto bg-black text-white px-0 py-2"
    >
      {viewerIsAdult === null && (
        <p className="text-center text-gray-400 mt-6">
          Loading your feed…
        </p>
      )}

      {viewerIsAdult !== null && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">
          No posts found.
        </p>
      )}

      {/* ======================================================
         POSTS
         ====================================================== */}
      {posts.map((post) => (
        <div key={`post:${post.id}`} className="mb-2 last:mb-0">
          <PostCard
            post={{
              ...post,
              // 🔒 FEED → POSTCARD CONTRACT
              actorId: post.actor.id,
            }}
            onOpenPost={() => navigate(`/post/${post.id}`)}
          />
        </div>
      ))}

      {debugPrivacy && (
        <DebugPrivacyPanel userId={actorId} posts={posts} />
      )}

      {loading && posts.length === 0 && (
        <div className="space-y-3 px-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-800 h-40 rounded-xl"
            />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">
          Loading more…
        </p>
      )}

      {!hasMore && !loading && posts.length > 0 && (
        <p className="text-center text-gray-400">
          End of feed
        </p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
  )
}
