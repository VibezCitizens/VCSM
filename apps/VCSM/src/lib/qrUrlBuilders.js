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
 * Layer: lib — pure utility, no side effects, no React.
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
  return encodeURIComponent(String(slug));
}

/**
 * Build the public reviews page URL for a QR code.
 * @param {string} slug — canonical slug (e.g. "abc123-marias-restaurant-laredo-tx")
 * @returns {string} absolute URL
 */
export function buildReviewsQrUrl(slug) {
  if (!slug) return "";
  return `${getOrigin()}/profile/${encodeSlug(slug)}/reviews`;
}

/**
 * Build the business card URL for a QR code.
 * @param {string} slug — canonical slug
 * @returns {string} absolute URL
 */
export function buildBusinessCardQrUrl(slug) {
  if (!slug) return "";
  return `${getOrigin()}/vport/${encodeSlug(slug)}/card`;
}

/**
 * Build the public menu URL for a QR code.
 * @param {string} slug — canonical slug
 * @returns {string} absolute URL
 */
export function buildMenuQrUrl(slug) {
  if (!slug) return "";
  return `${getOrigin()}/profile/${encodeSlug(slug)}/menu`;
}
