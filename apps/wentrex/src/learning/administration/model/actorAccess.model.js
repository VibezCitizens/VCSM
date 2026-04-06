export function mapActorAccess(row) {
  if (!row) return null;

  return {
    actorId: row.actor_id,
    canAccessLearningCenter: row.can_access_learning_center,
    grantedByActorId: row.granted_by_actor_id,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapActorAccessList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapActorAccess);
}

export default mapActorAccess;
