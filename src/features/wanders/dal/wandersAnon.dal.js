// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersAnon.dal.js
// ============================================================================
// WANDERS DAL — ANON IDENTITIES
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'anon_identities'

const COLS = [
  'id',
  'created_at',
  'last_seen_at',
  'user_agent_hash',
  'ip_hash',
  'device_hash',
  'client_key',
].join(',')

/**
 * Create an anon identity row.
 * @param {{ userAgentHash?: string|null, ipHash?: string|null, deviceHash?: string|null, clientKey?: string|null }} input
 */
export async function createWandersAnonIdentity(input = {}) {
  const supabase = getWandersSupabase()

  const payload = {
    user_agent_hash: input.userAgentHash ?? null,
    ip_hash: input.ipHash ?? null,
    device_hash: input.deviceHash ?? null,
    client_key: input.clientKey ?? null,
  }

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)

  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Read anon identity by id.
 * @param {string} anonId uuid
 */
export async function getWandersAnonIdentityById(anonId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', anonId)
    .limit(1)

  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Touch last_seen_at (and optionally refresh hashes).
 * @param {{ anonId: string, userAgentHash?: string|null, ipHash?: string|null, deviceHash?: string|null }} input
 */
export async function touchWandersAnonIdentity(input) {
  const supabase = getWandersSupabase()

  const patch = {
    last_seen_at: new Date().toISOString(),
  }

  if (input.userAgentHash !== undefined) patch.user_agent_hash = input.userAgentHash
  if (input.ipHash !== undefined) patch.ip_hash = input.ipHash
  if (input.deviceHash !== undefined) patch.device_hash = input.deviceHash

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.anonId)
    .select(COLS)

  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Lookup anon identity by client_key (optional strategy if you use localStorage stable key).
 * @param {string} clientKey
 */
export async function getWandersAnonIdentityByClientKey(clientKey) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('client_key', clientKey)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] ?? null
}
