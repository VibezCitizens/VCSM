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

  const { data, error } = await supabase
    .schema("chat")
    .from("inbox_entries")
    .update({ unread_count: 0 })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .select("actor_id");

  if (error) throw error;

  const rowsAffected = Array.isArray(data) ? data.length : 0;

  if (rowsAffected === 0 && import.meta.env.DEV) {
    console.warn(
      "[dalResetInboxUnreadCount] 0 rows updated — RLS may be blocking this actor.\n" +
      `  actorId:        ${actorId}\n` +
      `  conversationId: ${conversationId}\n` +
      "  Run SQL check: SELECT chat.current_actor_id(); — compare to actorId above."
    );
    return { success: false, rowsAffected: 0 };
  }

  return { success: true, rowsAffected };
}
