// src/services/attachmentService.js
// ============================================================
// Attachment Service
// ------------------------------------------------------------
// Encapsulates domain logic for message file attachments:
//   - attachFileToMessage  → insert attachment row + emit outbox
//   - validateAttachment   → enforce file constraints
//   - getAttachmentsForMessage → fetch + map to domain shape
//
// The actual file upload (to S3 / Supabase Storage) happens
// OUTSIDE the engine, in the host app. The engine only records
// the attachment metadata once the file is already stored.
//
// Schema: chat.message_attachments
//   Relevant columns: attachment_kind, storage_path, public_url,
//                     original_name, mime_type, size_bytes
//   No actor_id on this table — actor is on chat.messages.
//
// Services are called by controllers.
// Services must not call hooks, components, or screens.
// ============================================================

import {
  insertAttachmentDAL,
  fetchAttachmentsForMessageDAL,
} from '../dal/attachments.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from './domainEventService.js'

/**
 * Maximum allowed file size the engine will accept metadata for.
 * Host apps should enforce their own limit before upload.
 * 100 MB
 */
const MAX_SIZE_BYTES = 100 * 1024 * 1024

/**
 * Valid attachment_kind values per schema constraint.
 */
const VALID_ATTACHMENT_KINDS = ['file', 'image', 'video', 'audio', 'link', 'other']

/**
 * Validate attachment metadata before persisting.
 * Throws a descriptive error if validation fails.
 *
 * @param {Object}      params
 * @param {string}      params.attachmentKind
 * @param {string|null} params.mimeType
 * @param {number|null} params.sizeBytes
 */
export function validateAttachment({ attachmentKind, mimeType, sizeBytes }) {
  if (!attachmentKind || !VALID_ATTACHMENT_KINDS.includes(attachmentKind)) {
    throw new Error(
      `[attachmentService] attachmentKind must be one of: ${VALID_ATTACHMENT_KINDS.join(', ')}`
    )
  }
  if (sizeBytes !== null && sizeBytes > MAX_SIZE_BYTES) {
    throw new Error(`[attachmentService] file exceeds max size of ${MAX_SIZE_BYTES} bytes`)
  }
}

/**
 * Record a file attachment on a message and emit an outbox event.
 *
 * The file must already be uploaded before calling this.
 * This method only writes the metadata row.
 *
 * @param {Object}      params
 * @param {string}      params.messageId
 * @param {string}      params.conversationId   - for outbox payload
 * @param {string}      params.attachmentKind   - 'file'|'image'|'video'|'audio'|'link'|'other'
 * @param {string|null} [params.storagePath]
 * @param {string|null} [params.publicUrl]
 * @param {string|null} [params.originalName]
 * @param {string|null} [params.mimeType]
 * @param {number|null} [params.sizeBytes]
 * @param {number|null} [params.width]
 * @param {number|null} [params.height]
 * @param {number|null} [params.durationMs]
 * @param {string|null} [params.checksum]
 * @param {number}      [params.sortOrder=0]
 * @returns {Promise<Object>} Raw attachment row
 */
export async function attachFileToMessage({
  messageId,
  conversationId,
  attachmentKind,
  storagePath = null,
  publicUrl = null,
  originalName = null,
  mimeType = null,
  sizeBytes = null,
  width = null,
  height = null,
  durationMs = null,
  checksum = null,
  sortOrder = 0,
}) {
  validateAttachment({ attachmentKind, mimeType, sizeBytes })

  const row = await insertAttachmentDAL({
    messageId,
    attachmentKind,
    storagePath,
    publicUrl,
    originalName,
    mimeType,
    sizeBytes,
    width,
    height,
    durationMs,
    checksum,
    uploadStatus: 'ready',
    sortOrder,
  })

  await publishDomainEvent({
    eventName: EVENTS.ATTACHMENT_ADDED,
    aggregateType: 'message',
    aggregateId: messageId,
    conversationId,
    messageId,
    payload: {
      attachmentId: row.id,
      messageId,
      conversationId,
      attachmentKind,
      mimeType,
      createdAt: row.created_at,
    },
  })

  return row
}

/**
 * Fetch all attachments for a message as domain-safe objects.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @returns {Promise<Array<{
 *   id: string,
 *   messageId: string,
 *   attachmentKind: string,
 *   storagePath: string|null,
 *   publicUrl: string|null,
 *   originalName: string|null,
 *   mimeType: string|null,
 *   sizeBytes: number|null,
 *   width: number|null,
 *   height: number|null,
 *   durationMs: number|null,
 *   uploadStatus: string,
 *   sortOrder: number,
 *   createdAt: string
 * }>>}
 */
export async function getAttachmentsForMessage({ messageId }) {
  const rows = await fetchAttachmentsForMessageDAL({ messageId })

  return rows.map((row) => ({
    id: row.id,
    messageId: row.message_id,
    attachmentKind: row.attachment_kind,
    storagePath: row.storage_path ?? null,
    publicUrl: row.public_url ?? null,
    originalName: row.original_name ?? null,
    mimeType: row.mime_type ?? null,
    sizeBytes: row.size_bytes ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    durationMs: row.duration_ms ?? null,
    uploadStatus: row.upload_status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }))
}
