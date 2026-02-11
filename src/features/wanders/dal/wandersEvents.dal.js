// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\dal\wandersEvents.dal.js
// ============================================================================
// WANDERS DAL — CARD EVENTS
// Contract: raw rows only, explicit selects, no derived meaning.

// CAN BE DELETED LEGACY
// ============================================================================

import { getWandersSupabase } from '@/features/wanders/services/wandersSupabaseClient'

const SCHEMA = 'wanders'
const TABLE = 'card_events'

const COLS = ['id', 'card_id', 'created_at', 'actor_id', 'anon_id', 'event_type', 'meta'].join(',')

/**
 * Create a card event.
 * @param {{ cardId: string, actorId?: string|null, anonId?: string|null, eventType: string, meta?: any }} input
 */
export async function createWandersCardEvent(input) {
  const supabase = getWandersSupabase()

  const payload = {
    card_id: input.cardId,
    actor_id: input.actorId ?? null,
    anon_id: input.anonId ?? null,
    event_type: input.eventType,
    meta: input.meta ?? {},
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

export async function getWandersCardEventById(eventId) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('id', eventId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * List events by card id.
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listWandersCardEventsByCardId(input) {
  const supabase = getWandersSupabase()

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq('card_id', input.cardId)
    .order('created_at', { ascending: true })
    .limit(input.limit ?? 200)

  if (error) throw error
  return data ?? []
}
