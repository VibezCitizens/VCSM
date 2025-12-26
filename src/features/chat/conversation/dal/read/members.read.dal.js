// src/features/chat/conversation/dal/read/members.read.dal.js

import { supabase } from '@/services/supabase/supabaseClient'

export async function getConversationMembersDAL({
  conversationId,
}) {
  if (!conversationId) {
    throw new Error('[getConversationMembersDAL] conversationId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
      actor_id,
      role,
      is_active,
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

  if (error) throw error
  return data ?? []
}

export async function getConversationMemberDAL({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[getConversationMemberDAL] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(`
      actor_id,
      role,
      is_active,
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

  if (error) throw error
  return data ?? null
}
