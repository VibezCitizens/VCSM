// src/features/chat/conversation/dal/read/messages.last.read.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

export async function fetchLastMessageForConversationDAL({ conversationId }) {
  if (!conversationId) {
    throw new Error('[fetchLastMessageForConversationDAL] conversationId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select(`id, created_at`)
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[fetchLastMessageForConversationDAL] failed', error)
    throw error
  }

  return data ?? null
}
