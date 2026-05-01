// src/features/settings/profile/model/vportPublicDetails.mapper.js

function safeArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) {
    // allow comma-separated fallback (optional)
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function safeJson(v) {
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

export function mapVportPublicDetailsToView(row) {
  if (!row) return null;

  return {
    vportId: row.vport_id ?? null,

    websiteUrl: row.website_url ?? "",
    emailPublic: row.email_public ?? "",
    phonePublic: row.phone_public ?? "",
    locationText: row.location_text ?? "",
    bookingUrl: row.booking_url ?? "",

    // json
    address: safeJson(row.address),
    hours: safeJson(row.hours),
    socialLinks: safeJson(row.social_links),

    // arrays
    highlights: safeArray(row.highlights),
    languages: safeArray(row.languages),
    paymentMethods: safeArray(row.payment_methods),

    // numbers
    priceTier: row.price_tier ?? null,

    // coords
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
}

export function mapVportPublicDetailsUpdate(ui) {
  if (!ui) return {};

  // accept both camelCase + snake_case drafts
  const highlights = safeArray(ui.highlights ?? ui.highlights_array);
  const languages = safeArray(ui.languages ?? ui.language ?? ui.languages_array);
  const paymentMethods = safeArray(ui.paymentMethods ?? ui.payment_methods ?? ui.payments);

  const address = safeJson(ui.address);
  const hours = safeJson(ui.hours);
  const socialLinks = safeJson(ui.socialLinks ?? ui.social_links);

  return {
    website_url: ui.websiteUrl?.trim?.() || ui.website_url?.trim?.() || null,
    email_public: ui.emailPublic?.trim?.() || ui.email_public?.trim?.() || null,
    phone_public: ui.phonePublic?.trim?.() || ui.phone_public?.trim?.() || null,
    location_text: ui.locationText?.trim?.() || ui.location_text?.trim?.() || null,
    booking_url: ui.bookingUrl?.trim?.() || ui.booking_url?.trim?.() || null,

    address,
    hours,
    social_links: socialLinks,

    highlights,
    languages,
    payment_methods: paymentMethods,

    price_tier: ui.priceTier ?? ui.price_tier ?? null,

    lat: ui.lat ?? null,
    lng: ui.lng ?? null,
  };
}
