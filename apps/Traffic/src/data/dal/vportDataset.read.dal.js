import { getSupabaseClient } from "@/data/connectors/supabase.client";
import { shouldRequireLiveProviderIndex } from "@/lib/env";

const PROVIDER_INDEX_PROJECTION = [
  "id",
  "source",
  "source_id",
  "slug",
  "display_name",
  "business_type",
  "service_id",
  "service_slug",
  "service_name",
  "country_code",
  "state_code",
  "city_name",
  "city_slug",
  "zip_code",
  "address_text",
  "lat",
  "lng",
  "phone",
  "website_url",
  "instagram_url",
  "facebook_url",
  "google_maps_url",
  "avatar_url",
  "banner_url",
  "logo_url",
  "hours",
  "claim_status",
  "is_active",
  "is_indexable",
  "created_at",
  "updated_at"
].join(", ");

let loggedVportDatasetError = false;

// Supabase caps an unbounded select at ~1,000 rows, which silently truncated the
// provider index. We page through the view with explicit .range() windows.
// PAGE_SIZE matches Supabase's default max-rows so a full window means "more may
// remain"; a short window means we have reached the end. MAX_PAGES is a defensive
// stop far beyond the 1M-provider target (5,000 pages = 5M rows).
const PROVIDER_INDEX_PAGE_SIZE = 1000;
const PROVIDER_INDEX_MAX_PAGES = 5000;

function normalizeCountryCode(value) {
  const countryCode = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

export async function readPublicTrazeProviderIndexRows(options = {}) {
  const client = getSupabaseClient();
  if (!client) {
    if (shouldRequireLiveProviderIndex()) {
      throw new Error(
        "Traffic build requires Supabase provider index access. Set SUPABASE_URL and SUPABASE_ANON_KEY, or set TRAFFIC_ALLOW_EMPTY_PROVIDER_INDEX=true."
      );
    }
    return null;
  }

  const countryCode = normalizeCountryCode(options.countryCode);

  // A fresh query per page. Ordering is a strict total order
  // (created_at DESC, id ASC) — id is the unique view key, so range windows never
  // overlap or skip rows even when created_at values tie (e.g. batch-seeded rows).
  const buildPageQuery = (from, to) => {
    let query = client
      .schema("vport")
      .from("public_traze_provider_index_v")
      .select(PROVIDER_INDEX_PROJECTION)
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    return query;
  };

  const rows = [];
  let from = 0;
  let page = 0;
  let lastBatchSize = PROVIDER_INDEX_PAGE_SIZE;

  while (lastBatchSize === PROVIDER_INDEX_PAGE_SIZE && page < PROVIDER_INDEX_MAX_PAGES) {
    const to = from + PROVIDER_INDEX_PAGE_SIZE - 1;
    const { data, error } = await buildPageQuery(from, to);

    if (error) {
      if (!loggedVportDatasetError) {
        loggedVportDatasetError = true;
        console.error("[vportDataset] public_traze_provider_index_v query failed:", error.message);
      }
      if (shouldRequireLiveProviderIndex()) {
        throw new Error(`Traffic build could not read public_traze_provider_index_v: ${error.message}`);
      }
      return null;
    }

    const batch = data ?? [];
    rows.push(...batch);
    lastBatchSize = batch.length;
    from += PROVIDER_INDEX_PAGE_SIZE;
    page += 1;
  }

  if (lastBatchSize === PROVIDER_INDEX_PAGE_SIZE && page >= PROVIDER_INDEX_MAX_PAGES) {
    console.warn(
      `[vportDataset] provider index pagination hit the ${PROVIDER_INDEX_MAX_PAGES}-page safety cap; ` +
        `loaded ${rows.length} rows — output may be truncated.`
    );
  }

  console.info(
    `[vportDataset] loaded ${rows.length} provider index rows` +
      `${countryCode ? ` for ${countryCode}` : ""} across ${page} page(s).`
  );

  return rows;
}
