// src/features/settings/privacy/models/blocks.model.js

export function modelBlockRow(row) {
  if (!row) return null
  return {
    id: `${row.blocker_domain}:${row.blocker_actor_id}:${row.blocked_domain}:${row.blocked_actor_id}`,
    blockerDomain: row.blocker_domain ?? 'vc',
    blockerActorId: row.blocker_actor_id,
    blockedDomain: row.blocked_domain ?? 'vc',
    blockedActorId: row.blocked_actor_id,
    status: row.status ?? 'active',
    reason: row.reason ?? null,
    releasedAt: row.released_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  }
}

export function modelBlockRows(rows) {
  return (rows || []).map(modelBlockRow).filter(Boolean)
}

export function modelActorRow(row) {
  if (!row) return null

  // prefer vport avatar when present (but keep it dumb)
  const avatarUrl = row.vport_avatar_url || row.photo_url || null
  const displayName = row.vport_name || row.display_name || row.username || 'Unknown'
  const username = row.vport_slug || row.username || null

  return {
    actorId: row.actor_id,
    kind: row.kind,
    displayName,
    username,
    avatarUrl,
  }
}

export function modelActorRows(rows) {
  return (rows || []).map(modelActorRow).filter(Boolean)
}
