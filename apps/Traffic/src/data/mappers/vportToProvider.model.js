/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */

/**
 * @typedef {Object} MappedVportRow
 * @property {Provider} provider
 * @property {ProviderService|null} providerService
 * @property {ProviderStats} providerStats
 */

const COUNTRY_TO_CURRENCY = {
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  GB: "GBP",
  ES: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  AE: "AED",
  BR: "BRL",
  IN: "INR",
  AU: "AUD",
  JP: "JPY",
  CN: "CNY"
};

const VPORT_TYPE_TO_SERVICE_ID = {
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

// Keep compatibility with legacy city lookups while routing now keys off primaryCitySlug.
const CITY_SLUG_TO_ID = {
  "san-francisco": "city-sf",
  "miami": "city-miami",
  "toronto": "city-toronto",
  "mexico-city": "city-mexico-city",
  "london": "city-london",
  "madrid": "city-madrid",
  "paris": "city-paris",
  "berlin": "city-berlin",
  "dubai": "city-dubai",
  "sao-paulo": "city-sao-paulo",
  "mumbai": "city-mumbai",
  "laredo": "city-laredo"
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value ?? "").trim());
}

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value) {
  return safeStr(value).toLowerCase();
}

function extractAddressObj(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  return {};
}

function resolveCountryCode(address, row) {
  const structured = safeStr(row.city_country_code ?? row.country_code).toUpperCase();
  if (structured.length === 2) return structured;

  const fromAddress = safeStr(address.country_code ?? address.countryCode ?? address.country).toUpperCase();
  if (fromAddress.length === 2) return fromAddress;

  return "US";
}

function resolveRegionCode(address, row) {
  const fromStructured = safeStr(row.state_code).toUpperCase();
  if (fromStructured) return fromStructured;

  const fromAddress = safeStr(address.state ?? address.region ?? address.province).toUpperCase();
  if (fromAddress) return fromAddress;

  return null;
}

function resolveServiceId(categoryKey, slug) {
  const normalizedCategoryKey = normalizeSlug(categoryKey);
  if (normalizedCategoryKey) {
    const mapped = VPORT_TYPE_TO_SERVICE_ID[normalizedCategoryKey];
    if (mapped) return mapped;
  }

  const s = normalizeSlug(slug);
  if (s.includes("barber") || s.includes("fade") || s.includes("cut")) return "svc-barber";
  if (s.includes("lock") || s.includes("locksmith") || s.includes("key")) return "svc-locksmith";
  if (s.includes("restaurant") || s.includes("food") || s.includes("cafe")) return "svc-restaurant";
  if (s.includes("gas") || s.includes("fuel") || s.includes("station")) return "svc-gas-station";
  if (s.includes("money") || s.includes("exchange") || s.includes("currency") || s.includes("forex")) return "svc-money-exchange";

  return null;
}

function resolveLegacyCityId(countryCode, citySlug) {
  if (!citySlug) {
    return null;
  }

  const mapped = CITY_SLUG_TO_ID[citySlug];
  if (mapped) {
    return mapped;
  }

  // Structured fallback token for city slugs not present in static city taxonomy.
  return `vport-city:${countryCode}:${citySlug}`;
}

/**
 * Maps a flattened Supabase VPORT row into TRAZE's Provider/ProviderService/ProviderStats shape.
 *
 * Routing fields now come from structured city fields on vport.public_traze_profiles_v.
 * location_text remains display-only fallback.
 *
 * @param {Object} row
 * @returns {MappedVportRow | null}
 */
export function mapVportRowToProvider(row) {
  if (!row || !row.id || !row.slug) return null;

  const id = String(row.id);
  const slug = String(row.slug);
  const address = extractAddressObj(row.address);
  const locationText = safeStr(row.location_text);

  const cityId = safeStr(row.city_id) || null;
  const primaryCitySlug = normalizeSlug(row.city_slug) || null;
  const primaryCityName = safeStr(row.city) || null;

  const primaryCountryCode = resolveCountryCode(address, row);
  const primaryRegionCode = resolveRegionCode(address, row);

  // Structured city routing only.
  const primaryCityId =
    cityId && primaryCitySlug
      ? resolveLegacyCityId(primaryCountryCode, primaryCitySlug)
      : null;

  const currencyCode = COUNTRY_TO_CURRENCY[primaryCountryCode] ?? "USD";

  const rawName = safeStr(row.name) || slug;
  const rawBio = safeStr(row.bio) || `Visit ${rawName} on Vibez Citizens.`;
  const claimedAt = row.created_at ? new Date(row.created_at).toISOString() : null;

  const categoryKey = normalizeSlug(row.category_key) || null;
  const serviceId = resolveServiceId(categoryKey, slug);

  const directoryVisible = row.directory_visible === true;
  const directoryStatus = normalizeSlug(row.directory_status) || null;
  const isDirectoryActive = directoryStatus === "listed";

  /** @type {Provider} */
  const provider = {
    id,
    slug,
    displayName: rawName,
    primaryCountryCode,
    primaryRegionCode,
    primaryCityId,
    primaryLocalityId: null,
    addressLine1: safeStr(address.street ?? address.address_line1) || null,
    postalCode: safeStr(address.postal_code ?? address.zip) || null,
    phoneE164: safeStr(row.phone_public) || null,
    currencyCode,
    serviceAreaMode: "fixed_location",
    serviceAreaSummary: null,
    shortBio: rawBio,
    isActive: Boolean(row.is_active),
    isIndexable: Boolean(row.is_active) && directoryVisible && isDirectoryActive && slug.length > 0,
    claimStatus: isUuid(row.actor_id) ? "claimed" : "unclaimed",
    vcsmActorId: isUuid(row.actor_id) ? String(row.actor_id) : null,
    vcsmSlug: slug,
    claimedAt,
    avatarUrl: safeStr(row.avatar_url) || null,
    bannerUrl: safeStr(row.banner_url) || null,
    locationText: locationText || null,
    cityId,
    primaryCityName,
    primaryCitySlug,
    categoryKey,
    timezone: safeStr(row.timezone) || null,
    directoryVisible,
    directoryStatus
  };

  /** @type {ProviderService | null} */
  const providerService = serviceId
    ? {
        id: `vps-${id}`,
        providerId: id,
        serviceId,
        specialtyId: null,
        priceFromCents: null,
        priceToCents: null,
        currencyCode,
        isActive: true
      }
    : null;

  /** @type {ProviderStats} */
  const providerStats = {
    providerId: id,
    ratingAvg: 0,
    reviewCount: 0,
    bookingCount30d: 0,
    responseRate: 100,
    responseTimeP50Minutes: 30,
    rankScore: 50,
    updatedAt: claimedAt ?? new Date().toISOString()
  };

  return { provider, providerService, providerStats };
}
