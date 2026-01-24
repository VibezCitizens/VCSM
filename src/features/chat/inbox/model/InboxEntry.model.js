// src/features/chat/inbox/model/InboxEntry.model.js
export function InboxEntryModel(raw, selfActorId) {
  if (!raw) {
    console.warn('[InboxEntryModel] raw is null')
    return null
  }

  const members = Array.isArray(raw.members)
    ? raw.members.map((m) => {
        const a = m.actor || {}

        return {
          actorId: m.actor_id,
          kind: a.kind ?? null,
          displayName: a.display_name ?? a.vport_name ?? null,
          username: a.username ?? a.vport_slug ?? null,
          photoUrl: a.photo_url ?? a.vport_avatar_url ?? '/avatar.jpg',
        }
      })
    : []

  const partner =
    members.find((m) => m.actorId !== selfActorId) || null

  return {
    conversationId: raw.conversation_id,
    actorId: raw.actor_id,

    folder: raw.folder ?? 'inbox', // ✅ NEW (safe default)

    lastMessageId: raw.last_message_id ?? null,
    lastMessageAt: raw.last_message_at ?? null,

    unreadCount: Number(raw.unread_count || 0),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    muted: Boolean(raw.muted),
    archivedUntilNew: Boolean(raw.archived_until_new),
    historyCutoffAt: raw.history_cutoff_at ?? null,

    members,

    partnerActorId: partner?.actorId ?? null,
    partnerKind: partner?.kind ?? null,
    partnerDisplayName: partner?.displayName ?? null,
    partnerUsername: partner?.username ?? null,
    partnerPhotoUrl: partner?.photoUrl ?? null,

    preview: null,
    _raw: raw,
  }
}
