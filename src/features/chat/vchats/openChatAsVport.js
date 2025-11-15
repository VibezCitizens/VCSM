// Minimal, dependency-free stub.
// Use: import openChatAsVport from '@/features/chat/vchats/openChatAsVport'
// or:  import { openChatAsVport } from '...'

export function openChatAsVport({ navigate, vportActorId, targetActorId, fallbackId } = {}) {
  // No backend calls; just navigate to a predictable route.
  const a = String(vportActorId || 'vport')
  const b = String(targetActorId || 'target')
  const convoId = fallbackId || `v_${a}_${b}`

  if (typeof navigate === 'function') {
    navigate(`/chat/${convoId}`)
  } else if (typeof window !== 'undefined') {
    // safe fallback
    window.location.assign(`/chat/${convoId}`)
  }
  return convoId
}

export default openChatAsVport
