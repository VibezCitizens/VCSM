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

// Validate against lenient-but-NON-LOSSY values: collapse whitespace, upper-case
// state/country, and strip zip formatting — but never coerce invalid *content*
// into a valid shape. Callers must pass the raw (un-normalized) address; passing
// a lossily-normalized address would mask bad input (e.g. normalizeCity turns
// "M1ami" into "M ami", and normalizeCountry truncates "USA" to "US").
export function getAddressValidationError(address) {
  const city = normalizeWhitespace(address?.city);
  const state = String(address?.state || "").trim().toUpperCase();
  const zip = String(address?.zip || "").replace(/\D+/g, "");
  const country = String(address?.country || "").trim().toUpperCase();

  if (!CITY_REGEX.test(city)) return "Enter a valid city name.";
  if (!new RegExp(`^[A-Z]{${US_STATE_LETTERS}}$`).test(state)) return "State must be a 2-letter code (e.g. TX).";
  if (!new RegExp(`^\\d{${US_ZIP_DIGITS}}$`).test(zip)) return "ZIP must be 5 digits.";
  if (!COUNTRY_REGEX.test(country)) return "Country must be a 2-letter code (e.g. US).";
  return "";
}

export function normalizePhoneDigits(value) {
  const raw = String(value || "").replace(/\D+/g, "");
  // Strip a leading US country code only on an exact 11-digit number (1 + 10).
  // Do NOT truncate longer inputs — an over-long number must stay over-long so
  // the caller's length check rejects it instead of silently coercing it to 10.
  return raw.length === US_PHONE_DIGITS + 1 && raw.startsWith("1")
    ? raw.slice(1)
    : raw;
}

export { US_PHONE_DIGITS };
