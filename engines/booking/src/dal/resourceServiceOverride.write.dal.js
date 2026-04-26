import { getVportClient } from '../config.js'

export async function dalUpsertResourceServiceOverride({
  resourceId, serviceId, priceCents = null, durationMinutes = null, isBookable = true,
}) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  if (!serviceId) throw new Error('[BookingEngine] serviceId is required')

  const { data, error } = await getVportClient()
    .from('resource_service_overrides')
    .upsert(
      {
        resource_id: resourceId,
        service_id: serviceId,
        price_cents: priceCents ?? null,
        duration_minutes: durationMinutes ?? null,
        is_bookable: isBookable,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'resource_id,service_id' }
    )
    .select('resource_id,service_id,price_cents,duration_minutes,is_bookable,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalDeleteResourceServiceOverride({ resourceId, serviceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  if (!serviceId) throw new Error('[BookingEngine] serviceId is required')
  const { error } = await getVportClient()
    .from('resource_service_overrides')
    .delete()
    .eq('resource_id', resourceId)
    .eq('service_id', serviceId)
  if (error) throw error
}
