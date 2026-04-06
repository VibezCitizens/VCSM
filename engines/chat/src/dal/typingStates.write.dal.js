import { getSupabaseClient } from '../config.js'

export async function upsertTypingStateDAL({
  conversationId,
  actorId,
  startedAt,
  expiresAt,
}) {
  if (!conversationId || !actorId || !startedAt || !expiresAt) {
    throw new Error('[upsertTypingStateDAL] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('typing_states')
    .upsert(
      {
        conversation_id: conversationId,
        actor_id: actorId,
        started_at: startedAt,
        expires_at: expiresAt,
      },
      { onConflict: 'conversation_id,actor_id' }
    )

  if (error) throw error

  return true
}

export async function deleteTypingStateDAL({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error('[deleteTypingStateDAL] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('typing_states')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error

  return true
}

export async function deleteExpiredTypingStatesDAL({ before }) {
  if (!before) {
    throw new Error('[deleteExpiredTypingStatesDAL] before is required')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('typing_states')
    .delete()
    .lt('expires_at', before)

  if (error) throw error

  return true
}
