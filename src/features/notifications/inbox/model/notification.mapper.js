// src/features/notifications/inbox/model/notification.mapper.js

export function mapNotification(row, senderMap) {
  const ctx =
    typeof row.context === 'object' && row.context !== null
      ? row.context
      : {}

  const rawSender = row.actor_id
    ? senderMap[row.actor_id] ?? null
    : null

  return {
    id: row.id,

    // normalized domain kind
    kind: normalizeKind(row.kind, ctx),

    createdAt: row.created_at,
    isRead: row.is_read,
    isSeen: row.is_seen,

    // domain-safe sender (NO routing)
    sender: normalizeSender(rawSender),

    objectType: row.object_type,
    objectId: row.object_id,
    linkPath: row.link_path,
    context: ctx,
  }
}

function normalizeKind(kind, ctx = {}) {
  const v = String(kind || '').toLowerCase().replaceAll('.', '_')

  // legacy + new reaction normalization
  if (v === 'reaction' || v === 'post_reaction') {
    if (ctx?.reaction === 'like') return 'like'
    if (ctx?.reaction === 'dislike') return 'dislike'
    if (ctx?.reaction === 'rose') return 'post_rose'
    return 'post_reaction'
  }

  return v
}

/**
 * Converts raw sender into a domain-safe actor object.
 * Routing is handled by UI components (ActorLink, NotificationCard).
 */
function normalizeSender(sender) {
  if (!sender) return null

  // USER
  if (sender.type === 'user') {
    return {
      id: sender.id,
      kind: 'user',
      displayName: sender.display_name || sender.username || 'User',
      username: sender.username || null,
      avatar: sender.photo_url || '/avatar.jpg',
    }
  }

  // VPORT
  if (sender.type === 'vport') {
    return {
      id: sender.id,
      kind: 'vport',
      displayName: sender.display_name || 'VPORT',
      slug: sender.slug || null,
      avatar: sender.photo_url || '/avatar.jpg',
    }
  }

  return null
}
