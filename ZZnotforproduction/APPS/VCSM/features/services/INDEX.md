---
name: vcsm.services.index
description: VCSM services feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / services

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | Infrastructure layer — no controllers |
| DAL files | 0 | No direct DB queries; exposes schema-scoped clients |
| Hooks | 0 | No React hooks |
| Models | 0 | No domain models |
| Screens | 0 | No UI screens |
| Components | 0 | No UI components |
| Adapters | 0 | No feature adapters |
| Barrels | 1 | services/index.js (auto-generated, empty); supabase/index.js (auto-generated, empty); cloudflare/index.js (auto-generated, empty) |
| Tests | 0 | No tests detected by scanner |
| Routes | 0 | No routes — infrastructure module |
| Total source files | 14 | 10 substantive + 4 empty auto-generated barrels/stubs |

## Write Surface Map

No write surfaces detected by scanner. This module does not issue direct DB writes. It provides client instances (supabase, vc, vport, reviews schemas) consumed by DAL files in feature modules.

## Security-Sensitive Surfaces

The following integration points in this module carry security sensitivity:

| File | Sensitivity | Notes |
|---|---|---|
| supabase/supabaseClient.js | HIGH | JWT auth singleton — storageKey isolates from Wanders; HMR-safe via globalThis.__SB_CLIENT__ |
| supabase/authSession.js | HIGH | Reads raw Supabase session and exposes access_token — callers must not log or transmit this value |
| cloudflare/uploadToCloudflare.js | HIGH | Sends JWT Bearer token to Cloudflare Worker; contains silent __WANDERS_SB__ fallback (undocumented cross-product auth coupling — VENOM review needed) |
| onesignal/onesignalClient.js | MEDIUM | Associates auth userId with OneSignal subscription — loginOneSignalExternalUser must receive auth.uid, never actorId |
| supabase/supabaseClient.debug.js | LOW | Exposes window.__sbDebug in DEV; debug fetch wrapper redacts Bearer tokens in logs |

## Engine Dependencies

None detected. This module IS the base layer that engines and features depend on — it has no upstream engine imports.

## Routes

No routes in route-map for this feature. The services module is a pure infrastructure layer with no user-facing navigation entry points.

## File Manifest

| Subdirectory | File | Purpose |
|---|---|---|
| / | index.js | Auto-generated barrel (empty) |
| supabase/ | supabaseClient.js | Main Supabase singleton (default schema, HMR-safe) |
| supabase/ | vcClient.js | vc-schema scoped client |
| supabase/ | vportClient.js | vport-schema scoped client |
| supabase/ | reviewsClient.js | reviews-schema scoped client |
| supabase/ | authSession.js | readSupabaseSession(), readSupabaseAccessToken() |
| supabase/ | postgrestSafe.js | UUID validation, search term normalization helpers |
| supabase/ | index.js | Auto-generated barrel (empty) |
| supabase/ | supabaseClient.debug.js | Dev-only debug client factory, auth probe, timeit |
| cloudflare/ | uploadToCloudflare.js | R2 upload (foreground + background-worker paths) |
| cloudflare/ | index.js | Auto-generated barrel (empty) |
| onesignal/ | initOneSignal.js | OneSignal SDK init (idempotent, SSR-safe) |
| onesignal/ | onesignalClient.js | Push permission, login/logout, permission state |
| monitoring/ | monitoring.js | Sentry init + captureMonitoringError facade |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder — no real content) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
