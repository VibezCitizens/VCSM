// src/features/chat/constants/conversationRoles.js
// ============================================================
// Conversation Roles
// ------------------------------------------------------------
// - Central source of truth for conversation member roles
// - MUST match vc.conversation_members.role CHECK constraint
// ============================================================

export const CONVERSATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
}

/**
 * Ordered list from highest → lowest privilege
 * Useful for comparisons and permission checks
 */
export const CONVERSATION_ROLE_ORDER = [
  CONVERSATION_ROLES.OWNER,
  CONVERSATION_ROLES.ADMIN,
  CONVERSATION_ROLES.MEMBER,
]

/**
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * Validate role value
 */
export function isValidConversationRole(role) {
  return CONVERSATION_ROLE_ORDER.includes(role)
}

/**
 * Check if roleA >= roleB
 * Example: OWNER >= ADMIN === true
 */
export function hasAtLeastRole(roleA, roleB) {
  return (
    CONVERSATION_ROLE_ORDER.indexOf(roleA) <=
    CONVERSATION_ROLE_ORDER.indexOf(roleB)
  )
}

/**
 * Check if role can manage members
 * (add/remove/promote)
 */
export function canManageMembers(role) {
  return (
    role === CONVERSATION_ROLES.OWNER ||
    role === CONVERSATION_ROLES.ADMIN
  )
}

/**
 * Check if role can edit conversation
 * (title, avatar, settings)
 */
export function canEditConversation(role) {
  return role === CONVERSATION_ROLES.OWNER
}
