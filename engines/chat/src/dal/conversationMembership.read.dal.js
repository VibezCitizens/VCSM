import { getSupabaseClient } from '../config.js'

const MEMBERSHIP_COLUMNS =
  'conversation_id,actor_id,role,membership_status,can_post,can_manage,can_moderate'

const CONVERSATION_COLUMNS = `
  id,
  conversation_kind,
  access_mode,
  visibility,
  scope_kind,
  scope_id,
  conversation_members(${MEMBERSHIP_COLUMNS})
`

export async function readConversationMembershipDAL({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error('readConversationMembershipDAL: missing params')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .select(MEMBERSHIP_COLUMNS)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function readConversationMembershipStateDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error('readConversationMembershipStateDAL: conversationId required')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', conversationId)
    .single()

  if (error) throw error
  return data ?? null
}
