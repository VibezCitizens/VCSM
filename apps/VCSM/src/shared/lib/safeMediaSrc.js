// Scheme allowlist for values bound to an <img>/<video> `src`.
//
// Only schemes that cannot be reinterpreted as markup or script are permitted:
//   - http(s):            remote media (DB-stored avatar/banner/attachment URLs)
//   - blob:               URL.createObjectURL previews
//   - data:image/...      inline image data URIs
//   - root-relative "/x"  same-origin bundled assets (e.g. /default-banner.jpg)
//
// Everything else — javascript:, vbscript:, data:text/html, protocol-relative
// "//host", and any non-string — collapses to `fallback`. This neutralizes the
// "DOM text reinterpreted as HTML" class for untrusted media URLs.
const SAFE_ABSOLUTE_SCHEME = /^(?:https?:|blob:|data:image\/)/i;

export function safeMediaSrc(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const url = value.trim();
  if (!url) return fallback;
  // Root-relative same-origin path (but NOT protocol-relative "//host").
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (SAFE_ABSOLUTE_SCHEME.test(url)) return url;
  return fallback;
}
