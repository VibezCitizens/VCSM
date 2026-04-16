// src/features/feed/screens/CentralFeedScreen.jsx

import { useEffect, useRef, useCallback, useState } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

import PostCard from '@/features/post/adapters/postCard.adapter'

import PullToRefresh from '@/shared/components/PullToRefresh'
import { useFeed } from '@/features/feed/hooks/useFeed'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'

import DebugPrivacyPanel from '@/features/feed/screens/DebugPrivacyPanel'
import DebugFeedFilterPanel from '@/features/feed/screens/DebugFeedFilterPanel'
import { FeedDebugPanel, debugFeedEvent } from '@debuggers/feed'
import { useActorConsistencyCheck } from '@debuggers/identity/useActorConsistencyCheck'

import ReportModal from '@/features/moderation/adapters/components/ReportModal.adapter'
import PostActionsMenu from '@/features/post/adapters/postcard/components/PostActionsMenu.adapter'
import ShareModal from '@/features/post/adapters/postcard/components/ShareModal.adapter'

import ReportedPostCover from '@/features/moderation/adapters/components/ReportThanksOverlay.adapter'
import { useCentralFeedActions } from '@/features/feed/hooks/useCentralFeedActions'
import FeedConfirmModal from '@/features/feed/screens/FeedConfirmModal'
import Toast from '@/shared/components/components/Toast'
import '@/features/profiles/styles/profiles-modern.css'

function FeedSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`feed-skeleton:${i}`}
          className="profiles-card overflow-hidden rounded-2xl"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.1)' }} />
              <div className="h-2 w-20 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.07)' }} />
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            <div className="h-3 w-11/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.08)' }} />
            <div className="h-3 w-8/12 animate-pulse rounded" style={{ background: 'rgba(139,92,246,0.06)' }} />
            <div className="mt-3 h-44 animate-pulse rounded-xl" style={{ background: 'rgba(139,92,246,0.04)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CentralFeed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { identity } = useIdentity()
  const IS_DEV = import.meta.env.DEV

  const actorId = identity?.actorId ?? null
  const realmId = identity?.realmId ?? null
  useActorConsistencyCheck('feed', actorId, identity?.kind)

  // Feed debugger: log feed screen mount event (viewer snapshot is now synced globally in IdentityProvider)
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugFeedEvent('FEED_SCREEN_MOUNT', {
        status: 'info',
        message: actorId ? `Viewer: ${actorId.slice(0, 8)}` : 'No viewer actor',
        payload: { actorId, realmId, userId: user?.id },
      })
    }
  }, [actorId, realmId, user?.id])
  const confirmResolverRef = useRef(null)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    tone: 'danger',
  })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const closeConfirm = useCallback((accepted) => {
    const resolve = confirmResolverRef.current
    confirmResolverRef.current = null
    setConfirmState((prev) => ({ ...prev, open: false }))
    if (typeof resolve === 'function') resolve(Boolean(accepted))
  }, [])

  const requestConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmState({
        open: true,
        title: options.title ?? 'Confirm',
        message: options.message ?? 'Are you sure?',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        tone: options.tone ?? 'danger',
      })
    })
  }, [])

  const showToast = useCallback((message) => {
    const next = String(message || '')
    setToastMessage(next)
    setToastOpen(false)
    setTimeout(() => setToastOpen(true), 0)
  }, [])

  // Derive viewerIsAdult from identity instead of independent DB queries.
  // Vport actors are always treated as adult; user actors carry the profile flag.
  const viewerIsAdult = identity?.kind === 'vport' ? true : (identity?.isAdult ?? null)

  const {
    posts,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    hiddenPostIds: serverHiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  } = useFeed(actorId, realmId, { viewerIsAdult })

  const {
    reportFlow,
    postMenu,
    isMenuActorFollowing,
    openPostMenu,
    closePostMenu,
    handleEditPost,
    handleDeletePost,
    handleFollowActor,
    handleOpenActorProfile,
    handleBlockActor,
    handleReportPost,
    handleReportSubmit,
    shareState,
    closeShare,
    handleShare,
  } = useCentralFeedActions({
    actorId,
    posts,
    setPosts,
    fetchPosts,
    navigate,
    confirmAction: requestConfirm,
    onFollowToast: showToast,
  })

  const showInitialSkeleton = !firstBatchReady

  const [search] = useSearchParams()
  const debugMode = (search.get('debug') || '').toLowerCase()
  const debugPrivacy = IS_DEV && (debugMode === 'privacy' || debugMode === 'all')
  const debugFilter = IS_DEV && (debugMode === 'filter' || debugMode === 'all')

  const ptrRef = useRef(null)
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!firstBatchReady) return
    hideLaunchSplash()
  }, [firstBatchReady])

  useEffect(() => {
    return () => {
      const resolve = confirmResolverRef.current
      confirmResolverRef.current = null
      if (typeof resolve === 'function') resolve(false)
    }
  }, [])

  // Stable refs for IntersectionObserver — avoids recreating the observer
  // every time posts/loading/hasMore change, which was causing the observer
  // to immediately fire a pagination request right after the initial fetch.
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
  }, [firstBatchReady])

  const handleRefresh = useCallback(async () => {
    ptrRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    await fetchPosts(true)
  }, [fetchPosts])

  if (!user) return <Navigate to="/login" replace />

  return (
    <>
    {import.meta.env.DEV && <FeedDebugPanel />}
    <PullToRefresh
      ref={ptrRef}
      onRefresh={handleRefresh}
      threshold={70}
      maxPull={120}
      className="profiles-modern post-modern h-full min-h-full overflow-y-auto text-white px-0 py-2"
    >
      {showInitialSkeleton && <FeedSkeletonList count={3} />}

      {!showInitialSkeleton && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No Vibes found.</p>
      )}

      {posts.map((post, index) => {
        const hiddenServer =
          !!post.is_hidden_for_viewer || (serverHiddenPostIds?.has?.(post.id) ?? false)

        const covered = hiddenServer

        return (
          <div key={`post:${post.id}`} className="mb-2 last:mb-0">
            <PostCard
              post={{
                ...post,
                actorId:
                  post.actor?.actor_id ??
                  post.actor?.actorId ??
                  post.actorId ??
                  post.actor_id ??
                  null,
              }}
              onOpenPost={() => {
                if (covered) return
                navigate(`/post/${post.id}`)
              }}
              onOpenMenu={openPostMenu}
              onShare={handleShare}
              prioritizeMedia={index < 3}
              covered={covered}
              cover={covered ? <ReportedPostCover /> : null}
            />
          </div>
        )
      })}

      <PostActionsMenu
        open={!!postMenu}
        anchorRect={postMenu?.anchorRect}
        isOwn={!!postMenu?.isOwn}
        onClose={closePostMenu}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onFollow={handleFollowActor}
        followLabel={isMenuActorFollowing ? 'Unsubscribe' : 'Subscribe'}
        onProfile={handleOpenActorProfile}
        onBlock={handleBlockActor}
        onReport={handleReportPost}
      />

      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? 'Report'}
        subtitle={reportFlow.context?.subtitle ?? null}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={handleReportSubmit}
      />

      <ShareModal
        open={shareState.open}
        title="Spread"
        url={shareState.url}
        onClose={closeShare}
      />

      <FeedConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        tone={confirmState.tone}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />

      <Toast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />

      {debugPrivacy && <DebugPrivacyPanel actorId={actorId} posts={posts} />}
      {debugFilter && <DebugFeedFilterPanel rows={filterDebugRows} />}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">Loading more...</p>
      )}

      {!hasMore && !loading && posts.length > 0 && (
        <p className="text-center text-gray-400">End of feed</p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
    </>
  )
}
