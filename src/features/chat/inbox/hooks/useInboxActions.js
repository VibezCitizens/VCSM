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
  moveConversationToFolder, // ✅ NEW
} from '@/features/chat/inbox/dal/inbox.write.dal'

import { leaveConversation } from '@/features/chat/conversation/controllers/leaveConversation.controller'

// ✅ NEW: thread delete controller
import { deleteThreadForMeController } from '@/features/chat/inbox/controllers/deleteThreadForMe.controller'

export default function useInboxActions({ actorId }) {
  const isReady = Boolean(actorId)

  /* ============================================================
     Safe no-op wrapper
     ============================================================ */
  const guard = useCallback(
    (fn) =>
      async (...args) => {
        if (!isReady) return
        return fn(...args)
      },
    [isReady]
  )

  const pin = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: true },
      })
    }),
    [actorId, guard]
  )

  const unpin = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { pinned: false },
      })
    }),
    [actorId, guard]
  )

  const mute = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: true },
      })
    }),
    [actorId, guard]
  )

  const unmute = useCallback(
    guard(async (conversationId) => {
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { muted: false },
      })
    }),
    [actorId, guard]
  )

  const archive = useCallback(
    guard(async (conversationId) => {
      await archiveConversationForActor({
        actorId,
        conversationId,
      })
    }),
    [actorId, guard]
  )

  // ✅ Unarchive (move back to inbox folder)
  const unarchive = useCallback(
    guard(async (conversationId) => {
      await moveConversationToFolder({
        actorId,
        conversationId,
        folder: 'inbox',
      })
    }),
    [actorId, guard]
  )

  const leave = useCallback(
    guard(async (conversationId) => {
      await leaveConversation({
        actorId,
        conversationId,
      })
    }),
    [actorId, guard]
  )

  /* ============================================================
     Requests: Ignore (NO deleting) -> move to spam
     ============================================================ */
  const ignoreRequest = useCallback(
    guard(async (conversationId) => {
      await moveConversationToFolder({
        actorId,
        conversationId,
        folder: 'spam',
      })
    }),
    [actorId, guard]
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
    [actorId, guard]
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
