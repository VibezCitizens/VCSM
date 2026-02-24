import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchVportPublicDetailsByActorId(actorId) {
  if (!actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select(
      `
      id,
      kind,
      vport:vports (
        id,
        name,
        vport_type,
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
          price_tier,
          highlights,
          languages,
          payment_methods,
          social_links,
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
    `
    )
    .eq("id", actorId)
    .maybeSingle();

  if (error) {
    console.error("[fetchVportPublicDetailsByActorId] failed", error);
    throw error;
  }

  if (!data) return null;

  const v = data.vport || null;
  const pd = v?.public_details || null;

  return {
    actor_id: data.id,
    kind: data.kind,

    vport_id: v?.id ?? null,
    name: v?.name ?? null,
    vport_type: v?.vport_type ?? null,
    slug: v?.slug ?? null,
    bio: v?.bio ?? null,
    avatar_url: v?.avatar_url ?? null,
    banner_url: v?.banner_url ?? null,
    is_active: v?.is_active ?? null,

    website_url: pd?.website_url ?? null,
    email_public: pd?.email_public ?? null,
    phone_public: pd?.phone_public ?? null,
    phone: pd?.phone_public ?? null,

    location_text: pd?.location_text ?? null,
    address: pd?.address ?? null,
    hours: pd?.hours ?? null,
    price_tier: pd?.price_tier ?? null,
    highlights: pd?.highlights ?? [],
    languages: pd?.languages ?? [],
    payment_methods: pd?.payment_methods ?? [],
    social_links: pd?.social_links ?? {},
    booking_url: pd?.booking_url ?? null,

    logo_url: pd?.logo_url ?? null,
    flyer_food_image_1: pd?.flyer_food_image_1 ?? null,
    flyer_food_image_2: pd?.flyer_food_image_2 ?? null,
    flyer_headline: pd?.flyer_headline ?? null,
    flyer_subheadline: pd?.flyer_subheadline ?? null,
    flyer_note: pd?.flyer_note ?? null,
    accent_color: pd?.accent_color ?? null,
  };
}
