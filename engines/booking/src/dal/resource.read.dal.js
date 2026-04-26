import { getSupabaseClient } from '../config.js'

const RESOURCE_SELECT = [
  'id', 'owner_actor_id', 'resource_type', 'name',
  'is_active', 'timezone', 'sort_order', 'created_at', 'updated_at',
].join(',')

const RESOURCE_SERVICE_SELECT = ['resource_id', 'service_id', 'is_active', 'created_at'].join(',')

export async function dalGetBookingResourceById({ resourceId, ownerActorId = null }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  let query = getSupabaseClient()
    .schema('vc')
    .from('booking_resources')
    .select(RESOURCE_SELECT)
    .eq('id', resourceId)

  if (ownerActorId) query = query.eq('owner_actor_id', ownerActorId)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListBookingResourcesByOwnerActorId({ ownerActorId, includeInactive = false }) {
  if (!ownerActorId) throw new Error('BookingEngine: ownerActorId is required')

  let query = getSupabaseClient()
    .schema('vc')
    .from('booking_resources')
    .select(RESOURCE_SELECT)
    .eq('owner_actor_id', ownerActorId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListBookingResourceServicesByResourceId({ resourceId, includeInactive = false }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  let query = getSupabaseClient()
    .schema('vc')
    .from('booking_resource_services')
    .select(RESOURCE_SERVICE_SELECT)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
