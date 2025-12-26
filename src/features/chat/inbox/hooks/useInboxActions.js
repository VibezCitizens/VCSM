// ============================================================
// useInboxActions
// ------------------------------------------------------------
// - Actor-based
// - NULL-SAFE (identity hydration safe)
// - No hook-order violations
// ============================================================

import { useCallback } from 'react'

import {
  updateInboxFlags,
  archiveConversationForActor,
} from '@/features/chat/inbox/dal/inbox.write.dal'

import {
  leaveConversation,
} from '@/features/chat/conversation/controllers/leaveConversation.controller'

// ✅ NEW: thread delete controller
import {
  deleteThreadForMeController,
} from '@/features/chat/inbox/controllers/deleteThreadForMe.controller'

export default function useInboxActions({ actorId }) {
  const isReady = Boolean(actorId)

  /* ============================================================
     Safe no-op wrapper
     ============================================================ */
  const guard = (fn) => async (...args) => {
    if (!isReady) return
    return fn(...args)
  }

  const pin = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: true },
      })
    }),
    [actorId]
  )

  const unpin = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: false },
      })
    }),
    [actorId]
  )

  const mute = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: true },
      })
    }),
    [actorId]
  )

  const unmute = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: false },
      })
    }),
    [actorId]
  )

  const archive = useCallback(
    guard(async (conversationId) => {
      await archiveConversationForActor({
        actorId,
        conversationId,
      })
    }),
    [actorId]
  )

  const leave = useCallback(
    guard(async (conversationId) => {
      await leaveConversation({
        actorId,
        conversationId,
      })
    }),
    [actorId]
  )

  /* ============================================================
     Delete thread (for me only)
     ============================================================ */
  const deleteThreadForMe = useCallback(
    guard(async (conversationId) => {
      await deleteThreadForMeController({
        actorId,
        conversationId,
        archiveUntilNew: true,
      })
    }),
    [actorId]
  )

  return {
    ready: isReady,
    pin,
    unpin,
    mute,
    unmute,
    archive,
    leave,
    deleteThreadForMe, // ✅ exposed
  }
}
