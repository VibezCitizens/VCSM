import { supabase } from "@/services/supabase/supabaseClient";

const COLS = `
  vport_id,
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
  if (!row?.vport_id) {
    throw new Error("upsertVportPublicDetailsDAL: vport_id required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_public_details")
    .upsert(row, { onConflict: "vport_id" })
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
