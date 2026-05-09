import { supabase } from "@/services/supabase/supabaseClient";

export async function dalUpdateConversationMemberReadPointer({
  conversationId,
  actorId,
  lastReadMessageId,
  lastReadAt,
}) {
  const { error } = await supabase
    .schema("vc")
    .from("conversation_members")
    .update({
      last_read_message_id: lastReadMessageId,
      last_read_at: lastReadAt,
    })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId);

  if (error) throw error;
  return true;
}

export async function dalResetInboxUnreadCount({ conversationId, actorId }) {
  const { error } = await supabase
    .schema("vc")
    .from("inbox_entries")
    .update({
      unread_count: 0,
    })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId);

  if (error) throw error;
  return true;
}
