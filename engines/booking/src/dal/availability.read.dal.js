import { getSupabaseClient } from '../config.js'

const RULE_SELECT = [
  'id', 'resource_id', 'rule_type', 'weekday', 'start_time', 'end_time',
  'valid_from', 'valid_until', 'is_active', 'created_at', 'updated_at',
].join(',')

const EXCEPTION_SELECT = [
  'id', 'resource_id', 'exception_type', 'starts_at', 'ends_at',
  'note', 'created_by_actor_id', 'created_at', 'updated_at',
].join(',')

function asTimestamp(value, field) {
  if (!value) throw new Error(`BookingEngine: ${field} is required`)
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error(`BookingEngine: ${field} is invalid`)
    return value.toISOString()
  }
  return String(value)
}

export async function dalListAvailabilityRulesByResourceId({ resourceId, includeInactive = false }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  let query = getSupabaseClient()
    .schema('vc')
    .from('booking_availability_rules')
    .select(RULE_SELECT)
    .eq('resource_id', resourceId)
    .order('weekday',    { ascending: true })
    .order('start_time', { ascending: true })
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalListAvailabilityExceptionsInRange({ resourceId, rangeStart, rangeEnd, exceptionTypes = null }) {
  if (!resourceId) throw new Error('BookingEngine: resourceId is required')

  const startIso = asTimestamp(rangeStart, 'rangeStart')
  const endIso   = asTimestamp(rangeEnd,   'rangeEnd')

  let query = getSupabaseClient()
    .schema('vc')
    .from('booking_availability_exceptions')
    .select(EXCEPTION_SELECT)
    .eq('resource_id', resourceId)
    .lt('starts_at', endIso)
    .gt('ends_at', startIso)
    .order('starts_at', { ascending: true })
    .order('created_at', { ascending: true })

  const types = Array.isArray(exceptionTypes) ? exceptionTypes.filter(Boolean) : []
  if (types.length) query = query.in('exception_type', types)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
