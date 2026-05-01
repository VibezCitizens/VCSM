// src/features/chat/conversation/hooks/conversation/useSendMessageActions.js
// ============================================================
// useSendMessageActions
// ------------------------------------------------------------
// - View-local UI handlers for sending text + attaching images
// - Owns: handleSend + handleAttach
// - NO supabase
// - NO domain meaning
// ============================================================

import { useCallback } from 'react'
import { useChatAttachmentUpload } from './useChatAttachmentUpload'
import { recordChatAttachmentController } from '@/features/chat/conversation/controller/recordChatAttachment.controller'

export default function useSendMessageActions({ conversationId, actorId, onSendMessage, addOptimistic, updateOptimistic, markFailed }) {
  const { upload: uploadAttachment } = useChatAttachmentUpload({ actorId })

  /* ============================================================
     Send
     ============================================================ */
  const handleSend = useCallback(
    async (text) => {
      return onSendMessage({ body: text, type: 'text' })
    },
    [onSendMessage]
  )

  const handleAttach = useCallback(
    async (files) => {
      if (!files || files.length === 0) return { ok: false, error: 'No file selected.' }
      const file = files[0]
      if (!file) return { ok: false, error: 'No file selected.' }

      // Early return for non-image types — chat currently images only.
      // The engine also validates, but this avoids showing a placeholder for invalid files.
      if (!String(file.type || '').startsWith('image/')) {
        return { ok: false, error: 'Only images are supported in chat right now.' }
      }

      // Insert uploading placeholder immediately so the user sees feedback
      const placeholderClientId = addOptimistic
        ? addOptimistic({ kind: 'image', body: '', __uploading: true })
        : null

      // Upload via media engine: validates, compresses (1600px/0.82), builds UUID key, transports
      let result
      try {
        result = await uploadAttachment(file, { extraPath: conversationId })
      } catch (err) {
        if (placeholderClientId && markFailed) markFailed(placeholderClientId)
        return { ok: false, error: err?.message || 'Image upload failed.' }
      }

      const url = result.publicUrl
      const key = result.storageKey

      // Image is on CDN — show it immediately before DB round-trip
      if (placeholderClientId && updateOptimistic) {
        updateOptimistic(placeholderClientId, { mediaUrl: url, __uploading: false })
      }

      const sendResult = await onSendMessage({
        type: 'image',
        body: '',
        mediaUrl: url,
        attachments: [{
          attachment_kind: 'image',
          public_url: url,
          storage_path: key,
          original_name: file.name || null,
          mime_type: result.mimeType,
          size_bytes: result.sizeBytes,
          upload_status: 'ready',
          sort_order: 0,
        }],
        prebuiltClientId: placeholderClientId,
      })

      if (sendResult?.ok === false) {
        if (placeholderClientId && markFailed) markFailed(placeholderClientId)
        return { ok: false, error: sendResult.error || 'Image failed to send.' }
      }

      recordChatAttachmentController({
        mediaUploadResult: result,
        ownerActorId:      actorId,
        messageId:         sendResult?.message?.id ?? null,
        storageKey:        result.storageKey ?? null,
      }).catch((e) => {
        if (import.meta.env?.DEV) console.warn('[useSendMessageActions] media_assets record failed (non-fatal):', e?.message)
      })

      return { ok: true, url }
    },
    [conversationId, actorId, onSendMessage, addOptimistic, updateOptimistic, markFailed, uploadAttachment]
  )

  return {
    handleSend,
    handleAttach,
  }
}
