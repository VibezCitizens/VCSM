// src/features/chat/conversation/dal/read/messageVisibility.read.dal.js
// ============================================================
// Message Visibility — READ DAL
// ------------------------------------------------------------
// - Actor-based ONLY
// - Read-only
// - No business rules
// - No UI meaning
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Fetch IDs of messages hidden for a specific actor.
 *
 * RAW DATA ONLY.
 * Caller decides how to apply visibility.
 */
export async function getHiddenMessageIdSetDAL({
  actorId,
}) {
  if (!actorId) {
    throw new Error('[getHiddenMessageIdSetDAL] actorId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .select('message_id')
    .eq('actor_id', actorId)
    .not('hidden_at', 'is', null)

  if (error) {
    console.error('[getHiddenMessageIdSetDAL] failed', error)
    throw error
  }

  return new Set((data ?? []).map((r) => r.message_id))
}
