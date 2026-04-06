// ============================================================================
// WANDERS DAL — CARD EVENTS (WRITE)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "card_events";

const COLS = [
  "id",
  "card_id",
  "created_at",
  "actor_id",
  "user_id",
  "event_type",
  "meta",
].join(",");

/**
 * Create a card event.
 * @param {{
 *  cardId: string,
 *  actorId?: string|null,
 *  userId?: string|null,
 *  eventType: string,
 *  meta?: any
 * }} input
 */
export async function createWandersCardEvent(input) {
  const supabase = getWandersSupabase();

  const payload = {
    card_id: input.cardId,
    actor_id: input.actorId ?? null,
    user_id: input.userId ?? null,
    event_type: input.eventType,
    meta: input.meta ?? {},
  };

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
