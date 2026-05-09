// src/features/chat/conversation/dal/messages.read.dal.js
// ============================================================
// Messages Read DAL
// ------------------------------------------------------------
// - RAW database reads only
// - No business rules
// - No permission checks
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Fetch messages for a conversation (timeline).
 */
export async function getMessagesForConversation({
  conversationId,
  limit = 50,
  before = null,
}) {
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('[getMessagesForConversation] conversationId must be a UUID string')
  }

  let query = supabase
    .schema('vc')
    .from('messages')
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

      sender:actors!messages_sender_actor_id_fkey (
        id,
        kind,
        profile_id,
        vport_id
      )
    `)
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getMessagesForConversation] query failed', error)
    throw error
  }

  return data ?? []
}

/**
 * Fetch a single message row for hard delete / moderation.
 * RAW ROW ONLY.
 */
export async function fetchMessageForDelete({
  messageId,
}) {
  if (!messageId) {
    throw new Error('[fetchMessageForDelete] messageId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select(
      `
      id,
      sender_actor_id,
      deleted_at
    `
    )
    .eq('id', messageId)
    .maybeSingle()

  if (error) {
    console.error('[fetchMessageForDelete] query failed', error)
    throw error
  }

  return data ?? null
}
