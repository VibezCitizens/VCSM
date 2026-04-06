export function InboxEntryModel(raw, selfActorId) {
  if (!raw) return null

  const members = Array.isArray(raw.members)
    ? raw.members.map((m) => {
        const a = m.actor || {}
        return {
          actorId: m.actor_id,
          kind: a.kind ?? null,
          displayName: a.display_name ?? null,
          username: a.username ?? null,
          photoUrl: a.photo_url ?? null,
        }
      })
    : []

  const partner = members.find((m) => m.actorId !== selfActorId) || null

  const msgBody =
    raw.last_message_body ??
    raw.lastMessageBody ??
    raw.last_message?.body ??
    raw.last_message?.text ??
    null

  const msgKind = raw.last_message?.message_kind ?? null

  const normalizedBody =
    typeof msgBody === 'string' && msgBody.trim().length > 0
      ? msgBody
      : msgKind === 'image'
        ? '📷 Photo'
        : msgKind === 'video'
          ? '🎥 Video'
          : null

  return {
    conversationId: raw.conversation_id,
    actorId: raw.actor_id,

    folder: raw.folder ?? 'inbox',
    conversationKind:
      raw?.conversation?.conversation_kind ??
      raw?.conversation?.kind ??
      raw?.conversation?.conversation_type ??
      null,
    accessMode:
      raw?.conversation?.access_mode ?? 'standard',
    visibility: raw?.conversation?.visibility ?? 'members',
    scopeKind:
      raw?.conversation?.scope_kind ??
      (raw?.conversation?.course_id ? 'course' : null),
    scopeId:
      raw?.conversation?.scope_id ??
      raw?.conversation?.course_id ??
      null,
    title: raw?.conversation?.title ?? null,
    isAnnouncement:
      raw?.conversation?.access_mode === 'announcement',

    lastMessageId: raw.last_message_id ?? null,
    lastMessageAt: raw.last_message_at ?? null,

    lastMessageBody: normalizedBody,

    unreadCount: Number(raw.unread_count || 0),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    muted: Boolean(raw.muted),
    archivedUntilNew: Boolean(raw.archived_until_new),
    historyCutoffAt: raw.history_cutoff_at ?? null,

    members,

    partnerActorId: partner?.actorId ?? null,
    partnerKind: partner?.kind ?? null,
    partnerDisplayName: partner?.displayName ?? raw.partner_display_name ?? null,
    partnerUsername: partner?.username ?? raw.partner_username ?? null,
    partnerPhotoUrl: partner?.photoUrl ?? raw.partner_photo_url ?? null,

    preview: null,
    _raw: raw,
  }
}
