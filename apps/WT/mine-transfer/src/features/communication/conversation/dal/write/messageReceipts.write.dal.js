// src/features/chat/conversation/dal/messageReceipts.write.dal.js
// ============================================================
// Message Receipts — WRITE DAL
// ------------------------------------------------------------
// - Actor-based ONLY
// - Writes only (no reads)
// - Handles per-actor visibility + delivery state
// - No ownership / permission logic
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

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

  const { error } = await supabase
    .schema('vc')
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

  if (error) {
    console.error(error)
    throw new Error('[deleteMessageForMeDAL] upsert failed')
  }
}

/* ============================================================
   Undo delete-for-me (unhide)
   ============================================================ */

/**
 * Undo "delete for me" (make message visible again).
 */
export async function undoDeleteMessageForMeDAL({
  actorId,
  messageId,
}) {
  if (!actorId || !messageId) {
    throw new Error('[undoDeleteMessageForMeDAL] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .update({
      hidden_at: null,
    })
    .eq('actor_id', actorId)
    .eq('message_id', messageId)

  if (error) {
    console.error(error)
    throw new Error('[undoDeleteMessageForMeDAL] update failed')
  }
}

/* ============================================================
   Insert / update delivery & read receipts
   ============================================================ */

/**
 * Insert or update delivery / read receipt for an actor.
 */
export async function upsertMessageReceiptDAL({
  messageId,
  actorId,
  status = 'delivered', // 'delivered' | 'read'
}) {
  if (!messageId || !actorId) {
    throw new Error('[upsertMessageReceiptDAL] missing params')
  }

  const payload = {
    message_id: messageId,
    actor_id: actorId,
    status,
    seen_at: status === 'read'
      ? new Date().toISOString()
      : null,
  }

  const { error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .upsert(payload, {
      onConflict: 'message_id,actor_id',
    })

  if (error) {
    console.error(error)
    throw new Error('[upsertMessageReceiptDAL] upsert failed')
  }
}
