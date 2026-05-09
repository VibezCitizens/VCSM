const TRAZE_SELECTED_MARKET_KEY = "traffic-selected-market-v1";
const TRAZE_DETECTED_LOCATION_KEY = "traffic-detected-location-v1";
const TRAZE_LEGACY_KEY = "traffic-location-v1";

export const TRAZE_LOCATION_CHANGE_EVENT = "traffic-location-change";

// Backward-compat alias — external code that imported TRAZE_LOCATION_STORAGE_KEY still works.
export const TRAZE_LOCATION_STORAGE_KEY = TRAZE_SELECTED_MARKET_KEY;

function readJson(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeStoredLocation(value) {
  if (!value || typeof value !== "object") return null;

  const countryCode = String(value.country_code ?? value.countryCode ?? "").trim().toUpperCase();
  const countrySlug = String(value.country_slug ?? value.countrySlug ?? "").trim();
  const citySlug = String(value.city_slug ?? value.citySlug ?? "").trim();
  const cityName = String(value.city_name ?? value.cityName ?? (citySlug ? value.name ?? "" : "")).trim();
  const stateCode = String(value.state_code ?? value.stateCode ?? "").trim();
  const label = String(value.label ?? "").trim();

  if (!countryCode && !countrySlug && !citySlug) return null;

  return {
    countryCode: countryCode || null,
    countrySlug: countrySlug || null,
    citySlug: citySlug || null,
    cityName: cityName || null,
    stateCode: stateCode || null,
    label: label || null
  };
}

function normalizeCountryCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeCitySlug(value) {
  return String(value ?? "").trim();
}

function migrateFromLegacyKey() {
  try {
    const old = localStorage.getItem(TRAZE_LEGACY_KEY);
    if (!old) return;
    if (!localStorage.getItem(TRAZE_SELECTED_MARKET_KEY)) {
      localStorage.setItem(TRAZE_SELECTED_MARKET_KEY, old);
    }
    localStorage.removeItem(TRAZE_LEGACY_KEY);
  } catch {
    // localStorage unavailable — ignore
  }
}

export function buildTrazeLocationKey(location) {
  const countryCode = normalizeCountryCode(location?.countryCode ?? location?.country_code);
  const citySlug = normalizeCitySlug(location?.citySlug ?? location?.city_slug);
  return countryCode && citySlug ? `${countryCode}:${citySlug}` : null;
}

export function findLiveTrazeLocationOption(location, locationOptions = []) {
  const normalized = normalizeStoredLocation(location);
  if (!normalized?.citySlug) return null;

  const countryCode = normalizeCountryCode(normalized.countryCode);
  const citySlug = normalizeCitySlug(normalized.citySlug);

  if (countryCode) {
    return locationOptions.find((option) =>
      normalizeCountryCode(option.countryCode) === countryCode &&
      normalizeCitySlug(option.citySlug) === citySlug
    ) ?? null;
  }

  const matches = locationOptions.filter((option) =>
    normalizeCitySlug(option.citySlug) === citySlug
  );

  return matches.length === 1 ? matches[0] : null;
}

export function findLiveTrazeCountryOption(location, countryOptions = []) {
  const normalized = normalizeStoredLocation(location);
  if (!normalized) return null;

  const countryCode = normalizeCountryCode(normalized.countryCode);
  const countrySlug = String(normalized.countrySlug ?? "").trim();

  return countryOptions.find((country) =>
    (countryCode && normalizeCountryCode(country.countryCode) === countryCode) ||
    (countrySlug && String(country.countrySlug ?? "").trim() === countrySlug)
  ) ?? null;
}

export function validateStoredTrazeLocation(location, {
  countryOptions = [],
  locationOptions = []
} = {}) {
  const normalized = normalizeStoredLocation(location);
  if (!normalized) return null;

  const liveCity = findLiveTrazeLocationOption(normalized, locationOptions);
  if (liveCity) return liveCity;

  const liveCountry = findLiveTrazeCountryOption(normalized, countryOptions);
  if (liveCountry) return liveCountry;

  return null;
}

export function readStoredTrazeLocation() {
  if (typeof window === "undefined") return null;

  try {
    migrateFromLegacyKey();
    const stored = normalizeStoredLocation(readJson(localStorage.getItem(TRAZE_SELECTED_MARKET_KEY)));
    if (stored) return stored;
    return null;
  } catch {
    return null;
  }
}

export function writeStoredTrazeLocation(location) {
  if (typeof window === "undefined") return;

  const normalized = normalizeStoredLocation(location);

  try {
    if (normalized) {
      localStorage.setItem(
        TRAZE_SELECTED_MARKET_KEY,
        JSON.stringify({
          countryCode: normalized.countryCode,
          countrySlug: normalized.countrySlug,
          citySlug: normalized.citySlug,
          cityName: normalized.cityName,
          stateCode: normalized.stateCode,
          label: normalized.label
        })
      );
    } else {
      localStorage.removeItem(TRAZE_SELECTED_MARKET_KEY);
    }
  } catch {
    // localStorage unavailable in private browsing modes.
  }

  window.dispatchEvent(
    new CustomEvent(TRAZE_LOCATION_CHANGE_EVENT, {
      detail: normalized
    })
  );
}

export function readDetectedTrazeLocation() {
  if (typeof window === "undefined") return null;

  try {
    const raw = readJson(localStorage.getItem(TRAZE_DETECTED_LOCATION_KEY));
    if (!raw || typeof raw !== "object") return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeDetectedTrazeLocation(data) {
  if (typeof window === "undefined") return;

  try {
    if (data) {
      localStorage.setItem(TRAZE_DETECTED_LOCATION_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(TRAZE_DETECTED_LOCATION_KEY);
    }
  } catch {
    // localStorage unavailable — ignore
  }
}
