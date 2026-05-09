import {
  readConversationMembershipDAL,
} from "@/features/chat/conversation/dal/read/conversationMembership.read.dal";
import {
  insertConversationMembershipDAL,
  setConversationMembershipActiveDAL,
} from "@/features/chat/conversation/dal/write/conversationMembership.write.dal";

export async function ensureConversationMembership({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) return;

  const membership = await readConversationMembershipDAL({
    conversationId,
    actorId,
  });

  if (membership?.is_active) return;

  if (membership && membership.is_active === false) {
    await setConversationMembershipActiveDAL({
      conversationId,
      actorId,
      isActive: true,
    });
    return;
  }

  await insertConversationMembershipDAL({
    conversationId,
    actorId,
    role: "member",
    isActive: true,
  });
}
