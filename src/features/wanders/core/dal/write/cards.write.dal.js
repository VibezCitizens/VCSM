// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\write\cards.write.dal.js
// ============================================================================
// WANDERS DAL — CARDS (WRITE)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "cards";

const COLS = [
  "id",
  "public_id",
  "realm_id",
  "inbox_id",
  "drop_link_id",
  "created_at",
  "updated_at",
  "status",
  "sent_at",
  "expires_at",

  "sender_actor_id",
  "sender_user_id",
  "recipient_actor_id",
  "recipient_user_id",

  "recipient_channel",
  "recipient_email",
  "recipient_phone",

  "is_anonymous",

  "message_text",
  "message_ciphertext",
  "message_nonce",
  "message_alg",

  "template_key",
  "customization",

  "opened_at",
  "last_opened_at",
  "open_count",

  "sender_claim_token",
  "recipient_claim_token",

  "is_void",
].join(",");

/**
 * Insert a card row.
 * Raw rows only; callers must pass snake_case fields matching DB.
 *
 * @param {Record<string, any>} payload
 */
export async function createWandersCard(payload) {
  const supabase = getWandersSupabase();

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
 * Update card by id.
 * Contract: raw rows only.
 *
 * IMPORTANT: patch keys must be DB column names (snake_case).
 *
 * NOTE:
 * Do NOT use maybeSingle() here. If RLS blocks update, PostgREST returns 0 rows.
 * maybeSingle() can throw 406 (object mode).
 *
 * @param {{ cardId: string, patch: Record<string, any> }} input
 */
export async function updateWandersCard(input) {
  const supabase = getWandersSupabase();

  const patch = input?.patch ?? {};

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("id", input.cardId)
    .select(COLS);

  if (error) throw error;
  return data && data.length ? data[0] : null;
}
