import { useCallback, useState } from 'react'

import { useDeletePostAction } from '@/features/post/adapters/postcard/hooks/useDeletePostAction.adapter'
import { useFollowActorToggle } from '@/features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter'
import { useFollowStatus } from '@/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter'
import { useBlockActorAction } from '@/features/block/adapters/hooks/useBlockActorAction.adapter'
import { useHidePostForActor } from '@/features/moderation/adapters/hooks/useHidePostForActor.adapter'
import useReportFlow from '@/features/moderation/adapters/hooks/useReportFlow.adapter'
import { shareNative } from '@/shared/lib/shareNative'

function resolvePostActorId(post) {
  return (
    post?.actor?.actor_id ??
    post?.actor?.actorId ??
    post?.actor_id ??
    post?.actorId ??
    null
  )
}

export function useCentralFeedActions({
  actorId,
  posts,
  setPosts,
  fetchPosts,
  navigate,
  confirmAction,
  onFollowToast,
}) {
  const reportFlow = useReportFlow({ reporterActorId: actorId })
  const deletePost = useDeletePostAction({ actorId })
  const toggleFollow = useFollowActorToggle()
  const blockActor = useBlockActorAction()
  const hidePost = useHidePostForActor()

  const [postMenu, setPostMenu] = useState(null)
  const [shareState, setShareState] = useState({
    open: false,
    postId: null,
    url: '',
  })

  const isMenuActorFollowing = useFollowStatus({
    followerActorId: actorId,
    followedActorId: postMenu?.postActorId ?? null,
  })

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

  const confirm = useCallback(
    async (options) => {
      if (typeof confirmAction !== 'function') {
        console.warn('[useCentralFeedActions] missing confirmAction; skipping confirm prompt', options)
        return false
      }
      return Boolean(await confirmAction(options))
    },
    [confirmAction]
  )

  const handleEditPost = useCallback(() => {
    if (!postMenu?.postId) return
    const post = posts.find((p) => p.id === postMenu.postId)
    const initialText = post?.text ?? ''
    closePostMenu()
    navigate(`/post/${postMenu.postId}/edit`, { state: { initialText } })
  }, [postMenu, posts, navigate, closePostMenu])

  const handleDeletePost = useCallback(async () => {
    if (!actorId || !postMenu?.postId) return

    const okConfirm = await confirm({
      title: 'Delete Vibe',
      message: 'Delete this Vibe?',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!okConfirm) return

    const res = await deletePost({ postId: postMenu.postId })
    if (!res.ok) {
      window.alert(res.error?.message ?? 'Failed to delete Vibe')
      return
    }

    await fetchPosts(true)
    closePostMenu()
  }, [actorId, postMenu, fetchPosts, closePostMenu, deletePost, confirm])

  const handleReportPost = useCallback(() => {
    if (!actorId || !postMenu?.postId) return

    reportFlow.start({
      objectType: 'post',
      objectId: postMenu.postId,
      postId: postMenu.postId,
      dedupeKey: `report:post:${postMenu.postId}`,
      title: 'Report Vibe',
      subtitle: 'Tell us what is wrong with this Vibe.',
    })

    closePostMenu()
  }, [actorId, postMenu, reportFlow, closePostMenu])

  const handleFollowActor = useCallback(async () => {
    if (!actorId || !postMenu?.postActorId) return
    if (actorId === postMenu.postActorId) return

    try {
      const result = await toggleFollow({
        followerActorId: actorId,
        followedActorId: postMenu.postActorId,
        isFollowing: !!isMenuActorFollowing,
      })

      if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
        onFollowToast?.('Unsubscribed')
      } else {
        onFollowToast?.('Subscribed')
      }

      closePostMenu()
    } catch (err) {
      console.error('[CentralFeed] subscribe failed:', err)
      window.alert(
        err?.message ||
          (isMenuActorFollowing
            ? 'Failed to unsubscribe from actor'
            : 'Failed to subscribe to actor')
      )
    }
  }, [actorId, postMenu, closePostMenu, isMenuActorFollowing, toggleFollow, onFollowToast])

  const handleOpenActorProfile = useCallback(() => {
    if (!postMenu?.postActorId) return
    closePostMenu()
    navigate(`/profile/${postMenu.postActorId}`)
  }, [postMenu, closePostMenu, navigate])

  const handleBlockActor = useCallback(async () => {
    if (!actorId || !postMenu?.postActorId) return
    if (actorId === postMenu.postActorId) return

    const okConfirm = await confirm({
      title: 'Block actor',
      message: 'Block this actor?',
      confirmLabel: 'Block',
      tone: 'danger',
    })
    if (!okConfirm) return

    const blockedActorId = postMenu.postActorId
    let snapshot = null

    setPosts((prev) => {
      snapshot = prev
      return prev.filter((p) => String(resolvePostActorId(p)) !== String(blockedActorId))
    })

    closePostMenu()

    try {
      await blockActor({ blockerActorId: actorId, blockedActorId })
      await fetchPosts(true)
    } catch (err) {
      if (snapshot) setPosts(snapshot)
      console.error('[CentralFeed] block failed:', err)
      window.alert(err?.message || 'Failed to block actor')
    }
  }, [actorId, postMenu, closePostMenu, fetchPosts, setPosts, blockActor, confirm])

  const persistHideForMe = useCallback(
    async (postId) => {
      if (!actorId || !postId) return
      try {
        await hidePost({
          actorId,
          postId,
          reason: 'user_reported',
        })
      } catch (error) {
        console.warn('[CentralFeed] persist hide threw:', error)
      }
    },
    [actorId, hidePost]
  )

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
          await fetchPosts(true)
        }

        reportFlow.close?.()
      } catch (err) {
        console.error('[CentralFeed] report submit failed:', err)
      }
    },
    [reportFlow, persistHideForMe, fetchPosts]
  )

  const closeShare = useCallback(() => {
    setShareState({ open: false, postId: null, url: '' })
  }, [])

  const handleShare = useCallback(
    async (postId) => {
      if (!postId) return

      const url = `${window.location.origin}/post/${postId}`
      const post = posts.find((p) => p.id === postId)
      const text = post?.text ? String(post.text).slice(0, 140) : ''

      const res = await shareNative({
        title: 'Spread',
        text,
        url,
      })

      if (!res.ok) {
        setShareState({ open: true, postId, url })
      }
    },
    [posts]
  )

  return {
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
  }
}
