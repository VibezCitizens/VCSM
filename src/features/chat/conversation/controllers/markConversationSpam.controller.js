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

  // 1) Always move thread to Spam folder so SpamInboxScreen can read it.
  //    This is the primary UX side-effect and must not depend on report/moderation writes.
  await moveConversationToFolder({
    actorId: reporterActorId,
    conversationId,
    folder: 'spam',
  })

  // 2) Best-effort report row (non-fatal for folder move UX)
  let reportId = null
  try {
    reportId = await createReportDAL({
      reporterActorId,
      objectType: 'conversation',
      objectId: conversationId,
      conversationId,
      reasonCode: 'spam',
      reasonText,
    })
  } catch (e) {
    console.warn('[markConversationSpam] createReportDAL failed (non-fatal)', e)
  }

  // 3) Best-effort cover state for this viewer (non-fatal for folder move UX)
  try {
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

    if (error) {
      console.warn('[markConversationSpam] moderation_actions insert failed (non-fatal)', error)
    }
  } catch (e) {
    console.warn('[markConversationSpam] moderation_actions insert threw (non-fatal)', e)
  }

  return reportId
}
