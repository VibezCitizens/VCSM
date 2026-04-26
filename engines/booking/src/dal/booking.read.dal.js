import { getSupabaseClient } from '../config.js'

const BOOKING_SELECT = [
  'id', 'resource_id', 'service_id', 'customer_actor_id', 'customer_profile_id',
  'status', 'source', 'starts_at', 'ends_at', 'timezone', 'service_label_snapshot',
  'duration_minutes', 'customer_name', 'customer_phone', 'customer_email',
  'customer_note', 'internal_note', 'cancelled_at', 'completed_at',
  'created_by_actor_id', 'created_at', 'updated_at',
].join(',')

const BOOKING_SELECT_PUBLIC = [
  'id', 'resource_id', 'starts_at', 'ends_at', 'status',
  'duration_minutes', 'created_by_actor_id',
].join(',')

function asTimestamp(value, field) {
  if (!value) throw new Error(`BookingEngine: ${field} is required`)
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`BookingEngine: ${field} is invalid`)
    return value.toISOString()
  }
  return String(value)
}

export async function dalGetBookingById({ bookingId }) {
  if (!bookingId) throw new Error('BookingEngine: bookingId is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function dalListBookingsInRange({ resourceId, rangeStart, rangeEnd, statuses = null, publicMode = false }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  const startIso = asTimestamp(rangeStart, 'rangeStart')
  const endIso   = asTimestamp(rangeEnd,   'rangeEnd')

  let query = getSupabaseClient()
    .schema('vc')
    .from('bookings')
    .select(publicMode ? BOOKING_SELECT_PUBLIC : BOOKING_SELECT)
    .eq('resource_id', resourceId)
    .lt('starts_at', endIso)
    .gt('ends_at', startIso)
    .order('starts_at', { ascending: true })
    .order('created_at', { ascending: true })

  const statusList = Array.isArray(statuses) ? statuses.filter(Boolean) : []
  if (statusList.length) query = query.in('status', statusList)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListBookingsByResource({ resourceId, statuses = null, limit = 50, offset = 0 }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  let query = getSupabaseClient()
    .schema('vc')
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('resource_id', resourceId)
    .order('starts_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const statusList = Array.isArray(statuses) ? statuses.filter(Boolean) : []
  if (statusList.length) query = query.in('status', statusList)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
