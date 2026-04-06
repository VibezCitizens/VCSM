// src/dal/messages.timeline.read.dal.js
// ============================================================
// Messages Read DAL (ACTOR-AGNOSTIC)
// ============================================================

import { getSupabaseClient } from '../config.js'

const MESSAGE_TIMELINE_COLUMNS = `
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
  client_id,
  message_attachments (
    id,
    attachment_kind,
    public_url,
    storage_path,
    original_name,
    mime_type,
    size_bytes,
    width,
    height,
    duration_ms,
    checksum,
    upload_status,
    sort_order,
    meta,
    created_at
  )
`

export async function getMessagesForConversationForActor({
  conversationId,
  limit = 50,
  before = null,
}) {
  if (!conversationId) {
    throw new Error('[getMessagesForConversationForActor] conversationId required')
  }

  const supabase = getSupabaseClient()

  // Fetch newest first, then reverse to chronological for UI
  let query = supabase
    .schema('chat')
    .from('messages')
    .select(MESSAGE_TIMELINE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }) // NEWEST FIRST
    .limit(limit)

  // Pagination: "before" means older than timestamp
  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) throw error

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

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_actor_id,
      deleted_at
    `)
    .eq('id', messageId)
    .maybeSingle()

  if (error) throw error

  return data ?? null
}

/* ============================================================
   Fetch latest message (for inbox preview hydration)
   ============================================================ */

export async function fetchLatestMessageForConversationDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error('[fetchLatestMessageForConversationDAL] conversationId required')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
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

  if (error) throw error

  return data ?? null
}
