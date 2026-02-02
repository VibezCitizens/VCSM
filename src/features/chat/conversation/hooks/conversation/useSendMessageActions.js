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

function pad2(n) {
  return String(n).padStart(2, '0')
}

function randomHex(bytes = 3) {
  // 3 bytes => 6 hex chars (enough to avoid collisions alongside timestamp)
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function extFromFile(file) {
  const name = String(file?.name || '')
  const dot = name.lastIndexOf('.')
  if (dot > -1 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase().replace(/[^\w]+/g, '') || 'bin'
  }

  const type = String(file?.type || '').toLowerCase()
  if (type.startsWith('image/')) {
    const e = type.split('/')[1]
    if (e === 'jpeg') return 'jpg'
    return e.replace(/[^\w]+/g, '') || 'bin'
  }

  return 'bin'
}

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

      const now = new Date()
      const yyyy = String(now.getFullYear())
      const mm = pad2(now.getMonth() + 1)
      const dd = pad2(now.getDate())

      const ts = Math.floor(Date.now() / 1000)
      const rand = randomHex(3)
      const ext = extFromFile(file)

      // vox/CONV456/ACTOR123/2026/02/02/1706845200-1d0fef.jpg
      const key = `vox/${conversationId}/${actorId}/${yyyy}/${mm}/${dd}/${ts}-${rand}.${ext}`

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
