export function mapOrganization(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isActive: row.is_active,
    realmId: row.realm_id,
    ownerActorId: row.owner_actor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrganizations(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapOrganization);
}

export default mapOrganization;