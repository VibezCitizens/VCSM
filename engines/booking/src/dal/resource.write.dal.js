import { getSupabaseClient } from '../config.js'

const RESOURCE_SELECT = [
  'id', 'owner_actor_id', 'resource_type', 'name',
  'is_active', 'timezone', 'sort_order', 'created_at', 'updated_at',
].join(',')

const RESOURCE_SERVICE_SELECT = ['resource_id', 'service_id', 'is_active', 'created_at'].join(',')

const WRITE_COLUMNS = Object.freeze(['owner_actor_id', 'resource_type', 'name', 'is_active', 'timezone', 'sort_order'])

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key]
    return acc
  }, {})
}

export async function dalInsertBookingResource({ row } = {}) {
  const r = row ?? {}
  if (!r.owner_actor_id) throw new Error('BookingEngine: owner_actor_id is required')
  if (!r.resource_type)  throw new Error('BookingEngine: resource_type is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('booking_resources')
    .insert(pickDefined(r, WRITE_COLUMNS))
    .select(RESOURCE_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}

export async function dalUpsertBookingResourceServices({ rows } = {}) {
  const payload = (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.resource_id && row?.service_id)
    .map((row) => ({
      resource_id: String(row.resource_id),
      service_id: String(row.service_id),
      is_active: row.is_active !== false,
    }))

  if (!payload.length) return []

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('booking_resource_services')
    .upsert(payload, { onConflict: 'resource_id,service_id' })
    .select(RESOURCE_SERVICE_SELECT)

  if (error) throw error
  return Array.isArray(data) ? data : []
}
