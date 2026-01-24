import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Create a moderation report.
 * Uses vc.reports (reason_code includes 'spam' per schema).
 */
export async function createReportDAL({
  reporterActorId,
  objectType, // 'conversation' | 'message'
  objectId, // uuid
  conversationId = null,
  messageId = null,
  reasonCode = 'spam',
  reasonText = null,
}) {
  if (!reporterActorId) throw new Error('createReportDAL: reporterActorId is required')
  if (!objectType) throw new Error('createReportDAL: objectType is required')
  if (!objectId) throw new Error('createReportDAL: objectId is required')

  const payload = {
    reporter_actor_id: reporterActorId,
    object_type: objectType,
    object_id: objectId,
    reason_code: reasonCode,
    reason_text: reasonText,
    conversation_id: conversationId,
    message_id: messageId,
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('reports')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data?.id ?? null
}
