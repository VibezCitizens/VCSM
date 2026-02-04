// src/season/lovedrop/dal/lovedropCards.dal.js
import { getLovedropSupabase } from '@/season/lovedrop/services/lovedropSupabaseClient'

const SCHEMA = 'vc'
const TABLE = 'lovedrop_cards'

const COLS = [
  'id',
  'public_id',
  'realm_id',
  'created_at',
  'updated_at',
  'status',
  'sent_at',
  'expires_at',
  'sender_actor_id',
  'sender_anon_id',
  'recipient_actor_id',
  'recipient_anon_id',
  'recipient_email',
  'recipient_phone',
  'recipient_channel',
  'is_anonymous',
  'message_text',
  'message_ciphertext',
  'message_nonce',
  'message_alg',
  'template_key',
  'customization',
  'opened_at',
  'last_opened_at',
  'open_count',
  'sender_claim_token',
  'recipient_claim_token',
  'is_void',
].join(',')

export async function createLovedropCard(row) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getLovedropCardByPublicId(publicId) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('public_id', publicId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getLovedropCardById(cardId) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', cardId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function patchLovedropCard(cardId, patch) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', cardId)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function recordLovedropOpenAtomic(input) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .rpc('lovedrop_record_open', {
      p_public_id: input.publicId,
      p_anon_id: input.anonId,
    })

  if (error) throw error
  return data
}

export async function getLovedropCardByPublicIdRpc(publicId) {
  const supabase = getLovedropSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .rpc('lovedrop_get_card_by_public_id', {
      p_public_id: publicId,
    })

  if (error) throw error
  return data?.[0] ?? null
}
