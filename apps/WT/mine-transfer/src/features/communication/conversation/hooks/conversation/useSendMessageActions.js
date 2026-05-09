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
import { compressImageFile } from '@/shared/lib/compressImage'

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

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = String(navigator.userAgent || '')
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isHeicLike(file) {
  const type = String(file?.type || '').toLowerCase()
  const name = String(file?.name || '').toLowerCase()
  return type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif')
}

async function prepareUploadImage(file) {
  if (!file || !String(file.type || '').startsWith('image/')) return file

  const limit = isIOSDevice() ? 750 * 1024 : 2 * 1024 * 1024
  const shouldCompress = file.size > limit || isHeicLike(file)
  if (!shouldCompress) return file

  try {
    return await compressImageFile(file, 1600, 0.82)
  } catch (err) {
    console.warn('[useSendMessageActions] image compression skipped', err)
    return file
  }
}

export default function useSendMessageActions({ conversationId, actorId, onSendMessage }) {
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

      if (!String(file.type || '').startsWith('image/')) {
        return { ok: false, error: 'Only images are supported in chat right now.' }
      }

      const uploadFile = await prepareUploadImage(file)

      const now = new Date()
      const yyyy = String(now.getFullYear())
      const mm = pad2(now.getMonth() + 1)
      const dd = pad2(now.getDate())

      const ts = Math.floor(Date.now() / 1000)
      const rand = randomHex(3)
      const ext = extFromFile(uploadFile)

      // vox/CONV456/ACTOR123/2026/02/02/1706845200-1d0fef.jpg
      const key = `vox/${conversationId}/${actorId}/${yyyy}/${mm}/${dd}/${ts}-${rand}.${ext}`

      const { url, error: upErr } = await uploadToCloudflare(uploadFile, key)

      if (upErr || !url) {
        console.error('upload failed:', upErr)
        return { ok: false, error: upErr || 'Image upload failed.' }
      }

      const sendResult = await onSendMessage({
        type: 'image',
        body: '',
        mediaUrl: url,
      })

      if (sendResult?.ok === false) {
        return { ok: false, error: sendResult.error || 'Image failed to send.' }
      }

      return { ok: true, url }
    },
    [conversationId, actorId, onSendMessage]
  )

  return {
    handleSend,
    handleAttach,
  }
}
