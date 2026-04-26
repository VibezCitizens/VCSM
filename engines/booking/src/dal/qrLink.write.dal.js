import { getVportClient } from '../config.js'

export async function dalInsertQrLink({
  organizationId = null, locationId = null, profileId = null,
  resourceId = null, serviceId = null,
  qrType, label, slug, destinationPath,
}) {
  if (!qrType) throw new Error('[BookingEngine] qrType is required')
  if (!slug) throw new Error('[BookingEngine] slug is required')
  if (!destinationPath) throw new Error('[BookingEngine] destinationPath is required')

  const { data, error } = await getVportClient()
    .from('qr_links')
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      profile_id: profileId,
      resource_id: resourceId,
      service_id: serviceId,
      qr_type: qrType,
      label: label ?? null,
      slug,
      destination_path: destinationPath,
      scan_count: 0,
    })
    .select('id,organization_id,location_id,profile_id,resource_id,service_id,qr_type,label,slug,destination_path,scan_count,created_at')
    .single()
  if (error) throw error
  return data
}

export async function dalIncrementQrScanCountRaw({ qrLinkId, currentCount }) {
  if (!qrLinkId) throw new Error('[BookingEngine] qrLinkId is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .update({ scan_count: (currentCount ?? 0) + 1 })
    .eq('id', qrLinkId)
    .select('id,scan_count')
    .single()
  if (error) throw error
  return data
}

export async function dalDeleteQrLink({ qrLinkId }) {
  if (!qrLinkId) throw new Error('[BookingEngine] qrLinkId is required')
  const { error } = await getVportClient()
    .from('qr_links')
    .delete()
    .eq('id', qrLinkId)
  if (error) throw error
}
