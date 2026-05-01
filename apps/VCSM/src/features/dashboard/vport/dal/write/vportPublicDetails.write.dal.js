import { supabase } from "@/services/supabase/supabaseClient";

const COLS = `
  profile_id,
  city_id,
  website_url,
  email_public,
  phone_public,
  location_text,
  address,
  lat,
  lng,
  hours,
  price_tier,
  highlights,
  languages,
  payment_methods,
  social_links,
  booking_url
`;

export async function upsertVportPublicDetailsDAL({ row }) {
  if (!row?.profile_id) {
    throw new Error("upsertVportPublicDetailsDAL: profile_id required");
  }

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .upsert(row, { onConflict: "profile_id" })
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
