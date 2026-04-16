import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: fetch vport public details from vport.profiles + vport.profile_public_details.
 * Resolves actor_id → profile, fetches public detail extension, merges into flat envelope.
 */
export async function readVportPublicDetailsRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicDetailsRpcDAL: actorId is required");
  }

  const { data: profileRow, error: profileError } = await supabase
    .schema("vport")
    .from("profiles")
    .select("id,actor_id,slug,name,bio,avatar_url,banner_url")
    .eq("actor_id", actorId)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profileRow) {
    return { ok: false, actor_id: actorId, error: "not_found", details: null };
  }

  const { data: extRow, error: extError } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .select(
      "logo_url,website_url,phone_public,location_text,address,lat,lng,social_links"
    )
    .eq("profile_id", profileRow.id)
    .maybeSingle();

  if (extError) throw extError;

  return {
    ok: true,
    actor_id: actorId,
    error: null,
    details: {
      actor_id: profileRow.actor_id,
      slug: profileRow.slug,
      name: profileRow.name,
      bio: profileRow.bio,
      avatar_url: profileRow.avatar_url,
      banner_url: profileRow.banner_url,
      logo_url: extRow?.logo_url ?? null,
      website_url: extRow?.website_url ?? null,
      phone_public: extRow?.phone_public ?? null,
      location_text: extRow?.location_text ?? null,
      address: extRow?.address ?? null,
      lat: extRow?.lat ?? null,
      lng: extRow?.lng ?? null,
      social_links: extRow?.social_links ?? null,
    },
  };
}

export default readVportPublicDetailsRpcDAL;
