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
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-700/50" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-slate-700/50" />
              <div className="h-2 w-20 animate-pulse rounded bg-slate-700/40" />
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4">
            <div className="h-3 w-11/12 animate-pulse rounded bg-slate-700/50" />
            <div className="h-3 w-8/12 animate-pulse rounded bg-slate-700/40" />
            <div className="mt-3 h-44 animate-pulse rounded-xl bg-slate-700/35" />
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

  const {
    posts,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
    hiddenPostIds: serverHiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  } = useFeed(actorId, realmId)

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
    if (!actorId) return
    fetchViewer()
  }, [actorId, fetchViewer])

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

  const observeMore = useCallback(() => {
    const root = ptrRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return () => {}

    let locked = false

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && posts.length > 0 && hasMore && !loading && !locked) {
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
  }, [posts.length, hasMore, loading, fetchPosts])

  useEffect(() => observeMore(), [observeMore])

  const handleRefresh = useCallback(async () => {
    ptrRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    await fetchViewer()
    await fetchPosts(true)
  }, [fetchViewer, fetchPosts])

  if (!user) return <Navigate to="/login" replace />

  return (
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
  )
}
