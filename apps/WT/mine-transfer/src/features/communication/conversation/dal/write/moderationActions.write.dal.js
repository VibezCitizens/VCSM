import { supabase } from "@/services/supabase/supabaseClient";

export async function insertConversationHideModerationActionDAL({
  actorId,
  conversationId,
  reason = "user_marked_spam",
}) {
  if (!actorId || !conversationId) {
    throw new Error("insertConversationHideModerationActionDAL: missing params");
  }

  const { error } = await supabase
    .schema("vc")
    .from("moderation_actions")
    .insert({
      actor_id: actorId,
      object_type: "conversation",
      object_id: conversationId,
      action_type: "hide",
      reason,
    });

  if (error) throw error;
}
