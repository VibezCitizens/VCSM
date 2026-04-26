import { getVportClient } from '../config.js'

export async function dalInsertLocation({
  organizationId, profileId = null, name, slug,
  timezone = 'UTC', phone = null, email = null,
  address = null, lat = null, lng = null, isPrimary = false,
}) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!name) throw new Error('[BookingEngine] name is required')
  if (!slug) throw new Error('[BookingEngine] slug is required')

  const { data, error } = await getVportClient()
    .from('locations')
    .insert({
      organization_id: organizationId,
      profile_id: profileId,
      name,
      slug,
      timezone,
      phone,
      email,
      address,
      lat,
      lng,
      is_primary: isPrimary,
      is_active: true,
    })
    .select('id,organization_id,profile_id,name,slug,timezone,phone,email,address,lat,lng,is_primary,is_active,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpdateLocation({ locationId, patch }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  const allowed = ['name', 'slug', 'timezone', 'phone', 'email', 'address', 'lat', 'lng', 'is_primary', 'is_active', 'profile_id']
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)))
  const { data, error } = await getVportClient()
    .from('locations')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', locationId)
    .select('id,organization_id,profile_id,name,slug,timezone,phone,email,address,lat,lng,is_primary,is_active,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpsertLocationMember({ locationId, actorId, role, resourceId = null }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  if (!role) throw new Error('[BookingEngine] role is required')

  const { data, error } = await getVportClient()
    .from('location_members')
    .upsert(
      { location_id: locationId, actor_id: actorId, role, resource_id: resourceId ?? null },
      { onConflict: 'location_id,actor_id' }
    )
    .select('location_id,actor_id,role,resource_id,created_at')
    .single()
  if (error) throw error
  return data
}

export async function dalRemoveLocationMember({ locationId, actorId }) {
  if (!locationId) throw new Error('[BookingEngine] locationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  const { error } = await getVportClient()
    .from('location_members')
    .delete()
    .eq('location_id', locationId)
    .eq('actor_id', actorId)
  if (error) throw error
}
