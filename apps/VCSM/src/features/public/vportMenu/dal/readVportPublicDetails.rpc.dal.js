import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: public details adapter backed by vc_public views.
 * Returns an envelope compatible with existing controller/model boundaries.
 */
export async function readVportPublicDetailsRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicDetailsRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc_public")
    .from("vports_public")
    .select(
      [
        "actor_id",
        "slug",
        "name",
        "bio",
        "avatar_url",
        "banner_url",
        "logo_url",
        "website_url",
        "phone_public",
        "location_text",
        "address",
        "lat",
        "lng",
        "social_links",
      ].join(",")
    )
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      ok: false,
      actor_id: actorId,
      error: "not_found",
      details: null,
    };
  }

  return {
    ok: true,
    actor_id: actorId,
    error: null,
    details: data,
  };
}

export default readVportPublicDetailsRpcDAL;
