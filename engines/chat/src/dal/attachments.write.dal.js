// src/dal/attachments.write.dal.js
// ============================================================
// Message Attachments Write DAL
// ------------------------------------------------------------
// - RAW database writes only
// - Explicit column usage (NO select '*')
// - No business rules
// - No permission checks
//
// Schema: chat.message_attachments
//   Columns: id, message_id, attachment_kind (required),
//            storage_path, public_url, original_name,
//            mime_type, size_bytes, width, height,
//            duration_ms, checksum, upload_status,
//            sort_order, meta, created_at
//
// Note: actor ownership is on chat.messages — not on this table.
// ============================================================

import { getSupabaseClient } from '../config.js'

/**
 * Insert a message attachment row.
 *
 * @param {Object}      params
 * @param {string}      params.messageId
 * @param {string}      params.attachmentKind   - 'file'|'image'|'video'|'audio'|'link'|'other'
 * @param {string|null} [params.storagePath]    - internal storage path
 * @param {string|null} [params.publicUrl]      - publicly accessible URL
 * @param {string|null} [params.originalName]   - original file name
 * @param {string|null} [params.mimeType]
 * @param {number|null} [params.sizeBytes]
 * @param {number|null} [params.width]
 * @param {number|null} [params.height]
 * @param {number|null} [params.durationMs]     - for audio/video
 * @param {string|null} [params.checksum]
 * @param {string}      [params.uploadStatus]   - default 'ready'
 * @param {number}      [params.sortOrder]      - default 0
 * @returns {Promise<Object>} Raw attachment row
 */
export async function insertAttachmentDAL({
  messageId,
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
  uploadStatus = 'ready',
  sortOrder = 0,
}) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('message_attachments')
    .insert({
      message_id: messageId,
      attachment_kind: attachmentKind,
      storage_path: storagePath,
      public_url: publicUrl,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      width,
      height,
      duration_ms: durationMs,
      checksum,
      upload_status: uploadStatus,
      sort_order: sortOrder,
    })
    .select(`
      id,
      message_id,
      attachment_kind,
      storage_path,
      public_url,
      original_name,
      mime_type,
      size_bytes,
      width,
      height,
      duration_ms,
      checksum,
      upload_status,
      sort_order,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

/**
 * Update the upload_status of an attachment.
 * Used by upload workers to mark pending → processing → ready/failed.
 *
 * @param {Object} params
 * @param {string} params.attachmentId
 * @param {string} params.uploadStatus  - 'pending'|'processing'|'ready'|'failed'
 * @returns {Promise<true>}
 */
export async function updateAttachmentStatusDAL({ attachmentId, uploadStatus }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('message_attachments')
    .update({ upload_status: uploadStatus })
    .eq('id', attachmentId)

  if (error) throw error

  return true
}

/**
 * Fetch all attachments for a message, ordered by sort_order.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @returns {Promise<Object[]>} Array of raw attachment rows
 */
export async function fetchAttachmentsForMessageDAL({ messageId }) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('message_attachments')
    .select(`
      id,
      message_id,
      attachment_kind,
      storage_path,
      public_url,
      original_name,
      mime_type,
      size_bytes,
      width,
      height,
      duration_ms,
      checksum,
      upload_status,
      sort_order,
      created_at
    `)
    .eq('message_id', messageId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return data ?? []
}

/**
 * Delete an attachment row by id.
 * Controller must verify ownership before calling this.
 *
 * @param {Object} params
 * @param {string} params.attachmentId
 * @returns {Promise<true>}
 */
export async function deleteAttachmentDAL({ attachmentId }) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('message_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) throw error

  return true
}
