// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersReplies.dal.js
// ============================================================================
// WANDERS DAL — REPLIES
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'replies'

const COLS = [
  'id',
  'card_id',
  'created_at',
  'deleted_at',
  'is_deleted',
  'author_actor_id',
  'author_anon_id',
  'body',
  'body_ciphertext',
  'body_nonce',
  'body_alg',
].join(',')

/**
 * Create reply.
 * @param {{
 *  cardId: string,
 *  authorActorId?: string|null,
 *  authorAnonId?: string|null,
 *  body?: string|null,
 *  bodyCiphertext?: string|null,
 *  bodyNonce?: string|null,
 *  bodyAlg?: string
 * }} input
 */
export async function createWandersReply(input) {
  const supabase = getWandersSupabase()

  const payload = {
    card_id: input.cardId,
    author_actor_id: input.authorActorId ?? null,
    author_anon_id: input.authorAnonId ?? null,
    body: input.body ?? null,
    body_ciphertext: input.bodyCiphertext ?? null,
    body_nonce: input.bodyNonce ?? null,
    body_alg: input.bodyAlg ?? 'xchacha20poly1305',
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
 * List replies by card id.
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listWandersRepliesByCardId(input) {
  const supabase = getWandersSupabase()

  let q = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('card_id', input.cardId)
    .order('created_at', { ascending: true })

  if (input.limit) q = q.limit(input.limit)

  const { data, error } = await q

  if (error) throw error
  return data ?? []
}

/**
 * Update reply (soft-delete / undelete).
 * @param {{ replyId: string, isDeleted?: boolean, deletedAt?: string|null }} input
 */
export async function updateWandersReply(input) {
  const supabase = getWandersSupabase()

  const patch = {}
  if (input.isDeleted !== undefined) patch.is_deleted = input.isDeleted
  if (input.deletedAt !== undefined) patch.deleted_at = input.deletedAt

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.replyId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}
