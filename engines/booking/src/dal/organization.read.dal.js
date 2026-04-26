import { getVportClient } from '../config.js'

const ORG_SELECT = [
  'id', 'owner_actor_id', 'name', 'slug', 'organization_type',
  'is_active', 'meta', 'created_at', 'updated_at',
].join(',')

const ORG_MEMBER_SELECT = [
  'id', 'organization_id', 'actor_id', 'role', 'status',
  'created_at', 'updated_at',
].join(',')

const ORG_PROFILE_SELECT = [
  'organization_id', 'profile_id', 'relation_type', 'created_at',
].join(',')

export async function dalGetOrganizationById({ organizationId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const { data, error } = await getVportClient()
    .from('organizations')
    .select(ORG_SELECT)
    .eq('id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalGetOrganizationBySlug({ slug }) {
  if (!slug) throw new Error('[BookingEngine] slug is required')
  const { data, error } = await getVportClient()
    .from('organizations')
    .select(ORG_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListOrganizationsByOwnerActor({ ownerActorId, includeInactive = false }) {
  if (!ownerActorId) throw new Error('[BookingEngine] ownerActorId is required')
  let query = getVportClient()
    .from('organizations')
    .select(ORG_SELECT)
    .eq('owner_actor_id', ownerActorId)
    .order('created_at', { ascending: true })
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalGetOrganizationMember({ organizationId, actorId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  const { data, error } = await getVportClient()
    .from('organization_members')
    .select(ORG_MEMBER_SELECT)
    .eq('organization_id', organizationId)
    .eq('actor_id', actorId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListOrganizationMembers({ organizationId, status = null }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  let query = getVportClient()
    .from('organization_members')
    .select(ORG_MEMBER_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalGetOrganizationProfileByProfile({ organizationId, profileId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!profileId) throw new Error('[BookingEngine] profileId is required')
  const { data, error } = await getVportClient()
    .from('organization_profiles')
    .select(ORG_PROFILE_SELECT)
    .eq('organization_id', organizationId)
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function dalListOrganizationProfilesByOrg({ organizationId }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const { data, error } = await getVportClient()
    .from('organization_profiles')
    .select(ORG_PROFILE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export async function dalGetPrimaryOrganizationByProfile({ profileId }) {
  if (!profileId) throw new Error('[BookingEngine] profileId is required')
  const { data, error } = await getVportClient()
    .from('organization_profiles')
    .select(`${ORG_PROFILE_SELECT},organizations(${ORG_SELECT})`)
    .eq('profile_id', profileId)
    .eq('relation_type', 'primary')
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
