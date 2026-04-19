import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: fetch vport public details from vport.public_menu_read_model_v.
 * Profile and details fields are already joined by the view — single query, first row only.
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

  if (!data) {
    return { ok: false, actor_id: actorId, error: "not_found", details: null };
  }

  return { ok: true, actor_id: actorId, error: null, details: data };
}

export default readVportPublicDetailsRpcDAL;
