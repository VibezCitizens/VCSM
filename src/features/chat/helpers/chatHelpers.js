// Minimal helper bag — no external deps besides window.location if navigate not provided.

export function makeTempId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function isUuid(v) {
  return typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export function safeText(v, fallback = '') {
  return (v ?? '').toString().trim() || fallback
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function uniq(arr) {
  return Array.from(new Set(arr || []))
}

export function formatPreview(lastMessage) {
  const s = safeText(lastMessage)
  return s.length > 140 ? `${s.slice(0, 137)}…` : s
}

export function timeAgo(ts) {
  if (!ts) return ''
  const t = typeof ts === 'string' ? new Date(ts).getTime() : +ts
  const d = Math.max(0, Date.now() - (isFinite(t) ? t : 0))
  const sec = Math.floor(d / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  return `${day}d`
}

/**
 * BASIC STUB: openChatWithUser
 * - Dependency-free; does not create conversations.
 * - Computes a deterministic placeholder convoId and navigates to /chat/:id.
 *
 * Usage:
 *   import { openChatWithUser } from '@/features/chat/helpers/chatHelpers'
 *   openChatWithUser({ navigate, myActorId, targetActorId })
 */
export function openChatWithUser({ navigate, myActorId, targetActorId, fallbackId } = {}) {
  // Build a stable placeholder id to avoid duplicates while backend wiring is absent.
  const a = myActorId ? String(myActorId) : 'me'
  const b = targetActorId ? String(targetActorId) : 'target'
  const convoId = fallbackId || `u_${a}_${b}`

  if (typeof navigate === 'function') {
    navigate(`/chat/${convoId}`)
  } else if (typeof window !== 'undefined') {
    window.location.assign(`/chat/${convoId}`)
  }
  return convoId
}

/**
 * OPTIONAL: generic actor-to-actor opener (user or vport).
 * Keeps API flexible if other places import a generic name.
 */
export function openChatWithActor({ navigate, fromActorId, toActorId, fallbackId } = {}) {
  const a = fromActorId ? String(fromActorId) : 'from'
  const b = toActorId ? String(toActorId) : 'to'
  const convoId = fallbackId || `a_${a}_${b}`
  if (typeof navigate === 'function') navigate(`/chat/${convoId}`)
  else if (typeof window !== 'undefined') window.location.assign(`/chat/${convoId}`)
  return convoId
}

// Default export includes common helpers + openers
const helpers = {
  makeTempId,
  isUuid,
  safeText,
  clamp,
  uniq,
  formatPreview,
  timeAgo,
  openChatWithUser,
  openChatWithActor,
}

export default helpers
