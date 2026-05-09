// src/features/chat/conversation/dal/read/messages.read.dal.js
// ============================================================
// Messages Read DAL (ACTOR-AGNOSTIC)
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
    throw new Error('[getMessagesForConversationForActor] conversationId required')
  }

  // ✅ Fetch newest first, then reverse to chronological for UI
  let query = supabase
    .schema('vc')
    .from('messages')
    .select(MESSAGE_TIMELINE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }) // ✅ NEWEST FIRST
    .limit(limit)

  // ✅ Pagination: "before" means older than timestamp
  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getMessagesForConversationForActor] query failed', error)
    throw error
  }

  // UI wants oldest -> newest
  return (data ?? []).reverse()
}

/* ============================================================
   Fetch minimal message fields for UNSEND
   ============================================================ */

export async function fetchMessageForUnsendDAL({ messageId }) {
  if (!messageId) {
    throw new Error('[fetchMessageForUnsendDAL] messageId required')
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
    console.error('[fetchMessageForUnsendDAL] query failed', error)
    throw error
  }

  return data ?? null
}

/* ============================================================
   Fetch latest message (for inbox preview hydration)
   ============================================================ */

export async function fetchLatestMessageForConversationDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error('[fetchLatestMessageForConversationDAL] conversationId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select(`
      id,
      created_at,
      deleted_at
    `)
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[fetchLatestMessageForConversationDAL] query failed', error)
    throw error
  }

  return data ?? null
}
