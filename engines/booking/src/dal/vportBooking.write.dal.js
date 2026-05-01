import { getVportClient } from '../config.js'

const BOOKING_SELECT = [
  'id', 'resource_id', 'profile_id', 'service_id', 'customer_actor_id',
  'status', 'source', 'starts_at', 'ends_at', 'timezone', 'service_label_snapshot',
  'duration_minutes', 'customer_name', 'customer_phone', 'customer_email',
  'customer_note', 'internal_note', 'cancelled_at', 'completed_at',
  'created_by_actor_id', 'created_at', 'updated_at',
].join(',')

const INSERT_COLUMNS = Object.freeze([
  'resource_id', 'profile_id', 'service_id', 'customer_actor_id',
  'status', 'source', 'starts_at', 'ends_at', 'timezone', 'service_label_snapshot',
  'duration_minutes', 'customer_name', 'customer_phone', 'customer_email',
  'customer_note', 'internal_note', 'cancelled_at', 'completed_at', 'created_by_actor_id',
])

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key]
    return acc
  }, {})
}

export async function dalInsertVportBooking({ row } = {}) {
  const r = row ?? {}
  if (!r.resource_id)            throw new Error('BookingEngine: resource_id is required')
  if (!r.profile_id)             throw new Error('BookingEngine: profile_id is required')
  if (!r.starts_at)              throw new Error('BookingEngine: starts_at is required')
  if (!r.ends_at)                throw new Error('BookingEngine: ends_at is required')
  if (!r.timezone)               throw new Error('BookingEngine: timezone is required')
  if (!r.service_label_snapshot) throw new Error('BookingEngine: service_label_snapshot is required')
  if (r.duration_minutes == null) throw new Error('BookingEngine: duration_minutes is required')

  const { data, error } = await getVportClient()
    .from('bookings')
    .insert(pickDefined(r, INSERT_COLUMNS))
    .select(BOOKING_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}

export async function dalDeleteVportBooking({ bookingId } = {}) {
  if (!bookingId) throw new Error('BookingEngine: bookingId is required')

  const { error } = await getVportClient()
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (error) throw error
}

export async function dalUpdateVportBookingStatus({ bookingId, status, cancelledAt, completedAt, internalNote } = {}) {
  if (!bookingId) throw new Error('BookingEngine: bookingId is required')
  if (!status)    throw new Error('BookingEngine: status is required')

  const patch = { status }
  if (cancelledAt  !== undefined) patch.cancelled_at  = cancelledAt
  if (completedAt  !== undefined) patch.completed_at  = completedAt
  if (internalNote !== undefined) patch.internal_note = internalNote

  const { data, error } = await getVportClient()
    .from('bookings')
    .update(patch)
    .eq('id', bookingId)
    .select(BOOKING_SELECT)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}
