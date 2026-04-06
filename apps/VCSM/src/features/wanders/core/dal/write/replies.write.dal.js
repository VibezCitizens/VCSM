// src/features/wanders/core/dal/write/replies.write.dal.js
// ============================================================================
// WANDERS DAL — REPLIES (WRITE)
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
 * Create reply.
 * @param {{
 *  cardId: string,
 *  authorActorId?: string|null,
 *  authorUserId?: string|null,
 *  body?: string|null,
 *  bodyCiphertext?: string|null,
 *  bodyNonce?: string|null,
 *  bodyAlg?: string
 * }} input
 */
export async function createWandersReply(input) {
  const supabase = getWandersSupabase();

  const payload = {
    card_id: input.cardId,
    author_actor_id: input.authorActorId ?? null,
    author_user_id: input.authorUserId ?? null,
    body: input.body ?? null,
    body_ciphertext: input.bodyCiphertext ?? null,
    body_nonce: input.bodyNonce ?? null,
    body_alg: input.bodyAlg ?? "xchacha20poly1305",
  };

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update reply (soft-delete / undelete).
 * @param {{ replyId: string, isDeleted?: boolean, deletedAt?: string|null }} input
 */
export async function updateWandersReply(input) {
  const supabase = getWandersSupabase();

  const patch = {};
  if (input.isDeleted !== undefined) patch.is_deleted = input.isDeleted;
  if (input.deletedAt !== undefined) patch.deleted_at = input.deletedAt;

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("id", input.replyId)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data;
}
