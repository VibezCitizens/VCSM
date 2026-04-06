import { getSupabaseClient } from '../config.js'

/**
 * RAW inbox thread delete (one-sided)
 * NO business logic
 */
export async function deleteThreadForMeDAL({
  actorId,
  conversationId,
  patch,
}) {
  const supabase = getSupabaseClient()

  return supabase
    .schema('chat')
    .from('inbox_entries')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
}
