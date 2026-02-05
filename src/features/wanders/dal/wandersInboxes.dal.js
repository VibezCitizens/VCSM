// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersInboxes.dal.js
// ============================================================================
// WANDERS DAL — INBOXES
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'inboxes'

const COLS = [
  'id',
  'public_id',
  'realm_id',
  'owner_actor_id',
  'owner_anon_id',
  'is_active',
  'accepts_anon',
  'default_folder',
  'created_at',
  'updated_at',
].join(',')

/**
 * Create an inbox row.
 * @param {{ publicId: string, realmId: string, ownerActorId?: string|null, ownerAnonId?: string|null, isActive?: boolean, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests' }} input
 */
export async function createWandersInbox(input) {
  const supabase = getWandersSupabase()

  const payload = {
    public_id: input.publicId,
    realm_id: input.realmId,
    owner_actor_id: input.ownerActorId ?? null,
    owner_anon_id: input.ownerAnonId ?? null,
    is_active: input.isActive ?? true,
    accepts_anon: input.acceptsAnon ?? true,
    default_folder: input.defaultFolder ?? 'inbox',
  }

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Read inbox by id.
 * @param {string} inboxId uuid
 */
export async function getWandersInboxById(inboxId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', inboxId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Read inbox by public_id.
 * @param {string} publicId
 */
export async function getWandersInboxByPublicId(publicId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('public_id', publicId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * List inboxes by owner_actor_id.
 * @param {{ ownerActorId: string, isActive?: boolean|null, limit?: number }} input
 */
export async function listWandersInboxesByOwnerActorId(input) {
  const supabase = getWandersSupabase()

  let q = supabase.schema(SCHEMA).from(TABLE).select(COLS).eq('owner_actor_id', input.ownerActorId)

  if (input.isActive !== undefined && input.isActive !== null) q = q.eq('is_active', input.isActive)
  if (input.limit) q = q.limit(input.limit)

  const { data, error } = await q.order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * List inboxes by owner_anon_id.
 * @param {{ ownerAnonId: string, isActive?: boolean|null, limit?: number }} input
 */
export async function listWandersInboxesByOwnerAnonId(input) {
  const supabase = getWandersSupabase()

  let q = supabase.schema(SCHEMA).from(TABLE).select(COLS).eq('owner_anon_id', input.ownerAnonId)

  if (input.isActive !== undefined && input.isActive !== null) q = q.eq('is_active', input.isActive)
  if (input.limit) q = q.limit(input.limit)

  const { data, error } = await q.order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Update inbox by id (explicit patch).
 * @param {{ inboxId: string, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests', isActive?: boolean, ownerActorId?: string|null, ownerAnonId?: string|null }} input
 */
export async function updateWandersInbox(input) {
  const supabase = getWandersSupabase()

  const patch = {}

  if (input.acceptsAnon !== undefined) patch.accepts_anon = input.acceptsAnon
  if (input.defaultFolder !== undefined) patch.default_folder = input.defaultFolder
  if (input.isActive !== undefined) patch.is_active = input.isActive
  if (input.ownerActorId !== undefined) patch.owner_actor_id = input.ownerActorId
  if (input.ownerAnonId !== undefined) patch.owner_anon_id = input.ownerAnonId

  // keep raw db column naming
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.inboxId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}
