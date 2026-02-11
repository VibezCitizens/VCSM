// src/features/wanders/core/dal/read/replies.read.dal.js
// ============================================================================
// WANDERS DAL — REPLIES (READ)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "replies";

const COLS = [
  "id",
  "card_id",
  "created_at",
  "deleted_at",
  "is_deleted",
  "author_actor_id",
  "author_user_id",
  "body",
  "body_ciphertext",
  "body_nonce",
  "body_alg",
].join(",");

/**
 * List replies by card id.
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listWandersRepliesByCardId(input) {
  const supabase = getWandersSupabase();

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("card_id", input.cardId)
    .order("created_at", { ascending: true });

  if (input.limit) q = q.limit(input.limit);

  const { data, error } = await q;

  if (error) throw error;
  return data ?? [];
}
