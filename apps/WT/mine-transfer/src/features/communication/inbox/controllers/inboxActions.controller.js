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
  // Apply folder-semantics flags (business rule owned by controller)
  await moveConversationToFolder({
    actorId,
    conversationId,
    folder,
  });

  if (folder === "archived") {
    await updateInboxFlags({
      actorId,
      conversationId,
      flags: { archived: true, archived_until_new: false, unread_count: 0 },
    });
  } else {
    await updateInboxFlags({
      actorId,
      conversationId,
      flags: { archived: false, archived_until_new: false },
    });
  }
}
