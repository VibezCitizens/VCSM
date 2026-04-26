import { getVportClient } from '../config.js'

const VPORT_RESOURCE_SELECT = [
  'id', 'owner_actor_id', 'organization_id', 'location_id', 'member_actor_id',
  'resource_type', 'name', 'is_active', 'timezone', 'sort_order', 'created_at', 'updated_at',
].join(',')

const WRITE_COLUMNS = Object.freeze([
  'owner_actor_id', 'organization_id', 'location_id', 'member_actor_id',
  'resource_type', 'name', 'is_active', 'timezone', 'sort_order',
])

function pickDefined(input, columns) {
  return columns.reduce((acc, key) => {
    if (input[key] !== undefined) acc[key] = input[key]
    return acc
  }, {})
}

export async function dalInsertVportResource({ row } = {}) {
  const r = row ?? {}
  if (!r.owner_actor_id) throw new Error('[BookingEngine] owner_actor_id is required')
  if (!r.resource_type)  throw new Error('[BookingEngine] resource_type is required')

  const { data, error } = await getVportClient()
    .from('resources')
    .insert(pickDefined(r, WRITE_COLUMNS))
    .select(VPORT_RESOURCE_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}

export async function dalUpdateVportResource({ resourceId, patch }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const safe = pickDefined(patch, WRITE_COLUMNS)

  const { data, error } = await getVportClient()
    .from('resources')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', resourceId)
    .select(VPORT_RESOURCE_SELECT)
    .single()

  if (error) throw error
  return data ?? null
}
