// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersClaims.dal.js
// ============================================================================
// WANDERS DAL — CLAIMS
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'claims'

const COLS = [
  'id',
  'anon_id',
  'actor_id',
  'claimed_sender',
  'claimed_recipient',
  'created_at',
].join(',')

/**
 * Insert claim row.
 * @param {{
 *   anonId: string,
 *   actorId: string,
 *   claimedSender?: boolean,
 *   claimedRecipient?: boolean
 * }} input
 */
export async function createWandersClaim(input) {
  const supabase = getWandersSupabase()

  const payload = {
    anon_id: input.anonId,
    actor_id: input.actorId,
    claimed_sender: input.claimedSender ?? false,
    claimed_recipient: input.claimedRecipient ?? false,
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
 * Read claim by id.
 * @param {string} claimId uuid
 */
export async function getWandersClaimById(claimId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', claimId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * List claims by anon_id.
 * @param {{ anonId: string, limit?: number }} input
 */
export async function listWandersClaimsByAnonId(input) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('anon_id', input.anonId)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 50)

  if (error) throw error
  return data ?? []
}

/**
 * List claims by actor_id.
 * @param {{ actorId: string, limit?: number }} input
 */
export async function listWandersClaimsByActorId(input) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('actor_id', input.actorId)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 50)

  if (error) throw error
  return data ?? []
}

/**
 * Update claim row by id.
 * @param {{
 *   claimId: string,
 *   claimedSender?: boolean,
 *   claimedRecipient?: boolean
 * }} input
 */
export async function updateWandersClaim(input) {
  const supabase = getWandersSupabase()

  const patch = {}

  if (input.claimedSender !== undefined) patch.claimed_sender = input.claimedSender
  if (input.claimedRecipient !== undefined) patch.claimed_recipient = input.claimedRecipient

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.claimId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Delete claim row by id.
 * @param {string} claimId uuid
 */
export async function deleteWandersClaim(claimId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .delete()
    .eq('id', claimId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}
