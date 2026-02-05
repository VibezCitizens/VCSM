// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersCardKeys.dal.js
// ============================================================================
// WANDERS DAL — CARD KEYS
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'card_keys'

const COLS = [
  'card_id',
  'wrapped_key',
  'alg',
  'created_at',
].join(',')

/**
 * Insert card key row.
 * @param {{
 *   cardId: string,
 *   wrappedKey: string,
 *   alg?: string
 * }} input
 */
export async function createWandersCardKey(input) {
  const supabase = getWandersSupabase()

  const payload = {
    card_id: input.cardId,
    wrapped_key: input.wrappedKey,
    alg: input.alg ?? 'xchacha20poly1305',
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
 * Read card key by card_id.
 * @param {string} cardId uuid
 */
export async function getWandersCardKeyByCardId(cardId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('card_id', cardId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Update card key row by card_id.
 * NOTE: raw patch — caller must provide valid snake_case or mapped fields here.
 * @param {{
 *   cardId: string,
 *   wrappedKey?: string,
 *   alg?: string
 * }} input
 */
export async function updateWandersCardKey(input) {
  const supabase = getWandersSupabase()

  const patch = {}

  if (input.wrappedKey !== undefined) patch.wrapped_key = input.wrappedKey
  if (input.alg !== undefined) patch.alg = input.alg

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('card_id', input.cardId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Delete card key row by card_id.
 * @param {string} cardId uuid
 */
export async function deleteWandersCardKey(cardId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .delete()
    .eq('card_id', cardId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}
