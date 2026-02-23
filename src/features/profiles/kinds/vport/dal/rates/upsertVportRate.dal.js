// src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js

import supabase from "@/services/supabase/supabaseClient";

/**
 * DAL: upsert rate row (raw).
 * - explicit projection
 * - returns raw row exactly as stored
 * - no mapping, no permissions logic
 */
export default async function upsertVportRateDal({
  actorId,
  rateType = "fx",
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  meta = null,
} = {}) {
  if (!actorId) throw new Error("upsertVportRateDal: actorId is required");
  if (!baseCurrency) throw new Error("upsertVportRateDal: baseCurrency is required");
  if (!quoteCurrency) throw new Error("upsertVportRateDal: quoteCurrency is required");

  // adjust conflict columns to your DB unique constraint
  const { data, error } = await supabase
    .schema("vc")
    .from("vport_rates")
    .upsert(
      {
        actor_id: actorId,
        rate_type: rateType,
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        buy_rate: buyRate,
        sell_rate: sellRate,
        meta: meta,
      },
      {
        onConflict: "actor_id,rate_type,base_currency,quote_currency",
      }
    )
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
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}