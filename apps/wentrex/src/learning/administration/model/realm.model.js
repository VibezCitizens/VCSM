export function mapRealm(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sourceRealmId: row.vc_realm_id,
    ownerActorId: row.owner_actor_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRealms(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapRealm);
}

export default mapRealm;
