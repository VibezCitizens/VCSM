// src/features/chat/inbox/controllers/deleteThreadForMe.controller.js
// ============================================================
// deleteThreadForMe.controller
// ------------------------------------------------------------
// - Actor-based
// - Inbox-level delete (one-sided)
// - Owns meaning & intent
// - DAL performs raw DB write
// ============================================================

import { deleteThreadForMeDAL }
  from '../dal/deleteThreadForMe.dal'

/* ============================================================
   DEBUG CONFIG
   ============================================================ */
const DEBUG = true
const dbg = (...args) => {
  if (DEBUG) console.log('[deleteThreadForMeController]', ...args)
}

/**
 * One-sided inbox delete for an actor.
 *
 * Semantics:
 * - Hides the conversation for THIS actor only
 * - Does NOT affect other participants
 * - Uses history_cutoff_at to prevent resurrection
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.conversationId
 * @param {boolean} [params.archiveUntilNew=true]
 * @param {boolean} [params.archive=false]
 */
export async function deleteThreadForMeController({
  actorId,
  conversationId,
  archiveUntilNew = true,
  archive = false,
}) {
  /* ============================================================
     DEBUG START
     ============================================================ */
  if (DEBUG) {
    console.groupCollapsed('[deleteThreadForMeController] START')
    dbg('input:', {
      actorId,
      conversationId,
      archiveUntilNew,
      archive,
    })
    console.time('[deleteThreadForMeController] total')
  }

  /* ============================================================
     Validation
     ============================================================ */
  if (!actorId || !conversationId) {
    dbg('❌ validation failed')
    console.groupEnd()
    throw new Error('[deleteThreadForMeController] missing params')
  }

  /* ============================================================
     Build patch (meaning lives HERE)
     ============================================================ */
  const nowIso = new Date().toISOString()

  const patch = {
    history_cutoff_at: nowIso,
    last_message_id: null,
    last_message_at: null,
    unread_count: 0,
  }

  if (archive) {
    patch.archived = true
    patch.archived_until_new = false
  } else if (archiveUntilNew) {
    patch.archived_until_new = true
  }

  if (DEBUG) {
    dbg('computed patch:', patch)
    console.time('[deleteThreadForMeController] DAL call')
  }

  /* ============================================================
     Execute DAL
     ============================================================ */
  const result = await deleteThreadForMeDAL({
    actorId,
    conversationId,
    patch,
  })

  if (DEBUG) {
    console.timeEnd('[deleteThreadForMeController] DAL call')
    dbg('DAL result:', result)
  }

  if (result?.error) {
    console.error('[deleteThreadForMeController] FAILED', result.error)
    console.groupEnd()
    throw result.error
  }

  /* ============================================================
     DEBUG END
     ============================================================ */
  if (DEBUG) {
    console.timeEnd('[deleteThreadForMeController] total')
    console.groupEnd()
  }

  return { ok: true }
}