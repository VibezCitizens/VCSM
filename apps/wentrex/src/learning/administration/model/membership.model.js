export function mapMembership(row) {
  if (!row) return null;

  return {
    id: row.id,
    courseId: row.course_id,
    actorId: row.actor_id,
    role: row.role,
    status: row.status,
    createdByActorId: row.created_by_actor_id,
    createdAt: row.created_at,
  };
}

export function mapMemberships(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapMembership);
}

export default mapMembership;