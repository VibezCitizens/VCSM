// src/features/feed/screens/CentralFeed.jsx

import { useEffect, useRef, useCallback, useState } from 'react'
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

// ✅ USE ADAPTER (NOT VIEW)
import PostCard from '@/features/post/postcard/adapters/PostCard'

import PullToRefresh from '@/shared/components/PullToRefresh'
import { useFeed } from '@/features/feed/hooks/useFeed'

import DebugPrivacyPanel from './DebugPrivacyPanel'

// ✅ report flow
import useReportFlow from '@/features/moderation/hooks/useReportFlow'

// ✅ report modal
import ReportModal from '@/features/moderation/components/ReportModal'

// ✅ post menu
import PostActionsMenu from '@/features/post/postcard/components/PostActionsMenu'

import { softDeletePostController } from '@/features/post/postcard/controller/deletePost.controller'

// ✅ SHARE (native + modal fallback)
import { shareNative } from '@/shared/lib/shareNative'
import ShareModal from '@/features/post/postcard/components/ShareModal'

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

  // ✅ report flow (actor-based)
  const reportFlow = useReportFlow({ reporterActorId: actorId })

  // ✅ MOVE useFeed UP so fetchPosts/posts exist before callbacks use them
  const {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    fetchViewer,
  } = useFeed(actorId, realmId)

  // ✅ HIDE REPORTED POSTS (client-side immediate UX)
  const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set())

  /* ============================================================
     DEBUG: remounts / auth flicker / report state
     ============================================================ */
  useEffect(() => {
    console.log('[CentralFeed] MOUNT')
    return () => console.log('[CentralFeed] UNMOUNT')
  }, [])

  useEffect(() => {
    console.log('[CentralFeed] user changed', { hasUser: !!user })
  }, [user])

  useEffect(() => {
    console.log('[CentralFeed] reportFlow.open changed', { open: reportFlow.open })
  }, [reportFlow.open])

  // ✅ POST ••• MENU STATE
  const [postMenu, setPostMenu] = useState(null)
  // postMenu = { postId, postActorId, isOwn, anchorRect } | null

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

  // ✅ OWNER: EDIT
  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return

    // pass previous text if available (so edit screen shows it)
    const post = posts.find((p) => p.id === postMenu.postId)
    const initialText = post?.text ?? ''

    closePostMenu()
    navigate(`/post/${postMenu.postId}/edit`, { state: { initialText } })
  }, [postMenu, posts, navigate, closePostMenu])

  // ✅ OWNER: DELETE (SOFT DELETE)
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

    // refetch after delete
    await fetchPosts(true)

    closePostMenu()
  }, [actorId, postMenu, fetchPosts, closePostMenu])

  // ✅ NOT OWNER: REPORT
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

  // ✅ WRAP REPORT SUBMIT: hide post from feed after success
  const handleReportSubmit = useCallback(
    async (payload) => {
      const targetPostId =
        reportFlow.context?.objectType === 'post'
          ? (reportFlow.context?.objectId ?? null)
          : null

      try {
        const res = await reportFlow.submit?.(payload)

        // if hook returns { ok:false }, don't hide
        if (res && res.ok === false) return

        // ✅ immediately hide in feed
        if (targetPostId) {
          setHiddenPostIds((prev) => {
            const next = new Set(prev)
            next.add(targetPostId)
            return next
          })
        }

        reportFlow.close?.()

        // optional: refresh feed if you want server consistency immediately
        // await fetchPosts(true)
      } catch (err) {
        console.error('[CentralFeed] report submit failed:', err)
      }
    },
    [reportFlow]
  )

  const [search] = useSearchParams()
  const debugPrivacy = (search.get('debug') || '').toLowerCase() === 'privacy'

  /* ============================================================
     🔎 FEED STATE DEBUG
     ============================================================ */
  console.group('[CentralFeed][FEED STATE]')
  console.log({ actorId, realmId, postsCount: posts.length, loading, hasMore })
  console.groupEnd()

  const ptrRef = useRef(null)
  const sentinelRef = useRef(null)

  /* ============================================================
     ✅ SHARE STATE + HANDLER
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

      // you navigate to /post/:id in this screen
      const url = `${window.location.origin}/post/${postId}`

      const post = posts.find((p) => p.id === postId)
      const text = post?.text ? String(post.text).slice(0, 140) : ''
      const title = 'Spread'

      const res = await shareNative({ title, text, url })

      // fallback: open our modal on desktop/dev/unsupported
      if (!res.ok) {
        setShareState({ open: true, postId, url })
      }
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

  // ✅ filter out reported posts from UI
  const visiblePosts = posts.filter((p) => !hiddenPostIds.has(p.id))

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

      {viewerIsAdult !== null && !loading && visiblePosts.length === 0 && (
        <p className="text-center text-gray-400">No posts found.</p>
      )}

      {visiblePosts.map((post) => (
        <div key={`post:${post.id}`} className="mb-2 last:mb-0">
          <PostCard
            post={{
              ...post,
              actorId: post.actor.id,
            }}
            onOpenPost={() => navigate(`/post/${post.id}`)}
            onOpenMenu={openPostMenu}
            onShare={handleShare} // ✅ WIRE SHARE DOWN
          />
        </div>
      ))}

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

      {/* ✅ SHARE MODAL (fallback when native share unsupported) */}
      <ShareModal
        open={shareState.open}
        title="Spread"
        url={shareState.url}
        onClose={closeShare}
      />

      {debugPrivacy && <DebugPrivacyPanel userId={actorId} posts={posts} />}

      {loading && visiblePosts.length === 0 && (
        <div className="space-y-3 px-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-neutral-800 h-40 rounded-xl"
            />
          ))}
        </div>
      )}

      {loading && visiblePosts.length > 0 && (
        <p className="text-center text-white">Loading more…</p>
      )}

      {!hasMore && !loading && visiblePosts.length > 0 && (
        <p className="text-center text-gray-400">End of feed</p>
      )}

      <div ref={sentinelRef} className="h-1" />
    </PullToRefresh>
  )
}
