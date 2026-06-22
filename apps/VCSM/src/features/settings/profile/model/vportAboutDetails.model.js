export const US_PHONE_DIGITS = 10;
export const US_STATE_LETTERS = 2;
export const US_ZIP_DIGITS = 5;

export function toPhoneDigits(value) {
  const raw = String(value || "").replace(/\D+/g, "");
  const withoutCountryCode =
    raw.length > US_PHONE_DIGITS && raw.startsWith("1") ? raw.slice(1) : raw;
  return withoutCountryCode.slice(0, US_PHONE_DIGITS);
}

export function formatPhoneDisplay(value) {
  const digits = toPhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function sanitizeCityInput(value) {
  return String(value || "").replace(/[^A-Za-z\s.'-]/g, "");
}

export function sanitizeStateInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, US_STATE_LETTERS);
}

export function sanitizeZipInput(value) {
  return String(value || "")
    .replace(/\D+/g, "")
    .slice(0, US_ZIP_DIGITS);
}

export function sanitizeCountryInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}
