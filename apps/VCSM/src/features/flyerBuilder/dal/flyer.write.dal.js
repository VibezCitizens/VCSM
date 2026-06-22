import { supabase } from "@/services/supabase/supabaseClient";

export async function saveFlyerPublicDetails({ profileId, patch }) {
  if (!profileId) throw new Error("Missing profileId");

  const incomingHours = patch?.hours;
  const cleanHours =
    incomingHours && typeof incomingHours === "object" && !Array.isArray(incomingHours)
      ? incomingHours
      : {};

  const cleanPatch = {
    website_url: patch?.website_url ?? null,
    phone_public: patch?.phone_public ?? null,
    hours: cleanHours,

    logo_url: patch?.logo_url ?? null,
    flyer_food_image_1: patch?.flyer_food_image_1 ?? null,
    flyer_food_image_2: patch?.flyer_food_image_2 ?? null,
    flyer_headline: patch?.flyer_headline ?? null,
    flyer_subheadline: patch?.flyer_subheadline ?? null,
    flyer_note: patch?.flyer_note ?? null,
    accent_color: patch?.accent_color ?? null,
  };

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .upsert({ profile_id: profileId, ...cleanPatch }, { onConflict: "profile_id" })
    .select(`
      profile_id,
      website_url,
      phone_public,
      hours,
      logo_url,
      flyer_food_image_1,
      flyer_food_image_2,
      flyer_headline,
      flyer_subheadline,
      flyer_note,
      accent_color
    `)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
