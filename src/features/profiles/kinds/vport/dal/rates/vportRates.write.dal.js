import { supabase } from "@/services/supabase/supabaseClient";
// NOTE: adjust table/columns to your real schema.
// Common columns:
// id, actor_id, rate_type, base_currency, quote_currency, buy_rate, sell_rate, updated_at
export async function dalUpsertVportRateRow({
  actorId,
  rateType,
  baseCurrency,
  quoteCurrency,
  buyRate,
  sellRate,
} = {}) {
  const payload = {
    actor_id: actorId,
    rate_type: rateType,
    base_currency: baseCurrency,
    quote_currency: quoteCurrency,
    buy_rate: buyRate,
    sell_rate: sellRate,
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_rates")
    .upsert(payload, {
      // ✅ must match your unique constraint:
      // e.g. UNIQUE(actor_id, rate_type, base_currency, quote_currency)
      onConflict: "actor_id,rate_type,base_currency,quote_currency",
    })
    .select(
      "id, actor_id, rate_type, base_currency, quote_currency, buy_rate, sell_rate, updated_at"
    ) // ✅ explicit
    .maybeSingle();

  if (error) throw error;
  return data ?? null; // ✅ raw row
}