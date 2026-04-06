import { getSupabaseClient } from '../config.js'

export async function insertConversationMembershipDAL({
  conversationId,
  actorId,
  role = 'member',
  membershipStatus = 'active',
  canPost = true,
  canManage = false,
  canModerate = false,
}) {
  if (!conversationId || !actorId) {
    throw new Error('insertConversationMembershipDAL: missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .insert({
      conversation_id: conversationId,
      actor_id: actorId,
      role,
      membership_status: membershipStatus,
      can_post: canPost,
      can_manage: canManage,
      can_moderate: canModerate,
    })

  if (error) throw error
}

export async function upsertConversationMembershipDAL({
  conversationId,
  actorId,
  role = 'member',
  membershipStatus = 'active',
  canPost = true,
  canManage = false,
  canModerate = false,
}) {
  if (!conversationId || !actorId) {
    throw new Error('upsertConversationMembershipDAL: missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .upsert(
      {
        conversation_id: conversationId,
        actor_id: actorId,
        role,
        membership_status: membershipStatus,
        can_post: canPost,
        can_manage: canManage,
        can_moderate: canModerate,
      },
      {
        onConflict: 'conversation_id,actor_id',
      }
    )

  if (error) throw error
}

export async function setConversationMembershipStatusDAL({
  conversationId,
  actorId,
  membershipStatus,
}) {
  if (!conversationId || !actorId || !membershipStatus) {
    throw new Error('setConversationMembershipStatusDAL: missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .update({ membership_status: membershipStatus })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}
