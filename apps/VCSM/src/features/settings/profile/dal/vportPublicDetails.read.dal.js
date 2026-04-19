// src/features/settings/profile/dal/vportPublicDetails.read.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchVportPublicDetails(profileId) {
  if (!profileId) throw new Error("fetchVportPublicDetails: profileId required");

  const { data, error } = await supabase
    .schema("vport")
    .from("profile_public_details")
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
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;

  // if row doesn't exist yet, return a safe default
  const row =
    data || {
      profile_id: profileId,
      website_url: "",
      email_public: "",
      phone_public: "",
      location_text: "",
      address: {},
      lat: null,
      lng: null,
      hours: {},
      price_tier: null,
      highlights: [],
      languages: [],
      payment_methods: [],
      social_links: {},
      booking_url: "",
    };

  // return snake_case (db) + camelCase (ui) so both callers work
  return {
    ...row,

    // camelCase aliases
    websiteUrl: row.website_url || "",
    bookingUrl: row.booking_url || "",
    emailPublic: row.email_public || "",
    phonePublic: row.phone_public || "",
    locationText: row.location_text || "",

    paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
    socialLinks: row.social_links && typeof row.social_links === "object" ? row.social_links : {},

    address: row.address && typeof row.address === "object" ? row.address : {},
    hours: row.hours && typeof row.hours === "object" ? row.hours : {},
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
  };
}
