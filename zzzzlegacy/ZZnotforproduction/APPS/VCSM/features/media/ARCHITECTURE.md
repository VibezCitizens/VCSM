---
name: vcsm.media.architecture
description: ARCHITECT V2 module architecture report for VCSM:media
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** media
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/media
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The media feature is a thin feature-layer wrapper around the shared `@media` engine. It handles the lifecycle of media asset records: configuring the media engine at startup (wiring Cloudflare R2 transport via dependency injection), writing fully-typed insert rows to `platform.media_assets` after a successful upload, and soft-deleting media asset rows with RLS-enforced actor ownership. It owns no UI components or hooks — it is an infrastructure boundary consumed by other features.

## OWNERSHIP

Owned by the VCSM platform team. The feature is a configuration and persistence layer for the platform-level `@media` engine. Every feature that uses media upload (upload, settings, vport, chat, dashboard, feed, profiles) ultimately routes through this feature's controllers.

## ENTRY POINTS

- `media.adapter.js` — public boundary; exports `createMediaAssetController`, `softDeleteMediaAssetController`, and `resolveVcsmAppId`
- `setup.js` — `setupVcsmMediaEngine()` called once at app boot to inject Cloudflare R2 transport into the shared `@media` engine
- No routes or screens — this is a service-layer feature with no UI surface

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 5 | mediaAssets.write.dal.js, mediaAssets.softDelete.dal.js, resolveAppId.read.dal.js |
| Model | 2 | mediaAsset.model.js (mapUploadResultToMediaAsset, mapMediaAssetRow, SCOPE_MAP) |
| Controller | 2 | createMediaAsset.controller.js, softDeleteMediaAsset.controller.js |
| Service | N/A | — |
| Adapter | 1 | media.adapter.js (public boundary), mediaAppId.adapter.js (resolveVcsmAppId passthrough) |
| Hook | 0 | None — no view state |
| Component | 0 | None — no UI |
| Screen | 0 | None — no routes |
| Barrel | 3 | media.adapter.js re-exports; scanner detected 3 barrel nodes in callgraph |

Counts sourced from cg_layerCounts: adapter=1, barrel=3, controller=2, dal=5, model=2, module=1.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source read confirms clear single-responsibility | BEHAVIOR.md is PLACEHOLDER |
| Owner defined | PARTIAL | Implicit — no ownership record or doc | No OWNERSHIP.md or doc declaration |
| Entry points mapped | PASS | media.adapter.js exposes 3 explicit exports | — |
| Controllers present/delegated | PASS | 2 controllers (create, softDelete) | — |
| DAL/repository present/delegated | PASS | 5 DAL nodes — insert, soft-delete, app-id read | — |
| Models/transformers present | PASS | 2 model functions + SCOPE_MAP constant | — |
| Hooks/view models present | PASS (N/A) | No UI layer — by design | — |
| Screens/components present | PASS (N/A) | No UI layer — by design | — |
| Services/adapters present | PASS | setup.js wires engine; mediaAppId.adapter.js exposes resolveVcsmAppId | — |
| Database objects mapped | PASS | platform.media_assets (insert, soft-delete update); platform.apps (read) | {public} policy media_assets_vc_owner_update is a known risk — deferred cleanup |
| Authorization path mapped | PARTIAL | softDelete: RLS WITH CHECK enforces owner + status='deleted'. create: relies on app-level actorId validation only — no RLS WITH CHECK on INSERT | Insert path has no DB-layer row ownership check |
| Cache/runtime behavior mapped | PASS | resolveVcsmAppIdDAL uses module-level singleton cache (_cachedAppId) | Cache is process-scoped; cleared on refresh |
| Error/loading/empty states mapped | PARTIAL | Controllers throw on validation failure; DAL throws on Supabase error | No retry logic; no typed error codes returned to callers |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER — no real contract | BEHAVIOR.md needs authoring |
| Tests/validation noted | FAIL | 0 tests detected by scanner | No test coverage at all |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | @media engine (configureMediaEngine, uploadFn, publicUrlFn); notification engine declared in scanner but not found in source — scanner artifact | notification engine dependency is unverified |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @media (engines/media) | engine | media feature → engine | APPROVED — setup.js calls configureMediaEngine | VCSM injects transport; engine is the upload orchestrator |
| notification engine | engine | Declared in scanner data | UNVERIFIED | Not found in source files — scanner may have picked up transitive ref |
| platform.media_assets | DB table (platform schema) | feature → DB | APPROVED | Insert + soft-delete |
| platform.apps | DB table (platform schema) | feature → DB | APPROVED | Read-only; resolves app UUID for VCSM |
| @/services/cloudflare/uploadToCloudflare | service | setup.js → service | APPROVED | Cloudflare R2 transport wiring |
| @/services/supabase/supabaseClient | service | DAL → service | APPROVED | Supabase client |
| @debuggers/media/bugBunnyUploadDebugger | debugger | controller → debugger | APPROVED (dev-only) | Debug instrumentation in createMediaAsset.controller.js |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| platform.media_assets | INSERT | media feature | createMediaAssetController | No RLS WITH CHECK on insert — relies on app-layer actorId validation |
| platform.media_assets | UPDATE (soft-delete only) | media feature | softDeleteMediaAssetController | RLS WITH CHECK enforces status='deleted' + actor ownership via actor_owners; {public} media_assets_vc_owner_update policy coexists (Phase 6 cleanup deferred) |
| platform.apps | SELECT (read-only) | platform | resolveVcsmAppIdDAL | Read-only; module-cached after first call |
| MediaUploadResult | Input contract | @media engine | createMediaAssetController | Caller must provide publicUrl + storageKey |
| SCOPE_MAP | Static mapping | mediaAsset.model.js | createMediaAssetController → mapUploadResultToMediaAsset | 10 scopes defined; unknown scope throws at model layer |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes or screens — service-layer feature | — |
| Loading state | N/A | No UI | — |
| Empty state | N/A | No UI | — |
| Error state | PARTIAL | Controllers throw; DAL propagates Supabase errors | No typed error objects; callers receive raw thrown errors |
| Auth/owner gates | PARTIAL | softDelete: RLS enforced at DB. create: app-layer actorId presence check only | INSERT path relies on caller supplying valid actorId — no DB-level ownership enforcement |
| Cache behavior | PASS | App-ID resolution cached at module level (_cachedAppId singleton) | Cache survives hot-reload; test environments must null-clear manually |
| Runtime dependencies | PASS | setupVcsmMediaEngine() must be called once at app boot before any upload | Startup ordering critical — no guard checks if called after render |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/media/BEHAVIOR.md | PRESENT but PLACEHOLDER |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | The behavior contract is the authoritative definition of what this module guarantees — without it, consumers have no source of truth | LOGAN |
| 0 test coverage | HIGH | Both controllers (create + softDelete) are hot paths called from upload, settings, vport, chat, dashboard, and profiles — zero tests means silent regressions | SPIDER-MAN |
| INSERT path has no DB-layer ownership RLS | MEDIUM | Relies entirely on app-layer actorId parameter — a direct REST call or a misconfigured caller could insert under a different actor's ownerActorId | VENOM |
| {public} media_assets_vc_owner_update policy cleanup deferred | MEDIUM | Documented in softDeleteMediaAssetDAL as a Phase 6 cleanup — policy grants unrestricted column UPDATE to public role | CARNAGE / VENOM |
| Notification engine dependency unverified | LOW | Scanner lists 'notification' as engine dependency but no import found in source — could be a scanner artifact from a transitive reference | ARCHITECT |
| No typed error codes from controllers | LOW | Callers receive raw Supabase or JS Error objects — no error classification layer | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

- `createMediaAsset.controller.js` imports directly from `@debuggers/media/bugBunnyUploadDebugger`. This is a dev-only debugger path and is acceptable per VCSM debugger architecture rules, but it is an unusual import for a controller file. Confirm the debugger conditional renders correctly in production builds (import.meta.env?.DEV guards are present).
- `mediaAppId.adapter.js` is a pass-through adapter that does nothing but re-export `resolveVcsmAppIdDAL`. This thin wrapper exists to satisfy the adapter-boundary contract but adds no logic. Not a violation — correct pattern.
- No cross-feature direct DAL imports detected. All consumers access this feature through `media.adapter.js`.

---

## SPAGHETTI SCORE

**Module:** media
**Score:** CLEAN
**Reasons:** 9 source files. Clear layering: DAL → Model → Controller → Adapter. No UI, no hooks, no screens. Single responsibility (media asset persistence + engine setup). All cross-feature access via adapter boundary. One known deferred policy risk documented inline.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no real content authored

**Check A (Source without behavior):** FAIL — source exists and is well-structured; BEHAVIOR.md is a placeholder stub only
**Check B (Behavior without source):** PASS — no behavior is claimed in BEHAVIOR.md beyond "pending review", so no phantom behaviors
**Check C (§13 engine consistency):** PARTIAL — @media engine confirmed in source (setup.js). 'notification' engine listed in scanner data but not found in any source file — likely a scanner artifact.
**Check D (§6 data change consistency):** PASS — scanner write surfaces (platform.media_assets insert + soft-delete update) match what is found in the DAL files exactly.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md | PLACEHOLDER with no contract — highest documentation gap | LOGAN |
| P2 | Add controller tests (createMediaAsset + softDeleteMediaAsset) | Zero test coverage on hot-path infrastructure used by 6+ features | SPIDER-MAN |
| P3 | Investigate and resolve {public} media_assets_vc_owner_update policy | Deferred Phase 6 cleanup — unrestricted UPDATE surface documented in DAL | VENOM / CARNAGE |
| P4 | Verify or remove 'notification' engine dependency from scanner map | Scanner lists it; source does not use it — stale data needs correction | ARCHITECT |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md is a placeholder; full behavior contract needs authoring
- **SPIDER-MAN** — Zero test coverage on two hot-path controllers; regression risk across 6+ consumer features
- **VENOM** — {public} media_assets_vc_owner_update policy coexists with the actor-owner RLS; INSERT path has no DB-layer row ownership enforcement
- **CARNAGE** — Phase 6 migration to restrict the {public} media_assets_vc_owner_update policy is documented but not scheduled
- **IRONMAN** — No ownership declaration; feature is infrastructure-critical but has no explicit owner on record

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
