import { getSupabaseClient } from '../config.js'

/**
 * Open a conversation for an actor.
 *
 * 1. Verify membership (reactivate if needed)
 * 2. Ensure inbox entry exists
 * 3. Return conversation metadata
 */
export async function openConversation({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error('[openConversation] missing params')
  }

  console.log('[openConversation] START', { conversationId, actorId })

  const supabase = getSupabaseClient()

  // 1) Ensure membership row exists and is active
  const { data: member, error: memberError } = await supabase
    .schema('chat')
    .from('conversation_members')
    .select('conversation_id,actor_id,membership_status,role')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  console.log('[openConversation] MEMBER CHECK', {
    conversationId,
    actorId,
    memberRow: member,
    memberErr: memberError,
  })

  if (memberError) throw memberError

  if (!member) {
    throw new Error('[openConversation] actor is not a member of this conversation')
  }

  if (member.membership_status !== 'active') {
    const { error: reactivateError } = await supabase
      .schema('chat')
      .from('conversation_members')
      .update({ membership_status: 'active' })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)

    console.log('[openConversation] REACTIVATE RESULT', {
      conversationId,
      actorId,
      reactivateErr: reactivateError,
    })

    if (reactivateError) throw reactivateError
  }

  // 2) Ensure inbox entry exists — but do NOT overwrite folder/archived/spam placement
  const { data: existingInbox } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (!existingInbox) {
    // Only insert if no row exists — new conversations default to inbox
    const { error: inboxError } = await supabase
      .schema('chat')
      .from('inbox_entries')
      .insert({
        conversation_id: conversationId,
        actor_id: actorId,
        folder: 'inbox',
        archived: false,
        archived_until_new: false,
      })

    if (inboxError && inboxError.code !== '23505') throw inboxError
  }

  // 3) Return conversation metadata
  const { data: conversation, error: conversationError } = await supabase
    .schema('chat')
    .from('conversations')
    .select(
      'id,conversation_kind,access_mode,visibility,scope_kind,scope_id,created_by_actor_id,title,avatar_url,last_message_id,last_message_at,realm_id,created_at'
    )
    .eq('id', conversationId)
    .maybeSingle()

  console.log('[openConversation] CONVERSATION FETCH', {
    conversationId,
    actorId,
    convo: conversation,
    convoErr: conversationError,
  })

  if (conversationError) throw conversationError
  return conversation ?? null
}
