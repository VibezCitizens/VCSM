// src/dal/sendMessageAtomic.rpc.dal.js
// ============================================================
// Send Message — Atomic RPC DAL
// ------------------------------------------------------------
// Single RPC call that atomically:
//   1. Inserts the message row (with conversation_seq)
//   2. Inserts attachment rows into chat.message_attachments
//   3. Updates conversation last_message pointers
//   4. Fan-out updates inbox_entries for all members
//   5. Inserts audit_log entry
//   6. Inserts the outbox event
//
// No client-side multi-step writes needed.
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Send a message via the atomic database RPC.
 *
 * @param {Object} params
 * @param {string}      params.conversationId
 * @param {string}      params.senderActorId
 * @param {string}      [params.messageKind='text']
 * @param {string|null} [params.body]
 * @param {string|null} [params.replyToMessageId]
 * @param {string|null} [params.clientId]
 * @param {Object}      [params.meta={}]
 * @param {Array}       [params.attachments=[]]
 * @returns {Promise<Object>} The created message row with attachments and media_url
 */
export async function sendMessageAtomicDAL({
  conversationId,
  senderActorId,
  messageKind = 'text',
  body = null,
  replyToMessageId = null,
  clientId = null,
  meta = {},
  attachments = [],
}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.schema('chat').rpc('send_message_atomic', {
    p_conversation_id: conversationId,
    p_sender_actor_id: senderActorId,
    p_message_kind: messageKind,
    p_body: body,
    p_reply_to_message_id: replyToMessageId,
    p_client_id: clientId,
    p_meta: meta,
    p_attachments: attachments,
  })

  if (error) throw error

  return data?.[0] ?? data
}
