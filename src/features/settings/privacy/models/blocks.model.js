// src/features/settings/privacy/models/blocks.model.js

export function modelBlockRow(row) {
  if (!row) return null
  return {
    id: row.id,
    blockerActorId: row.blocker_actor_id,
    blockedActorId: row.blocked_actor_id,
    scope: row.scope,
    vportId: row.vport_id || null,
    createdAt: row.created_at,
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
