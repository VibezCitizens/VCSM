const COUNTRY_TO_CURRENCY = {
  US: "USD",
  MX: "MXN",
  GT: "GTQ",
  BZ: "BZD",
  HN: "HNL",
  SV: "USD",
  NI: "NIO",
  CR: "CRC",
  PA: "USD",
};

const SERVICE_ALIASES = {
  barber: "barber",
  barbershop: "barber",
  barber_shop: "barber",
  hairstylist: "barber",
  hair_stylist: "barber",
  hair_salon: "barber",
  hair_color: "hair-color",
  makeup_artist: "makeup",
  makeup: "makeup",
  nail_technician: "makeup",
  locksmith: "locksmith",
  lock_smith: "locksmith",
  locksmith_service: "locksmith",
  restaurant: "restaurant",
  cafe: "restaurant",
  food: "restaurant",
  food_service: "restaurant",
  gas: "gas-station",
  gas_station: "gas-station",
  fuel: "gas-station",
  fuel_station: "gas-station",
  exchange: "money-exchange",
  money_exchange: "money-exchange",
  currency_exchange: "money-exchange",
  forex: "money-exchange",
};

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function slugifyTrazeValue(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function keyify(value) {
  return slugifyTrazeValue(value).replace(/-/g, "_");
}

function titleize(value) {
  const clean = text(value).replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!clean) return "";
  return clean
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCountryCode(value, phone = "") {
  const code = text(value).toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;

  const digits = text(phone).replace(/[^\d+]/g, "");
  if (digits.startsWith("+52")) return "MX";
  if (digits.startsWith("+1")) return "US";
  if (digits.startsWith("+502")) return "GT";
  if (digits.startsWith("+501")) return "BZ";
  if (digits.startsWith("+504")) return "HN";
  if (digits.startsWith("+503")) return "SV";
  if (digits.startsWith("+505")) return "NI";
  if (digits.startsWith("+506")) return "CR";
  if (digits.startsWith("+507")) return "PA";
  return null;
}

function normalizeStateCode(value) {
  const code = text(value);
  if (!code) return null;
  return code.length <= 4 ? code.toUpperCase() : code;
}

function maybeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHours(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function resolveService(row) {
  const rawSlug = slugifyTrazeValue(row?.service_slug || row?.service_name || row?.business_type || row?.service_id);
  const aliasKey = keyify(row?.service_slug || row?.business_type || row?.service_name);
  const serviceSlug = SERVICE_ALIASES[aliasKey] ?? rawSlug;
  const serviceId = text(row?.service_id) || (serviceSlug ? `svc-${serviceSlug}` : null);
  const serviceName = text(row?.service_name) || titleize(serviceSlug || row?.business_type);
  const categoryKey = slugifyTrazeValue(row?.business_type || serviceSlug || serviceName);

  return {
    serviceId,
    serviceSlug: serviceSlug || null,
    serviceName: serviceName || null,
    categoryKey: categoryKey || null,
    businessType: text(row?.business_type) || null,
  };
}

function contactHealth(provider) {
  const gaps = [
    !provider.phone && "phone",
    !provider.websiteUrl && "website",
    !provider.googleMapsUrl && !provider.addressText && "maps/address",
  ].filter(Boolean);

  return {
    score: Math.max(0, 100 - gaps.length * 34),
    gaps,
    label: gaps.length === 0 ? "Complete" : `Missing ${gaps.join(", ")}`,
  };
}

function rankScore(provider) {
  let score = provider.source === "vport" ? 55 : 30;
  if (provider.avatarUrl || provider.logoUrl) score += 10;
  if (provider.bannerUrl) score += 4;
  if (provider.phone) score += 10;
  if (provider.websiteUrl) score += 8;
  if (provider.addressText) score += 8;
  if (provider.hours) score += 5;
  if (provider.serviceSlug || provider.serviceId) score += 5;
  if (provider.citySlug) score += 5;
  return Math.min(score, 100);
}

export function mapProviderIndexRow(row) {
  const id = text(row?.id);
  const slug = slugifyTrazeValue(row?.slug);
  const displayName = text(row?.display_name);
  if (!id || !slug || !displayName) return null;

  const source = row.source === "seed" ? "seed" : "vport";
  const phone = text(row.phone) || null;
  const countryCode = normalizeCountryCode(row.country_code, phone);
  if (!countryCode) return null;

  const cityName = text(row.city_name) || null;
  const citySlug = slugifyTrazeValue(row.city_slug || row.city_name) || null;
  const service = resolveService(row);
  const provider = {
    id,
    source,
    sourceId: text(row.source_id) || null,
    slug,
    displayName,
    businessType: service.businessType,
    serviceId: service.serviceId,
    serviceSlug: service.serviceSlug,
    serviceName: service.serviceName,
    categoryKey: service.categoryKey,
    countryCode,
    stateCode: normalizeStateCode(row.state_code),
    cityName,
    citySlug,
    zipCode: text(row.zip_code) || null,
    neighborhoodName: null,
    neighborhoodSlug: null,
    addressText: text(row.address_text) || null,
    lat: maybeNumber(row.lat),
    lng: maybeNumber(row.lng),
    phone,
    websiteUrl: text(row.website_url) || null,
    instagramUrl: text(row.instagram_url) || null,
    facebookUrl: text(row.facebook_url) || null,
    googleMapsUrl: text(row.google_maps_url) || null,
    avatarUrl: text(row.avatar_url) || null,
    bannerUrl: text(row.banner_url) || null,
    logoUrl: text(row.logo_url) || null,
    hours: normalizeHours(row.hours),
    claimStatus: row.claim_status === "claimed" ? "claimed" : "unclaimed",
    isActive: row.is_active === true,
    isIndexable: row.is_indexable === true,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    currencyCode: COUNTRY_TO_CURRENCY[countryCode] ?? "USD",
  };

  return {
    ...provider,
    isClaimed: provider.claimStatus === "claimed" || provider.source === "vport",
    hasContact: Boolean(provider.phone || provider.websiteUrl || provider.googleMapsUrl || provider.addressText),
    hasLocation: Boolean(provider.countryCode && provider.citySlug),
    hasService: Boolean(provider.serviceSlug || provider.serviceId || provider.businessType),
    contactHealth: contactHealth(provider),
    rankScore: rankScore(provider),
  };
}
