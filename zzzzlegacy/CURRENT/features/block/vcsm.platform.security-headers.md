# vcsm.platform.security-headers.md
# VCSM — HTTP Security Headers Reference
# Last audited: 2026-04-25 (VENOM)
# CSP updated: 2026-05-03 (WOLVERINE/LOGAN sync) — blob: added to img-src, upload endpoint added to connect-src
# Phase 1 deployed: 2026-04-25 — securityheaders.com grade B confirmed

---

## Deployment Architecture

| Layer | Technology |
|---|---|
| Primary hosting | Cloudflare Pages |
| Dynamic edge routes | Cloudflare Pages Functions (`functions/*.js`) |
| Backend API | Supabase Edge Functions |
| Dev/fallback server | Express (`server/server.js`) — NOT production |
| PWA service worker | Workbox via vite-plugin-pwa (`src/sw.js`) |

Headers must be set in **two places** for full coverage:

1. `public/_headers` — covers all Cloudflare Pages static responses
2. Every Cloudflare Pages Function `new Response()` — Functions bypass `_headers`

---

## Current State (Phase 1 deployed 2026-04-25; CSP updated 2026-05-03)

### What exists

| File | Status | Notes |
|---|---|---|
| `public/_headers` | **EXISTS** — Phase 1 deployed | Baseline headers + CSP Report-Only |
| `functions/_shared/securityHeaders.js` | **EXISTS** | Shared constant imported by all 6 HTML functions |
| `public/_redirects` | Exists | SPA routing only |
| `functions/_middleware.js` | Does not exist | Not needed — shared import pattern used instead |
| `vite.config.js` server.headers | Not configured | Dev server only — not needed for production |
| `server/server.js` | No security headers | Dev server only — not production path |
| Any CSP meta tag | None | — |

### Headers deployed (Phase 1)

- `X-Content-Type-Options: nosniff` — set
- `X-Frame-Options: DENY` — set
- `Referrer-Policy: strict-origin-when-cross-origin` — set
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=()` — set
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` — set
- `Content-Security-Policy-Report-Only` — set (report-only, not enforcing)
- `Strict-Transport-Security` — NOT added (Cloudflare sets at edge)
- `Cross-Origin-Embedder-Policy` — NOT added (onemoredays.com iframe blocks this)
- `Cross-Origin-Resource-Policy` — NOT added (not needed at app level)

---

## Cloudflare Pages Functions — Per-Route State

These 6 functions bypass `public/_headers`. All now import `SECURITY_HEADERS` from `functions/_shared/securityHeaders.js` and spread into every response.

| Function | Route | Headers set |
|---|---|---|
| `functions/vport/[slug]/card.js` | `/vport/:slug/card` | **Full security headers** + content-type + cache-control: public, max-age=60 |
| `functions/profile/[slug]/menu.js` | `/profile/:slug/menu` | **Full security headers** + content-type + cache-control: public, max-age=60 |
| `functions/m/[actorId].js` | `/m/:actorId` | **Full security headers** + content-type + cache-control: public, max-age=60 |
| `functions/wanders/c/[publicId].js` | `/wanders/c/:publicId` | **Full security headers** + content-type + cache-control: public, max-age=60 |
| `functions/wanders/i/[publicId].js` | `/wanders/i/:publicId` | **Full security headers** + content-type + cache-control: public, max-age=60 |
| `functions/lovedrop/v/[id].js` | `/lovedrop/v/:id` | **Full security headers** + content-type + cache-control: no-store |

---

## External Connections — CSP Allowlist

| Source | Domain | Directive |
|---|---|---|
| R2 Upload Worker | `https://upload.vibezcitizens.com` | `connect-src` |
| Supabase REST / Edge Functions | `https://*.supabase.co` | `connect-src` |
| Supabase Realtime WebSocket | `wss://*.supabase.co` | `connect-src` |
| Supabase Storage images | `https://*.supabase.co` | `img-src` |
| R2 CDN — user media | `https://cdn.vibezcitizens.com` | `img-src` |
| Image preview (client blob URLs) | `blob:` | `img-src` |
| Google Fonts stylesheet | `https://fonts.googleapis.com` | `style-src` |
| Google Fonts binary files | `https://fonts.gstatic.com` | `font-src` |
| Onemoredays ad iframe | `https://onemoredays.com` | `frame-src` |
| App scripts, styles, assets | `'self'` | all directives |
| React inline style props | `'unsafe-inline'` | `style-src` |
| Splash screen inline script | `'unsafe-inline'` (phase 1) | `script-src` |

**Server-side only — must NOT appear in browser CSP:** AWS SES, Supabase admin client.

---

## Deployed Header Set

### `public/_headers` — live

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://cdn.vibezcitizens.com https://*.supabase.co; connect-src 'self' https://upload.vibezcitizens.com https://*.supabase.co wss://*.supabase.co; frame-src https://onemoredays.com; object-src 'none'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff
```

### `functions/_shared/securityHeaders.js` — live, imported by all 6 HTML functions

```js
export const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(self), payment=()",
  "cross-origin-opener-policy": "same-origin-allow-popups",
  "content-security-policy-report-only": "...",  // same CSP as _headers
};
```

### Phase 2 — CSP enforcement (pending 1-week observation window)

When ready to enforce, change in both files:
- `public/_headers`: `Content-Security-Policy-Report-Only:` → `Content-Security-Policy:`
- `functions/_shared/securityHeaders.js`: key `"content-security-policy-report-only"` → `"content-security-policy"`

---

## Header Decisions — Rationale

| Header | Value | Reason |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing of JS/CSS as HTML |
| `X-Frame-Options` | `DENY` | Prevent clickjacking on login, register, invite pages |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevent `?invite_code=` leakage via Referer on cross-origin navigation |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=(self) | Block API access not used by the app; allow geolocation for local discovery |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Isolate browsing context; `allow-popups` is required because auth flows and some pages use `window.open` |
| `CSP` | Report-Only phase 1 | Start observing violations before enforcement to avoid breaking the app |
| `HSTS` | **Not in `_headers`** — enable in Cloudflare dashboard: SSL/TLS → Edge Certificates → HTTP Strict Transport Security → max-age=31536000, includeSubDomains |
| `COEP` | **Not added** | Would break `onemoredays.com` iframe embed. Fix sandbox issue first. |

---

## Security Findings from 2026-04-25 Audit

| # | Finding | Severity | Location | Status |
|---|---|---|---|---|
| 1 | Zero security headers deployed globally | HIGH | `public/_headers` missing | **RESOLVED 2026-04-25** |
| 2 | Pages Functions return no security headers | HIGH | All 6 `functions/*.js` | **RESOLVED 2026-04-25** |
| 3 | iframe sandbox escape: `allow-same-origin` + `allow-scripts` | HIGH | `OnemoredaysAd.jsx` | **RESOLVED 2026-04-25** |
| 4 | `?invite_code=` leakable via Referer without policy | MEDIUM | `/register` route | **RESOLVED** — `Referrer-Policy` in `_headers` |
| 5 | No X-Frame-Options — clickjacking possible | MEDIUM | All routes | **RESOLVED** — `X-Frame-Options: DENY` in `_headers` |
| 6 | og:image URL trust — off-CDN images accepted | MEDIUM/LOW | `card.js`, `menu.js`, `m/*.js` | Open |
| 7 | `iosProdDebugger` window globals exposed in production | LOW | `iosProdDebugger.js` | Open |

---

## Do NOT Add (Breaking Risk)

| Header | Why blocked |
|---|---|
| `Cross-Origin-Embedder-Policy: require-corp` | Breaks `onemoredays.com` iframe — fix sandbox first, then re-evaluate |
| `Cross-Origin-Embedder-Policy: credentialless` | May affect Supabase Storage image loads — needs testing |
| `script-src` nonce/hash enforcement | Requires removing inline splash script from `index.html` or computing a pinned hash — phase 2 |
| `HSTS` (in `_headers`) | Verify Cloudflare is not already setting it — double headers with conflicting `max-age` causes browser policy breakage |

---

## Rollout Plan

| Phase | Action | Condition to advance |
|---|---|---|
| Phase 1 ✅ | Create `public/_headers` with `Content-Security-Policy-Report-Only` | **Done 2026-04-25** |
| Phase 1 ✅ | Add security headers to all 6 Pages Function responses | **Done 2026-04-25** |
| Phase 1 ✅ | Fix `OnemoredaysAd.jsx` sandbox: remove `allow-same-origin` | **Done 2026-04-25** |
| Phase 2 | Promote CSP from `Report-Only` to `Content-Security-Policy` (enforcement) | After 1 week with zero console violations |
| Phase 2 | Replace `'unsafe-inline'` in `script-src` with hash of splash script | Compute SHA-256 of the exact script block in `index.html` |
| Phase 3 | Evaluate COEP once iframe embed situation is resolved | After Phase 2 |

---

## Live Verification — 2026-04-25

**securityheaders.com grade: B**

Raw headers confirmed on `https://vibezcitizens.com`:

```
content-security-policy-report-only  ✅  full CSP policy active
cross-origin-opener-policy            ✅  same-origin-allow-popups
permissions-policy                    ✅  camera=(), microphone=(), geolocation=(self), payment=()
referrer-policy                       ✅  strict-origin-when-cross-origin
x-content-type-options                ✅  nosniff
x-frame-options                       ✅  DENY
```

Remaining for grade A:
- `Strict-Transport-Security` — enable in Cloudflare dashboard (not in `_headers`)
- `Content-Security-Policy` enforced — after 1-week report-only observation window (target ~2026-05-02)

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-25 | Initial Phase 1 deployment — all 6 baseline headers + CSP report-only deployed. securityheaders.com grade B confirmed. | VENOM |
| 2026-05-03 | Added `blob:` to `img-src` (required for client-side image preview before upload). Added `https://upload.vibezcitizens.com` to `connect-src` (required for authenticated R2 uploads via Cloudflare Worker). OneSignal entries removed from all directives (was added and removed between sessions — never documented). | WOLVERINE/LOGAN |

---

## Testing Checklist

- [x] `securityheaders.com` scan — grade B confirmed 2026-04-25
- [x] All 6 baseline headers visible in raw headers
- [x] `Content-Security-Policy-Report-Only` full policy visible in raw headers
- [ ] Check browser console after 1 week — zero CSP report-only violations
- [ ] Enable HSTS in Cloudflare dashboard
- [ ] Promote CSP to enforcement (phase 2) — target ~2026-05-02
- [ ] Re-run `securityheaders.com` after enforcement — target grade A
- [ ] Confirm Supabase Realtime WebSocket connects in Network tab
- [ ] Confirm Google Fonts load with no `net::ERR_BLOCKED_BY_CSP` errors
