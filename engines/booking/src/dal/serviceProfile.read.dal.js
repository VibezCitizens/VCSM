import { getVportClient } from '../config.js'

const SERVICE_PROFILE_SELECT = [
  'service_id', 'duration_minutes', 'padding_before_minutes', 'padding_after_minutes',
  'booking_mode', 'max_concurrent', 'is_bookable', 'price_cents', 'currency_code',
  'created_at', 'updated_at',
].join(',')

function normalizeIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean).map(String))]
}

export async function dalListBookingServiceProfilesByServiceIds({ serviceIds, includeNonBookable = false }) {
  const ids = normalizeIds(serviceIds)
  if (!ids.length) return []

  let query = getVportClient()
    .from('service_booking_profiles')
    .select(SERVICE_PROFILE_SELECT)
    .in('service_id', ids)
    .order('created_at', { ascending: true })

  if (!includeNonBookable) query = query.eq('is_bookable', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
