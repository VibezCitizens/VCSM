// src/features/chat/dal/messages.write.dal.js
// ============================================================
// Messages — WRITE DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Writes only (no reads)
// - Ownership enforced by CONTROLLERS
// - Inbox unread state is SERVER-OWNED
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/* ============================================================
   Insert message
   ============================================================ */

export async function insertMessage({
  conversationId,
  senderActorId,
  messageType,
  body = null,
  mediaUrl = null,
  replyToMessageId = null,
}) {
  if (!conversationId || !senderActorId || !messageType) {
    throw new Error('[insertMessage] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_actor_id: senderActorId,
      message_type: messageType,
      body,
      media_url: mediaUrl,
      reply_to_message_id: replyToMessageId,
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error(error)
    throw new Error('[insertMessage] insert failed')
  }

  return data
}

/* ============================================================
   Update conversation last message pointer
   ============================================================ */

export async function touchConversationLastMessage({
  conversationId,
  messageId,
  createdAt,
}) {
  if (!conversationId || !messageId || !createdAt) {
    throw new Error('[touchConversationLastMessage] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('conversations')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq('id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[touchConversationLastMessage] update failed')
  }
}

/* ============================================================
   Fan-out inbox updates (metadata only)
   ============================================================ */

export async function updateInboxForNewMessage({
  actorId,
  conversationId,
  messageId,
  createdAt,
}) {
  if (!actorId || !conversationId || !messageId || !createdAt) {
    throw new Error('[updateInboxForNewMessage] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
      archived: false,
      archived_until_new: false,
    })
    .eq('actor_id', actorId)
    .eq('conversation_id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateInboxForNewMessage] update failed')
  }
}

/* ============================================================
   Insert message receipts (delivery/read)
   ============================================================ */

export async function insertMessageReceipt({
  messageId,
  actorId,
  status = 'delivered',
}) {
  if (!messageId || !actorId) {
    throw new Error('[insertMessageReceipt] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('message_receipts')
    .upsert(
      {
        message_id: messageId,
        actor_id: actorId,
        status,
        seen_at: status === 'read'
          ? new Date().toISOString()
          : null,
      },
      {
        onConflict: 'message_id,actor_id',
      }
    )

  if (error) {
    console.error(error)
    throw new Error('[insertMessageReceipt] upsert failed')
  }
}

/* ============================================================
   Edit message body (sender verified by controller)
   ============================================================ */

export async function updateMessageBody({
  messageId,
  newBody,
}) {
  if (!messageId) {
    throw new Error('[updateMessageBody] missing messageId')
  }

  const { error } = await supabase
    .schema('vc')
    .from('messages')
    .update({
      body: newBody,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) {
    console.error(error)
    throw new Error('[updateMessageBody] update failed')
  }
}

/* ============================================================
   Soft delete message (unsend — ownership checked in controller)
   ============================================================ */

export async function softDeleteMessage({
  messageId,
}) {
  if (!messageId) {
    throw new Error('[softDeleteMessage] missing messageId')
  }

  const { error } = await supabase
    .schema('vc')
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      body: null,
    })
    .eq('id', messageId)

  if (error) {
    console.error(error)
    throw new Error('[softDeleteMessage] update failed')
  }
}
