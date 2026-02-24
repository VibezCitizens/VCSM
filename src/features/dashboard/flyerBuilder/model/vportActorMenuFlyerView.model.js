export function asTextValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function buildFlyerProfile(publicDetails) {
  const src = publicDetails || {};
  const displayNameRaw = src.display_name ?? src.name ?? "Menu";

  return {
    displayName: asTextValue(displayNameRaw) || "Menu",
    username: asTextValue(src.username),
    tagline: asTextValue(src.tagline),
    bannerUrl: asTextValue(src.banner_url ?? src.bannerUrl),
    avatarUrl: asTextValue(src.avatar_url ?? src.avatarUrl),
    logoUrl: asTextValue(src.logo_url ?? src.logoUrl),
    address: asTextValue(src.address ?? src.street_address ?? src.streetAddress),
    hours: asTextValue(src.hours ?? src.open_hours ?? src.openHours),
    website: asTextValue(src.website ?? src.website_url ?? src.websiteUrl),
    accent: asTextValue(src.accent ?? src.accent_color ?? src.accentColor),
    flyerHeadline: asTextValue(src.flyer_headline ?? src.flyerHeadline),
    flyerSubheadline: asTextValue(src.flyer_subheadline ?? src.flyerSubheadline),
  };
}

export function buildFlyerActions(publicDetails) {
  const src = publicDetails || {};
  return {
    directionsUrl: asTextValue(
      src.directions_url ?? src.directionsUrl ?? src.maps_url ?? src.mapsUrl
    ).trim(),
    phone: asTextValue(src.phone ?? src.phone_number ?? src.phoneNumber).trim(),
    foodImage1: asTextValue(src.flyer_food_image_1 ?? src.flyerFoodImage1).trim(),
    foodImage2: asTextValue(src.flyer_food_image_2 ?? src.flyerFoodImage2).trim(),
  };
}

export function createFlyerViewStyles() {
  return {
    page: {
      height: "100vh",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      overscrollBehavior: "contain",
      background:
        "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    },
    headerWrap: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: 14,
      background:
        "linear-gradient(180deg, rgba(5,6,11,0.92) 0%, rgba(7,8,18,0.86) 55%, rgba(5,6,11,0.65) 100%)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    },
    headerInner: {
      width: "100%",
      maxWidth: 980,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    pillBtn: (active = false, tone = "soft") => ({
      padding: "10px 12px",
      borderRadius: 14,
      border:
        tone === "accent"
          ? "1px solid rgba(0,255,240,0.22)"
          : "1px solid rgba(255,255,255,0.12)",
      background: active
        ? "rgba(255,255,255,0.12)"
        : tone === "accent"
        ? "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))"
        : "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
      letterSpacing: 0.3,
      boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    }),
  };
}

