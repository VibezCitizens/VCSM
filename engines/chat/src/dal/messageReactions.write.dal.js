// src/dal/messageReactions.write.dal.js
// ============================================================
// Message Reactions Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Schema: chat.message_reactions
//   PK: (message_id, actor_id, reaction)
//   Columns: message_id, actor_id, reaction, created_at, updated_at
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert a reaction row.
 * Upserts on (message_id, actor_id, reaction) — safe to retry.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.reaction  - e.g. '👍', ':thumbsup:'
 * @returns {Promise<Object>} Raw reaction row
 */
export async function insertReactionDAL({ messageId, actorId, reaction }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('message_reactions')
    .upsert(
      {
        message_id: messageId,
        actor_id: actorId,
        reaction,
      },
      { onConflict: 'message_id,actor_id,reaction' }
    )
    .select(`
      message_id,
      actor_id,
      reaction,
      created_at,
      updated_at
    `)
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a specific reaction row.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.reaction
 * @returns {Promise<true>}
 */
export async function deleteReactionDAL({ messageId, actorId, reaction }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('actor_id', actorId)
    .eq('reaction', reaction)

  if (error) throw error

  return true
}

/**
 * Fetch all reactions for a single message.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @returns {Promise<Object[]>} Array of raw reaction rows
 */
export async function fetchReactionsForMessageDAL({ messageId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('message_reactions')
    .select(`
      message_id,
      actor_id,
      reaction,
      created_at,
      updated_at
    `)
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data ?? []
}
