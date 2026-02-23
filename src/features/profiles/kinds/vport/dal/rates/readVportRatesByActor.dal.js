// src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js

// IMPORTANT: use your existing Supabase client import path.
// Replace the line below with whatever your app already uses elsewhere.
import supabase from "@/services/supabase/supabaseClient";

/**
 * DAL: read rates by actor + rateType
 * - vc schema
 * - explicit projection (no select('*'))
 * - returns raw rows exactly as stored
 */
export default async function readVportRatesByActorDal({
  actorId,
  rateType = "fx",
} = {}) {
  if (!actorId) {
    throw new Error("readVportRatesByActorDal: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_rates")
    .select(
      [
        "id",
        "actor_id",
        "rate_type",
        "base_currency",
        "quote_currency",
        "buy_rate",
        "sell_rate",
        "meta",
        "updated_at",
        "created_at",
      ].join(",")
    )
    .eq("actor_id", actorId)
    .eq("rate_type", rateType)
    .order("base_currency", { ascending: true })
    .order("quote_currency", { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}