import { supabase } from '@/services/supabase/supabaseClient'

/**
 * DAL: read unread chat inbox rows for a single actor.
 * Controllers aggregate these raw rows; React Query owns timing/cache.
 */
export async function readChatInboxUnreadRowsDAL(actorId) {
  if (!actorId) return []

  const { data, error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .select('unread_count')
    .eq('actor_id', actorId)
    .eq('archived', false)
    .eq('archived_until_new', false)

  if (error) throw error

  return Array.isArray(data) ? data : []
}

export default readChatInboxUnreadRowsDAL
