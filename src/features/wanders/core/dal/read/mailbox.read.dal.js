// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\read\mailbox.read.dal.js
// ============================================================================
// WANDERS DAL — MAILBOX ITEMS (READ)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "mailbox_items";

const COLS = [
  "id",
  "card_id",
  "owner_actor_id",
  "owner_user_id",
  "owner_role",
  "folder",
  "pinned",
  "archived",
  "is_read",
  "read_at",
  "created_at",
  "updated_at",
].join(",");

const CARD_COLS = [
  "id",
  "public_id",
  "realm_id",
  "inbox_id",
  "drop_link_id",
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
  "created_at",
  "updated_at",
].join(",");

const COLS_WITH_CARD = `${COLS},card:cards(${CARD_COLS})`;

/**
 * Get mailbox item by id (with joined card).
 * @param {{ itemId: string }} input
 */
export async function getWandersMailboxItemById(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq("id", input.itemId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * List mailbox items for an owner_user_id (with joined card).
 * @param {{
 *  ownerUserId: string,
 *  folder?: string|null,
 *  ownerRole?: string|null,
 *  limit?: number
 * }} input
 */
export async function listWandersMailboxItemsByOwnerUserId(input) {
  const supabase = getWandersSupabase();

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq("owner_user_id", input.ownerUserId);

  if (input.folder) q = q.eq("folder", input.folder);
  if (input.ownerRole) q = q.eq("owner_role", input.ownerRole);
  if (input.limit) q = q.limit(input.limit);

  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * List mailbox items for an owner_actor_id (with joined card).
 * Keep this for actor-owned mailboxes (optional).
 * @param {{
 *  ownerActorId: string,
 *  folder?: string|null,
 *  ownerRole?: string|null,
 *  limit?: number
 * }} input
 */
export async function listWandersMailboxItemsByOwnerActorId(input) {
  const supabase = getWandersSupabase();

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq("owner_actor_id", input.ownerActorId);

  if (input.folder) q = q.eq("folder", input.folder);
  if (input.ownerRole) q = q.eq("owner_role", input.ownerRole);
  if (input.limit) q = q.limit(input.limit);

  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get mailbox item by card + owner_user_id + owner_role.
 * @param {{ cardId: string, ownerUserId: string, ownerRole: string }} input
 */
export async function getWandersMailboxItemByCardAndOwnerUserRole(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_WITH_CARD)
    .eq("card_id", input.cardId)
    .eq("owner_user_id", input.ownerUserId)
    .eq("owner_role", input.ownerRole)
    .maybeSingle();

  if (error) throw error;
  return data;
}
