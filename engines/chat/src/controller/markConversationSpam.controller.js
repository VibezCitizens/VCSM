import { insertConversationHideModerationActionDAL } from '../dal/moderationActions.write.dal.js'
import { readConversationMembershipDAL } from '../dal/conversationMembership.read.dal.js'
import { moveConversationToFolder } from '../dal/inbox.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'

export async function markConversationSpam({
  reporterActorId,
  conversationId,
  reasonText = null,
}) {
  if (!reporterActorId) {
    throw new Error('markConversationSpam: reporterActorId is required')
  }
  if (!conversationId) {
    throw new Error('markConversationSpam: conversationId is required')
  }

  const membership = await readConversationMembershipDAL({
    conversationId,
    actorId: reporterActorId,
  })

  if (!membership || membership.membership_status !== 'active') {
    throw new Error('markConversationSpam: actor is not an active conversation member')
  }

  await moveConversationToFolder({
    actorId: reporterActorId,
    conversationId,
    folder: 'spam',
  })

  try {
    await insertConversationHideModerationActionDAL({
      actorId: reporterActorId,
      conversationId,
      reason: 'user_marked_spam',
    })
  } catch (_err) {
    // moderation action is non-fatal
  }

  await publishDomainEvent({
    eventName: EVENTS.REPORT_SUBMITTED,
    aggregateType: 'conversation',
    aggregateId: conversationId,
    conversationId,
    payload: {
      conversationId,
      reporterActorId,
      reasonCode: 'spam',
      reasonText,
    },
  })
}
