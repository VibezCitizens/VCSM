// src/features/wanders/core/dal/read/cardKeys.read.dal.js
// ============================================================================
// WANDERS DAL — CARD KEYS (READ)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "card_keys";

const COLS = ["card_id", "wrapped_key", "alg", "created_at"].join(",");

/**
 * Read card key by card id.
 * @param {{ cardId: string }} input
 */
export async function getWandersCardKeyByCardId(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("card_id", input.cardId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
