import { supabase } from "@/services/supabase/supabaseClient";

export async function dalReadConversationMemberForReadState({ conversationId, actorId }) {
  const { data, error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .select("actor_id,is_active,last_read_message_id")
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function dalReadLatestVisibleMessageInConversation({ conversationId }) {
  const { data, error } = await supabase
    .schema("vc")
    .from("messages")
    .select("id,created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
