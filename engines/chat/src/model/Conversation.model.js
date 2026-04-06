import {
  isAnnouncementConversation,
  normalizeConversationAccessMode,
} from '../rules/conversationAccess.rules.js'

export function ConversationModel(raw) {
  if (!raw) return null

  const accessMode = normalizeConversationAccessMode(
    raw.access_mode ?? raw.accessMode
  )

  const conversationKind =
    raw.conversation_kind ??
    raw.kind ??
    (accessMode === 'announcement' ? 'channel' : null) ??
    (raw.is_group ? 'group' : 'direct')

  return {
    id: raw.id,
    conversationKind,
    isGroup:
      typeof raw.isGroup === 'boolean'
        ? raw.isGroup
        : conversationKind === 'group' || Boolean(raw.is_group),
    accessMode,
    visibility: raw.visibility ?? 'members',
    scopeKind: raw.scope_kind ?? raw.scopeKind ?? null,
    scopeId: raw.scope_id ?? raw.scopeId ?? null,
    isAnnouncement: isAnnouncementConversation({
      access_mode: raw.access_mode ?? raw.accessMode,
    }),
    createdByActorId: raw.created_by_actor_id ?? raw.createdByActorId ?? null,
    title: raw.title || null,
    avatarUrl: raw.avatar_url || null,
    lastMessageId: raw.last_message_id || null,
    lastMessageAt: raw.last_message_at || null,
    realmId: raw.realm_id,
    createdAt: raw.created_at,
  }
}

// Alias for backwards compatibility
export default ConversationModel
export { ConversationModel as normalizeConversation }
