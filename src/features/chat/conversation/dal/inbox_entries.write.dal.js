// src/features/chat/conversation/dal/inbox_entries.write.dal.js
// ============================================================
// inbox_entries.write.dal
// ------------------------------------------------------------
// - RAW database writes only
// - No business logic
// - No permission checks
// - No derived meaning
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Reset unread count for a conversation + actor.
 */
export async function resetInboxUnread({
  conversationId,
  actorId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      unread_count: 0,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Archive a conversation for an actor.
 */
export async function archiveInboxEntry({
  conversationId,
  actorId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      archived: true,
      archived_until_new: true,
      unread_count: 0,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Unarchive a conversation for an actor.
 */
export async function unarchiveInboxEntry({
  conversationId,
  actorId,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      archived: false,
      archived_until_new: false,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}

/**
 * Bump inbox state after a message is sent.
 * NOTE: Caller decides who this applies to.
 */
export async function bumpInboxAfterSend({
  conversationId,
  actorId,
  lastMessageId,
  lastMessageAt,
  unreadCount,
}) {
  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      last_message_id: lastMessageId,
      last_message_at: lastMessageAt,
      unread_count: unreadCount,
      archived: false,
      archived_until_new: false,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) throw error
}
