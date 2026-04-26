/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */

/**
 * @typedef {Object} MappedVportRow
 * @property {Provider} provider
 * @property {ProviderService|null} providerService
 * @property {ProviderStats} providerStats
 */

// ISO 3166-1 alpha-2 → currency code
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

// category_key (from vport.categories) → TRAZE service ID
// Keys must match vport.categories exactly (confirmed against seed + schema).
const VPORT_TYPE_TO_SERVICE_ID = {
  // Beauty & grooming
  barber: "svc-barber",
  hairstylist: "svc-barber",       // exact DB key
  esthetician: "svc-barber",
  // Legacy / alternate spellings (not DB keys — kept for safety)
  barbershop: "svc-barber",
  barber_shop: "svc-barber",
  hair_stylist: "svc-barber",
  hair_salon: "svc-barber",
  hair_color: "svc-hair-color",
  makeup_artist: "svc-makeup",     // exact DB key
  makeup: "svc-makeup",
  nail_technician: "svc-makeup",
  // Locksmith
  locksmith: "svc-locksmith",      // exact DB key
  lock_smith: "svc-locksmith",
  locksmith_service: "svc-locksmith",
  // Food & hospitality
  restaurant: "svc-restaurant",    // exact DB key
  baker: "svc-restaurant",
  caterer: "svc-restaurant",
  chef: "svc-restaurant",
  cook: "svc-restaurant",
  bartender: "svc-restaurant",
  cafe: "svc-restaurant",
  food: "svc-restaurant",
  food_service: "svc-restaurant",
  dining: "svc-restaurant",
  // Gas & fuel
  gas_station: "svc-gas-station",  // exact DB key
  gas: "svc-gas-station",
  fuel: "svc-gas-station",
  fuel_station: "svc-gas-station",
  service_station: "svc-gas-station",
  // Money exchange
  exchange: "svc-money-exchange",  // exact DB key
  money_exchange: "svc-money-exchange",
  currency_exchange: "svc-money-exchange",
  forex: "svc-money-exchange",
  financial: "svc-money-exchange"
};

// Normalized city name (lowercase, trimmed) → TRAZE city ID.
// Must stay in sync with MOCK_CITIES in mockDataset.js.
const CITY_NAME_TO_ID = {
  "san francisco": "city-sf",
  "miami": "city-miami",
  "toronto": "city-toronto",
  "mexico city": "city-mexico-city",
  "london": "city-london",
  "madrid": "city-madrid",
  "paris": "city-paris",
  "berlin": "city-berlin",
  "dubai": "city-dubai",
  "sao paulo": "city-sao-paulo",
  "mumbai": "city-mumbai",
  "laredo": "city-laredo"
};

// ─── UUID validation ──────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value ?? "").trim());
}

// ─── Location helpers ─────────────────────────────────────────────────────────

function safeStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractAddressObj(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  return {};
}

function resolveCityId(address, locationText) {
  const fromAddress = safeStr(address.city).toLowerCase();
  if (fromAddress && CITY_NAME_TO_ID[fromAddress]) {
    return CITY_NAME_TO_ID[fromAddress];
  }

  if (locationText) {
    const firstSegment = safeStr(locationText.split(",")[0]).toLowerCase();
    if (firstSegment && CITY_NAME_TO_ID[firstSegment]) {
      return CITY_NAME_TO_ID[firstSegment];
    }
  }

  // Fallback: all current live VPORTs are in Laredo, TX
  return "city-laredo";
}

function resolveCountryCode(address, _locationText) {
  const fromAddress = safeStr(address.country).toUpperCase();
  if (fromAddress.length === 2) return fromAddress;

  // locationText like "Laredo, TX" doesn't include country — default US
  return "US";
}

function resolveRegionCode(address, locationText) {
  const fromAddress = safeStr(address.state).toUpperCase();
  if (fromAddress) return fromAddress;

  // Parse "City, ST" or "City, ST ZIP" format
  if (locationText) {
    const parts = safeStr(locationText).split(",");
    if (parts.length >= 2) {
      const stateToken = (parts[1].trim().split(/\s+/)[0] ?? "").toUpperCase();
      if (stateToken.length === 2) return stateToken;
    }
  }

  return null;
}

// ─── Service ID resolver ──────────────────────────────────────────────────────

function resolveServiceId(vportType, categoryKey, slug) {
  // 1. category_key from profile_categories (most authoritative)
  if (categoryKey) {
    const mapped = VPORT_TYPE_TO_SERVICE_ID[safeStr(categoryKey).toLowerCase()];
    if (mapped) return mapped;
  }

  // 2. vport_type from profiles
  if (vportType) {
    const mapped = VPORT_TYPE_TO_SERVICE_ID[safeStr(vportType).toLowerCase()];
    if (mapped) return mapped;
  }

  // 3. Slug-based inference for unmapped types
  const s = safeStr(slug).toLowerCase();
  if (s.includes("barber") || s.includes("bar-ber") || s.includes("fade") || s.includes("cut")) return "svc-barber";
  if (s.includes("lock") || s.includes("locksmith") || s.includes("key")) return "svc-locksmith";
  if (s.includes("restaurant") || s.includes("food") || s.includes("eat") || s.includes("cafe")) return "svc-restaurant";
  if (s.includes("gas") || s.includes("fuel") || s.includes("station")) return "svc-gas-station";
  if (s.includes("money") || s.includes("exchange") || s.includes("currency") || s.includes("forex")) return "svc-money-exchange";

  return null;
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

/**
 * Maps a flattened Supabase VPORT row into TRAZE's Provider/ProviderService/ProviderStats shape.
 *
 * The row must be pre-flattened by vportDataset.js before being passed here
 * (profile_public_details and profile_categories already extracted to top-level keys).
 *
 * @param {Object} row
 * @returns {MappedVportRow | null}  null if the row is missing required fields
 */
export function mapVportRowToProvider(row) {
  if (!row || !row.id || !row.slug) return null;

  const id = String(row.id);
  const slug = String(row.slug);
  const address = extractAddressObj(row.address);
  const locationText = safeStr(row.location_text);

  const primaryCountryCode = row.country_code
    ? String(row.country_code).toUpperCase()
    : resolveCountryCode(address, locationText);
  const primaryRegionCode = resolveRegionCode(address, locationText);
  const primaryCityId = resolveCityId(address, locationText);
  const currencyCode = COUNTRY_TO_CURRENCY[primaryCountryCode] ?? "USD";

  const rawName = safeStr(row.name) || slug;
  const rawBio = safeStr(row.bio) || `Visit ${rawName} on Vibez Citizens.`;
  const claimedAt = row.created_at ? new Date(row.created_at).toISOString() : null;

  const serviceId = resolveServiceId(row.vport_type, row.category_key, slug);

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
    isIndexable: Boolean(row.is_active) && slug.length > 0,
    claimStatus: isUuid(row.actor_id) ? "claimed" : "unclaimed",
    // vcsmSlug equals slug — VPORTs use the same slug on both platforms
    vcsmActorId: isUuid(row.actor_id) ? String(row.actor_id) : null,
    vcsmSlug: slug,
    claimedAt,
    avatarUrl: safeStr(row.avatar_url) || null,
    bannerUrl: safeStr(row.banner_url) || null,
    locationText: safeStr(row.location_text) || null
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
