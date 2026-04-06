import { getSupabaseClient } from '../config.js'

export async function dalUpdateConversationMemberReadPointer({
  conversationId,
  actorId,
  lastReadMessageId,
  lastReadAt,
}) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema("chat")
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
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .update({
      unread_count: 0,
    })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId);

  if (error) throw error;
  return true;
}
