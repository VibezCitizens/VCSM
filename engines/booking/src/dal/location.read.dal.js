import { getVportClient } from '../config.js'

const LOCATION_SELECT = [
  'id', 'organization_id', 'profile_id', 'name', 'slug', 'timezone',
  'phone', 'email', 'address', 'lat', 'lng',
  'is_primary', 'is_active', 'created_at', 'updated_at',
].join(',')

const LOCATION_MEMBER_SELECT = [
  'id', 'location_id', 'actor_id', 'role', 'resource_id', 'created_at',
].join(',')

export async function dalGetLocationById({ locationId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const { data, error } = await getVportClient()
    .from('locations')
    .select(LOCATION_SELECT)
    .eq('id', locationId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalGetLocationBySlug({ organizationId, slug }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!slug) throw new Error('[BookingEngine] slug is required')
  const { data, error } = await getVportClient()
    .from('locations')
    .select(LOCATION_SELECT)
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalGetPrimaryLocation({ organizationId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const { data, error } = await getVportClient()
    .from('locations')
    .select(LOCATION_SELECT)
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListLocationsByOrganization({ organizationId, includeInactive = false }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  let query = getVportClient()
    .from('locations')
    .select(LOCATION_SELECT)
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalGetLocationMember({ locationId, actorId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  const { data, error } = await getVportClient()
    .from('location_members')
    .select(LOCATION_MEMBER_SELECT)
    .eq('location_id', locationId)
    .eq('actor_id', actorId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListLocationMembers({ locationId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const { data, error } = await getVportClient()
    .from('location_members')
    .select(LOCATION_MEMBER_SELECT)
    .eq('location_id', locationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListLocationMembersByResource({ resourceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const { data, error } = await getVportClient()
    .from('location_members')
    .select(LOCATION_MEMBER_SELECT)
    .eq('resource_id', resourceId)
  if (error) throw error
  return Array.isArray(data) ? data : []
}
