import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchFlyerPublicDetailsByActorId(actorId) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select(`
      id,
      kind,
      vport:vports (
        id,
        name,
        slug,
        bio,
        avatar_url,
        banner_url,
        is_active,
        public_details:vport_public_details (
          website_url,
          email_public,
          phone_public,
          location_text,
          address,
          hours,
          booking_url,

          logo_url,
          flyer_food_image_1,
          flyer_food_image_2,
          flyer_headline,
          flyer_subheadline,
          flyer_note,
          accent_color
        )
      )
    `)
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const v = data.vport || null;
  const pd = v?.public_details || null;

  // flatten the shape so UI is easy
  return {
    actor_id: data.id,
    kind: data.kind,

    vport_id: v?.id ?? null,
    name: v?.name ?? null,
    slug: v?.slug ?? null,
    bio: v?.bio ?? null,
    avatar_url: v?.avatar_url ?? null,
    banner_url: v?.banner_url ?? null,

    website_url: pd?.website_url ?? null,
    phone_public: pd?.phone_public ?? null,
    hours: pd?.hours ?? null,

    logo_url: pd?.logo_url ?? null,
    flyer_food_image_1: pd?.flyer_food_image_1 ?? null,
    flyer_food_image_2: pd?.flyer_food_image_2 ?? null,
    flyer_headline: pd?.flyer_headline ?? null,
    flyer_subheadline: pd?.flyer_subheadline ?? null,
    flyer_note: pd?.flyer_note ?? null,
    accent_color: pd?.accent_color ?? null,
  };
}
