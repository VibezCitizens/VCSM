// src/dal/messages.last.read.dal.js
import { getSupabaseClient } from '../config.js'

export async function fetchLastMessageForConversationDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error('[fetchLastMessageForConversationDAL] conversationId required')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('messages')
    .select(`id, created_at`)
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data ?? null
}
