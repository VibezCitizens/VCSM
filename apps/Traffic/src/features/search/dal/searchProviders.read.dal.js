import { createClient } from "@supabase/supabase-js";

// Browser-safe public provider search. Traffic ships as a static export, so
// search runs at runtime in the visitor's browser using the public anon key —
// the same pattern as features/answers/dal/publishedQuestions.read.dal.js.
//
// The traffic.search_public_providers() RPC returns ONLY public provider fields
// and is bounded server-side (limit capped at 50; requires a query or a
// location filter so it can never dump the full corpus).

// Mirror the deployed RPC's server-side guards so we never send out-of-range
// input (traffic.search_public_providers caps query at 120 chars, limit at 50,
// and offset at 100000).
const MAX_QUERY_LENGTH = 120;
const MAX_LIMIT = 50;
const MAX_OFFSET = 100000;

let cachedClient = null;

function getSearchReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-traze-search-read-${url.slice(-8)}`
    }
  });

  return cachedClient;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Search public providers via the Postgres-backed RPC.
 *
 * Always resolves (never throws) so the public /search page degrades
 * gracefully: returns { data: [], total: 0, error } when the client, env, or
 * RPC is unavailable (e.g. before the DB migration is deployed).
 *
 * @param {Object} args
 * @param {string} args.query
 * @param {string|null} [args.countryCode]
 * @param {string|null} [args.citySlug]
 * @param {number|null} [args.lat]
 * @param {number|null} [args.lng]
 * @param {number} [args.limit]
 * @param {number} [args.offset]
 * @returns {Promise<{ data: Array<object>, total: number, error: Error|null }>}
 */
export async function searchPublicProviders({
  query = "",
  countryCode = null,
  citySlug = null,
  lat = null,
  lng = null,
  limit = 20,
  offset = 0
} = {}) {
  const client = getSearchReadClient();
  if (!client) {
    return { data: [], total: 0, error: new Error("Search is not available.") };
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), MAX_LIMIT);
  const safeOffset = Math.min(Math.max(Number(offset) || 0, 0), MAX_OFFSET);
  const safeQuery = String(query ?? "").trim().slice(0, MAX_QUERY_LENGTH) || null;

  const { data, error } = await client.schema("traffic").rpc("search_public_providers", {
    p_query: safeQuery,
    p_country_code: countryCode ? String(countryCode).trim().toUpperCase() : null,
    p_city_slug: citySlug ? String(citySlug).trim().toLowerCase() : null,
    p_lat: toNullableNumber(lat),
    p_lng: toNullableNumber(lng),
    p_limit: safeLimit,
    p_offset: safeOffset
  });

  if (error) {
    return { data: [], total: 0, error };
  }

  const rows = Array.isArray(data) ? data : [];
  const total = rows.length ? Number(rows[0].total_count ?? rows.length) : 0;

  return { data: rows, total, error: null };
}
