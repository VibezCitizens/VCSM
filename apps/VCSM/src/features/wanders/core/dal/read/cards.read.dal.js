// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\read\cards.read.dal.js
// ============================================================================
// WANDERS DAL — CARDS (READ)
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

  "is_void",
].join(",");

/**
 * Read by card id.
 * @param {{ cardId: string }} input
 */
export async function getWandersCardById(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("id", input.cardId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Read by public_id.
 * @param {{ publicId: string }} input
 */
export async function getWandersCardByPublicId(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("public_id", input.publicId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * List cards by inbox_id.
 * @param {{ inboxId: string, limit?: number }} input
 */
export async function listWandersCardsByInboxId(input) {
  const supabase = getWandersSupabase();

  const limit = input?.limit ?? 50;

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("inbox_id", input.inboxId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
