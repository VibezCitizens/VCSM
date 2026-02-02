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
import { uploadToCloudflare } from '@/services/cloudflare/uploadToCloudflare'

export default function useSendMessageActions({ conversationId, actorId, onSendMessage }) {
  /* ============================================================
     Send
     ============================================================ */
  const handleSend = useCallback(
    (text) => {
      onSendMessage({ body: text, type: 'text' })
    },
    [onSendMessage]
  )

  const handleAttach = useCallback(
    async (files) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file) return

      if (!String(file.type || '').startsWith('image/')) return

      const safeName = String(file.name || 'image').replace(/[^\w.\-]+/g, '_')
      const key = `chat/${conversationId}/${actorId}/${Date.now()}-${safeName}`

      const { url, error: upErr } = await uploadToCloudflare(file, key)

      if (upErr || !url) {
        console.error('upload failed:', upErr)
        return
      }

      onSendMessage({
        type: 'image',
        body: '',
        mediaUrl: url,
      })
    },
    [conversationId, actorId, onSendMessage]
  )

  return {
    handleSend,
    handleAttach,
  }
}
