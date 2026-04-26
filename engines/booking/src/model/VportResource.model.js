export function mapVportResourceRow(row) {
  if (!row) return null
  return {
    id:             row.id ?? null,
    ownerActorId:   row.owner_actor_id ?? null,
    organizationId: row.organization_id ?? null,
    locationId:     row.location_id ?? null,
    memberActorId:  row.member_actor_id ?? null,
    resourceType:   row.resource_type ?? null,
    name:           row.name ?? '',
    isActive:       row.is_active === true,
    timezone:       row.timezone ?? 'UTC',
    sortOrder:      Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
    createdAt:      row.created_at ?? null,
    updatedAt:      row.updated_at ?? null,
  }
}

export function mapVportResourceRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(mapVportResourceRow).filter(Boolean)
}
