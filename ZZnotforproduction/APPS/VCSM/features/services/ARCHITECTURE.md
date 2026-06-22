---
name: vcsm.services.architecture
description: ARCHITECT V2 module architecture report for VCSM:services
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** services
**Application Scope:** VCSM
**Module Type:** services
**Primary Root:** apps/VCSM/src/services
**Independence Status:** INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `services` module is VCSM's third-party integration and platform client layer. It provides singleton client instances for Supabase (main, vc-schema, vport-schema, and reviews-schema), Cloudflare R2 media upload (foreground and background-worker paths), OneSignal push notifications, and Sentry error monitoring. Every DAL file and engine in the app ultimately depends on one of these clients, making `services` the lowest-level infrastructure boundary in the codebase.

## OWNERSHIP

Platform infrastructure team. This module is not owned by any feature domain — it is a cross-cutting dependency consumed by all features, engines, and shared utilities. IRONMAN should track integration version drift and client configuration.

## ENTRY POINTS

This module has no user-facing routes or screens. It is consumed exclusively as an import target:

- `@/services/supabase/supabaseClient` — primary Supabase singleton (default schema)
- `@/services/supabase/vcClient` — `vc` schema client (`supabase.schema('vc')`)
- `@/services/supabase/vportClient` — `vport` schema client (`supabase.schema('vport')`)
- `@/services/supabase/reviewsClient` — `reviews` schema client (`supabase.schema('reviews')`)
- `@/services/supabase/authSession` — `readSupabaseSession()` / `readSupabaseAccessToken()`
- `@/services/supabase/postgrestSafe` — UUID validation, search-term normalization helpers
- `@/services/cloudflare/uploadToCloudflare` — `uploadToCloudflare()`, `getBackgroundJob()`, `publicUrlForKey()`
- `@/services/onesignal/onesignalClient` — push permission, login/logout, permission state
- `@/services/monitoring/monitoring` — `initMonitoring()`, `captureMonitoringError()`
- `@/services/supabase/supabaseClient.debug` — dev-only debug client factory, auth probe, timeit

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A — no DAL queries; clients only |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 10 | supabaseClient.js, vcClient.js, vportClient.js, reviewsClient.js, authSession.js, postgrestSafe.js, uploadToCloudflare.js, onesignalClient.js, initOneSignal.js, monitoring.js |
| Adapter | 0 | N/A |
| Hook | 0 | N/A |
| Component | 0 | N/A |
| Screen | 0 | N/A |
| Barrel | 1 | services/index.js (auto-generated placeholder), supabase/index.js (auto-generated placeholder), cloudflare/index.js (auto-generated placeholder) — none export real symbols |

Scanner cg_layerCounts classifies all files as `module` (34) with 1 barrel. This is accurate — these are infrastructure modules, not feature-layer files.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source reading — clear client/integration boundary | BEHAVIOR.md is PLACEHOLDER — no written contract |
| Owner defined | FAIL | No ownership record or BEHAVIOR.md section | BEHAVIOR.md needs author + owner |
| Entry points mapped | PASS | All 10 source files read; entry points identified above | — |
| Controllers present/delegated | N/A | Module is infrastructure, no controllers needed | — |
| DAL/repository present/delegated | N/A | No DB writes; clients only | — |
| Models/transformers present | N/A | No domain models needed | — |
| Hooks/view models present | N/A | No UI layer | — |
| Screens/components present | N/A | No UI layer | — |
| Services/adapters present | PASS | 10 active service modules covering all 4 integrations | — |
| Database objects mapped | N/A | No direct writes; exposes schema-scoped clients consumed by DALs | — |
| Authorization path mapped | PARTIAL | supabaseClient.js enforces `storageKey: 'sb-auth-main'` isolation; authSession.js wraps token reads; uploadToCloudflare sends JWT in Authorization header | No formal auth boundary doc |
| Cache/runtime behavior mapped | PASS | supabaseClient uses HMR-safe globalThis singleton; OneSignal uses module-level `_initQueued` guard; monitoring uses `_active` flag | — |
| Error/loading/empty states mapped | PARTIAL | monitoring.js wraps errors for Sentry; uploadToCloudflare returns `{url, error}` tuple; onesignalClient catches all SDK exceptions | authSession.js throws on error (callers must catch) |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER — no real content | Full behavior contract needed |
| Tests/validation noted | FAIL | 0 tests (scanner: tests=0) | No unit tests for client initialization, auth token reads, upload helpers, or UUID validators |
| Native parity noted | N/A | Infrastructure layer, not a feature | — |
| Engine dependencies mapped | N/A | No engine imports — this IS the base layer engines depend on | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @supabase/supabase-js | npm package | inbound | YES | Singleton created in supabaseClient.js |
| @sentry/react | npm package | inbound | YES | Wrapped behind monitoring.js facade |
| OneSignal Web SDK v16 | window global | inbound | YES | window.OneSignal accessed via os() guard |
| Cloudflare R2 Worker | HTTP/fetch | outbound | YES | UPLOAD_ENDPOINT = https://upload.vibezcitizens.com |
| @debuggers/performance | dev-only | inbound | YES | Injected only in DEV; supabaseProxy wraps client |
| @debuggers/media | dev-only | inbound | YES | bugBunnyUploadStep/Error called in uploadToCloudflare |
| globalThis.__WANDERS_SB__ | runtime global | inbound | RISK | uploadToCloudflare falls back to Wanders client for auth token — undocumented cross-product coupling |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| supabase (default schema) | singleton read | services | All DALs, engines, features | HIGH — all DB traffic flows through this client |
| vc (vc schema) | singleton read | services | vc.* DALs | MEDIUM — schema-scoped but same auth context |
| vport (vport schema) | singleton read | services | vport.* DALs | MEDIUM |
| reviewsSchema (reviews schema) | singleton read | services | reviews.* DALs | MEDIUM |
| Supabase session/token | read | services | authSession.js, uploadToCloudflare | HIGH — JWT exposure risk if misused |
| R2 CDN URL | computed | services | uploadToCloudflare callers | LOW |
| OneSignal subscription ID | read | services | notification features | LOW |
| Sentry capture | write | services | monitoring callers | LOW |
| postgrestSafe helpers | pure functions | services | DALs, search controllers | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | Infrastructure only | — |
| Loading state | PASS | All clients are synchronous singletons; no async init required | — |
| Empty state | N/A | Not applicable | — |
| Error state | PARTIAL | uploadToCloudflare returns error tuple; onesignalClient catches exceptions; authSession throws | authSession callers must handle thrown errors |
| Auth/owner gates | PARTIAL | supabaseClient enforces storageKey isolation; upload worker enforces JWT; OneSignal login uses auth userId | globalThis.__WANDERS_SB__ fallback in upload is undocumented |
| Cache behavior | PASS | HMR-safe singleton pattern via globalThis.__SB_CLIENT__; module-level flags for OneSignal and Sentry | — |
| Runtime dependencies | PASS | All VITE env vars guarded with existence checks and warnings | Missing DSN/appId degrades gracefully |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/services/BEHAVIOR.md | PRESENT (PLACEHOLDER only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | This module IS the base layer |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No documented contract for the lowest-level module in the app — any engineer touching integration config has no reference | LOGAN |
| globalThis.__WANDERS_SB__ fallback in uploadToCloudflare | HIGH | Undocumented cross-product coupling — Wanders client used as fallback auth source; breaks isolation contract | VENOM |
| Zero tests | MEDIUM | supabaseClient singleton logic, UUID validators, search normalizers, and upload helpers have no coverage | SPIDER-MAN |
| Barrel files are auto-generated stubs | MEDIUM | services/index.js, supabase/index.js, cloudflare/index.js export nothing — import consumers must use deep paths directly | IRONMAN |
| ARCHITECTURE.md was missing | LOW | Now resolved by this run | — |
| CURRENT_STATUS.md was missing | LOW | Now resolved by this run | — |
| supabaseClient.debug.js exposes window.__sbDebug | LOW | Dev-only global but not guarded behind a feature flag; could leak to production builds if DEV check is ever bypassed | SENTRY |

---

## MODULE BOUNDARY WARNINGS

1. **globalThis.__WANDERS_SB__ coupling** — `uploadToCloudflare.js` falls back to `globalThis.__WANDERS_SB__?.auth?.getSession()` to obtain an auth token when the main Supabase session is absent. This is an undocumented cross-product dependency that violates the VCSM/Wanders isolation contract. The fallback path is silent and produces no warning in production. VENOM ticket recommended.

2. **Barrel files export nothing** — `services/index.js`, `supabase/index.js`, and `cloudflare/index.js` all contain only `// auto-generated` with no exports. Callers must use full deep import paths. This is functionally harmless but creates a misleading module structure.

3. No other boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** services
**Score:** WATCH
**Reasons:** The module is structurally clean (flat directory, no circular deps, clear separation by integration). The single concern is the undocumented __WANDERS_SB__ cross-product fallback in uploadToCloudflare, which is a hidden coupling that should be formally documented or removed. Empty barrel files add noise without impact.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no substantive content

**Check A (Source without behavior):** FAIL — source files exist and are substantive, but BEHAVIOR.md is a placeholder with no documented behavior.
**Check B (Behavior without source):** PASS — no phantom behaviors claimed in BEHAVIOR.md (it declares nothing).
**Check C (§13 engine consistency):** N/A — BEHAVIOR.md has no engine declarations. Scanner engines list is empty, which is correct (services has no engine dependencies — engines depend on it).
**Check D (§6 data change consistency):** N/A — no write surfaces declared in scanner. Correct — services module has no direct DB writes. Schema-scoped clients are passed to DALs that own their own writes.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | Lowest-level module with no documentation — every feature depends on this | LOGAN |
| P2 | Investigate and document/remove __WANDERS_SB__ fallback | Silent cross-product coupling in auth path is a security and isolation risk | VENOM |
| P3 | Add unit tests for postgrestSafe helpers and UUID validators | Pure functions are easy to test and critical for input safety | SPIDER-MAN |
| P4 | Populate or remove empty barrel files | Auto-generated stubs mislead consumers | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the BEHAVIOR.md contract for this module
- **VENOM** — Audit the __WANDERS_SB__ fallback in uploadToCloudflare and the debug client's window global exposure
- **SPIDER-MAN** — Add test coverage for postgrestSafe.js (UUID, search normalization) and authSession.js error paths
- **IRONMAN** — Track Supabase SDK version, Sentry SDK version, OneSignal SDK version; populate or remove barrel stubs

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
