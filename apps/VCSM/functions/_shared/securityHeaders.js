// functions/_shared/securityHeaders.js
// Shared security headers for all Cloudflare Pages Functions that return HTML.
//
// Cloudflare Pages Functions bypass public/_headers, so every HTML response
// must include these headers explicitly.
//
// Phase 1: CSP is report-only. After 1 week of zero console violations,
// rename the key to "content-security-policy" to enforce.
//
// DO NOT include cache-control here — each function sets its own policy.
// DO NOT include content-type here — each function sets its own charset.

const CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "img-src 'self' data: blob: https://cdn.vibezcitizens.com https://*.supabase.co; " +
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://upload.vibezcitizens.com; " +
  "frame-src https://onemoredays.com; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

export const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(self), payment=()",
  "cross-origin-opener-policy": "same-origin-allow-popups",
  "content-security-policy-report-only": CSP,
};
