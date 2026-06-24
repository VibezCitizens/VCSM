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

  // Session binding — require an authenticated session at the DAL boundary.
  // Ownership is verified upstream by saveVportPublicDetailsByActorIdController
  // via assertActorOwnsActorController (actor_owners). The prior owner_user_id
  // check here used an inconsistent ownership model and blocked legitimate team-member
  // writes. VEN-DASHBOARD-002 — removed 2026-06-05.
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData?.user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .upsert(row, { onConflict: "profile_id" })
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
