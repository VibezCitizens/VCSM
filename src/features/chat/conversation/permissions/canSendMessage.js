// src/features/chat/conversation/permissions/canSendMessage.js (R)
// ============================================================
// canSendMessage
// ------------------------------------------------------------
// - Actor-based permission check
// - MODEL-SAFE (ConversationMember)
// - Pure function (no IO)
// - Used by hooks, screens, controllers
// ============================================================

/**
 * Determine whether an actor can send a message in a conversation.
 *
 * Rules:
 * ------------------------------------------------------------
 * - Actor must be an ACTIVE member of the conversation
 * - Conversation must allow sending (future-safe)
 * - Block logic is handled elsewhere
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {Object} params.conversation           // Conversation model
 * @param {Array}  params.members                // ConversationMember[]
 *
 * @returns {boolean}
 */
export default function canSendMessage({
  actorId,
  conversation,
  members,
}) {
  if (
    !actorId ||
    !conversation ||
    !Array.isArray(members)
  ) {
    return false
  }

  // Actor must be an active member
  const membership = members.find(
    (m) => m.actorId === actorId && m.isActive
  )

  if (!membership) {
    return false
  }

  // Future-safe restrictions (none yet)
  // Example:
  // if (conversation.isStealth && membership.role === 'viewer') return false

  return true
}
