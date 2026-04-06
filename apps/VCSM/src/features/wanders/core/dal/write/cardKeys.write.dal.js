// src/features/wanders/core/dal/write/cardKeys.write.dal.js
// ============================================================================
// WANDERS DAL — CARD KEYS (WRITE)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "card_keys";

const COLS = ["card_id", "wrapped_key", "alg", "created_at"].join(",");

/**
 * Create card key.
 * @param {{ cardId: string, wrappedKey: string, alg?: string }} input
 */
export async function createWandersCardKey(input) {
  const supabase = getWandersSupabase();

  const payload = {
    card_id: input.cardId,
    wrapped_key: input.wrappedKey,
    alg: input.alg ?? "xchacha20poly1305",
  };

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Update card key (by card_id).
 * @param {{ cardId: string, wrappedKey: string, alg?: string }} input
 */
export async function updateWandersCardKey(input) {
  const supabase = getWandersSupabase();

  const patch = {
    wrapped_key: input.wrappedKey,
  };
  if (input.alg !== undefined) patch.alg = input.alg;

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("card_id", input.cardId)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
