// src/features/chat/conversation/dal/read/messages.edit.read.dal.js
// ============================================================
// Fetch message for edit validation (RAW READ)(R)(R)(R)(R)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

export async function fetchMessageForEditDAL({ messageId }) {
  if (!messageId) {
    throw new Error('[fetchMessageForEditDAL] messageId required')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .select('id, sender_actor_id, deleted_at')
    .eq('id', messageId)
    .maybeSingle()

  if (error) throw error
  return data
}
