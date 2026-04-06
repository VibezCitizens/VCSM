import {
  readConversationMembershipStateDAL,
} from '../dal/conversationMembership.read.dal.js'
import {
  setConversationMembershipStatusDAL as setConversationMembershipActiveDAL,
} from '../dal/conversationMembership.write.dal.js'
import {
  archiveConversationForActor,
  resetUnread,
} from '../dal/inbox.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'

export async function leaveConversation({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[leaveConversation] missing params')
  }

  const convo = await readConversationMembershipStateDAL({ conversationId })
  if (!convo) {
    throw new Error('[leaveConversation] conversation not found')
  }

  const member = (convo.conversation_members ?? []).find(
    (row) => row.actor_id === actorId
  )

  if (!member || member.membership_status !== 'active') {
    throw new Error('[leaveConversation] actor not an active member')
  }

  if (convo.conversation_kind === 'group') {
    await setConversationMembershipActiveDAL({
      conversationId,
      actorId,
      membershipStatus: 'left',
    })

    await publishDomainEvent({
      eventName: EVENTS.MEMBER_REMOVED,
      aggregateType: 'conversation',
      aggregateId: conversationId,
      conversationId,
      payload: {
        conversationId,
        actorId,
        membershipStatus: 'left',
      },
    })
  } else {
    await archiveConversationForActor({
      actorId,
      conversationId,
      untilNew: true,
    })

    await publishDomainEvent({
      eventName: EVENTS.CONVERSATION_ARCHIVED,
      aggregateType: 'conversation',
      aggregateId: conversationId,
      conversationId,
      payload: {
        conversationId,
        actorId,
        reason: 'left_direct_conversation',
      },
    })
  }

  await resetUnread({
    actorId,
    conversationId,
  })

  return { success: true }
}
