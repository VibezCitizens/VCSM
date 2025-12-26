// src/features/chat/conversation/model/Message.model.js

function MessageModel(row) {
  if (!row) return null

  const isDeleted = !!row.deleted_at

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderActorId: row.sender_actor_id,

    type: row.message_type,

    // 🔒 HIDE content when unsent
    body: isDeleted ? null : row.body ?? null,
    mediaUrl: isDeleted ? null : row.media_url ?? null,

    createdAt: row.created_at,
    editedAt: row.edited_at ?? null,
    deletedAt: row.deleted_at ?? null,

    // 🔒 Edited flag suppressed when deleted
    isEdited: !!row.edited_at && !isDeleted,
    isDeleted,

    isSystem: row.message_type === 'system',

    // 🔑 REQUIRED for optimistic + realtime reconciliation
    clientId: row.client_id ?? null,
  }
}

/* ============================================================
   EXPORTS (STABILIZATION MODE)
   ============================================================ */

export default MessageModel
export { MessageModel }
export const messageModel = MessageModel
