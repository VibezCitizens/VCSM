import { supabase } from "@/services/supabase/supabaseClient";

export async function insertConversationMembershipDAL({
  conversationId,
  actorId,
  role = "member",
  isActive = true,
}) {
  if (!conversationId || !actorId) {
    throw new Error("insertConversationMembershipDAL: missing params");
  }

  const { error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .insert({
      conversation_id: conversationId,
      actor_id: actorId,
      role,
      is_active: isActive,
    });

  if (error) throw error;
}

export async function setConversationMembershipActiveDAL({
  conversationId,
  actorId,
  isActive,
}) {
  if (!conversationId || !actorId || typeof isActive !== "boolean") {
    throw new Error("setConversationMembershipActiveDAL: missing params");
  }

  const { error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .update({
      is_active: isActive,
    })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId);

  if (error) throw error;
}
