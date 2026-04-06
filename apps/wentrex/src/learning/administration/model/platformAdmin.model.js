export function mapPlatformAdmin(row) {
  if (!row) return null;

  return {
    id: row.id,
    actorId: row.actor_id,
    createdAt: row.created_at,
  };
}

export function mapPlatformAdmins(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPlatformAdmin);
}

export default mapPlatformAdmin;
