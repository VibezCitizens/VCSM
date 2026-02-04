// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\dal\lovedropReplies.dal.js
// ============================================================================
// LOVE DROP DAL — REPLIES
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================
import { supabase } from '@/services/supabase/supabaseClient'

const SCHEMA = 'vc'
const TABLE = 'lovedrop_replies'

const COLS = [
  'id',
  'card_id',
  'created_at',
  'deleted_at',
  'author_actor_id',
  'author_anon_id',
  'body',
  'body_ciphertext',
  'body_nonce',
  'body_alg',
  'is_deleted',
].join(',')

/**
 * Insert a reply row.
 * @param {{
 *  cardId: string,
 *  authorActorId?: string|null,
 *  authorAnonId?: string|null,
 *  body?: string|null,
 *  bodyCiphertext?: string|null,
 *  bodyNonce?: string|null,
 *  bodyAlg?: string|null
 * }} input
 */
export async function createLovedropReply(input) {
  const row = {
    card_id: input.cardId,
    author_actor_id: input.authorActorId ?? null,
    author_anon_id: input.authorAnonId ?? null,

    body: input.body ?? null,
    body_ciphertext: input.bodyCiphertext ?? null,
    body_nonce: input.bodyNonce ?? null,
    body_alg: input.bodyAlg ?? 'xchacha20poly1305',

    is_deleted: false,
  }

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * List replies for a card (latest first).
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listLovedropRepliesByCardId(input) {
  const limit = input.limit ?? 50

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('card_id', input.cardId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
