import { createReportDAL } from "@/features/chat/conversation/dal/write/reports.write.dal";
import { insertConversationHideModerationActionDAL } from "@/features/chat/conversation/dal/write/moderationActions.write.dal";
import { moveConversationToFolder } from "@/features/chat/inbox/dal/inbox.write.dal";

export async function markConversationSpam({
  reporterActorId,
  conversationId,
  reasonText = null,
}) {
  if (!reporterActorId) {
    throw new Error("markConversationSpam: reporterActorId is required");
  }
  if (!conversationId) {
    throw new Error("markConversationSpam: conversationId is required");
  }

  await moveConversationToFolder({
    actorId: reporterActorId,
    conversationId,
    folder: "spam",
  });

  let reportId = null;
  try {
    reportId = await createReportDAL({
      reporterActorId,
      objectType: "conversation",
      objectId: conversationId,
      conversationId,
      reasonCode: "spam",
      reasonText,
    });
  } catch (error) {
    console.warn("[markConversationSpam] createReportDAL failed (non-fatal)", error);
  }

  try {
    await insertConversationHideModerationActionDAL({
      actorId: reporterActorId,
      conversationId,
      reason: "user_marked_spam",
    });
  } catch (error) {
    console.warn("[markConversationSpam] moderation action failed (non-fatal)", error);
  }

  return reportId;
}
