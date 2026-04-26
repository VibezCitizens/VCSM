export function mapOrganizationRow(row) {
  if (!row) return null
  return {
    id:               row.id,
    ownerActorId:     row.owner_actor_id,
    name:             row.name,
    slug:             row.slug,
    organizationType: row.organization_type,
    isActive:         row.is_active ?? true,
    meta:             row.meta ?? null,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

export function mapOrganizationRows(rows) {
  return Array.isArray(rows) ? rows.map(mapOrganizationRow) : []
}

export function mapOrganizationMemberRow(row) {
  if (!row) return null
  return {
    id:             row.id,
    organizationId: row.organization_id,
    actorId:        row.actor_id,
    role:           row.role,
    status:         row.status,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  }
}

export function mapOrganizationMemberRows(rows) {
  return Array.isArray(rows) ? rows.map(mapOrganizationMemberRow) : []
}

export function mapOrganizationProfileRow(row) {
  if (!row) return null
  return {
    organizationId: row.organization_id,
    profileId:      row.profile_id,
    relationType:   row.relation_type,
    createdAt:      row.created_at,
  }
}
