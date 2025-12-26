// src/features/chat/conversation/dal/write/messages.write.dal.js
// ============================================================
// Messages Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/* ============================================================
   Insert message
   ============================================================ */

/**
 * Insert a new message row.
 * RAW INSERT — controller enforces ownership & permissions.
 */
export async function insertMessageDAL({
  conversationId,
  senderActorId,
  messageType,
  body = null,
  mediaUrl = null,
  replyToMessageId = null,
  clientId = null,
}) {
  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_actor_id: senderActorId,
      message_type: messageType,
      body,
      media_url: mediaUrl,
      reply_to_message_id: replyToMessageId,
      client_id: clientId,
    })
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

  if (error) {
    console.error('[insertMessageDAL] failed', error)
    throw error
  }

  return data
}

/* ============================================================
   Edit message
   ============================================================ */

/**
 * Update message body + edited_at.
 * RAW UPDATE — ownership enforced by controller.
 */
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
      created_at
    `)
    .single()

  if (error) {
    console.error('[editMessageDAL] failed', error)
    throw error
  }

  return data
}

/* ============================================================
   Soft delete (unsend)
   ============================================================ */

/**
 * Soft-delete a message for everyone.
 * Sets deleted_at timestamp.
 */
export async function softDeleteMessageDAL({
  messageId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .is('deleted_at', null)

  if (error) {
    console.error('[softDeleteMessageDAL] failed', error)
    throw error
  }

  return true
}

/* ============================================================
   Hard delete (admin / system)
   ============================================================ */

/**
 * Permanently delete a message row.
 * IRREVERSIBLE.
 */
export async function hardDeleteMessageDAL({
  messageId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    console.error('[hardDeleteMessageDAL] failed', error)
    throw error
  }

  return true
}

/* ============================================================
   Fetch minimal message fields for delete / unsend
   ============================================================ */

/**
 * Fetch minimal fields needed for delete / unsend controllers.
 * RAW ROW ONLY.
 */
export async function fetchMessageForDeleteDAL({
  messageId,
}) {
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
    console.error('[fetchMessageForDeleteDAL] failed', error)
    throw error
  }

  return data ?? null
}
