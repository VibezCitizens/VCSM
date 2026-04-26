import { getSupabaseClient, getVportClient } from '../config.js'

const ACTOR_SELECT       = ['id', 'kind', 'profile_id', 'vport_id', 'is_void'].join(',')
const ACTOR_OWNER_SELECT = ['actor_id', 'user_id', 'is_primary', 'is_void', 'created_at'].join(',')
const VPORT_SERVICES_SELECT = 'id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at'

export async function dalGetActorById({ actorId }) {
  if (!actorId) throw new Error('BookingEngine: actorId is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('actors')
    .select(ACTOR_SELECT)
    .eq('id', actorId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function dalReadActorOwnerLink({ targetActorId, userProfileId }) {
  if (!targetActorId)   throw new Error('BookingEngine: targetActorId is required')
  if (!userProfileId)   throw new Error('BookingEngine: userProfileId is required')

  const { data, error } = await getSupabaseClient()
    .schema('vc')
    .from('actor_owners')
    .select(ACTOR_OWNER_SELECT)
    .eq('actor_id', targetActorId)
    .eq('user_id', userProfileId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function dalReadVportServicesByActor({ actorId, includeDisabled = true }) {
  if (!actorId) throw new Error('BookingEngine: actorId is required')

  const vportClient = getVportClient()

  const { data: profileRow } = await vportClient
    .from('profiles')
    .select('id')
    .eq('actor_id', actorId)
    .maybeSingle()

  const profileId = profileRow?.id ?? null
  if (!profileId) return []

  let query = vportClient
    .from('services')
    .select(VPORT_SERVICES_SELECT)
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })
    .order('key',        { ascending: true })

  if (!includeDisabled) query = query.eq('enabled', true)

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}
