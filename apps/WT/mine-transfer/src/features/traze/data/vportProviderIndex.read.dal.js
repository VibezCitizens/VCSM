import { supabase } from "@/services/supabase/supabaseClient";

const PROVIDER_INDEX_COLUMNS = [
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
  "updated_at",
];

function normalizeCountryCode(value) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export async function readVportProviderIndexRows(options = {}) {
  let query = supabase
    .schema("vport")
    .from("public_traze_provider_index_v")
    .select(PROVIDER_INDEX_COLUMNS.join(", "))
    .eq("is_active", true)
    .eq("is_indexable", true)
    .in("source", ["vport", "seed"])
    .order("created_at", { ascending: false });

  const countryCode = normalizeCountryCode(options.countryCode);
  if (countryCode) {
    query = query.eq("country_code", countryCode);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}
