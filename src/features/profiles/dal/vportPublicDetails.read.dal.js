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
          booking_url
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
    slug: v?.slug ?? null,
    bio: v?.bio ?? null,
    avatar_url: v?.avatar_url ?? null,
    banner_url: v?.banner_url ?? null,
    is_active: v?.is_active ?? null,

    website_url: pd?.website_url ?? null,
    email_public: pd?.email_public ?? null,
    phone_public: pd?.phone_public ?? null,
    location_text: pd?.location_text ?? null,
    address: pd?.address ?? null,
    hours: pd?.hours ?? null,
    price_tier: pd?.price_tier ?? null,
    highlights: pd?.highlights ?? [],
    languages: pd?.languages ?? [],
    payment_methods: pd?.payment_methods ?? [],
    social_links: pd?.social_links ?? {},
    booking_url: pd?.booking_url ?? null,
  };
}
