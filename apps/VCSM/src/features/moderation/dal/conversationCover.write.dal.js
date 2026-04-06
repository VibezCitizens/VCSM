import { supabase } from "@/services/supabase/supabaseClient";

export async function updateConversationInboxFolderDAL({
  actorId,
  conversationId,
  folder,
}) {
  const { data, error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .update({ folder })
    .eq("actor_id", actorId)
    .eq("conversation_id", conversationId)
    .select("actor_id,conversation_id,folder")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function updateConversationInboxLastMessageDAL({
  actorId,
  conversationId,
  messageId,
  createdAt,
}) {
  const { data, error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq("actor_id", actorId)
    .eq("conversation_id", conversationId)
    .select("actor_id,conversation_id,last_message_id,last_message_at")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
