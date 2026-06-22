/**
 * qrUrlBuilders.js
 *
 * Centralized QR code URL builders for VCSM.
 *
 * Rules:
 * - Never hardcode domain names (no vibezcitizens.com).
 * - Always use window.location.origin when available for staging/production parity.
 * - All builders require a resolved canonical slug — never call with a raw UUID.
 * - Slugs are safely encoded before use.
 *
 * Layer: shared/lib — pure utility, no side effects, no React.
 */

/**
 * Returns the current origin, safe for both browser and SSR contexts.
 * @returns {string}
 */
function getOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

/**
 * Safely encode a slug for use in a URL path.
 * Canonical slugs are already URL-safe, but this guards against edge cases.
 * @param {string} slug
 * @returns {string}
 */
function encodeSlug(slug) {
  return encodeURIComponent(String(slug).trim());
}

/**
 * UUID pattern — raw UUIDs must never appear in public-facing QR codes or URLs.
 * Used internally by all QR builders and exported for view-layer guards.
 * Consumers should import isQrSafeSlug rather than redeclaring this pattern locally.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true when a slug is safe to encode into a QR code or public URL.
 * Rejects null, empty strings, and raw UUIDs.
 *
 * Import this in view components instead of declaring UUID_RE locally — it is
 * the single source of truth for the QR safe-slug contract (VENOM V-006).
 *
 * @param {string|null|undefined} slug
 * @returns {boolean}
 */
export function isQrSafeSlug(slug) {
  const value = String(slug ?? "").trim();
  return !!value && !UUID_RE.test(value);
}

/**
 * Build the public reviews page URL for a QR code.
 * Returns "" if slug is absent or is a raw UUID (defense-in-depth — VENOM V-006).
 * @param {string} slug — canonical slug (e.g. "abc123-marias-restaurant-laredo-tx")
 * @returns {string} absolute URL
 */
export function buildReviewsQrUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";
  return `${getOrigin()}/profile/${encodeSlug(slug)}/reviews`;
}

/**
 * Build the business card URL for a QR code.
 * Returns "" if slug is absent or is a raw UUID (defense-in-depth — VENOM V-006).
 * @param {string} slug — canonical slug
 * @returns {string} absolute URL
 */
export function buildBusinessCardQrUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";
  return `${getOrigin()}/vport/${encodeSlug(slug)}/card`;
}

/**
 * Build the public menu URL for a QR code.
 * Returns "" if slug is absent or is a raw UUID (defense-in-depth — VENOM V-006).
 * @param {string} slug — canonical slug
 * @returns {string} absolute URL
 */
export function buildMenuQrUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";
  return `${getOrigin()}/profile/${encodeSlug(slug)}/menu`;
}

/**
 * Build a short display URL for print flyers — no protocol prefix, uses
 * the current hostname so staging and local environments stay consistent.
 * Path mirrors the canonical public menu route: /profile/:slug/menu.
 *
 * Rules:
 * - Never hardcode a domain name here.
 * - Always derives hostname from window.location (origin-safe).
 * - Falls back to empty string when slug is absent.
 *
 * @param {string} slug — canonical slug
 * @returns {string} display URL without https:// prefix (e.g. "myhost.com/profile/abc-slug/menu")
 */
export function buildMenuShortDisplayUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "";
  const port =
    typeof window !== "undefined" && window.location?.port
      ? `:${window.location.port}`
      : "";
  return `${host}${port}/profile/${encodeSlug(slug)}/menu`;
}
