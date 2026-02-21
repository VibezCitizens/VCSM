// src/features/profiles/kinds/vport/model/mapVportPublicDetails.model.js

export function mapVportPublicDetailsModel(raw, vportTypeRow) {
  if (!raw) return null

  // raw shape comes from fetchVportPublicDetailsByActorId()
  // vportTypeRow shape comes from readVportTypeDAL()

  return {
    actorId: raw.actor_id ?? null,
    kind: raw.kind ?? null,

    // ✅ include vport type but DO NOT expose vportId
    vportType: vportTypeRow?.vport_type ?? null,

    // vport-facing fields
    name: raw.name ?? null,
    slug: raw.slug ?? null,
    bio: raw.bio ?? null,
    avatarUrl: raw.avatar_url ?? null,
    bannerUrl: raw.banner_url ?? null,
    isActive: raw.is_active ?? null,

    // public details
    websiteUrl: raw.website_url ?? null,
    emailPublic: raw.email_public ?? null,
    phonePublic: raw.phone_public ?? null,
    locationText: raw.location_text ?? null,
    address: raw.address ?? null,
    hours: raw.hours ?? null,
    priceTier: raw.price_tier ?? null,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    paymentMethods: Array.isArray(raw.payment_methods) ? raw.payment_methods : [],
    socialLinks: raw.social_links ?? {},
    bookingUrl: raw.booking_url ?? null,

    logoUrl: raw.logo_url ?? null,
    flyerFoodImage1: raw.flyer_food_image_1 ?? null,
    flyerFoodImage2: raw.flyer_food_image_2 ?? null,
    flyerHeadline: raw.flyer_headline ?? null,
    flyerSubheadline: raw.flyer_subheadline ?? null,
    flyerNote: raw.flyer_note ?? null,
    accentColor: raw.accent_color ?? null,
  }
}