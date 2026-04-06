// src/controller/deleteThreadForMe.controller.js
// ============================================================
// deleteThreadForMe.controller
// ------------------------------------------------------------
// - Actor-based
// - Inbox-level delete (one-sided)
// - Owns meaning & intent
// - DAL performs raw DB write
// ============================================================

import { deleteThreadForMeDAL } from '../dal/deleteThreadForMe.dal.js'

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
     Validation
     ============================================================ */
  if (!actorId || !conversationId) {
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

  /* ============================================================
     Execute DAL
     ============================================================ */
  const result = await deleteThreadForMeDAL({
    actorId,
    conversationId,
    patch,
  })

  if (result?.error) throw result.error

  return { ok: true }
}
