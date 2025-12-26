// src/features/chat/controllers/markConversationRead.controller.js
// ============================================================
// markConversationRead
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Marks a conversation as read up to latest message
// - Updates conversation_members + inbox_entries
// - Safe to call repeatedly (idempotent)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Mark a conversation as read for an actor.
 *
 * Behavior:
 * ------------------------------------------------------------
 * - Validates actor is an active member
 * - Finds latest visible message in conversation
 * - Updates:
 *   - conversation_members.last_read_message_id
 *   - conversation_members.last_read_at
 *   - inbox_entries.unread_count = 0
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 *
 * @returns {Promise<{ success: true, lastReadMessageId?: string }>}
 */
export async function markConversationRead({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[markConversationRead] missing params')
  }

  /* ============================================================
     STEP 1: Validate membership
     ============================================================ */
  const { data: member, error: memberError } = await supabase
    .schema('vc')
    .from('conversation_members')
    .select(
      `
      actor_id,
      is_active,
      last_read_message_id
    `
    )
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .single()

  if (memberError || !member) {
    console.error(memberError)
    throw new Error('[markConversationRead] membership not found')
  }

  if (!member.is_active) {
    throw new Error('[markConversationRead] actor not active in conversation')
  }

  /* ============================================================
     STEP 2: Get latest message in conversation
     ------------------------------------------------------------
     We do NOT care who sent it.
     Deleted messages are ignored.
     ============================================================ */
  const { data: lastMessage, error: messageError } = await supabase
    .schema('vc')
    .from('messages')
    .select('id, created_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (messageError) {
    console.error(messageError)
    throw new Error('[markConversationRead] failed to load last message')
  }

  // No messages yet → just zero unread
  if (!lastMessage) {
    await supabase
      .schema('vc')
      .from('inbox_entries')
      .update({
        unread_count: 0,
      })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)

    return { success: true }
  }

  // Already read up to this message → idempotent exit
  if (member.last_read_message_id === lastMessage.id) {
    return {
      success: true,
      lastReadMessageId: lastMessage.id,
    }
  }

  /* ============================================================
     STEP 3: Update conversation_members read pointer
     ============================================================ */
  const now = new Date().toISOString()

  const { error: updateMemberError } = await supabase
    .schema('vc')
    .from('conversation_members')
    .update({
      last_read_message_id: lastMessage.id,
      last_read_at: now,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (updateMemberError) {
    console.error(updateMemberError)
    throw new Error('[markConversationRead] failed to update read pointer')
  }

  /* ============================================================
     STEP 4: Reset inbox unread count
     ============================================================ */
  const { error: inboxError } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      unread_count: 0,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (inboxError) {
    console.error(inboxError)
    throw new Error('[markConversationRead] failed to reset inbox unread')
  }

  return {
    success: true,
    lastReadMessageId: lastMessage.id,
  }
}
