export function mapAuditLog(row) {
  if (!row) return null;

  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    context: row.context,
    realmId: row.realm_id,
    createdAt: row.created_at,
  };
}

export function mapAuditLogs(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAuditLog);
}

export default mapAuditLog;
