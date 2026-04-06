// src/dal/messageForEdit.read.dal.js
// ============================================================
// Fetch message for edit validation (RAW READ)
// ============================================================

import { getSupabaseClient } from '../config.js'

export async function fetchMessageForEditDAL({ messageId }) {
  if (!messageId) {
    throw new Error('[fetchMessageForEditDAL] messageId required')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('messages')
    .select('id, conversation_id, sender_actor_id, deleted_at')
    .eq('id', messageId)
    .maybeSingle()

  if (error) throw error
  return data
}
