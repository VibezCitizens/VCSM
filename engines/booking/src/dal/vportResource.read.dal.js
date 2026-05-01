import { getVportClient } from '../config.js'

const VPORT_RESOURCE_SELECT = [
  'id', 'owner_actor_id', 'profile_id', 'organization_id', 'location_id', 'member_actor_id',
  'resource_type', 'name', 'is_active', 'timezone', 'sort_order', 'created_at', 'updated_at',
].join(',')

export async function dalGetVportResourceById({ resourceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const { data, error } = await getVportClient()
    .from('resources')
    .select(VPORT_RESOURCE_SELECT)
    .eq('id', resourceId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListVportResourcesByLocationId({ locationId, includeInactive = false }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')

  let query = getVportClient()
    .from('resources')
    .select(VPORT_RESOURCE_SELECT)
    .eq('location_id', locationId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListVportResourcesByOrganizationId({ organizationId, includeInactive = false }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')

  let query = getVportClient()
    .from('resources')
    .select(VPORT_RESOURCE_SELECT)
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListVportResourcesByMemberActor({ memberActorId, locationId = null, includeInactive = false }) {
  if (!memberActorId) throw new Error('[BookingEngine] memberActorId is required')

  let query = getVportClient()
    .from('resources')
    .select(VPORT_RESOURCE_SELECT)
    .eq('member_actor_id', memberActorId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (locationId) query = query.eq('location_id', locationId)
  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
