// src/dal/inbox.entry.read.dal.js
import { getSupabaseClient } from '../config.js'

export async function getInboxEntryDAL({ actorId, conversationId }) {
  if (!actorId || !conversationId) {
    throw new Error('[getInboxEntryDAL] missing params')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .select(`
      conversation_id,
      actor_id,
      folder,
      last_message_id,
      last_message_at,
      unread_count,
      pinned,
      archived,
      muted,
      archived_until_new,
      history_cutoff_at
    `)
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (error) throw error

  return data ?? null
}
