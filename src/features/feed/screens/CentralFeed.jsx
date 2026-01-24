// src/features/feed/screens/CentralFeed.jsx

import { useEffect, useRef, useCallback, useState } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

// ✅ supabase for persistence
import { supabase } from '@/services/supabase/supabaseClient'

// ✅ USE ADAPTER (NOT VIEW)
import PostCard from '@/features/post/postcard/adapters/PostCard'

import PullToRefresh from '@/shared/components/PullToRefresh'
import { useFeed } from '@/features/feed/hooks/useFeed'

import DebugPrivacyPanel from './DebugPrivacyPanel'

// ✅ report flow
import useReportFlow from '@/features/moderation/hooks/useReportFlow'

// ✅ report modal (collect reason)
import ReportModal from '@/features/moderation/components/ReportModal'

// ✅ post menu
import PostActionsMenu from '@/features/post/postcard/components/PostActionsMenu'

import { softDeletePostController } from '@/features/post/postcard/controller/deletePost.controller'

// ✅ SHARE (native + modal fallback)
import { shareNative } from '@/shared/lib/shareNative'
import ShareModal from '@/features/post/postcard/components/ShareModal'

// ✅ cover component
import ReportedPostCover from '@/features/moderation/components/ReportThanksOverlay'

export default function CentralFeed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { identity } = useIdentity()

  console.group('[CentralFeed][IDENTITY DEBUG]')
  console.log('raw identity:', identity)
  console.log('actorId:', identity?.actorId ?? null)
  console.log('realmId:', identity?.realmId ?? null)
  console.groupEnd()

  if (!user) return <Navigate to="/login" replace />

  const actorId = identity?.actorId ?? null
  const realmId = identity?.realmId ?? null

  const reportFlow = useReportFlow({ reporterActorId: actorId })

  const {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    fetchViewer,
    hiddenPostIds: serverHiddenPostIds, // ✅ persisted source of truth from useFeed
  } = useFeed(actorId, realmId)

  /* ============================================================
     DEBUG
     ============================================================ */
  useEffect(() => {
    console.log('[CentralFeed] MOUNT')
    return () => console.log('[CentralFeed] UNMOUNT')
  }, [])

  // ✅ POST ••• MENU STATE
  const [postMenu, setPostMenu] = useState(null)

  const openPostMenu = useCallback(
    ({ postId, postActorId, anchorRect }) => {
      if (!postId || !anchorRect) return
      setPostMenu({
        postId,
        postActorId: postActorId ?? null,
        isOwn: (postActorId ?? null) === (actorId ?? null),
        anchorRect,
      })
    },
    [actorId]
  )

  const closePostMenu = useCallback(() => {
    setPostMenu(null)
  }, [])

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return
    const post = posts.find((p) => p.id === postMenu.postId)
    const initialText = post?.text ?? ''
    closePostMenu()
    navigate(`/post/${postMenu.postId}/edit`, { state: { initialText } })
  }, [postMenu, posts, navigate, closePostMenu])

  const handleDeletePost = useCallback(async () => {
    if (!actorId) return
    if (!postMenu?.postId) return

    const okConfirm = window.confirm('Delete this post?')
    if (!okConfirm) return

    const res = await softDeletePostController({
      actorId,
      postId: postMenu.postId,
    })

    if (!res.ok) {
      window.alert(res.error?.message ?? 'Failed to delete post')
      return
    }

    await fetchPosts(true)
    closePostMenu()
  }, [actorId, postMenu, fetchPosts, closePostMenu])

  const handleReportPost = useCallback(() => {
    if (!actorId) return
    if (!postMenu?.postId) return

    reportFlow.start({
      objectType: 'post',
      objectId: postMenu.postId,
      postId: postMenu.postId,
      dedupeKey: `report:post:${postMenu.postId}`,
      title: 'Report post',
      subtitle: 'Tell us what’s wrong with this post.',
    })

    closePostMenu()
  }, [actorId, postMenu, reportFlow, closePostMenu])

  // ✅ Persist "hide for me" on server
  const persistHideForMe = useCallback(
    async (postId) => {
      if (!actorId || !postId) return
      try {
        const { error } = await supabase.schema('vc').from('moderation_actions').insert({
          actor_id: actorId,
          object_type: 'post',
          object_id: postId,
          action_type: 'hide',
          reason: 'user_reported',
        })
        if (error) console.warn('[CentralFeed] persist hide failed:', error)
      } catch (e) {
        console.warn('[CentralFeed] persist hide threw:', e)
      }
    },
    [actorId]
  )

  // ✅ Report submit: persist hide (server will rehydrate cover after refresh)
  const handleReportSubmit = useCallback(
    async (payload) => {
      const targetPostId =
        reportFlow.context?.objectType === 'post'
          ? (reportFlow.context?.objectId ?? null)
          : null

      try {
        const res = await reportFlow.submit?.(payload)
        if (res && res.ok === false) return

        if (targetPostId) {
          await persistHideForMe(targetPostId)

          // ✅ refresh feed so serverHiddenPostIds includes it immediately
          await fetchPosts(true)
        }

        reportFlow.close?.()
      } catch (err) {
        console.error('[CentralFeed] report submit failed:', err)
      }
    },
    [reportFlow, persistHideForMe, fetchPosts]
  )

  const [search] = useSearchParams()
  const debugPrivacy = (search.get('debug') || '').toLowerCase() === 'privacy'

  const ptrRef = useRef(null)
  const sentinelRef = useRef(null)

  /* ============================================================
     SHARE
     ============================================================ */
  const [shareState, setShareState] = useState({
    open: false,
    postId: null,
    url: '',
  })

  const closeShare = useCallback(() => {
    setShareState({ open: false, postId: null, url: '' })
  }, [])

  const handleShare = useCallback(
    async (postId) => {
      if (!postId) return
      const url = `${window.location.origin}/post/${postId}`
      const post = posts.find((p) => p.id === postId)
      const text = post?.text ? String(post.text).slice(0, 140) : ''
      const title = 'Spread'

      const res = await shareNative({ title, text, url })
      if (!res.ok) setShareState({ open: true, postId, url })
    },
    [posts]
  )

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
        <p className="text-center text-gray-400 mt-6">Loading your feed…</p>
      )}

      {viewerIsAdult !== null && !loading && posts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {posts.map((post) => {
        const hiddenServer =
          !!post.is_hidden_for_viewer || (serverHiddenPostIds?.has?.(post.id) ?? false)

        const covered = hiddenServer

        return (
          <div key={`post:${post.id}`} className="mb-2 last:mb-0">
            <PostCard
              post={{
                ...post,
                actorId: post.actor.id,
              }}
              onOpenPost={() => {
                if (covered) return
                navigate(`/post/${post.id}`)
              }}
              onOpenMenu={openPostMenu}
              onShare={handleShare}
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

      {debugPrivacy && <DebugPrivacyPanel userId={actorId} posts={posts} />}

      {loading && posts.length === 0 && (
        <div className="space-y-3 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 h-40 rounded-xl" />
          ))}
        </div>
      )}

      {loading && posts.length > 0 && (
        <p className="text-center text-white">Loading more…</p>
      )}

      {!hasMore && !loading && posts.length > 0 && (
        <p className="text-center text-gray-400">End of feed</p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
  )
}
