import { getSupabaseClient } from '../config.js'

const RULE_SELECT = [
  'id', 'resource_id', 'rule_type', 'weekday', 'start_time', 'end_time',
  'valid_from', 'valid_until', 'is_active', 'created_at', 'updated_at',
].join(',')

const EXCEPTION_SELECT = [
  'id', 'resource_id', 'exception_type', 'starts_at', 'ends_at',
  'note', 'created_by_actor_id', 'created_at', 'updated_at',
].join(',')

const RULE_WRITE_COLUMNS    = Object.freeze(['id', 'resource_id', 'rule_type', 'weekday', 'start_time', 'end_time', 'valid_from', 'valid_until', 'is_active'])
const EXCEPTION_WRITE_COLUMNS = Object.freeze(['id', 'resource_id', 'exception_type', 'starts_at', 'ends_at', 'note', 'created_by_actor_id'])

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key]
    return acc
  }, {})
}

export async function dalUpsertAvailabilityRule({ row } = {}) {
  const r = row ?? {}
  if (!r.resource_id) throw new Error('BookingEngine: resource_id is required')
  if (r.weekday == null) throw new Error('BookingEngine: weekday is required')
  if (!r.start_time)  throw new Error('BookingEngine: start_time is required')
  if (!r.end_time)    throw new Error('BookingEngine: end_time is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('booking_availability_rules')
    .upsert(pickDefined(r, RULE_WRITE_COLUMNS), { onConflict: 'id' })
    .select(RULE_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}

export async function dalUpsertAvailabilityException({ row } = {}) {
  const r = row ?? {}
  if (!r.resource_id)    throw new Error('BookingEngine: resource_id is required')
  if (!r.exception_type) throw new Error('BookingEngine: exception_type is required')
  if (!r.starts_at)      throw new Error('BookingEngine: starts_at is required')
  if (!r.ends_at)        throw new Error('BookingEngine: ends_at is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('booking_availability_exceptions')
    .upsert(pickDefined(r, EXCEPTION_WRITE_COLUMNS), { onConflict: 'id' })
    .select(EXCEPTION_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}
