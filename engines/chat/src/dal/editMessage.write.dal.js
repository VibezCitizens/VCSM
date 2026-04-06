// src/dal/editMessage.write.dal.js
// ============================================================
// Edit message body (RAW WRITE)
// ============================================================

import { getSupabaseClient } from '../config.js'

export async function editMessageDAL({ messageId, body }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('messages')
    .update({
      body,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select(`
      id,
      conversation_id,
      sender_actor_id,
      message_kind,
      body,
      reply_to_message_id,
      conversation_seq,
      edited_at,
      deleted_at,
      is_hidden,
      created_at,
      client_id
    `)
    .single()

  if (error) throw error
  return data
}
