import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Verify that a notification recipient row belongs to the given actor.
 * Queries notification.recipients by (id, recipient_actor_id).
 * Returns true only when both fields match — rejects if either is missing.
 *
 * Called before any inbox state mutation (markRead, dismiss, archive) to
 * ensure callers cannot mutate another actor's notifications.
 * DB RLS on notification.inbox_items is the final enforcement layer.
 *
 * @param {string} recipientId — notification.recipients.id (row UUID)
 * @param {string} actorId — the actor asserting ownership
 * @returns {Promise<boolean>}
 */
export async function verifyRecipientOwnership(recipientId, actorId) {
  if (!recipientId || !actorId) return false

  const { data, error } = await supabase
    .schema('notification')
    .from('recipients')
    .select('id')
    .eq('id', recipientId)
    .eq('recipient_actor_id', actorId)
    .maybeSingle()

  if (error) return false
  return !!data
}
