import {
  archiveConversationForActor,
  moveConversationToFolder,
  updateInboxFlags,
} from "@/features/chat/inbox/dal/inbox.write.dal";

export async function ctrlUpdateInboxFlags({ actorId, conversationId, flags }) {
  return updateInboxFlags({ actorId, conversationId, flags });
}

export async function ctrlArchiveConversationForActor({
  actorId,
  conversationId,
  untilNew = true,
}) {
  return archiveConversationForActor({
    actorId,
    conversationId,
    untilNew,
  });
}

export async function ctrlMoveConversationToFolder({
  actorId,
  conversationId,
  folder,
}) {
  return moveConversationToFolder({
    actorId,
    conversationId,
    folder,
  });
}
