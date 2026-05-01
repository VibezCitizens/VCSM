import {
  dalReadConversationMemberForReadState,
  dalReadLatestVisibleMessageInConversation,
} from '../dal/conversationRead.read.dal.js'
import {
  dalUpdateConversationMemberReadPointer,
  dalResetInboxUnreadCount,
} from '../dal/conversationRead.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from '../services/domainEventService.js'

export async function markConversationRead({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error('[markConversationRead] missing params')
  }

  const member = await dalReadConversationMemberForReadState({ conversationId, actorId })
  if (!member) {
    throw new Error('[markConversationRead] membership not found')
  }
  if (member.membership_status !== 'active') {
    throw new Error('[markConversationRead] actor not active in conversation')
  }

  const lastMessage = await dalReadLatestVisibleMessageInConversation({ conversationId })

  if (!lastMessage) {
    await dalResetInboxUnreadCount({ conversationId, actorId })
    return { success: true }
  }

  if (member.last_read_message_id === lastMessage.id) {
    // Read pointer is current, but unread_count may still be > 0 due to data
    // inconsistency or RPC fan-out timing. Always reset to guarantee badge clears.
    await dalResetInboxUnreadCount({ conversationId, actorId })
    return {
      success: true,
      lastReadMessageId: lastMessage.id,
    }
  }

  await dalUpdateConversationMemberReadPointer({
    conversationId,
    actorId,
    lastReadMessageId: lastMessage.id,
    lastReadAt: new Date().toISOString(),
  })

  await dalResetInboxUnreadCount({ conversationId, actorId })

  await publishDomainEvent({
    eventName: EVENTS.CONVERSATION_READ,
    aggregateType: 'conversation',
    aggregateId: conversationId,
    conversationId,
    messageId: lastMessage.id,
    payload: {
      conversationId,
      actorId,
      lastReadMessageId: lastMessage.id,
    },
  })

  return {
    success: true,
    lastReadMessageId: lastMessage.id,
  }
}
