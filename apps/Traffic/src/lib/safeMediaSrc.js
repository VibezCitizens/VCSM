// Scheme allowlist for values bound to an <img>/<video> `src` or a CSS
// background-image url(). Provider media URLs in Traffic originate from the
// `vport.public_traze_provider_index_v` view, which exposes seed-intake rows
// edited by hand in the WT admin — i.e. untrusted input. Only schemes that
// cannot be reinterpreted as markup or script are permitted:
//
//   - http(s):            remote media (avatar/banner/logo/gallery/menu URLs)
//   - blob:               object-url previews
//   - data:image/...      inline image data URIs
//   - root-relative "/x"  same-origin bundled assets
//
// Everything else — javascript:, vbscript:, file:, data:text/html,
// protocol-relative "//host", and any non-string — collapses to `fallback`.
// This is a local port (Traffic must not import from apps/VCSM per its
// isolation rules); behavior mirrors apps/VCSM/src/shared/lib/safeMediaSrc.js.
const SAFE_ABSOLUTE_SCHEME = /^(?:https?:|blob:|data:image\/)/i;

export function safeMediaSrc(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const url = value.trim();
  if (!url) return fallback;
  // Root-relative same-origin path (but NOT protocol-relative "//host").
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (SAFE_ABSOLUTE_SCHEME.test(url)) return url;
  return fallback;
}
