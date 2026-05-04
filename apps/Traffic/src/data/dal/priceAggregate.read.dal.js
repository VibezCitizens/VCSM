import { getSupabaseClient } from "@/data/connectors/supabase.client";

let loggedError = false;

/**
 * Fetches all service rows with a non-null price from Supabase.
 * Used at build time to compute market price percentiles per (cityId, serviceId).
 *
 * @returns {Promise<Array<{profile_id: string, key: string, price_cents: number, currency_code: string}>>}
 */
export async function readAllServicePriceRows() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .schema("vport")
      .from("public_provider_services_v")
      .select("profile_id, key, price_cents, currency_code")
      .not("price_cents", "is", null);

    if (error) {
      if (process.env.NODE_ENV !== "production" && !loggedError) {
        loggedError = true;
        console.warn("[priceAggregate] Query failed:", error.message);
      }
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}
