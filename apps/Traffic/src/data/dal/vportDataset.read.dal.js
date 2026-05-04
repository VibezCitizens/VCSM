import { getSupabaseClient } from "@/data/connectors/supabase.client";

const VPORT_PUBLIC_TRAZE_PROFILE_PROJECTION = [
  "id",
  "actor_id",
  "slug",
  "name",
  "bio",
  "avatar_url",
  "banner_url",
  "phone_public",
  "location_text",
  "address",
  "timezone",
  "city",
  "city_slug",
  "state_code",
  "city_country_code",
  "country_code",
  "category_key",
  "directory_visible",
  "directory_status",
  "created_at",
  "logo_url",
  "email_public",
  "website_url",
  "booking_url",
  "hours",
  "lat",
  "lng"
].join(", ");

let loggedVportDatasetError = false;

export async function readVportPublicTrazeProfileRows() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .schema("vport")
    .from("public_traze_profiles_v")
    .select(VPORT_PUBLIC_TRAZE_PROFILE_PROJECTION)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV !== "production" && !loggedVportDatasetError) {
      loggedVportDatasetError = true;
      console.warn("[vportDataset] Supabase query failed:", error.message);
    }
    return null;
  }

  return data ?? [];
}
