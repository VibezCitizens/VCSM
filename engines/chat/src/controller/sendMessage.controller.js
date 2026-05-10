// src/controller/sendMessage.controller.js
// ============================================================
// sendMessage.controller
// ------------------------------------------------------------
// - Owns ALL business meaning
// - Enforces membership + posting rights
// - Delegates persistence to send_message_atomic RPC
//
// The RPC atomically handles:
//   1. Message insert (with conversation_seq)
//   2. Conversation last_message update
//   3. Inbox fan-out for all members
//   4. Outbox event insert
// ============================================================

import { fetchConversationMember, fetchDirectPartner } from '../dal/conversationMembers.partner.read.dal.js'
import { listUserBlockRowsBetweenActorsDAL } from '../dal/blockRelations.read.dal.js'
import { ensureConversationMembership } from './ensureConversationMembership.controller.js'
import {
  assertMessageHasContent,
  idempotentSendMessage,
  publishMessageSentEvent,
} from '../services/messageService.js'

export async function sendMessageController({
  conversationId,
  actorId,
  body,
  messageKind = 'text',
  messageType = null,
  mediaUrl = null,
  replyToMessageId = null,
  clientId = null,
  meta = {},
  attachments = [],
}) {
  if (!conversationId || !actorId) {
    throw new Error('[sendMessage] missing params')
  }

  const normalizedBody = typeof body === 'string' ? body.trim() : ''
  const effectiveMessageKind = messageType || messageKind || 'text'
  const effectiveAttachments = Array.isArray(attachments) ? attachments : []
  assertMessageHasContent({
    body: normalizedBody,
    mediaUrl: mediaUrl || (effectiveAttachments.length > 0 ? effectiveAttachments[0].public_url : null),
    messageKind: effectiveMessageKind,
  })

  /* ============================================================
     BLOCK CHECK — direct conversations only
     Resolve the partner actor and check for an active block in either
     direction. Group chats are excluded: partnerActorId is null for
     groups and the block check is skipped.
     ============================================================ */
  const { partnerActorId, isDirectConversation } =
    await fetchDirectPartner({ conversationId, actorId })

  if (isDirectConversation && partnerActorId) {
    const blockRows = await listUserBlockRowsBetweenActorsDAL({
      actorA: actorId,
      actorB: partnerActorId,
    })
    if (blockRows.length > 0) {
      throw new Error('[sendMessage] blocked relationship - messaging not allowed')
    }
  }

  /* ============================================================
     ENSURE EXISTING MEMBERSHIP
     ============================================================ */
  await ensureConversationMembership({ conversationId, actorId })

  /* ============================================================
     Membership validation
     ============================================================ */
  const member = await fetchConversationMember({ conversationId, actorId })

  if (!member || member.membership_status !== 'active') {
    throw new Error('[sendMessage] actor not allowed')
  }

  if (member.can_post === false) {
    throw new Error('[sendMessage] actor does not have posting rights')
  }

  /* ============================================================
     Atomic send via RPC (message + conversation + inbox + outbox)
     ============================================================ */
  const { message, isDuplicate } = await idempotentSendMessage({
    conversationId,
    senderActorId: actorId,
    messageKind: effectiveMessageKind,
    body: normalizedBody || null,
    replyToMessageId,
    clientId,
    meta,
    attachments: effectiveAttachments,
  })

  /* ============================================================
     In-memory event for live UI updates (outbox handled by RPC)
     ============================================================ */
  if (!isDuplicate) {
    publishMessageSentEvent({
      message,
      conversationId,
      senderActorId: actorId,
    })
  }

  return { message, isDuplicate }
}
