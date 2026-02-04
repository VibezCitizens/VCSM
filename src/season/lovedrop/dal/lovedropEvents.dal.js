// src/season/lovedrop/dal/lovedropEvents.dal.js
import { getLovedropSupabase } from '@/season/lovedrop/services/lovedropSupabaseClient'

const SCHEMA = 'vc'
const TABLE = 'lovedrop_card_events'

const COLS = [
  'id',
  'card_id',
  'created_at',
  'actor_id',
  'anon_id',
  'event_type',
  'meta',
].join(',')

export async function insertLovedropCardEvent(input) {
  const supabase = getLovedropSupabase()

  const row = {
    card_id: input.cardId,
    actor_id: input.actorId ?? null,
    anon_id: input.anonId ?? null,
    event_type: input.eventType,
    meta: input.meta ?? {},
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

export async function listLovedropCardEventsByCardId(input) {
  const supabase = getLovedropSupabase()
  const limit = input.limit ?? 50

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('card_id', input.cardId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
