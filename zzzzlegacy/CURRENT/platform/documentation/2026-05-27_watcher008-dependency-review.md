# CHANGE INTENT ENTRY — Dependency Changes (WATCHER-008)

Date: 2026-05-27
Author / Command: WATCHER → manual review
Scope: VCSM
Change Type: DEPENDENCY_REVIEW
Status: REVIEWED — NO RED FLAGS (git diff not available; current-state inspection only)
Branch: vport-booking-feed-security-updates
Related WATCHER Finding: WATCHER-008

---

## Limitation

Git commands are prohibited in this workspace. This review reflects a **current-state inspection**
of `apps/VCSM/package.json` — not a diff against HEAD. An actual before/after diff requires
manual `git diff HEAD -- apps/VCSM/package.json` outside this session.

---

## Current Dependency Inventory

### Production Dependencies (42 packages)

| Package | Version | Category | Risk |
|---|---|---|---|
| `@aws-sdk/client-s3` | ^3.888.0 | Storage | LOW — AWS SDK, standard |
| `@dnd-kit/core` + sortable + utilities | ^6.3.1 / ^10.0.0 / ^3.2.2 | UI | LOW |
| `@ffmpeg/ffmpeg` + util | ^0.12.15 / ^0.12.2 | Media processing | LOW — client-side WASM |
| `@headlessui/react` | ^2.2.9 | UI | LOW |
| `@hookform/resolvers` | ^5.2.2 | Forms | LOW |
| `@sentry/react` | ^10.54.0 | Monitoring | ⚠️ NOTE — see below |
| `@stripe/stripe-js` | ^8.1.0 | Payments | LOW — client-side only |
| `@supabase/supabase-js` | ^2.50.0 | Database | LOW |
| `@tanstack/react-query` | ^5.90.5 | Data fetching | LOW |
| `@tsparticles/react` + `tsparticles` | ^3.0.0 / ^3.8.1 | UI effects | LOW |
| `@unocss/preset-wind3` | ^66.2.3 | CSS | LOW |
| `browser-image-compression` | ^2.0.2 | Media | LOW |
| `date-fns` | ^4.1.0 | Utils | LOW |
| `dotenv` | ^17.2.2 | Config | LOW |
| `express` | ^5.1.0 | Server | LOW — server-only |
| `framer-motion` | ^12.23.24 | Animation | LOW |
| `hls.js` | ^1.6.13 | Video | LOW |
| `idb-keyval` | ^6.2.2 | Storage | LOW |
| `ky` | ^1.12.0 | HTTP client | LOW |
| `leaflet` + routing + clustering + geosearch | various | Maps | LOW |
| `lucide-react` | ^0.522.0 | Icons | LOW |
| `mime-types` | ^3.0.1 | Utils | LOW |
| `multer` | ^2.0.2 | File upload | LOW — server-only |
| `nanoid` | ^5.1.6 | IDs | LOW |
| `phosphor-react` | ^1.4.1 | Icons | LOW |
| `react` + `react-dom` | ^19.1.0 | Framework | LOW |
| `react-easy-crop` | ^5.4.2 | Media | LOW |
| `react-hook-form` | ^7.65.0 | Forms | LOW |
| `react-hot-toast` | ^2.5.2 | UI | LOW |
| `react-icons` | ^5.5.0 | Icons | LOW |
| `react-leaflet` + markercluster | ^5.0.0 | Maps | LOW |
| `react-qr-code` | ^2.0.16 | UI | LOW |
| `react-router-dom` | ^7.6.2 | Routing | LOW |
| `react-swipeable` | ^7.0.2 | UI | LOW |
| `react-window` | 1.8.11 | UI | LOW |
| `use-places-autocomplete` | ^4.0.1 | Maps | LOW |
| `workbox-window` | ^7.3.0 | PWA | LOW |
| `zod` | ^4.1.12 | Validation | ⚠️ NOTE — see below |
| `zustand` | ^5.0.12 | State | LOW |

### Dev Dependencies (12 packages)

| Package | Version | Category | Risk |
|---|---|---|---|
| `@eslint/js` | ^9.25.0 | Tooling | LOW |
| `@types/leaflet` | ^1.9.20 | Types | LOW |
| `@types/react` + dom | ^19.1.2 | Types | LOW |
| `@vitejs/plugin-react` | ^4.4.1 | Build | LOW |
| `@vitest/coverage-v8` | ^4.1.7 | Testing | LOW |
| `autoprefixer` | ^10.4.21 | CSS | LOW |
| `eslint` + plugins | ^9.25.0 | Tooling | LOW |
| `globals` | ^16.0.0 | Tooling | LOW |
| `postcss` | ^8.5.6 | CSS | LOW |
| `unocss` | ^66.2.3 | CSS | LOW |
| `vite` | ^6.3.5 | Build | LOW |
| `vite-plugin-pwa` | ^1.0.0 | PWA | LOW |
| `vitest` | ^4.1.7 | Testing | LOW |

---

## Notable Items

### `@sentry/react: ^10.54.0`
Sentry error monitoring SDK. This is directly related to the untracked `monitoring.js` file
flagged in WATCHER-007 (`apps/VCSM/src/services/monitoring/monitoring.js`). These are a pair —
Sentry was added as a dependency to power the monitoring service.

**Risk:** LOW — Sentry is a standard, well-audited error monitoring library. The concern to
verify is whether the Sentry DSN (data source name) is being read from environment variables
and not hardcoded. Review `monitoring.js` before release.

### `zod: ^4.1.12`
Zod version 4 — a major version bump from v3. Zod v4 introduced breaking API changes.
This was likely added for vport settings validation (noted in this session's work on
`vportSettingsValidation.js`). No risk concern — Zod is standard — but the major version
jump warrants confirming all Zod usages are on v4 API.

---

## Risk Summary

| Area | Status | Notes |
|---|---|---|
| Supply chain risk | CLEAN | All packages are well-known, audited, popular libraries |
| Auth/security packages | CLEAN | No auth-adjacent packages added (no JWT libs, no crypto, no policy libs) |
| Server-side exposure | CLEAN | `express` and `multer` are server-only; not bundled into client build |
| Sentry monitoring | ⚠️ VERIFY | Confirm DSN is env-var-sourced, not hardcoded in `monitoring.js` |
| Zod v4 migration | ⚠️ VERIFY | Confirm all Zod usages updated to v4 API |
| `npm audit` recommendation | PENDING | Run `npm audit` before THOR — no known issues visible from package.json |

---

## WATCHER-008 Verdict

| Field | Value |
|---|---|
| Diff available | NO — git prohibited in this workspace |
| Current state | Inspected — 42 prod + 12 dev dependencies |
| Red flags | NONE |
| Notable additions | `@sentry/react` (paired with untracked `monitoring.js`), `zod` v4 |
| Required before THOR | Run `npm audit`; verify Sentry DSN is env-sourced; verify Zod v4 compatibility |
| THOR Blocker | NO |
| WATCHER-008 | REVIEWED — pending `npm audit` and manual diff |
