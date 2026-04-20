import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: fetch vport public details.
 * Primary: vport.public_menu_read_model_v (richest data, only present when menu items exist).
 * Fallback: vport.profiles (always present for any vport with a profile).
 */
export async function readVportPublicDetailsRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicDetailsRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vport")
    .from("public_menu_read_model_v")
    .select(
      "profile_id,actor_id,profile_slug,profile_name,profile_bio,profile_avatar_url,profile_banner_url,public_menu_url,location_text,logo_url,website_url,phone_public,email_public,address,lat,lng,social_links,hours,booking_url"
    )
    .eq("actor_id", actorId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return { ok: true, actor_id: actorId, error: null, details: data };
  }

  // Fallback: vport not in menu read model (no menu items yet), read profile directly.
  const { data: profileData, error: profileError } = await supabase
    .schema("vport")
    .from("profiles")
    .select("actor_id,slug,name,bio,avatar_url,banner_url")
    .eq("actor_id", actorId)
    .limit(1)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profileData) {
    return { ok: false, actor_id: actorId, error: "not_found", details: null };
  }

  return { ok: true, actor_id: actorId, error: null, details: profileData };
}

export default readVportPublicDetailsRpcDAL;
