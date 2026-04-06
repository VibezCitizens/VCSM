// src/dal/messageReceipts.write.dal.js
// ============================================================
// Message Receipts — WRITE DAL
// ------------------------------------------------------------
// - Actor-based ONLY
// - Writes only (no reads)
// - Handles per-actor visibility + delivery state
// - No ownership / permission logic
// ============================================================

import { getSupabaseClient } from '../config.js'

/* ============================================================
   Delete message for me (hide)
   ============================================================ */

/**
 * Hide a message for a specific actor.
 * This is a SOFT delete ("delete for me").
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.messageId
 * @param {string} [params.hiddenAt]
 */
export async function deleteMessageForMeDAL({
  actorId,
  messageId,
  hiddenAt,
}) {
  if (!actorId || !messageId) {
    throw new Error('[deleteMessageForMeDAL] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('message_receipts')
    .upsert(
      {
        message_id: messageId,
        actor_id: actorId,
        hidden_at: hiddenAt ?? new Date().toISOString(),
      },
      {
        onConflict: 'message_id,actor_id',
      }
    )

  if (error) throw new Error('[deleteMessageForMeDAL] upsert failed')
}

/* ============================================================
   Undo delete-for-me (unhide)
   ============================================================ */

export async function undoDeleteMessageForMeDAL({
  actorId,
  messageId,
}) {
  if (!actorId || !messageId) {
    throw new Error('[undoDeleteMessageForMeDAL] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('message_receipts')
    .update({
      hidden_at: null,
    })
    .eq('actor_id', actorId)
    .eq('message_id', messageId)

  if (error) throw new Error('[undoDeleteMessageForMeDAL] update failed')
}

/* ============================================================
   Insert / update delivery & read receipts
   ============================================================ */

/**
 * Insert or update delivery / read receipt for an actor.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {'delivered'|'read'} [params.status]
 * @param {string|null} [params.deliveredAt]
 * @param {string|null} [params.seenAt]
 */
export async function upsertMessageReceiptDAL({
  messageId,
  actorId,
  status = 'delivered',
  deliveredAt = null,
  seenAt = null,
}) {
  if (!messageId || !actorId) {
    throw new Error('[upsertMessageReceiptDAL] missing params')
  }

  const supabase = getSupabaseClient()
  const resolvedDeliveredAt =
    deliveredAt ?? (status === 'delivered' || status === 'read'
      ? new Date().toISOString()
      : null)
  const resolvedSeenAt =
    seenAt ?? (status === 'read' ? new Date().toISOString() : null)

  const payload = {
    message_id: messageId,
    actor_id: actorId,
    status,
    delivered_at: resolvedDeliveredAt,
    seen_at: resolvedSeenAt,
  }

  const { error } = await supabase
    .schema('chat')
    .from('message_receipts')
    .upsert(payload, {
      onConflict: 'message_id,actor_id',
    })

  if (error) throw new Error('[upsertMessageReceiptDAL] upsert failed')
}
