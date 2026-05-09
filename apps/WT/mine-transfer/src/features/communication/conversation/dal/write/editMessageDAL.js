// src/features/chat/conversation/dal/write/messages.edit.write.dal.js
// ============================================================
// Edit message body (RAW WRITE)(R)(R)(R)(R)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

export async function editMessageDAL({
  messageId,
  body,
}) {
  const { data, error } = await supabase
    .schema('vc')
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
      message_type,
      body,
      media_url,
      reply_to_message_id,
      edited_at,
      deleted_at,
      created_at,
      client_id
    `)
    .single()

  if (error) throw error
  return data
}
