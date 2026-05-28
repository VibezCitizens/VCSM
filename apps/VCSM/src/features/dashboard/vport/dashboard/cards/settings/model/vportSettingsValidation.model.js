// Moved from: dashboard/vport/screens/lib/vportSettingsValidation.js
// VPD-V-FIX-005: Validation helpers belong in the model layer, not screens/lib/.
// Logic is unchanged — pure functions only.

const REQUIRED_ADDRESS_KEYS = ["line1", "city", "state", "zip", "country"];
const US_PHONE_DIGITS = 10;
const US_STATE_LETTERS = 2;
const US_ZIP_DIGITS = 5;
const CITY_REGEX = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/;
const COUNTRY_REGEX = /^[A-Z]{2}$/;

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeCity(value) {
  return normalizeWhitespace(String(value || "").replace(/[^A-Za-z\s.'-]/g, " "));
}

export function normalizeState(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

export function normalizeZip(value) {
  return String(value || "").replace(/\D+/g, "");
}

export function normalizeCountry(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

export function normalizeAddress(address) {
  const raw = address && typeof address === "object" ? address : {};
  return {
    line1: normalizeWhitespace(raw.line1),
    line2: normalizeWhitespace(raw.line2),
    city: normalizeCity(raw.city),
    state: normalizeState(raw.state),
    zip: normalizeZip(raw.zip),
    country: normalizeCountry(raw.country),
  };
}

export function hasAnyAddressValue(address) {
  return Object.values(address).some((value) => String(value || "").trim().length > 0);
}

export function hasCompleteAddress(address) {
  return REQUIRED_ADDRESS_KEYS.every(
    (key) => String(address?.[key] || "").trim().length > 0
  );
}

export function getAddressValidationError(address) {
  const city = String(address?.city || "").trim();
  const state = String(address?.state || "").trim();
  const zip = String(address?.zip || "").trim();
  const country = String(address?.country || "").trim();

  if (!CITY_REGEX.test(city)) return "Enter a valid city name.";
  if (!new RegExp(`^[A-Z]{${US_STATE_LETTERS}}$`).test(state)) return "State must be a 2-letter code (e.g. TX).";
  if (!new RegExp(`^\\d{${US_ZIP_DIGITS}}$`).test(zip)) return "ZIP must be 5 digits.";
  if (!COUNTRY_REGEX.test(country)) return "Country must be a 2-letter code (e.g. US).";
  return "";
}

export function normalizePhoneDigits(value) {
  const raw = String(value || "").replace(/\D+/g, "");
  const withoutCountryCode =
    raw.length > US_PHONE_DIGITS && raw.startsWith("1") ? raw.slice(1) : raw;
  return withoutCountryCode.slice(0, US_PHONE_DIGITS);
}

export { US_PHONE_DIGITS };
