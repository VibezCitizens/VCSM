const DAY_ORDER = Object.freeze(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

const DAY_LABEL = Object.freeze({
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
});

function asText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeUrl(value) {
  const raw = asText(value);
  if (!raw) return "";

  if (raw.startsWith("/") || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const candidate = /^[a-z][a-z0-9+\-.]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeKey(value) {
  return asText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readSocialLink(socialLinks, keys) {
  const source = asObject(socialLinks);
  if (!Object.keys(source).length) return "";

  const map = new Map();
  for (const [key, value] of Object.entries(source)) {
    map.set(normalizeKey(key), value);
  }

  for (const key of keys) {
    const match = map.get(normalizeKey(key));
    const safeUrl = normalizeUrl(match);
    if (safeUrl) return safeUrl;
  }

  return "";
}

function formatAddressText(address) {
  const source = asObject(address);
  const parts = [
    source.line1,
    source.line2,
    source.city,
    source.state,
    source.zip,
    source.country,
  ]
    .map((item) => asText(item))
    .filter(Boolean);

  return parts.join(", ");
}

function formatTimeRange(start, end) {
  const from = asText(start);
  const to = asText(end);

  if (!from && !to) return "";
  if (from && to) return `${from}-${to}`;
  if (from) return `${from}-`;
  return `-${to}`;
}

function formatDayIntervals(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) return "";

  return intervals
    .map((interval) => formatTimeRange(interval?.start, interval?.end))
    .filter(Boolean)
    .join(", ");
}

function formatDayRange(start, end) {
  if (start === end) return DAY_LABEL[start];
  return `${DAY_LABEL[start]}-${DAY_LABEL[end]}`;
}

function formatHoursSummary(hours) {
  const source = asObject(hours);
  if (!Object.keys(source).length) return "";

  if (source.always_open === true || source.alwaysOpen === true) {
    return "Open 24/7";
  }

  const weekly = asObject(source.weekly);
  const segments = [];

  for (const day of DAY_ORDER) {
    const value = formatDayIntervals(weekly[day]);
    if (!value) continue;

    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.value === value) {
      lastSegment.end = day;
      continue;
    }

    segments.push({ start: day, end: day, value });
  }

  if (!segments.length) return "";
  if (segments.length > 3) return "Hours vary by day";

  return segments
    .map((segment) => `${formatDayRange(segment.start, segment.end)} ${segment.value}`)
    .join(" | ");
}

function buildDirectionsUrl(source) {
  const directUrl = normalizeUrl(
    source.directionsUrl ??
      source.directions_url ??
      source.mapsUrl ??
      source.maps_url ??
      source.mapUrl ??
      source.map_url
  );
  if (directUrl) return directUrl;

  const socialUrl = readSocialLink(source.socialLinks ?? source.social_links, [
    "directions",
    "maps",
    "google_maps",
    "google_maps_url",
  ]);
  if (socialUrl) return socialUrl;

  const query = asText(source.addressText || source.locationText || source.location_text);
  if (!query) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function normalizeDashboardVportDetails(details) {
  const source = details && typeof details === "object" ? details : {};
  const address = asObject(source.address);
  const hours = asObject(source.hours);
  const locationText = asText(source.locationText ?? source.location_text);
  const addressText = formatAddressText(address) || locationText;

  const normalized = {
    actorId: source.actorId ?? source.actor_id ?? null,
    cityId: source.cityId ?? source.city_id ?? null,
    kind: asText(source.kind),
    vportType: asText(source.vportType ?? source.vport_type),
    name: asText(source.name ?? source.displayName ?? source.display_name),
    slug: asText(source.slug ?? source.username),
    tagline: asText(source.tagline ?? source.bio),
    bio: asText(source.bio ?? source.tagline),
    bannerUrl: normalizeUrl(source.bannerUrl ?? source.banner_url),
    avatarUrl: normalizeUrl(source.avatarUrl ?? source.avatar_url),
    websiteUrl: normalizeUrl(source.websiteUrl ?? source.website_url ?? source.website),
    emailPublic: asText(source.emailPublic ?? source.email_public),
    phonePublic: asText(source.phonePublic ?? source.phone_public ?? source.phone),
    locationText,
    bookingUrl: normalizeUrl(source.bookingUrl ?? source.booking_url),
    address,
    addressText,
    hours,
    hoursText: formatHoursSummary(hours),
    highlights: asArray(source.highlights),
    languages: asArray(source.languages),
    paymentMethods: asArray(source.paymentMethods ?? source.payment_methods),
    socialLinks: asObject(source.socialLinks ?? source.social_links),
    priceTier: source.priceTier ?? source.price_tier ?? null,
    logoUrl: normalizeUrl(source.logoUrl ?? source.logo_url),
    flyerFoodImage1: normalizeUrl(source.flyerFoodImage1 ?? source.flyer_food_image_1),
    flyerFoodImage2: normalizeUrl(source.flyerFoodImage2 ?? source.flyer_food_image_2),
    flyerHeadline: asText(source.flyerHeadline ?? source.flyer_headline),
    flyerSubheadline: asText(source.flyerSubheadline ?? source.flyer_subheadline),
    flyerNote: asText(source.flyerNote ?? source.flyer_note),
    accentColor: asText(source.accentColor ?? source.accent_color ?? source.accent),
  };

  return {
    ...normalized,
    directionsUrl: buildDirectionsUrl({
      ...source,
      socialLinks: normalized.socialLinks,
      addressText: normalized.addressText,
      locationText: normalized.locationText,
    }),
  };
}
