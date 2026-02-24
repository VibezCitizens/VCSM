import { supabase } from '@/services/supabase/supabaseClient'

function isRpcNetworkFailure(error) {
  const text = String(
    error?.message || error?.details || error?.hint || ''
  ).toLowerCase()

  return (
    text.includes('networkerror') ||
    text.includes('failed to fetch') ||
    text.includes('cors') ||
    text.includes('request failed')
  )
}

async function openConversationFallback({
  conversationId,
  actorId,
}) {
  // 1) Ensure membership row exists and is active
  const { data: member, error: memberError } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select('conversation_id,actor_id,is_active')
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (memberError) throw memberError

  if (!member) {
    const { error: insertMemberError } = await supabase
      .schema('vc')
      .from('conversation_members')
      .insert({
        conversation_id: conversationId,
        actor_id: actorId,
        role: 'member',
        is_active: true,
      })

    if (insertMemberError) throw insertMemberError
  } else if (member.is_active === false) {
    const { error: reactivateError } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({ is_active: true })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)

    if (reactivateError) throw reactivateError
  }

  // 2) Ensure inbox entry exists and is visible
  const { error: inboxError } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .upsert(
      {
        conversation_id: conversationId,
        actor_id: actorId,
        folder: 'inbox',
        archived: false,
        archived_until_new: false,
      },
      { onConflict: 'conversation_id,actor_id' }
    )

  if (inboxError) throw inboxError

  // 3) Return conversation metadata
  const { data: conversation, error: conversationError } = await supabase
    .schema('vc')
    .from('conversations')
    .select(
      'id,is_group,is_stealth,created_by_actor_id,title,avatar_url,last_message_id,last_message_at,realm_id,created_at'
    )
    .eq('id', conversationId)
    .maybeSingle()

  if (conversationError) throw conversationError
  return conversation ?? null
}

export async function openConversation({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[openConversation] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .rpc('open_conversation', {
      p_conversation_id: conversationId,
      p_actor_id: actorId,
    })
    .single()

  if (error) {
    console.error('[openConversation] rpc error', error)
    if (isRpcNetworkFailure(error)) {
      console.warn('[openConversation] rpc unavailable, using fallback path')
      return openConversationFallback({ conversationId, actorId })
    }
    throw error
  }

  return data
}
