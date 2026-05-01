// Shared byte size constants for scope configs.
export const BYTES = {
  MB_5:   5   * 1024 * 1024,
  MB_10:  10  * 1024 * 1024,
  MB_50:  50  * 1024 * 1024,
  MB_100: 100 * 1024 * 1024,
}

// MIME types that must never be accepted regardless of scope.
// SVG can execute script when served from CDN with wrong Content-Type.
export const BLOCKED_MIMES = Object.freeze([
  'image/svg+xml',
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/xml',
  'text/xml',
])
