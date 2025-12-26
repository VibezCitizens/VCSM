import { supabase } from '@/services/supabase/supabaseClient'

/**
 * RAW inbox thread delete (one-sided)
 * NO business logic
 */
export async function deleteThreadForMeDAL({
  actorId,
  conversationId,
  patch,
}) {
  return supabase
    .schema('vc')
    .from('inbox_entries')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
}
