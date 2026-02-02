// src/features/chat/conversation/dal/read/conversation_members.partner.read.dal.js
// ============================================================
// Conversation Members — READ DAL (ACTOR-BASED)
// ------------------------------------------------------------
// - Central export for conversation member reads
// - Keeps controllers importing from ONE path
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Fetch a single conversation member row
 * (Used by sendMessage.controller.js)
 */
export async function fetchConversationMember({ conversationId, actorId }) {
  if (!conversationId || !actorId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) {
    console.error('[fetchConversationMember] failed:', error)
    throw error
  }

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

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('actor_id')
    .eq('conversation_id', conversationId)

  if (error) {
    console.error('[fetchConversationMemberActorIds] failed:', error)
    throw error
  }

  return (data ?? []).map((r) => r?.actor_id).filter(Boolean)
}
