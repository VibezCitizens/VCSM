import { supabase } from '@/services/supabase/supabaseClient'

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
    throw error
  }

  return data
}
