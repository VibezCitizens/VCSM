import { supabase } from "@/services/supabase/supabaseClient";

export async function saveFlyerPublicDetails({ vportId, patch }) {
  if (!vportId) throw new Error("Missing vportId");

  const incomingHours = patch?.hours;
  const cleanHours =
    incomingHours && typeof incomingHours === "object" && !Array.isArray(incomingHours)
      ? incomingHours
      : {};

  // Only allow keys that exist in vport_public_details
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
    .schema("vc")
    .from("vport_public_details")
    .upsert({ vport_id: vportId, ...cleanPatch }, { onConflict: "vport_id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
