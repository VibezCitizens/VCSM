// src/features/CentralFeed/screens/CentralFeedScreen.jsx

import { useEffect, useRef, useCallback } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity, useActiveActorState } from '@/features/identity/adapters/identity.adapter'

import { PostCard } from '@/features/post/adapters/post.adapter'

import PullToRefresh from '@/shared/components/PullToRefresh'
import { useCentralFeed } from '@/features/CentralFeed/hooks/useCentralFeed'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'

import DebugPrivacyPanel from '@/features/CentralFeed/screens/DebugPrivacyPanel'
import DebugFeedFilterPanel from '@/features/CentralFeed/screens/DebugFeedFilterPanel'
import { FeedDebugPanel, debugFeedEvent } from '@debuggers/feed'
import { useActorConsistencyCheck } from '@debuggers/identity/useActorConsistencyCheck'

import ReportModal from '@/features/moderation/adapters/components/ReportModal.adapter'
import { PostActionsMenu, ShareModal } from '@/features/post/adapters/post.adapter'

import ReportedPostCover from '@/features/moderation/adapters/components/ReportThanksOverlay.adapter'
import { useCentralFeedActions } from '@/features/CentralFeed/hooks/useCentralFeedActions'
import FeedConfirmModal from '@/features/CentralFeed/components/FeedConfirmModal'
import Toast from '@/shared/components/components/Toast'
import WelcomeFeedCard from '@/features/CentralFeed/components/WelcomeFeedCard'
import { FeedSkeletonList } from '@/features/CentralFeed/components/FeedSkeletonList'
import { useFeedConfirmToast } from '@/features/CentralFeed/hooks/useFeedConfirmToast'
import { useFeedInfiniteScroll } from '@/features/CentralFeed/hooks/useFeedInfiniteScroll'
import '@/shared/styles/profiles-modern.css'

export default function CentralFeed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { identity } = useIdentity()
  const { realmId, isAdult } = useActiveActorState()
  const IS_DEV = import.meta.env.DEV

  const actorId = identity?.actorId ?? null
  useActorConsistencyCheck('feed', actorId, identity?.kind)

  useEffect(() => {
    if (import.meta.env.DEV) {
      debugFeedEvent('FEED_SCREEN_MOUNT', {
        status: 'info',
        message: actorId ? `Viewer: ${actorId.slice(0, 8)}` : 'No viewer actor',
        payload: { actorId, realmId, userId: user?.id },
      })
    }
  }, [actorId, realmId, user?.id])

  const {
    confirmState,
    closeConfirm,
    requestConfirm,
    toastOpen,
    setToastOpen,
    toastMessage,
    showToast,
  } = useFeedConfirmToast()

  const viewerIsAdult = identity?.kind === 'vport' ? true : isAdult

  const {
    posts,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    hiddenPostIds: serverHiddenPostIds,
    filterDebugRows,
    firstBatchReady,
  } = useCentralFeed(actorId, realmId, { viewerIsAdult })

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

  useEffect(() => {
    if (!firstBatchReady) return
    hideLaunchSplash()
  }, [firstBatchReady])

  const { sentinelRef } = useFeedInfiniteScroll({
    ptrRef,
    posts,
    hasMore,
    loading,
    fetchPosts,
    firstBatchReady,
  })

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

      {!showInitialSkeleton && (
        <WelcomeFeedCard actorId={actorId} kind={identity?.kind} />
      )}

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
    </>
  )
}
