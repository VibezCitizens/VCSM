import { getVportClient } from '../config.js'

const QR_SELECT = [
  'id', 'organization_id', 'location_id', 'profile_id', 'resource_id', 'service_id',
  'qr_type', 'label', 'slug', 'destination_path', 'scan_count', 'created_at',
].join(',')

export async function dalGetQrLinkBySlug({ slug }) {
  if (!slug) throw new Error('[BookingEngine] slug is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalGetQrLinkById({ qrLinkId }) {
  if (!qrLinkId) throw new Error('[BookingEngine] qrLinkId is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('id', qrLinkId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListQrLinksByOrganization({ organizationId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListQrLinksByLocation({ locationId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListQrLinksByProfile({ profileId }) {
  if (!profileId) throw new Error('[BookingEngine] profileId is required')
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return Array.isArray(data) ? data : []
}
