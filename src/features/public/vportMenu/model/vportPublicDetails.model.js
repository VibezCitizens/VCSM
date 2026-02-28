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

function isLikelyFlyerAsset(url) {
  const v = toText(url).toLowerCase();
  return v.includes("/flyers/") || v.includes("/design-assets/");
}

/**
 * Model: raw RPC payload -> domain-safe public details.
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

  const reviewUrl = row.review_url ?? row.reviewUrl ?? row.rating_url ?? row.ratingUrl ?? "";
  const directionsUrl =
    row.directions_url ??
    row.directionsUrl ??
    row.maps_url ??
    row.mapsUrl ??
    row.map_url ??
    row.mapUrl ??
    "";

  const displayName = firstNonEmpty(
    row.display_name,
    row.displayName,
    row.name,
    row.vport_name,
    row.vportName,
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

  return {
    ok: true,
    actorId,
    error: null,
    details: {
      displayName,
      username,
      tagline: toText(row.tagline),
      bannerUrl,
      avatarUrl,
      phone: toSafePhone(row.phone_public ?? row.phone ?? row.phone_number ?? row.phoneNumber),
      reviewUrl: toSafeUrl(reviewUrl),
      directionsUrl: toSafeUrl(directionsUrl),
      websiteUrl: toSafeUrl(row.website_url ?? row.websiteUrl),
      raw: row,
    },
  };
}

export default mapVportPublicDetailsRpcResult;
