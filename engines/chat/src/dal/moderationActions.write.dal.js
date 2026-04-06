import { getSupabaseClient } from '../config.js'

export async function insertConversationHideModerationActionDAL({
  actorId,
  conversationId,
  reason = "user_marked_spam",
}) {
  if (!actorId || !conversationId) {
    throw new Error("insertConversationHideModerationActionDAL: missing params");
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema("moderation")
    .from("actions")
    .insert({
      actor_domain: "vc",
      actor_id: actorId,
      target_domain: "chat",
      target_type: "conversation",
      target_id: conversationId,
      action_type: "hide",
      reason,
      meta: {},
    });

  if (error) throw error;
}
