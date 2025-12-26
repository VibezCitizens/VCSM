// src/features/chat/conversation/dal/read/messages.read.dal.js
// ============================================================
// Messages Read DAL (ACTOR-AGNOSTIC)
// ------------------------------------------------------------
// - RAW database reads only
// - NO visibility logic
// - NO message_receipts joins
// - NO actor-based filtering
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

const MESSAGE_TIMELINE_COLUMNS = `
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
`

export async function getMessagesForConversationForActor({
  conversationId,
  limit = 50,
  before = null,
}) {
  if (!conversationId) {
    throw new Error(
      '[getMessagesForConversationForActor] conversationId required'
    )
  }

  let query = supabase
    .schema('vc')
    .from('messages')
    .select(MESSAGE_TIMELINE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    console.error(
      '[getMessagesForConversationForActor] query failed',
      error
    )
    throw error
  }

  return data ?? []
}

/* ============================================================
   Fetch minimal message fields for UNSEND
   ============================================================ */

export async function fetchMessageForUnsendDAL({
  messageId,
}) {
  if (!messageId) {
    throw new Error(
      '[fetchMessageForUnsendDAL] messageId required'
    )
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select(`
      id,
      sender_actor_id,
      deleted_at
    `)
    .eq('id', messageId)
    .maybeSingle()

  if (error) {
    console.error(
      '[fetchMessageForUnsendDAL] query failed',
      error
    )
    throw error
  }

  return data ?? null
}
