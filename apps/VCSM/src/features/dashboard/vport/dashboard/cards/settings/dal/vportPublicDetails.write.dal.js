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

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: owned, error: ownerError } = await supabase
    .schema("vport")
    .from("profiles")
    .select("id")
    .eq("id", row.profile_id)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (!owned) throw new Error("VPORT not found or not owned by you");

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .upsert(row, { onConflict: "profile_id" })
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
