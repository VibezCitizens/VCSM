function toText(value) {
  return String(value ?? "").trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const next = toText(value);
    if (next) return next;
  }
  return "";
}

function toSafeUrl(value) {
  const raw = toText(value);
  if (!raw) return "";
  if (raw.startsWith("/") || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }
  const withProtocol = /^[a-z][a-z0-9+\-.]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toSafePhone(value) {
  return toText(value).replace(/[^0-9+#*(),;.\-\s]/g, "");
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function maybeParseObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const raw = toText(value);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeKey(value) {
  return toText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getSocialLink(socialLinks, candidateKeys) {
  const source = maybeParseObject(socialLinks);
  if (!source) return "";

  const normalized = new Map();
  for (const [key, value] of Object.entries(source)) {
    normalized.set(normalizeKey(key), value);
  }

  for (const key of candidateKeys) {
    const raw = normalized.get(normalizeKey(key));
    const safe = toSafeUrl(raw);
    if (safe) return safe;
  }

  return "";
}

function buildDirectionsUrl(row, socialLinks) {
  const direct = toSafeUrl(
    firstNonEmpty(
      row.directions_url,
      row.directionsUrl,
      row.maps_url,
      row.mapsUrl,
      row.map_url,
      row.mapUrl
    )
  );
  if (direct) return direct;

  const social = getSocialLink(socialLinks, ["directions", "maps", "google_maps", "google_maps_url"]);
  if (social) return social;

  const lat = toFiniteNumber(row.lat);
  const lng = toFiniteNumber(row.lng);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  const locationQuery = firstNonEmpty(row.address, row.location_text, row.locationText);
  if (locationQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
  }

  return "";
}

function buildReviewUrl(row, socialLinks) {
  const direct = toSafeUrl(
    firstNonEmpty(row.review_url, row.reviewUrl, row.rating_url, row.ratingUrl)
  );
  if (direct) return direct;

  return getSocialLink(socialLinks, [
    "reviews",
    "review",
    "google_reviews",
    "google_review",
    "google_business",
    "yelp",
    "tripadvisor",
  ]);
}

function isLikelyFlyerAsset(url) {
  const v = toText(url).toLowerCase();
  return v.includes("/flyers/") || v.includes("/design-assets/");
}

/**
 * Model: raw payload -> domain-safe public details.
 * Supports both legacy RPC envelopes and vc_public view envelopes.
 */
export function mapVportPublicDetailsRpcResult(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const ok = source.ok === true;
  const actorId = source.actorId ?? source.actor_id ?? null;

  if (!ok) {
    return {
      ok: false,
      actorId,
      error: String(source.error || "unavailable"),
      details: null,
    };
  }

  const row = source.details && typeof source.details === "object" ? source.details : {};
  const socialLinks = row.social_links ?? row.socialLinks ?? null;

  const displayName = firstNonEmpty(
    row.display_name,
    row.displayName,
    row.vport_name,
    row.vportName,
    row.name,
    row.title
  );

  const username = firstNonEmpty(
    row.username,
    row.slug,
    row.handle,
    row.actor_username,
    row.actorUsername
  );

  const logoUrl = toSafeUrl(firstNonEmpty(row.logo_url, row.logoUrl));
  const rawAvatar = firstNonEmpty(
    row.profile_avatar_url,
    row.profileAvatarUrl,
    row.vport_avatar_url,
    row.vportAvatarUrl,
    row.actor_avatar_url,
    row.actorAvatarUrl,
    row.avatar_url,
    row.avatarUrl,
    row.photo_url,
    row.photoUrl
  );
  const safeAvatar = toSafeUrl(rawAvatar);
  const avatarLooksLikeLogoAsset =
    !!safeAvatar &&
    !!logoUrl &&
    safeAvatar === logoUrl &&
    isLikelyFlyerAsset(safeAvatar);
  const avatarUrl = avatarLooksLikeLogoAsset ? "" : safeAvatar;

  const bannerUrl = toSafeUrl(
    firstNonEmpty(row.banner_url, row.bannerUrl, row.cover_url, row.coverUrl)
  );
  const reviewUrl = buildReviewUrl(row, socialLinks);
  const directionsUrl = buildDirectionsUrl(row, socialLinks);

  return {
    ok: true,
    actorId,
    error: null,
    details: {
      displayName,
      username,
      tagline: firstNonEmpty(row.tagline, row.bio),
      bannerUrl,
      avatarUrl,
      phone: toSafePhone(row.phone_public ?? row.phone ?? row.phone_number ?? row.phoneNumber),
      reviewUrl,
      directionsUrl,
      websiteUrl: toSafeUrl(row.website_url ?? row.websiteUrl),
      raw: row,
    },
  };
}

export default mapVportPublicDetailsRpcResult;
