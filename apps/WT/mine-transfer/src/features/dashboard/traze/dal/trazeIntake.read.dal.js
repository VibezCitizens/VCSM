import { supabase } from "@/services/supabase/supabaseClient";

const BASE_LEAD_COLS = [
  "id", "business_name", "business_type", "slug", "description",
  "service_id", "city_id", "neighborhood_id",
  "country_code", "state_code", "city_name", "city_slug",
  "address_text", "lat", "lng",
  "phone", "email", "website_url",
  "instagram_url", "facebook_url", "google_maps_url",
  "avatar_url", "banner_url", "logo_url",
  "price_notes", "hours",
  "source", "source_url", "notes",
  "status", "created_by", "reviewed_by", "reviewed_at",
  "imported_provider_id", "created_at", "updated_at",
];

const LEAD_COLS = [
  ...BASE_LEAD_COLS.slice(0, 8),
  "country_code", "state_code", "city_name", "city_slug", "zip_code",
  ...BASE_LEAD_COLS.slice(12),
].join(", ");

const LEAD_COLS_WITHOUT_ZIP = BASE_LEAD_COLS.join(", ");

function isMissingZipColumn(error) {
  const message = String(error?.message ?? "");
  return Boolean(error) && message.includes("zip_code");
}

const PROVIDER_COLS = [
  "id", "source_provider_id", "slug", "display_name", "business_type",
  "primary_city_id", "primary_neighborhood_id", "primary_service_id",
  "short_bio", "phone", "email", "website_url", "address_text", "lat", "lng", "hours",
  "avatar_url", "banner_url", "logo_url",
  "google_maps_url", "instagram_url", "facebook_url",
  "platform_profile_url", "platform_book_url",
  "claim_status", "claimed_by", "claimed_at",
  "is_active", "is_indexable",
  "created_at", "updated_at",
].join(", ");

const CLAIM_COLS = [
  "id", "provider_id", "provider_slug", "business_name",
  "owner_name", "role", "contact_method", "phone", "email",
  "verification_method", "verification_status",
  "claim_status", "claim_confidence",
  "instagram_url", "website_url", "notes", "proof_image_url",
  "source", "source_url", "reviewed_by", "reviewed_at",
  "created_at", "updated_at",
].join(", ");

export async function readIntakeLeads() {
  const query = (cols) => supabase
    .schema("traffic")
    .from("business_intake_leads")
    .select(cols)
    .order("created_at", { ascending: false });

  let { data, error } = await query(LEAD_COLS);
  if (isMissingZipColumn(error)) {
    ({ data, error } = await query(LEAD_COLS_WITHOUT_ZIP));
    if (error) throw error;
    return (data ?? []).map((row) => ({ ...row, zip_code: null }));
  }
  if (error) throw error;
  return data ?? [];
}

export async function readIntakeLead(id) {
  const query = (cols) => supabase
    .schema("traffic")
    .from("business_intake_leads")
    .select(cols)
    .eq("id", id)
    .single();

  let { data, error } = await query(LEAD_COLS);
  if (isMissingZipColumn(error)) {
    ({ data, error } = await query(LEAD_COLS_WITHOUT_ZIP));
    if (error) throw error;
    return { ...data, zip_code: null };
  }
  if (error) throw error;
  return data;
}

export async function readCities() {
  const { data, error } = await supabase
    .schema("traffic")
    .from("cities")
    .select("id, name, slug, state_code, country_code")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function readNeighborhoods(cityId) {
  const q = supabase
    .schema("traffic")
    .from("neighborhoods")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  if (cityId) q.eq("city_id", cityId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function readServices() {
  const { data, error } = await supabase
    .schema("traffic")
    .from("services")
    .select("id, name, slug, category")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function readTrazeProvider(id) {
  const { data, error } = await supabase
    .schema("traffic")
    .from("providers")
    .select(PROVIDER_COLS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function readClaimRequests() {
  const { data, error } = await supabase
    .schema("traffic")
    .from("business_claim_requests")
    .select(CLAIM_COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
