// src/features/moderation/controllers/getConversationCoverStatus.controller.js
// ============================================================
// Controller: cover status
// - Answers: "Is this covered (hidden/spam) for this actor?"
// - Returns domain result only (boolean)
// ============================================================

import { dalGetConversationHideAction } from '../dal/moderationActions.dal'

export async function getConversationCoverStatus({ actorId, conversationId }) {
  if (!actorId || !conversationId) return false

  try {
    const row = await dalGetConversationHideAction({ actorId, conversationId })
    return row?.action_type === 'hide'
  } catch {
    // treat failure as "not covered"
    return false
  }
}
