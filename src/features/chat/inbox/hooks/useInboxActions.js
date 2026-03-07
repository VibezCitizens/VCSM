// ============================================================
// useInboxActions
// ------------------------------------------------------------
// - Actor-based
// - NULL-SAFE (identity hydration safe)
// - No hook-order violations
// ============================================================

import { useCallback } from 'react'

import {
  ctrlArchiveConversationForActor,
  ctrlMoveConversationToFolder,
  ctrlUpdateInboxFlags,
} from '@/features/chat/inbox/controllers/inboxActions.controller'

import { leaveConversation } from '@/features/chat/conversation/controllers/leaveConversation.controller'

// ✅ NEW: thread delete controller
import { deleteThreadForMeController } from '@/features/chat/inbox/controllers/deleteThreadForMe.controller'

export default function useInboxActions({ actorId }) {
  const isReady = Boolean(actorId)

  const pin = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlUpdateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: true },
      })
    },
    [actorId, isReady]
  )

  const unpin = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlUpdateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: false },
      })
    },
    [actorId, isReady]
  )

  const mute = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlUpdateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: true },
      })
    },
    [actorId, isReady]
  )

  const unmute = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlUpdateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: false },
      })
    },
    [actorId, isReady]
  )

  const archive = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlArchiveConversationForActor({
        actorId,
        conversationId,
      })
    },
    [actorId, isReady]
  )

  // ✅ Unarchive (move back to inbox folder)
  const unarchive = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlMoveConversationToFolder({
        actorId,
        conversationId,
        folder: 'inbox',
      })
    },
    [actorId, isReady]
  )

  const leave = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await leaveConversation({
        actorId,
        conversationId,
      })
    },
    [actorId, isReady]
  )

  /* ============================================================
     Requests: Ignore (NO deleting) -> move to spam
     ============================================================ */
  const ignoreRequest = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await ctrlMoveConversationToFolder({
        actorId,
        conversationId,
        folder: 'spam',
      })
    },
    [actorId, isReady]
  )

  /* ============================================================
     Delete thread (for me only)
     ============================================================ */
  const deleteThreadForMe = useCallback(
    async (conversationId) => {
      if (!isReady) return
      await deleteThreadForMeController({
        actorId,
        conversationId,
        archiveUntilNew: true,
      })
    },
    [actorId, isReady]
  )

  return {
    ready: isReady,
    pin,
    unpin,
    mute,
    unmute,
    archive,
    unarchive,
    leave,

    // ✅ Requests
    ignoreRequest,

    // existing
    deleteThreadForMe,
  }
}
