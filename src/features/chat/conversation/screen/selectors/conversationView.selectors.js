// src/features/chat/conversation/screen/selectors/conversationView.selectors.js
// ============================================================
// ConversationView Selectors (PURE)
// ------------------------------------------------------------
// - Pure functions only (no React, no hooks, no I/O)
// - Derive view-level values from inputs
// - No permissions/business rules beyond calling existing helpers
// ============================================================

import resolvePartnerActor from '../../lib/resolvePartnerActor'
import canReadConversation from '../../permissions/canReadConversation'
import canSendMessage from '../../permissions/canSendMessage'

export function selectPartnerActor({ actorId, conversation, members }) {
  return resolvePartnerActor({ actorId, conversation, members }) ?? null
}

export function selectIsReady({ loading, conversation, members }) {
  return !loading && !!conversation && !!members?.length
}

export function selectCanRead({ actorId, members, isReady }) {
  if (!isReady) return false
  return canReadConversation({ actorId, members })
}

export function selectAllowSend({
  actorId,
  conversation,
  members,
  isReady,
  canRead,
  conversationCovered,
  canChatInteract,
}) {
  if (!isReady) return false
  if (!canRead) return false

  return (
    canSendMessage({ actorId, conversation, members }) &&
    !conversationCovered &&
    !!canChatInteract
  )
}
