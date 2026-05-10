import vportSchema from "@/services/supabase/vportClient";

export async function fetchVportPublicDetailsByActorId(actorId) {
  if (!actorId) return null;

  // Try vport.profiles first — new VPORTs store actor_id directly on vport.profiles
  const { data: newData, error: newError } = await vportSchema
    .from("profiles")
    .select(
      `
      id,
      name,
      slug,
      bio,
      avatar_url,
      banner_url,
      is_active,
      is_deleted,
      public_details:profile_public_details (
        city_id,
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
        accent_color
      )
    `
    )
    .eq("actor_id", actorId)
    .maybeSingle();

  if (newError) throw newError;

  if (newData) {
    const pd = newData.public_details || null;

    return {
      actor_id: actorId,
      kind: "vport",

      vport_id: newData.id,
      name: newData.name ?? null,
      // vport_type not stored in vport.profiles — use profile_categories if needed
      vport_type: null,
      slug: newData.slug ?? null,
      bio: newData.bio ?? null,
      avatar_url: newData.avatar_url ?? null,
      banner_url: newData.banner_url ?? null,
      is_active: newData.is_active ?? null,

      city_id: pd?.city_id ?? null,
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
      // Flyer columns do not exist in vport.profile_public_details
      flyer_food_image_1: null,
      flyer_food_image_2: null,
      flyer_headline: null,
      flyer_subheadline: null,
      flyer_note: null,
      accent_color: pd?.accent_color ?? null,
    };
  }

  return null;
}
