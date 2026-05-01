// src/features/notifications/inbox/model/notification.mapper.js
//
// Maps engine InboxNotification (notification.* schema) to UI domain object.
// Engine shape: { recipientId, eventId, eventKey, sourceActorId, objectType,
//   objectId, payload, title, body, linkPath, isSeen, isRead, ... }

export function mapNotification(row, senderMap) {
  const payload =
    typeof row.payload === 'object' && row.payload !== null
      ? row.payload
      : {}

  const senderActorId = row.sourceActorId ?? null
  const rawSender = senderActorId
    ? senderMap[senderActorId] ?? null
    : null

  return {
    id: row.recipientId ?? row.id,

    // normalized domain kind from engine eventKey
    kind: normalizeKind(row.eventKey ?? '', payload),

    createdAt: row.eventCreatedAt ?? row.created_at,
    isRead: row.isRead ?? false,
    isSeen: row.isSeen ?? false,

    // domain-safe sender (includes route for ActorLink)
    sender: normalizeSender(rawSender, payload, senderActorId),

    objectType: row.objectType ?? null,
    objectId: row.objectId ?? null,
    linkPath: row.linkPath ?? null,

    // engine rendered content
    title: row.title ?? null,
    body: row.body ?? null,

    context: payload,
  }
}

function normalizeKind(kind, ctx = {}) {
  const v = String(kind || '').toLowerCase().replaceAll('.', '_')

  // engine event keys for post reactions — map to displayable kinds
  if (v === 'social_post_like') return 'like'
  if (v === 'social_post_dislike') return 'dislike'
  if (v === 'social_post_rose') return 'post_rose'
  if (v === 'social_post_comment_like') return 'comment_like'
  if (v === 'social_post_comment') return 'comment'
  if (v === 'social_post_comment_reply') return 'comment_reply'
  if (v === 'social_post_mention') return 'post_mention'

  // legacy + new reaction normalization (eventKey = 'reaction' or 'post_reaction')
  if (v === 'reaction' || v === 'post_reaction') {
    if (ctx?.reaction === 'like') return 'like'
    if (ctx?.reaction === 'dislike') return 'dislike'
    if (ctx?.reaction === 'rose') return 'post_rose'
    return 'post_reaction'
  }

  if (
    v === 'follow' ||
    v === 'followed_you' ||
    v === 'subscribe' ||
    v === 'subscribed'
  ) {
    return 'follow'
  }

  if (v === 'team_invite' || v === 'team_invitation') return 'team_invite'

  return v
}

/**
 * Converts raw sender into a domain-safe actor object.
 * Routing is handled by UI components (ActorLink, NotificationCard).
 */
function normalizeSender(sender, ctx = {}, actorId = null) {
  if (!sender) {
    const displayName =
      ctx?.senderDisplayName ??
      ctx?.actorDisplayName ??
      ctx?.displayName ??
      ctx?.senderUsername ??
      ctx?.actorUsername ??
      ctx?.username ??
      null

    const avatar =
      ctx?.senderAvatar ??
      ctx?.actorAvatar ??
      ctx?.photoUrl ??
      ctx?.avatarUrl ??
      '/avatar.jpg'

    if (!actorId && !displayName) return null

    return {
      id: actorId ?? null,
      kind: 'user',
      displayName: displayName || 'Someone',
      username: null,
      avatar,
      route: actorId ? `/profile/${actorId}` : '#',
    }
  }

  // USER
  if (sender.type === 'user') {
    const id = sender.id ?? actorId ?? null
    const username = sender.username || null
    return {
      id,
      kind: 'user',
      displayName: sender.display_name || username || 'User',
      username,
      avatar: sender.photo_url || '/avatar.jpg',
      route: id ? `/profile/${username ?? id}` : '#',
    }
  }

  // VPORT
  if (sender.type === 'vport') {
    const id = sender.id ?? actorId ?? null
    const slug = sender.slug || null
    return {
      id,
      kind: 'vport',
      displayName: sender.display_name || 'VPORT',
      slug,
      avatar: sender.photo_url || '/avatar.jpg',
      route: id ? `/profile/${slug ?? id}` : '#',
    }
  }

  return null
}
