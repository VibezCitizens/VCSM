import { dalDeleteConversationHideAction } from "../dal/moderationActions.dal";
import { readLatestConversationMessageDAL } from "@/features/moderation/dal/conversationCover.read.dal";
import {
  updateConversationInboxFolderDAL,
  updateConversationInboxLastMessageDAL,
} from "@/features/moderation/dal/conversationCover.write.dal";

export async function undoConversationCover({ actorId, conversationId }) {
  if (!actorId || !conversationId) return { ok: false };

  try {
    await dalDeleteConversationHideAction({
      actorId,
      conversationId,
      actionTypes: ["hide"],
    });

    await updateConversationInboxFolderDAL({
      actorId,
      conversationId,
      folder: "inbox",
    });

    const last = await readLatestConversationMessageDAL({ conversationId });
    if (last?.id && last?.created_at) {
      await updateConversationInboxLastMessageDAL({
        actorId,
        conversationId,
        messageId: last.id,
        createdAt: last.created_at,
      });
    }

    return { ok: true };
  } catch (_ERR) {
    return { ok: false };
  }
}
