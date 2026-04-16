import { supabase } from "@/services/supabase/supabaseClient";
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
      public_details:profile_public_details (
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

  // Fall back to legacy vc.actors → vports → vport_public_details join
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
