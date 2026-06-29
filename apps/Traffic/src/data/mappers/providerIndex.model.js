/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */

const COUNTRY_TO_CURRENCY = {
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  GT: "GTQ",
  BZ: "BZD",
  HN: "HNL",
  SV: "USD",
  NI: "NIO",
  CR: "CRC",
  PA: "USD"
};

const TYPE_TO_SERVICE_ID = {
  barber: "svc-barber",
  hairstylist: "svc-barber",
  esthetician: "svc-barber",
  barbershop: "svc-barber",
  barber_shop: "svc-barber",
  hair_stylist: "svc-barber",
  hair_salon: "svc-barber",
  hair_color: "svc-hair-color",
  makeup_artist: "svc-makeup",
  makeup: "svc-makeup",
  nail_technician: "svc-makeup",
  locksmith: "svc-locksmith",
  lock_smith: "svc-locksmith",
  locksmith_service: "svc-locksmith",
  restaurant: "svc-restaurant",
  baker: "svc-restaurant",
  caterer: "svc-restaurant",
  chef: "svc-restaurant",
  cook: "svc-restaurant",
  bartender: "svc-restaurant",
  cafe: "svc-restaurant",
  food: "svc-restaurant",
  food_service: "svc-restaurant",
  dining: "svc-restaurant",
  gas_station: "svc-gas-station",
  gas: "svc-gas-station",
  fuel: "svc-gas-station",
  fuel_station: "svc-gas-station",
  service_station: "svc-gas-station",
  exchange: "svc-money-exchange",
  money_exchange: "svc-money-exchange",
  currency_exchange: "svc-money-exchange",
  forex: "svc-money-exchange",
  financial: "svc-money-exchange"
};

const SERVICE_SLUG_TO_SERVICE_ID = {
  barber: "svc-barber",
  barbershop: "svc-barber",
  "hair-color": "svc-hair-color",
  hair_color: "svc-hair-color",
  makeup: "svc-makeup",
  locksmith: "svc-locksmith",
  restaurant: "svc-restaurant",
  "gas-station": "svc-gas-station",
  gas_station: "svc-gas-station",
  "money-exchange": "svc-money-exchange",
  money_exchange: "svc-money-exchange",
  exchange: "svc-money-exchange"
};

const CITY_SLUG_TO_ID = {
  "san-francisco": "city-sf",
  "los-angeles": "city-los-angeles",
  "san-diego": "city-san-diego",
  miami: "city-miami",
  orlando: "city-orlando",
  tampa: "city-tampa",
  houston: "city-houston",
  "san-antonio": "city-san-antonio",
  dallas: "city-dallas",
  "el-paso": "city-el-paso",
  mcallen: "city-mcallen",
  brownsville: "city-brownsville",
  laredo: "city-laredo",
  phoenix: "city-phoenix",
  "las-vegas": "city-las-vegas",
  "new-york": "city-new-york",
  chicago: "city-chicago",
  "mexico-city": "city-mexico-city",
  monterrey: "city-monterrey",
  tijuana: "city-tijuana",
  "ciudad-juarez": "city-ciudad-juarez",
  guadalajara: "city-guadalajara",
  cancun: "city-cancun",
  puebla: "city-puebla",
  mexicali: "city-mexicali",
  matamoros: "city-matamoros",
  reynosa: "city-reynosa",
  "nuevo-laredo": "city-nuevo-laredo",
  hermosillo: "city-hermosillo",
  "guatemala-city": "city-guatemala-city",
  "belize-city": "city-belize-city",
  tegucigalpa: "city-tegucigalpa",
  "san-salvador": "city-san-salvador",
  managua: "city-managua",
  "san-jose": "city-san-jose-cr",
  "panama-city": "city-panama-city"
};

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Only trust media hosted on our own CDN. Seed intake harvests ephemeral,
// hotlink-protected third-party photo URLs (e.g. Google Places
// lh3.googleusercontent.com/gps-cs-s/...) that fail to load cross-origin from
// the static site. Anything not on the platform CDN resolves to null so the
// card renders its branded icon fallback instead of a broken image.
function cdnMediaUrl(value) {
  const url = safeStr(value);
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return null;
    const onPlatformCdn =
      hostname === "cdn.vibezcitizens.com" || hostname.endsWith(".vibezcitizens.com");
    return onPlatformCdn ? url : null;
  } catch {
    return null;
  }
}

function normalizeKey(value) {
  return safeStr(value)
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
}

function normalizeSlug(value) {
  return safeStr(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCountryCode(value, phone = "") {
  const code = safeStr(value).toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;

  const digits = safeStr(phone).replace(/[^\d+]/g, "");
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

function normalizeRegionCode(value) {
  const region = safeStr(value);
  if (!region) return null;
  return region.length <= 3 ? region.toUpperCase() : region;
}

function maybeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function resolveStaticServiceId(row) {
  const serviceSlug = safeStr(row.service_slug).toLowerCase();
  return (
    SERVICE_SLUG_TO_SERVICE_ID[serviceSlug] ??
    SERVICE_SLUG_TO_SERVICE_ID[serviceSlug.replace(/-/g, "_")] ??
    TYPE_TO_SERVICE_ID[normalizeKey(row.business_type)] ??
    TYPE_TO_SERVICE_ID[normalizeKey(row.service_name)] ??
    null
  );
}

function resolveCityId(countryCode, citySlug, source) {
  if (!citySlug) return null;
  return CITY_SLUG_TO_ID[citySlug] ?? `${source}-city:${countryCode}:${citySlug}`;
}

function resolveLocationText({ cityName, regionCode, addressText }) {
  const place = [cityName, regionCode].filter(Boolean).join(", ");
  return place || safeStr(addressText) || null;
}

function hasPublicContact(provider, row) {
  return Boolean(
    provider.phoneE164 ||
    provider.websiteUrl ||
    provider.addressLine1 ||
    provider.locationText ||
    row.google_maps_url
  );
}

function computeRankScore(provider, row, serviceId) {
  let score = row.source === "vport" ? 55 : 30;
  if (provider.avatarUrl || provider.logoUrl) score += 12;
  if (provider.bannerUrl) score += 5;
  if (provider.phoneE164) score += 10;
  if (provider.websiteUrl) score += 8;
  if (provider.addressLine1) score += 8;
  if (provider.hours) score += 5;
  if (serviceId) score += 5;
  if (provider.primaryCitySlug) score += 5;
  return Math.min(score, 100);
}

/**
 * Maps one row from vport.public_traze_provider_index_v to TRAZE's Provider shape.
 * @param {Object} row
 * @returns {{ provider: Provider, providerServices: ProviderService[], providerStats: ProviderStats } | null}
 */
export function mapProviderIndexRowToProvider(row) {
  const id = safeStr(row?.id);
  const slug = normalizeSlug(row?.slug);
  const displayName = safeStr(row?.display_name);
  if (!id || !slug || !displayName) return null;

  const source = row.source === "seed" ? "seed" : "vport";
  const phone = safeStr(row.phone) || null;
  const countryCode = normalizeCountryCode(row.country_code, phone);
  if (!countryCode) return null;
  const regionCode = normalizeRegionCode(row.state_code);
  const cityName = safeStr(row.city_name) || null;
  const citySlug = normalizeSlug(row.city_slug || row.city_name) || null;
  const primaryCityId = resolveCityId(countryCode, citySlug, source);
  const serviceId = resolveStaticServiceId(row);
  const addressLine1 = safeStr(row.address_text) || null;
  const claimStatus = row.claim_status === "claimed" ? "claimed" : "unclaimed";
  const shortBio =
    source === "seed"
      ? `${displayName} is listed on TRAZE as an unclaimed local business.`
      : `Visit ${displayName} on Vibez Citizens.`;

  /** @type {Provider} */
  const provider = {
    id,
    slug,
    displayName,
    primaryCountryCode: countryCode,
    primaryRegionCode: regionCode,
    primaryCityId,
    primaryLocalityId: null,
    addressLine1,
    postalCode: safeStr(row.zip_code) || null,
    phoneE164: phone,
    currencyCode: COUNTRY_TO_CURRENCY[countryCode] ?? "USD",
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio,
    isActive: row.is_active === true,
    isIndexable: row.is_indexable === true,
    claimStatus,
    vcsmActorId: null,
    vcsmSlug: source === "vport" ? slug : null,
    claimedAt: source === "vport" && row.created_at ? new Date(row.created_at).toISOString() : null,
    avatarUrl: cdnMediaUrl(row.avatar_url),
    bannerUrl: cdnMediaUrl(row.banner_url),
    logoUrl: cdnMediaUrl(row.logo_url),
    locationText: resolveLocationText({ cityName, regionCode, addressText: addressLine1 }),
    cityId: null,
    primaryCityName: cityName,
    primaryCitySlug: citySlug,
    categoryKey: normalizeKey(row.business_type || row.service_slug || row.service_name) || null,
    timezone: null,
    directoryVisible: false,
    directoryStatus: row.is_indexable === true ? "listed" : "unlisted",
    email: null,
    websiteUrl: safeStr(row.website_url) || null,
    bookingUrl: null,
    hours: normalizeHours(row.hours),
    lat: maybeNumber(row.lat),
    lng: maybeNumber(row.lng),
    source,
    sourceProviderId: safeStr(row.source_id) || null,
    businessType: safeStr(row.business_type) || null,
    platformProfileUrl: null,
    googleMapsUrl: safeStr(row.google_maps_url) || null,
    instagramUrl: safeStr(row.instagram_url) || null,
    facebookUrl: safeStr(row.facebook_url) || null
  };

  provider.directoryVisible =
    provider.isActive &&
    provider.slug.length > 0 &&
    (source === "vport" || hasPublicContact(provider, row));

  const providerServices = serviceId
    ? [{
        id: `${source}-service-${id}-${serviceId}`,
        providerId: provider.id,
        serviceId,
        specialtyId: null,
        priceFromCents: null,
        priceToCents: null,
        currencyCode: provider.currencyCode,
        isActive: true
      }]
    : [];

  /** @type {ProviderStats} */
  const providerStats = {
    providerId: provider.id,
    ratingAvg: 0,
    reviewCount: 0,
    bookingCount30d: 0,
    responseRate: source === "vport" ? 100 : 0,
    responseTimeP50Minutes: 30,
    rankScore: computeRankScore(provider, row, serviceId),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString()
  };

  return { provider, providerServices, providerStats };
}
