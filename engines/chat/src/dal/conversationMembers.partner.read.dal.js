// src/dal/conversationMembers.partner.read.dal.js
// ============================================================
// Conversation Members — READ DAL (ACTOR-BASED)
// ------------------------------------------------------------
// - Central export for conversation member reads
// - Keeps controllers importing from ONE path
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Fetch a single conversation member row
 * (Used by sendMessage.controller.js)
 */
export async function fetchConversationMember({ conversationId, actorId }) {
  if (!conversationId || !actorId) return null

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .select('conversation_id,actor_id,role,membership_status,can_post,can_manage,can_moderate,last_read_message_id,last_read_at,joined_at')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) throw error

  return data ?? null
}

/**
 * Fetch all member actorIds for a conversation
 * Used for block enforcement.
 *
 * @returns {string[]} actorIds
 */
export async function fetchConversationMemberActorIds({ conversationId }) {
  if (!conversationId) return []

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .select('actor_id')
    .eq('conversation_id', conversationId)

  if (error) throw error

  return (data ?? []).map((r) => r?.actor_id).filter(Boolean)
}
