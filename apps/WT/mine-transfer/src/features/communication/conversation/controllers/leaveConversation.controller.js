import {
  readConversationMembershipStateDAL,
} from "@/features/chat/conversation/dal/read/conversationMembership.read.dal";
import {
  setConversationMembershipActiveDAL,
} from "@/features/chat/conversation/dal/write/conversationMembership.write.dal";
import {
  archiveConversationForActor,
  resetUnread,
} from "@/features/chat/inbox/dal/inbox.write.dal";

export async function leaveConversation({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error("[leaveConversation] missing params");
  }

  const convo = await readConversationMembershipStateDAL({ conversationId });
  if (!convo) {
    throw new Error("[leaveConversation] conversation not found");
  }

  const member = (convo.conversation_members ?? []).find(
    (row) => row.actor_id === actorId
  );

  if (!member || !member.is_active) {
    throw new Error("[leaveConversation] actor not an active member");
  }

  if (convo.is_group) {
    await setConversationMembershipActiveDAL({
      conversationId,
      actorId,
      isActive: false,
    });
  } else {
    await archiveConversationForActor({
      actorId,
      conversationId,
      untilNew: true,
    });
  }

  await resetUnread({
    actorId,
    conversationId,
  });

  return { success: true };
}
