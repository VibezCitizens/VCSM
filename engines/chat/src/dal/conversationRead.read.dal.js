import { getSupabaseClient } from '../config.js'

export async function dalReadConversationMemberForReadState({ conversationId, actorId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
    .from("conversation_members")
    .select("actor_id,membership_status,last_read_message_id")
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function dalReadLatestVisibleMessageInConversation({ conversationId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema("chat")
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
