// src/features/chat/controllers/leaveConversation.controller.js
// ============================================================
// leaveConversation
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Safely removes an actor from a conversation
// - Handles direct vs group conversations correctly
// - Cleans inbox state
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Leave a conversation as an actor.
 *
 * Rules:
 * ------------------------------------------------------------
 * - Actor must be an active member
 * - For GROUP conversations:
 *   - Member is deactivated (soft leave)
 * - For DIRECT conversations:
 *   - Conversation is hidden for that actor only
 *     (other actor still keeps it)
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 *
 * @returns {Promise<{ success: true }>}
 */
export async function leaveConversation({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[leaveConversation] missing params')
  }

  /* ============================================================
     STEP 1: Load conversation + membership
     ============================================================ */
  const { data: convo, error: convoError } = await supabase
    .schema('vc')
    .from('conversations')
    .select(
      `
      id,
      is_group,
      conversation_members (
        actor_id,
        is_active
      )
    `
    )
    .eq('id', conversationId)
    .single()

  if (convoError || !convo) {
    console.error(convoError)
    throw new Error('[leaveConversation] conversation not found')
  }

  const member = convo.conversation_members?.find(
    (m) => m.actor_id === actorId
  )

  if (!member || !member.is_active) {
    throw new Error('[leaveConversation] actor not an active member')
  }

  /* ============================================================
     STEP 2: Group conversation → deactivate membership
     ============================================================ */
  if (convo.is_group) {
    const { error: updateError } = await supabase
      .schema('vc')
      .from('conversation_members')
      .update({
        is_active: false,
      })
      .eq('conversation_id', conversationId)
      .eq('actor_id', actorId)

    if (updateError) {
      console.error(updateError)
      throw new Error('[leaveConversation] failed to leave group')
    }
  } else {
    /* ==========================================================
       STEP 3: Direct conversation → archive for this actor only
       ----------------------------------------------------------
       We do NOT delete the conversation or membership.
       We hide it via inbox_entries.
       ========================================================== */
    const { error: inboxError } = await supabase
      .schema('vc')
      .from('inbox_entries')
      .upsert({
        conversation_id: conversationId,
        actor_id: actorId,
        folder: 'archived',
        archived: true,
        archived_until_new: true,
        unread_count: 0,
      }, {
        onConflict: 'conversation_id,actor_id',
      })

    if (inboxError) {
      console.error(inboxError)
      throw new Error('[leaveConversation] failed to archive direct convo')
    }
  }

  /* ============================================================
     STEP 4: Cleanup inbox entry (always safe)
     ============================================================ */
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
