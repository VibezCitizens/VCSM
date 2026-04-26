import { getVportClient } from '../config.js'

export async function dalInsertOrganization({ ownerActorId, name, slug, organizationType = 'business', meta = null }) {
  if (!ownerActorId) throw new Error('[BookingEngine] ownerActorId is required')
  if (!name) throw new Error('[BookingEngine] name is required')
  if (!slug) throw new Error('[BookingEngine] slug is required')

  const { data, error } = await getVportClient()
    .from('organizations')
    .insert({
      owner_actor_id: ownerActorId,
      name,
      slug,
      organization_type: organizationType,
      is_active: true,
      meta: meta ?? null,
    })
    .select('id,owner_actor_id,name,slug,organization_type,is_active,meta,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpdateOrganization({ organizationId, patch }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const allowed = ['name', 'slug', 'organization_type', 'is_active', 'meta']
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)))
  const { data, error } = await getVportClient()
    .from('organizations')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', organizationId)
    .select('id,owner_actor_id,name,slug,organization_type,is_active,meta,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpsertOrganizationMember({ organizationId, actorId, role, status = 'active' }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  if (!role) throw new Error('[BookingEngine] role is required')

  const { data, error } = await getVportClient()
    .from('organization_members')
    .upsert(
      { organization_id: organizationId, actor_id: actorId, role, status, updated_at: new Date().toISOString() },
      { onConflict: 'organization_id,actor_id' }
    )
    .select('id,organization_id,actor_id,role,status,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpdateOrganizationMemberStatus({ organizationId, actorId, status }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!actorId) throw new Error('[BookingEngine] actorId is required')
  const { data, error } = await getVportClient()
    .from('organization_members')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('actor_id', actorId)
    .select('id,organization_id,actor_id,role,status,created_at,updated_at')
    .single()
  if (error) throw error
  return data
}

export async function dalUpsertOrganizationProfile({ organizationId, profileId, relationType }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  if (!profileId) throw new Error('[BookingEngine] profileId is required')
  if (!relationType) throw new Error('[BookingEngine] relationType is required')

  const { data, error } = await getVportClient()
    .from('organization_profiles')
    .upsert(
      { organization_id: organizationId, profile_id: profileId, relation_type: relationType },
      { onConflict: 'organization_id,profile_id' }
    )
    .select('organization_id,profile_id,relation_type,created_at')
    .single()
  if (error) throw error
  return data
}
