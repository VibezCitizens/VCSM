// src/dal/messages.write.dal.js
// ============================================================
// Messages Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Message INSERT is handled by send_message_atomic RPC.
// This file handles edit, soft-delete, hard-delete, and fetch.
// ============================================================

import { getSupabaseClient } from '../config.js'

const MESSAGE_COLUMNS = `
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
`

/* ============================================================
   Edit message
   ============================================================ */

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
    .select(MESSAGE_COLUMNS)
    .single()

  if (error) throw error

  return data
}

/* ============================================================
   Soft delete (unsend)
   ============================================================ */

export async function softDeleteMessageDAL({ messageId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('deleted_at', null)

  if (error) throw error

  return true
}

/* ============================================================
   Hard delete (admin / system)
   ============================================================ */

export async function hardDeleteMessageDAL({ messageId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error

  return true
}

/* ============================================================
   Fetch minimal fields for delete / unsend
   ============================================================ */

export async function fetchMessageForDeleteDAL({ messageId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('messages')
    .select('id, conversation_id, sender_actor_id, deleted_at')
    .eq('id', messageId)
    .maybeSingle()

  if (error) throw error

  return data ?? null
}
