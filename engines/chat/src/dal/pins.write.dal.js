// src/dal/pins.write.dal.js
// ============================================================
// Conversation Pins Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Schema: chat.conversation_pins
//   PK: (conversation_id, message_id)  — no separate id column
//   Columns: conversation_id, message_id, pinned_by_actor_id,
//            created_at, expires_at
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert a pin row for a message inside a conversation.
 * Upserts on (conversation_id, message_id) — safe to retry.
 *
 * @param {Object}      params
 * @param {string}      params.conversationId
 * @param {string}      params.messageId
 * @param {string}      params.pinnedByActorId
 * @param {string|null} [params.expiresAt]  - ISO timestamp, optional
 * @returns {Promise<Object>} Raw pin row
 */
export async function insertPinDAL({ conversationId, messageId, pinnedByActorId, expiresAt = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversation_pins')
    .upsert(
      {
        conversation_id: conversationId,
        message_id: messageId,
        pinned_by_actor_id: pinnedByActorId,
        expires_at: expiresAt,
      },
      { onConflict: 'conversation_id,message_id' }
    )
    .select(`
      conversation_id,
      message_id,
      pinned_by_actor_id,
      created_at,
      expires_at
    `)
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a pin row for a message inside a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.messageId
 * @returns {Promise<true>}
 */
export async function deletePinDAL({ conversationId, messageId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_pins')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('message_id', messageId)

  if (error) throw error

  return true
}

/**
 * Fetch all pinned messages in a conversation, newest first.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @returns {Promise<Object[]>} Array of raw pin rows
 */
export async function fetchPinsForConversationDAL({ conversationId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversation_pins')
    .select(`
      conversation_id,
      message_id,
      pinned_by_actor_id,
      created_at,
      expires_at
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}
