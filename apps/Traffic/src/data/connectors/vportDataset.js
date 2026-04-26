import { getSupabaseClient } from "@/data/connectors/supabase.client";
import { mapVportRowToProvider } from "@/data/mappers/vportToProvider.mapper";

/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */

/**
 * @typedef {Object} VportDataset
 * @property {Provider[]} providers
 * @property {ProviderService[]} providerServices
 * @property {ProviderStats[]} providerStats
 */

const EMPTY_DATASET = { providers: [], providerServices: [], providerStats: [] };

// View vport.public_traze_profiles_v is flat — no joins needed.
// Filters (is_active, is_deleted, slug not null) are enforced by the view.
const VPORT_SELECT = [
  "id",
  "actor_id",
  "name",
  "slug",
  "bio",
  "avatar_url",
  "banner_url",
  "created_at",
  "phone_public",
  "location_text",
  "address",
  "country_code",
  "category_key"
].join(", ");

// ─── Row normalization ────────────────────────────────────────────────────────

function flattenRow(row) {
  return {
    id: row.id,
    actor_id: row.actor_id,
    name: row.name,
    slug: row.slug,
    bio: row.bio,
    avatar_url: row.avatar_url ?? null,
    banner_url: row.banner_url ?? null,
    is_active: true,
    created_at: row.created_at,
    phone_public: row.phone_public ?? null,
    location_text: row.location_text ?? null,
    address: row.address ?? null,
    country_code: row.country_code ?? null,
    category_key: row.category_key ?? null
  };
}

// ─── Supabase fetch ───────────────────────────────────────────────────────────

async function fetchVportRows() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .schema("vport")
    .from("public_traze_profiles_v")
    .select(VPORT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[vportDataset] Supabase query failed:", error.message);
    return null;
  }

  return data ?? [];
}

// ─── Public loader ────────────────────────────────────────────────────────────

/**
 * Loads all active VPORT profiles via the public_traze_profiles_v view and
 * maps them into TRAZE's Provider/ProviderService/ProviderStats shape.
 *
 * Returns an empty dataset — never throws — so a failed Supabase connection
 * cannot break a static build.
 *
 * @returns {Promise<VportDataset>}
 */
export async function loadVportDataset() {
  let rows;
  try {
    rows = await fetchVportRows();
  } catch (err) {
    console.error("[vportDataset] Unexpected error fetching VPORT rows:", err?.message ?? err);
    return EMPTY_DATASET;
  }

  if (!rows) return EMPTY_DATASET;

  /** @type {Provider[]} */
  const providers = [];
  /** @type {ProviderService[]} */
  const providerServices = [];
  /** @type {ProviderStats[]} */
  const providerStats = [];

  for (const raw of rows) {
    let mapped;
    try {
      mapped = mapVportRowToProvider(flattenRow(raw));
    } catch (err) {
      console.error("[vportDataset] Failed to map row", raw?.slug, err?.message ?? err);
      continue;
    }

    if (!mapped) continue;

    providers.push(mapped.provider);
    if (mapped.providerService) providerServices.push(mapped.providerService);
    providerStats.push(mapped.providerStats);
  }

  return { providers, providerServices, providerStats };
}
