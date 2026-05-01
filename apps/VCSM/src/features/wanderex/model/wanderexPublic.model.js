const WEEKDAY_INDEX = Object.freeze({
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
});

export function slugifySegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function humanizeCategory(categoryKey) {
  const value = String(categoryKey || "").trim();
  if (!value) return "Provider";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(dateKey) {
  const parts = String(dateKey || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function minutesFromTime(value) {
  const [h, m] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function timeFromMinutes(totalMinutes) {
  const safe = Math.max(0, Math.min(24 * 60, Number(totalMinutes) || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function weekdayToIndex(value) {
  if (Number.isFinite(Number(value))) {
    const asNumber = Number(value);
    if (asNumber >= 0 && asNumber <= 6) return asNumber;
  }

  const key = String(value || "").trim().toLowerCase();
  if (!key) return null;
  return WEEKDAY_INDEX[key] ?? null;
}

function normalizeAddress(address) {
  if (!address || typeof address !== "object") return null;
  return {
    line1: String(address.line1 || "").trim(),
    line2: String(address.line2 || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    zip: String(address.zip || "").trim(),
    country: String(address.country || address.country_code || "").trim(),
  };
}

export function formatAddressLabel(address) {
  if (!address) return "";
  return [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatCurrencyFromCents(priceCents, currencyCode = "USD") {
  const cents = Number(priceCents);
  if (!Number.isFinite(cents)) return null;
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currencyCode || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}

export function normalizeDirectoryCard(row, options = {}) {
  const rating = options.ratingByActorId?.[row.actor_id] ?? null;
  const isBookable = Boolean(options.bookableByProfileId?.[row.id]);
  const isOpenNow = Boolean(options.openNowByProfileId?.[row.id]);
  const city = String(row.city || row.location_text || "").trim();

  return {
    profileId: row.id,
    actorId: row.actor_id,
    slug: row.slug,
    name: row.name || "VPORT",
    avatarUrl: row.avatar_url || "/avatar.jpg",
    categoryKey: row.category_key || null,
    categoryLabel: humanizeCategory(row.category_key),
    city,
    ratingAverage: rating?.averageRating ?? null,
    ratingCount: rating?.reviewCount ?? 0,
    isBookable,
    isOpenNow,
  };
}

export function normalizeWanderExProfile(rawProfile, options = {}) {
  if (!rawProfile) return null;

  const details = rawProfile.public_details || {};
  const categories = Array.isArray(rawProfile.profile_categories)
    ? rawProfile.profile_categories
    : [];
  const primary = categories.find((row) => row?.is_primary) || categories[0] || null;
  const address = normalizeAddress(details.address);

  return {
    profileId: rawProfile.id,
    actorId: rawProfile.actor_id,
    slug: rawProfile.slug,
    name: rawProfile.name || "VPORT",
    bio: rawProfile.bio || "",
    avatarUrl: rawProfile.avatar_url || "/avatar.jpg",
    bannerUrl: rawProfile.banner_url || "",
    categoryKey: primary?.category_key || null,
    categoryLabel: humanizeCategory(primary?.category_key),
    locationText: String(details.location_text || "").trim(),
    city: String(address?.city || details.location_text || "").trim(),
    state: String(address?.state || "").trim(),
    address,
    addressLabel: formatAddressLabel(address),
    phone: String(details.phone_public || "").trim(),
    email: String(details.email_public || "").trim(),
    websiteUrl: String(details.website_url || "").trim(),
    bookingUrl: String(details.booking_url || "").trim(),
    logoUrl: String(details.logo_url || "").trim(),
    accentColor: String(details.accent_color || "").trim(),
    ratingAverage: options.reviewSummary?.averageRating ?? null,
    ratingCount: options.reviewSummary?.reviewCount ?? 0,
  };
}

export function mergeServicesWithBookingProfiles(services, bookingProfiles) {
  const profileByServiceId = new Map();
  (Array.isArray(bookingProfiles) ? bookingProfiles : []).forEach((item) => {
    if (!item?.service_id) return;
    profileByServiceId.set(item.service_id, item);
  });

  return (Array.isArray(services) ? services : [])
    .filter((service) => service?.enabled !== false)
    .map((service) => {
      const bookingProfile = profileByServiceId.get(service.id) || null;
      const durationMinutes = Number(
        bookingProfile?.duration_minutes ?? service?.meta?.duration_minutes ?? 30
      );
      const priceCents = bookingProfile?.price_cents ?? service?.meta?.price_cents ?? null;
      const currencyCode = bookingProfile?.currency_code ?? service?.meta?.currency_code ?? "USD";
      const isBookable = bookingProfile
        ? bookingProfile.is_bookable !== false
        : service?.meta?.is_bookable !== false;

      return {
        id: service.id,
        label: service.label || service.key || "Service",
        description: service.description || "",
        durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 30,
        priceCents: Number.isFinite(Number(priceCents)) ? Number(priceCents) : null,
        currencyCode,
        priceLabel: formatCurrencyFromCents(priceCents, currencyCode),
        isBookable,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function normalizeReviewSummary(raw) {
  if (!raw) return { averageRating: null, reviewCount: 0 };

  const averageRating = Number(raw.average_rating);
  const reviewCount = Number(raw.review_count);

  return {
    averageRating: Number.isFinite(averageRating) ? averageRating : null,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
  };
}

export function normalizeTeamResources(resources) {
  return (Array.isArray(resources) ? resources : [])
    .filter((resource) => resource?.is_active !== false)
    .filter((resource) => {
      const status = String(resource?.meta?.status || "linked").toLowerCase();
      return status === "linked";
    })
    .map((resource, index) => ({
      id: resource.id,
      profileId: resource.profile_id,
      name: resource.name || `Barber ${index + 1}`,
      actorId: resource.member_actor_id || null,
      sortOrder: Number.isFinite(Number(resource.sort_order))
        ? Number(resource.sort_order)
        : index,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function composeDirectionsUrl(profile) {
  const location = profile?.addressLabel || profile?.locationText || "";
  if (!location) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
