// src/features/chat/conversation/dal/members.read.dal.js
// ============================================================
// Conversation Members — READ DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Uses actor_presentation VIEW
// - Returns ConversationMember MODELS
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

import {
  ConversationMemberList,
  ConversationMemberModel,
} from '@/features/chat/conversation/model/ConversationMember.model'

/* ============================================================
   Get members of a conversation
   ============================================================ */
export async function getConversationMembers({ conversationId }) {
  if (!conversationId) {
    throw new Error('[getConversationMembers] conversationId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
      actor_id,
      role,
      is_active,
      joined_at,
      last_read_message_id,
      last_read_at,
      actor:actor_presentation (
        actor_id,
        kind,
        display_name,
        username,
        photo_url,
        vport_name,
        vport_slug,
        vport_avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error(error)
    throw new Error('[getConversationMembers] query failed')
  }

  // ✅ Normalize → ConversationMember[]
  return ConversationMemberList(data)
}

/* ============================================================
   Get membership record for ONE actor
   ============================================================ */
export async function getConversationMember({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[getConversationMember] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
      actor_id,
      role,
      is_active,
      joined_at,
      last_read_message_id,
      last_read_at,
      actor:actor_presentation (
        actor_id,
        kind,
        display_name,
        username,
        photo_url,
        vport_name,
        vport_slug,
        vport_avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) {
    console.error(error)
    throw new Error('[getConversationMember] query failed')
  }

  // ✅ Normalize → ConversationMember | null
  return data ? ConversationMemberModel(data) : null
}
