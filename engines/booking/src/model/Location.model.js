export function mapLocationRow(row) {
  if (!row) return null
  return {
    id:             row.id,
    organizationId: row.organization_id,
    profileId:      row.profile_id ?? null,
    name:           row.name,
    slug:           row.slug,
    timezone:       row.timezone ?? 'UTC',
    phone:          row.phone ?? null,
    email:          row.email ?? null,
    address:        row.address ?? null,
    lat:            row.lat ?? null,
    lng:            row.lng ?? null,
    isPrimary:      row.is_primary ?? false,
    isActive:       row.is_active ?? true,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  }
}

export function mapLocationRows(rows) {
  return Array.isArray(rows) ? rows.map(mapLocationRow) : []
}

export function mapLocationMemberRow(row) {
  if (!row) return null
  return {
    id:         row.id,
    locationId: row.location_id,
    actorId:    row.actor_id,
    role:       row.role,
    resourceId: row.resource_id ?? null,
    createdAt:  row.created_at,
  }
}

export function mapLocationMemberRows(rows) {
  return Array.isArray(rows) ? rows.map(mapLocationMemberRow) : []
}
