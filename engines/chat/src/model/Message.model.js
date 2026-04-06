function MessageModel(row) {
  if (!row) return null
  if (!row.sender_actor_id) {
    throw new Error('[MessageModel] sender_actor_id is required')
  }

  const isDeleted = !!row.deleted_at
  const isHidden  = !!row.is_hidden
  const messageKind =
    row.message_kind ??
    row.message_type ??
    row.kind ??
    row.type ??
    'text'

  const rawSource = row.attachments ?? row.message_attachments ?? []
  const rawAttachments = Array.isArray(rawSource)
    ? rawSource
    : (typeof rawSource === 'string' ? JSON.parse(rawSource) : [])
  const attachments = Array.isArray(rawAttachments) ? rawAttachments : []

  return {
    id:                row.id,
    conversationId:    row.conversation_id,
    senderActorId:     row.sender_actor_id,
    kind:              messageKind,
    type:              messageKind,
    body:              (isDeleted || isHidden) ? null : row.body ?? null,
    replyToMessageId:  row.reply_to_message_id ?? null,
    conversationSeq:   row.conversation_seq ?? null,
    createdAt:         row.created_at,
    editedAt:          row.edited_at ?? null,
    deletedAt:         row.deleted_at ?? null,
    isEdited:          !!row.edited_at && !isDeleted,
    isDeleted,
    isHidden,
    isSystem:          messageKind === 'system',
    clientId:          row.client_id ?? null,
    mediaUrl:          row.media_url ?? (attachments[0]?.public_url || null),
    attachments:       (isDeleted || isHidden) ? [] : attachments,
  }
}

export default MessageModel
export { MessageModel }
