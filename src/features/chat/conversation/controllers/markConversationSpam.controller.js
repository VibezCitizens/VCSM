// src/features/chat/conversation/controllers/markConversationSpam.controller.js
import { supabase } from '@/services/supabase/supabaseClient'
import { createReportDAL } from '@/features/chat/conversation/dal/write/reports.write.dal'

// ✅ NEW: move inbox entry into spam folder
import { moveConversationToFolder } from '@/features/chat/inbox/dal/inbox.write.dal'

export async function markConversationSpam({
  reporterActorId,
  conversationId,
  reasonText = null,
}) {
  if (!reporterActorId) throw new Error('markConversationSpam: reporterActorId is required')
  if (!conversationId) throw new Error('markConversationSpam: conversationId is required')

  // 1) create report
  const reportId = await createReportDAL({
    reporterActorId,
    objectType: 'conversation',
    objectId: conversationId,
    conversationId,
    reasonCode: 'spam',
    reasonText,
  })

  // 2) persist cover state for this viewer
  const { error } = await supabase
    .schema('vc')
    .from('moderation_actions')
    .insert({
      actor_id: reporterActorId,
      object_type: 'conversation',
      object_id: conversationId,
      action_type: 'hide',
      reason: 'user_marked_spam',
    })

  if (error) throw error

  // 3) ✅ NEW: move thread to Spam folder so SpamInboxScreen can read it
  await moveConversationToFolder({
    actorId: reporterActorId,
    conversationId,
    folder: 'spam',
  })

  return reportId
}
