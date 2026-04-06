// ============================================================================
// WANDERS DAL — CARD EVENTS (READ)
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
 * Read card event by id.
 * @param {{ eventId: string }} input
 */
export async function getWandersCardEventById(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("id", input.eventId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * List events by card id.
 * @param {{ cardId: string, limit?: number }} input
 */
export async function listWandersCardEventsByCardId(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("card_id", input.cardId)
    .order("created_at", { ascending: true })
    .limit(input.limit ?? 200);

  if (error) throw error;
  return data ?? [];
}
