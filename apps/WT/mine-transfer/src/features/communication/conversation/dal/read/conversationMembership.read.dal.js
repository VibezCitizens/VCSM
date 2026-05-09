import { supabase } from "@/services/supabase/supabaseClient";

const MEMBERSHIP_COLUMNS = "conversation_id,actor_id,role,is_active";
const CONVERSATION_COLUMNS = `id,is_group,conversation_members(${MEMBERSHIP_COLUMNS})`;

export async function readConversationMembershipDAL({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error("readConversationMembershipDAL: missing params");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .select(MEMBERSHIP_COLUMNS)
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readConversationMembershipStateDAL({
  conversationId,
}) {
  if (!conversationId) {
    throw new Error("readConversationMembershipStateDAL: conversationId required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("id", conversationId)
    .single();

  if (error) throw error;
  return data ?? null;
}
