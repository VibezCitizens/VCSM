// src/features/settings/profile/dal/vportPublicDetails.write.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

function safeObj(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function safeArr(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v].filter(Boolean);
}

function mapPayloadToRow(payload) {
  const p = payload || {};

  return {
    // snake_case columns
    website_url: (p.website_url ?? p.websiteUrl ?? "") || "",
    booking_url: (p.booking_url ?? p.bookingUrl ?? "") || "",
    email_public: (p.email_public ?? p.emailPublic ?? "") || "",
    phone_public: (p.phone_public ?? p.phonePublic ?? "") || "",
    location_text: (p.location_text ?? p.locationText ?? "") || "",

    address: safeObj(p.address),
    hours: safeObj(p.hours),

    highlights: safeArr(p.highlights),
    languages: safeArr(p.languages),
    payment_methods: safeArr(p.payment_methods ?? p.paymentMethods),

    social_links: safeObj(p.social_links ?? p.socialLinks),

    // optional fields if you ever send them
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    price_tier: p.price_tier ?? p.priceTier ?? null,
  };
}

export async function upsertVportPublicDetails(profileId, payload) {
  if (!profileId) throw new Error("upsertVportPublicDetails: profileId required");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData?.user?.id;
  if (!userId) throw new Error("upsertVportPublicDetails: not authenticated");

  const { data: owned, error: ownerError } = await supabase
    .schema("vport")
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (!owned) throw new Error("upsertVportPublicDetails: profile not found or not owned by you");

  const row = {
    profile_id: profileId,
    ...mapPayloadToRow(payload),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
    .upsert(row, { onConflict: "profile_id" })
    .select(
      `
      profile_id,
      website_url,
      email_public,
      phone_public,
      location_text,
      address,
      lat,
      lng,
      hours,
      price_tier,
      highlights,
      languages,
      payment_methods,
      social_links,
      booking_url
    `
    )
    .single();

  if (error) throw error;
  return data;
}
