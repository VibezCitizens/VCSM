export function mapQrLinkRow(row) {
  if (!row) return null
  return {
    id:              row.id,
    organizationId:  row.organization_id ?? null,
    locationId:      row.location_id ?? null,
    profileId:       row.profile_id ?? null,
    resourceId:      row.resource_id ?? null,
    serviceId:       row.service_id ?? null,
    qrType:          row.qr_type,
    label:           row.label ?? null,
    slug:            row.slug,
    destinationPath: row.destination_path,
    isActive:        row.is_active === true,
    scanCount:       row.scan_count ?? 0,
    createdAt:       row.created_at,
  }
}

export function mapQrLinkRows(rows) {
  return Array.isArray(rows) ? rows.map(mapQrLinkRow) : []
}

/**
 * Build a canonical destination path for a QR link.
 * Mode determines what the QR code points to.
 *
 * @param {{ mode: string, profileSlug?: string, serviceKey?: string, resourceId?: string, locationSlug?: string }} opts
 * @returns {string}
 */
export function buildQrDestinationPath({ mode, profileSlug, serviceKey, resourceId, locationSlug }) {
  if (mode === 'profile_book' && profileSlug) {
    return serviceKey
      ? `/pro/${profileSlug}/book?service=${serviceKey}`
      : `/pro/${profileSlug}/book`
  }
  if (mode === 'profile' && profileSlug) {
    return `/pro/${profileSlug}`
  }
  if (mode === 'location_book' && profileSlug && locationSlug) {
    return serviceKey
      ? `/pro/${profileSlug}/book?location=${locationSlug}&service=${serviceKey}`
      : `/pro/${profileSlug}/book?location=${locationSlug}`
  }
  if (mode === 'resource_book' && profileSlug && resourceId) {
    return serviceKey
      ? `/pro/${profileSlug}/book?resource=${resourceId}&service=${serviceKey}`
      : `/pro/${profileSlug}/book?resource=${resourceId}`
  }
  if (mode === 'service' && profileSlug && serviceKey) {
    return `/pro/${profileSlug}/services/${serviceKey}`
  }
  return profileSlug ? `/pro/${profileSlug}` : '/'
}
