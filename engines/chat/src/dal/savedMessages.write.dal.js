// src/dal/savedMessages.write.dal.js
// ============================================================
// Saved Messages Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Schema: chat.saved_messages
//   PK: (actor_id, message_id)  — no separate id column
//   Columns: actor_id, message_id, note, created_at
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Save a message for an actor.
 * Upserts on (actor_id, message_id) — safe to retry.
 *
 * @param {Object}      params
 * @param {string}      params.actorId
 * @param {string}      params.messageId
 * @param {string|null} [params.note]  - optional personal note
 * @returns {Promise<Object>} Raw saved message row
 */
export async function insertSavedMessageDAL({ actorId, messageId, note = null }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('saved_messages')
    .upsert(
      {
        actor_id: actorId,
        message_id: messageId,
        note,
      },
      { onConflict: 'actor_id,message_id' }
    )
    .select(`
      actor_id,
      message_id,
      note,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

/**
 * Remove a saved message for an actor.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.messageId
 * @returns {Promise<true>}
 */
export async function deleteSavedMessageDAL({ actorId, messageId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('saved_messages')
    .delete()
    .eq('actor_id', actorId)
    .eq('message_id', messageId)

  if (error) throw error

  return true
}

/**
 * Fetch all saved messages for an actor, newest first.
 *
 * @param {Object}      params
 * @param {string}      params.actorId
 * @param {number}      [params.limit=30]
 * @param {string|null} [params.before]  - ISO timestamp cursor (created_at)
 * @returns {Promise<Object[]>} Array of raw saved message rows
 */
export async function fetchSavedMessagesDAL({ actorId, limit = 30, before = null }) {
  const supabase = getSupabaseClient()

  let query = supabase
    .schema('chat')
    .from('saved_messages')
    .select(`
      actor_id,
      message_id,
      note,
      created_at
    `)
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query

  if (error) throw error

  return data ?? []
}
