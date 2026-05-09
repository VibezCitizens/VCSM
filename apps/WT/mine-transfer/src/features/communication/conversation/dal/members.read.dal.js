import { supabase } from '@/services/supabase/supabaseClient'

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

  return data ?? []
}

export async function getConversationMember({ conversationId, actorId }) {
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

  return data ?? null
}
