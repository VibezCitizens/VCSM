import { CONVERSATION_ROLES } from '../model/constants/conversationRoles.js'

export const CONVERSATION_ACCESS_MODES = {
  STANDARD: 'standard',
  ANNOUNCEMENT: 'announcement',
}

export function normalizeConversationAccessMode(mode) {
  return mode === CONVERSATION_ACCESS_MODES.ANNOUNCEMENT
    ? CONVERSATION_ACCESS_MODES.ANNOUNCEMENT
    : CONVERSATION_ACCESS_MODES.STANDARD
}

export function normalizeConversationVisibility(visibility) {
  if (typeof visibility !== 'string') return 'members'

  const value = visibility.trim()
  return value || 'members'
}

export function normalizeConversationKind({
  conversationKind,
  accessMode = CONVERSATION_ACCESS_MODES.STANDARD,
  memberCount = 2,
}) {
  if (conversationKind) return conversationKind

  if (normalizeConversationAccessMode(accessMode) === CONVERSATION_ACCESS_MODES.ANNOUNCEMENT) {
    return 'channel'
  }

  return memberCount > 2 ? 'group' : 'direct'
}

function defaultManageFlag(role) {
  return role === CONVERSATION_ROLES.OWNER || role === CONVERSATION_ROLES.ADMIN
}

export function normalizeConversationMemberAccess({
  role = CONVERSATION_ROLES.MEMBER,
  canPost,
  canManage,
  canModerate,
  accessMode = CONVERSATION_ACCESS_MODES.STANDARD,
}) {
  const normalizedAccessMode = normalizeConversationAccessMode(accessMode)
  const defaultCanManage = defaultManageFlag(role)

  return {
    canPost: typeof canPost === 'boolean'
      ? canPost
      : normalizedAccessMode !== CONVERSATION_ACCESS_MODES.ANNOUNCEMENT,
    canManage: typeof canManage === 'boolean'
      ? canManage
      : defaultCanManage,
    canModerate: typeof canModerate === 'boolean'
      ? canModerate
      : defaultCanManage,
  }
}

export function isAnnouncementConversation(conversation) {
  return normalizeConversationAccessMode(
    conversation?.accessMode ?? conversation?.access_mode
  ) === CONVERSATION_ACCESS_MODES.ANNOUNCEMENT
}

export function memberCanPost(membership) {
  return (
    membership?.membership_status === 'active' &&
    membership?.can_post !== false &&
    membership?.canPost !== false
  )
}
