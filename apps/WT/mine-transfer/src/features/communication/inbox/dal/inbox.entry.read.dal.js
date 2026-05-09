// src/features/chat/inbox/dal/inbox.entry.read.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

export async function getInboxEntryDAL({ actorId, conversationId }) {
  if (!actorId || !conversationId) {
    throw new Error('[getInboxEntryDAL] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .select('folder, archived, archived_until_new')
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)
    .maybeSingle()

  if (error) {
    console.error('[getInboxEntryDAL] failed', error)
    throw error
  }

  return data ?? null
}
