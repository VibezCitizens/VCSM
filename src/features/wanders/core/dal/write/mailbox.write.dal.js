// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\write\mailbox.write.dal.js
// ============================================================================
// WANDERS DAL — MAILBOX ITEMS (WRITE)
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
 * Create mailbox item.
 * @param {{
 *  cardId: string,
 *  ownerActorId?: string|null,
 *  ownerUserId?: string|null,
 *  ownerRole: "sender"|"recipient",
 *  folder?: string,
 *  pinned?: boolean,
 *  archived?: boolean,
 *  isRead?: boolean,
 *  readAt?: string|null,
 * }} input
 */
export async function createWandersMailboxItem(input) {
  const supabase = getWandersSupabase();

  const payload = {
    card_id: input.cardId,
    owner_actor_id: input.ownerActorId ?? null,
    owner_user_id: input.ownerUserId ?? null,
    owner_role: input.ownerRole,
    folder: input.folder ?? "inbox",
    pinned: input.pinned ?? false,
    archived: input.archived ?? false,
    is_read: input.isRead ?? false,
    read_at: input.readAt ?? null,
  };

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS_WITH_CARD)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update mailbox item.
 * @param {{
 *  itemId: string,
 *  folder?: string,
 *  pinned?: boolean,
 *  archived?: boolean,
 *  isRead?: boolean,
 *  readAt?: string|null,
 * }} input
 */
export async function updateWandersMailboxItem(input) {
  const supabase = getWandersSupabase();

  const patch = {};

  if (input.folder !== undefined) patch.folder = input.folder;
  if (input.pinned !== undefined) patch.pinned = input.pinned;
  if (input.archived !== undefined) patch.archived = input.archived;
  if (input.isRead !== undefined) patch.is_read = input.isRead;
  if (input.readAt !== undefined) patch.read_at = input.readAt;

  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("id", input.itemId)
    .select(COLS_WITH_CARD)
    .maybeSingle();

  if (error) throw error;
  return data;
}
