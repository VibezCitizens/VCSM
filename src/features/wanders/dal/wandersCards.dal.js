// src/features/wanders/dal/wandersCards.dal.js
// ============================================================================
// WANDERS DAL — CARDS
// Contract: raw rows only, explicit selects, no derived meaning.

// CAN BE DELETED LEGACY
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'cards'

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

  'recipient_channel',
  'recipient_email',
  'recipient_phone',

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
  'inbox_id',
].join(',')

// ----------------------------------------------------------------------------
// CREATE
// ----------------------------------------------------------------------------

/**
 * Insert a card row.
 * Raw rows only; callers must pass snake_case fields matching DB.
 */
export async function createWandersCard(payload) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

// ----------------------------------------------------------------------------
// READ
// ----------------------------------------------------------------------------

export async function getWandersCardById(cardId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', cardId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function getWandersCardByPublicId(publicId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('public_id', publicId)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function listWandersCardsByInboxId(input) {
  const supabase = getWandersSupabase()

  const limit = input?.limit ?? 50

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('inbox_id', input.inboxId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ----------------------------------------------------------------------------
// UPDATE
// ----------------------------------------------------------------------------

/**
 * Update card by id.
 * Contract: raw rows only.
 *
 * IMPORTANT: This expects patch keys are DB column names (snake_case).
 * Controllers should convert camelCase -> snake_case before calling OR
 * supply snake_case directly.
 *
 * NOTE:
 * Do NOT use maybeSingle() here. If RLS blocks the update, PostgREST returns 0 rows.
 * maybeSingle() forces object mode and will throw 406 Not Acceptable.
 */
export async function updateWandersCard(input) {
  const supabase = getWandersSupabase()

  const patch = input?.patch ?? {}

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq('id', input.cardId)
    .select(COLS)

  if (error) throw error
  return (data && data.length ? data[0] : null)
}
