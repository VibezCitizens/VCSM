import { getSupabaseClient } from "@/data/connectors/supabase.client";

const CATEGORIES_SELECT = [
  "key",
  "label",
  "is_active"
].join(", ");

const TRAZE_VIEW_BASE_SELECT = [
  "id",
  "source",
  "source_id",
  "display_name",
  "slug",
  "business_type",
  "service_slug",
  "service_name",
  "avatar_url",
  "banner_url",
  "country_code",
  "state_code",
  "city_name",
  "city_slug",
  "zip_code",
  "address_text",
  "phone",
  "website_url",
  "claim_status",
  "is_active",
  "is_indexable",
  "created_at"
];

const TRAZE_VIEW_SELECT_CANDIDATES = [TRAZE_VIEW_BASE_SELECT.join(", ")];

let resolvedTrazeViewSelectIndex = null;

const LOGGED_ERRORS = new Set();

function logQueryErrorOnce(scope, error) {
  const message = `${scope}:${error?.message ?? "unknown"}`;
  if (LOGGED_ERRORS.has(message)) {
    return;
  }

  LOGGED_ERRORS.add(message);
  console.error(`[vportHomepage.read.dal] ${scope} query failed:`, error?.message ?? error);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCountryCode(value) {
  const countryCode = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function mapProfilesFromTrazeView(rows) {
  return toArray(rows)
    .map((row) => {
      const id = String(row?.id ?? "").trim();
      const slug = String(row?.slug ?? "").trim();
      if (!id || !slug) {
        return null;
      }

      return {
        id,
        actor_id: null,
        source: row?.source ?? null,
        source_id: row?.source_id ?? null,
        name: row?.display_name ?? slug,
        display_name: row?.display_name ?? slug,
        slug,
        avatar_url: row?.avatar_url ?? null,
        banner_url: row?.banner_url ?? null,
        is_active: row?.is_active !== false,
        is_deleted: false,
        created_at: row?.created_at ?? null
      };
    })
    .filter(Boolean);
}

async function readCategories(client) {
  const { data, error } = await client
    .schema("vport")
    .from("public_categories_v")
    .select(CATEGORIES_SELECT);

  if (error) {
    logQueryErrorOnce("public_categories_v", error);
    return { ok: false, rows: [] };
  }

  const rows = toArray(data).filter((row) => row?.is_active !== false);
  return { ok: true, rows };
}

async function readPublicTrazeProfilesView(client, options = {}) {
  let lastError = null;
  const countryCode = normalizeCountryCode(options.countryCode);

  const startIndex = resolvedTrazeViewSelectIndex ?? 0;
  for (let index = startIndex; index < TRAZE_VIEW_SELECT_CANDIDATES.length; index += 1) {
    const selectClause = TRAZE_VIEW_SELECT_CANDIDATES[index];
    let query = client
      .schema("vport")
      .from("public_traze_provider_index_v")
      .select(selectClause)
      .eq("is_active", true)
      .eq("is_indexable", true)
      .order("created_at", { ascending: false });

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    const { data, error } = await query;

    if (!error) {
      resolvedTrazeViewSelectIndex = index;
      return { ok: true, rows: toArray(data) };
    }

    lastError = error;
  }

  if (lastError) {
    logQueryErrorOnce("public_traze_provider_index_v", lastError);
  }

  return { ok: false, rows: [] };
}

/**
 * Reads homepage-safe directory rows with public-view-first behavior.
 * Private table reads are optional and should never block rendering.
 * Never throws so static export can gracefully fallback to mock content.
 */
export async function fetchVportHomepageRows(options = {}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      profiles: [],
      profilePublicDetails: [],
      profileCategories: [],
      categories: [],
      publicTrazeProfiles: [],
      status: {
        profiles: false,
        profilePublicDetails: false,
        profileCategories: false,
        categories: false,
        publicTrazeProfiles: false
      }
    };
  }

  try {
    const [categoriesResult, trazeViewResult] = await Promise.all([
      readCategories(client),
      readPublicTrazeProfilesView(client, options)
    ]);

    const viewBackfilledProfiles = mapProfilesFromTrazeView(trazeViewResult.rows);

    return {
      profiles: viewBackfilledProfiles,
      profilePublicDetails: [],
      profileCategories: [],
      categories: categoriesResult.rows,
      publicTrazeProfiles: trazeViewResult.rows,
      status: {
        profiles: trazeViewResult.ok,
        profilePublicDetails: false,
        profileCategories: false,
        categories: categoriesResult.ok,
        publicTrazeProfiles: trazeViewResult.ok
      }
    };
  } catch (error) {
    console.error("[vportHomepage.read.dal] unexpected failure:", error?.message ?? error);

    return {
      profiles: [],
      profilePublicDetails: [],
      profileCategories: [],
      categories: [],
      publicTrazeProfiles: [],
      status: {
        profiles: false,
        profilePublicDetails: false,
        profileCategories: false,
        categories: false,
        publicTrazeProfiles: false
      }
    };
  }
}
