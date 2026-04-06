import { supabase } from "@/services/supabase/supabaseClient";

export async function readLatestConversationMessageDAL({ conversationId }) {
  if (!conversationId) return null;

  const { data, error } = await supabase
    .schema("chat")
    .from("messages")
    .select("id,conversation_id,created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
