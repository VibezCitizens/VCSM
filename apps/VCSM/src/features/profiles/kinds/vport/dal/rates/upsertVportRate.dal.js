// src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js

import vportSchema from "@/services/supabase/vportClient";

const RATES_SELECT =
  "id,profile_id,rate_type,base_currency,quote_currency,buy_rate,sell_rate,meta,updated_at,created_at";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export default async function upsertVportRateDal({
  actorId,
  rateType = "fx",
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
  meta = {},
} = {}) {
  if (!actorId) throw new Error("upsertVportRateDal: actorId is required");
  if (!baseCurrency) throw new Error("upsertVportRateDal: baseCurrency is required");
  if (!quoteCurrency) throw new Error("upsertVportRateDal: quoteCurrency is required");

  const profileId = await resolveProfileId(actorId);
  if (!profileId) return null;

  const { data, error } = await vportSchema
    .from("rates")
    .upsert(
      {
        profile_id: profileId,
        rate_type: rateType,
        base_currency: baseCurrency,
        quote_currency: quoteCurrency,
        buy_rate: buyRate,
        sell_rate: sellRate,
        meta: meta ?? {},
      },
      { onConflict: "profile_id,rate_type,base_currency,quote_currency" }
    )
    .select(RATES_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
