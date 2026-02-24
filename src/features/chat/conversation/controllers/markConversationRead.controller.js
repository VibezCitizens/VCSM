import {
  dalReadConversationMemberForReadState,
  dalReadLatestVisibleMessageInConversation,
} from "@/features/chat/conversation/dal/read/conversationRead.read.dal";
import {
  dalResetInboxUnreadCount,
  dalUpdateConversationMemberReadPointer,
} from "@/features/chat/conversation/dal/write/conversationRead.write.dal";

export async function markConversationRead({ conversationId, actorId }) {
  if (!conversationId || !actorId) {
    throw new Error("[markConversationRead] missing params");
  }

  const member = await dalReadConversationMemberForReadState({ conversationId, actorId });
  if (!member) {
    throw new Error("[markConversationRead] membership not found");
  }
  if (!member.is_active) {
    throw new Error("[markConversationRead] actor not active in conversation");
  }

  const lastMessage = await dalReadLatestVisibleMessageInConversation({ conversationId });

  if (!lastMessage) {
    await dalResetInboxUnreadCount({ conversationId, actorId });
    return { success: true };
  }

  if (member.last_read_message_id === lastMessage.id) {
    return {
      success: true,
      lastReadMessageId: lastMessage.id,
    };
  }

  await dalUpdateConversationMemberReadPointer({
    conversationId,
    actorId,
    lastReadMessageId: lastMessage.id,
    lastReadAt: new Date().toISOString(),
  });

  await dalResetInboxUnreadCount({ conversationId, actorId });

  return {
    success: true,
    lastReadMessageId: lastMessage.id,
  };
}
