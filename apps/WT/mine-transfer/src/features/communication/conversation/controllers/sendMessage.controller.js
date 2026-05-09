// src/features/chat/conversation/controllers/sendMessage.controller.js (R)
// ============================================================
// sendMessage.controller(R)(R)(R)(R)
// ------------------------------------------------------------
// - Owns ALL business meaning
// - Maps intent → DAL shape
// - Returns DOMAIN message
// ============================================================

import { insertMessageDAL } from '../dal/write/messages.write.dal'
import { fetchConversationMember } from '../dal/read/conversation_members.partner.read.dal'
import { bumpInboxAfterSend } from '../dal/inbox_entries.write.dal'
import { MessageModel } from '../model/Message.model'

// 🔒 NEW: membership enforcer (idempotent)
import { ensureConversationMembership } from './ensureConversationMembership.controller'

export async function sendMessageController({
  conversationId,
  actorId,
  body,
  mediaUrl = null,
  messageType = 'text',
  clientId = null, // ✅ accept clientId from optimistic sender
}) {
  if (!conversationId || !actorId) {
    throw new Error('[sendMessage] missing params')
  }

  const hasBody = typeof body === 'string' && body.trim().length > 0
  const hasMedia = !!mediaUrl

  if (!hasBody && !hasMedia) {
    throw new Error('[sendMessage] empty message')
  }

  /* ============================================================
     🔒 ENSURE MEMBERSHIP (FIXES DELETE-FOR-ME RACE)
     ============================================================ */
  await ensureConversationMembership({
    conversationId,
    actorId,
  })

  /* ============================================================
     Membership validation (now guaranteed)
     ============================================================ */
  const member = await fetchConversationMember({
    conversationId,
    actorId,
  })

  if (!member || !member.is_active) {
    throw new Error('[sendMessage] actor not allowed')
  }

  /* ============================================================
     DAL write
     ============================================================ */
  const row = await insertMessageDAL({
    conversationId,
    senderActorId: actorId,
    messageType,
    body: hasBody ? body.trim() : null,
    mediaUrl,
    clientId, // ✅ persist clientId in DB so realtime can reconcile
  })

  /* ============================================================
     Inbox fan-out (non-fatal)
     ============================================================ */
  try {
    await bumpInboxAfterSend({
      actorId,
      conversationId,
      messageId: row.id,
      createdAt: row.created_at,
    })
  } catch (e) {
    // IMPORTANT: message is already written; do not fail send UX
    console.error('[sendMessage] bumpInboxAfterSend failed (non-fatal)', e)
  }

  /* ============================================================
     DOMAIN result
     ============================================================ */
  return {
    message: MessageModel(row),
  }
}
