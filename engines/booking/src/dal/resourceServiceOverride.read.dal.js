import { getVportClient } from '../config.js'

const OVERRIDE_SELECT = [
  'resource_id', 'service_id', 'price_cents', 'duration_minutes',
  'is_bookable', 'created_at', 'updated_at',
].join(',')

export async function dalGetResourceServiceOverride({ resourceId, serviceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  if (!serviceId) throw new Error('[BookingEngine] serviceId is required')
  const { data, error } = await getVportClient()
    .from('resource_service_overrides')
    .select(OVERRIDE_SELECT)
    .eq('resource_id', resourceId)
    .eq('service_id', serviceId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListResourceServiceOverridesByResource({ resourceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const { data, error } = await getVportClient()
    .from('resource_service_overrides')
    .select(OVERRIDE_SELECT)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListResourceServiceOverridesByService({ serviceId }) {
  if (!serviceId) throw new Error('[BookingEngine] serviceId is required')
  const { data, error } = await getVportClient()
    .from('resource_service_overrides')
    .select(OVERRIDE_SELECT)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return Array.isArray(data) ? data : []
}
