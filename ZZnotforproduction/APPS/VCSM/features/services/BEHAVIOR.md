---
name: vcsm.services.behavior
description: Feature-level behavior contract for the VCSM services feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — services
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The `services` module is VCSM's third-party integration and platform client layer. It provides singleton client instances for Supabase (main, vc-schema, vport-schema, and reviews-schema), Cloudflare R2 media upload (foreground and background-worker paths), OneSignal push notifications, and Sentry error monitoring.

Every DAL file and engine in the app ultimately depends on one of these clients, making `services` the lowest-level infrastructure boundary in the codebase. It is not a feature domain — it is a cross-cutting dependency consumed by all features, engines, and shared utilities.

**Owner:** Platform infrastructure team. No single feature domain owns this module. IRONMAN tracks integration version drift and client configuration.

**Architecture state:** STABLE — Evidence: CURRENT_STATUS.md (ARCHITECT run 2026-06-04)
**Independence status:** INDEPENDENT — no upstream feature or engine imports.
**Spaghetti score:** WATCH — one undocumented cross-product coupling (see §9).

Sources: ARCHITECTURE.md §PURPOSE, ARCHITECTURE.md §OWNERSHIP, CURRENT_STATUS.md.

---

## §2 Entry Points

This module has no user-facing routes or screens. It is consumed exclusively as an import target by DAL files, controllers, hooks, and app boot code.

**Documented import targets:**

| Import Path | Exports | Consumers |
|---|---|---|
| `@/services/supabase/supabaseClient` | `supabase` singleton | All DALs, engines, features |
| `@/services/supabase/vcClient` | `vcClient` (vc schema) | vc.* DALs |
| `@/services/supabase/vportClient` | `vportClient` (vport schema) | vport.* DALs |
| `@/services/supabase/reviewsClient` | `reviewsClient` (reviews schema) | reviews.* DALs |
| `@/services/supabase/authSession` | `readSupabaseSession()`, `readSupabaseAccessToken()` | Upload auth, identity binding |
| `@/services/supabase/postgrestSafe` | `isUuid()`, `assertUuid()`, `normalizeSearchTerm()`, `toContainsPattern()`, `toPrefixPattern()` | All DALs accepting user-supplied IDs or search strings |
| `@/services/cloudflare/uploadToCloudflare` | `uploadToCloudflare()`, `getBackgroundJob()`, `publicUrlForKey()` | Media upload callers |
| `@/services/onesignal/onesignalClient` | `requestPushPermission()`, `loginOneSignalExternalUser()`, `logoutOneSignalExternalUser()`, `getOneSignalUserId()` | Notification features |
| `@/services/monitoring/monitoring` | `initMonitoring()`, `captureMonitoringError()` | App boot, error handlers |
| `@/services/supabase/supabaseClient.debug` | Dev-only debug client, auth probe, timeit | DEV environment only |

**Barrel files are empty stubs:** `services/index.js`, `supabase/index.js`, and `cloudflare/index.js` are auto-generated and export nothing. Callers must use deep import paths directly.

Sources: ARCHITECTURE.md §ENTRY POINTS, INDEX.md §File Manifest, modules/service/BEHAVIOR.md §No Route Entry Points.

---

## §3 User Flows

This module has no user flows. It is a pure infrastructure layer — no screens, no routes, no UI components.

All behaviors are triggered by one of three mechanisms:
1. **App boot** — `initMonitoring()` (Sentry), `initOneSignal()` (OneSignal SDK), and Supabase singleton creation happen at app initialization.
2. **DAL imports** — Schema clients (`vcClient`, `vportClient`, `reviewsClient`, `supabase`) and input helpers (`postgrestSafe`) are consumed by feature DAL files.
3. **Direct call sites** — `uploadToCloudflare()` (media upload), `readSupabaseAccessToken()` (auth headers), `loginOneSignalExternalUser()` / `logoutOneSignalExternalUser()` (identity binding), `captureMonitoringError()` (error reporting).

Sources: ARCHITECTURE.md §ENTRY POINTS, modules/service/BEHAVIOR.md §No Route Entry Points.

---

## §4 Business Rules

**BR-001 — Supabase singleton isolation:**
The primary Supabase client is initialized once per app process using `storageKey: 'sb-auth-main'`. This key is intentionally distinct from the Wanders/VCSM cross-product context to prevent session contamination between products.
Evidence: ARCHITECTURE.md §MODULE DATA CONTRACT (supabase HIGH risk row), INDEX.md §Security-Sensitive Surfaces (supabaseClient.js HIGH row).

**BR-002 — HMR-safe singleton pattern:**
The Supabase singleton is guarded via `globalThis.__SB_CLIENT__` to survive Vite Hot Module Replacement without recreating the client and losing session state.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-001, ARCHITECTURE.md §MODULE RUNTIME READINESS (Cache behavior PASS row).

**BR-003 — Schema isolation via schema-scoped clients:**
DAL files must not import the default `supabase` client for schema-specific queries. Each schema (`vc`, `vport`, `reviews`) has a dedicated client created via `supabase.schema('name')`. This enforces schema boundary discipline across all DALs.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-002.

**BR-004 — Upload endpoint auth is JWT-based:**
`uploadToCloudflare()` sends the Supabase access token as a Bearer header to the Cloudflare Worker at `https://upload.vibezcitizens.com`. The Worker enforces JWT validation server-side.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-005, ARCHITECTURE.md §MODULE DEPENDENCY GRAPH (Cloudflare R2 Worker row).

**BR-005 — OneSignal identity is bound to Supabase auth.uid, never actorId:**
`loginOneSignalExternalUser(externalId)` must receive the Supabase `auth.uid()` as its argument — not a VCSM actorId. This is the routing key used to deliver push notifications to the correct user account.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-008, INDEX.md §Security-Sensitive Surfaces (onesignalClient.js MEDIUM row).

**BR-006 — OneSignal opt-in is explicit only:**
The OneSignal NotifyButton is explicitly disabled in `initOneSignal.js`. Push permission is only granted when the app UI explicitly calls `requestPushPermission()`. No automatic permission prompts are issued.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-007.

**BR-007 — Sentry monitoring is no-op when DSN is absent:**
`initMonitoring()` is safe to call in development environments without a `VITE_SENTRY_DSN`. When the env var is absent, monitoring degrades gracefully without errors. Production uses 10% trace sampling.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-009, ARCHITECTURE.md §MODULE RUNTIME READINESS (Runtime dependencies PASS row).

**BR-008 — All VITE env vars have guarded existence checks:**
Missing environment variables (DSN, OneSignal appId, upload endpoint) degrade gracefully with warnings rather than crashing. Env var existence is verified at module initialization.
Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS (Runtime dependencies PASS row).

**BR-009 — authSession.js throws on error; callers must catch:**
`readSupabaseSession()` and `readSupabaseAccessToken()` throw when the session cannot be read. All callers are responsible for handling thrown errors — the services layer does not swallow them.
Evidence: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Error/loading/empty states PARTIAL row), ARCHITECTURE.md §MODULE RUNTIME READINESS (Error state PARTIAL row).

**BR-010 — publicUrlForKey constructs CDN URLs without authentication:**
`publicUrlForKey(key)` computes `${R2_PUBLIC_BASE}/${key}` — a pure function used to build public media URLs without triggering an upload or requiring a session.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-006.

**BR-011 — UUID validation must gate all DAL inputs accepting user-supplied IDs:**
`postgrestSafe.js` provides `isUuid()` and `assertUuid()` for UUID validation, and search normalization helpers (`normalizeSearchTerm()`, `toContainsPattern()`, `toPrefixPattern()`) for ILIKE search inputs. These must be used by DALs accepting user-supplied identifiers or search strings.
Evidence: modules/service/BEHAVIOR.md §BEH-SERVICES-004.

**BR-012 — Zero direct DB writes in services layer:**
The services module provides client instances only. It does not issue any direct database queries. All write authority belongs to DAL files in feature modules.
Evidence: ARCHITECTURE.md §LAYER MAP (DAL count: 0), INDEX.md §Write Surface Map (no write surfaces detected).

**BR-013 — Debug client must not activate in production builds:**
The debug Supabase client (`supabaseClient.debug.js`) may only be active in DEV environments. It must not be reachable in production builds via any runtime flag.
Evidence: VEN-SERVICES-006 finding (SECURITY.md), INDEX.md §Security-Sensitive Surfaces (supabaseClient.debug.js LOW row). NOTE: This rule documents the required behavior; VENOM found it is currently violated in the Wentrex services layer via a localStorage activation path.

---

## §5 State Rules

No state machine is documented for this module. The services module is stateless by design — it provides singleton client references and utility functions with no domain state transitions.

**Documented runtime state (not a state machine):**

| State | How set | How cleared |
|---|---|---|
| Supabase singleton (`globalThis.__SB_CLIENT__`) | Set once at first import; HMR-safe | Cleared on process restart only |
| OneSignal `_initQueued` guard | Set during initOneSignal; prevents duplicate SDK init | Module reload |
| Sentry `_active` flag | Set after initMonitoring(); prevents double init | Module reload |
| 60s viewer cache for getVportServicesController | Set on first getVportServices (viewer mode) call | TTL expiry; `invalidateVportServices()` is exported but never called (BW-SERV-004) |

Sources: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Cache/runtime behavior PASS row), BLACKWIDOW report §G (BW-SERV-004).

---

## §6 Security Constraints

The following constraints are derived from VENOM and BLACKWIDOW findings documented in SECURITY.md and the specialist output reports.

**NOTE ON SCOPE:** VENOM findings (VEN-SERVICES-001 through VEN-SERVICES-006) were discovered in `apps/wentrex/src/features/services/` — the Wentrex product. The scanner misattributed Wentrex surfaces to the VCSM services feature slot. BLACKWIDOW findings (BW-SERV-*) are specific to VCSM services controllers and hooks. Both sets are recorded here because SECURITY.md governs both and the upload surface (`uploadToCloudflare.js`) is shared infrastructure.

---

**VENOM Constraints (Wentrex services layer — shared upload infrastructure):**

CONSTRAINT: Password reset operations must never invoke the edge function without verifying the caller's organization membership against the target student's organization.
Evidence: VEN-SERVICES-001 (HIGH) — `resetStudentPassword` called from ResetPasswordModal with no org-ownership check; arbitrary student password reset possible.

CONSTRAINT: The `canParentReset` capability must only be enabled when a verified `parent_student_links` row exists for the caller and target student. It must never be hardcoded to `true`.
Evidence: VEN-SERVICES-002 (HIGH) — `canParentReset` hardcoded `true` in ParentStudentScreen; unlinked parent can reset any student password.

CONSTRAINT: Temporary auth credentials must never be rendered in clear text in the browser DOM. Credential delivery must use server-side channels (e.g., email).
Evidence: VEN-SERVICES-003 (HIGH) — Temporary auth credential rendered in plain text in browser DOM after parent password reset.

CONSTRAINT: `uploadToCloudflare()` must never use a cross-product global (`globalThis.__WANDERS_SB__`) as an auth token fallback. Authentication must use the product's own Supabase session exclusively.
Evidence: VEN-SERVICES-004 (MEDIUM) — uploadToCloudflare falls back to VCSM cross-product global for auth token.

CONSTRAINT: Student creation operations must verify the caller's organization membership before invoking the create-student edge function. Org membership must not be assumed from route guards alone.
Evidence: VEN-SERVICES-005 (MEDIUM) — RegisterStudentModal invokes createStudent with no caller org-membership verification.

CONSTRAINT: The debug Supabase client must not be activatable via a user-settable localStorage flag in production. Debug activation must only be possible via a build-time environment variable.
Evidence: VEN-SERVICES-006 (LOW) — `supabaseClient.debug` mode activatable in production via localStorage flag.

---

**BLACKWIDOW Constraints (VCSM services feature — vport services controllers):**

CONSTRAINT: `useDeleteVportServiceAddon` must pass `callerActorId` from the authenticated identity context to the delete controller. The controller requires it and will throw if absent, making delete non-functional from the UI path.
Evidence: BW-SERV-001 (CRITICAL) — hook never passes `callerActorId`; ownership verification chain structurally broken at hook layer.

CONSTRAINT: `createOrUpdateVportServiceAddonController` must not rely solely on RLS for ownership enforcement. A controller-layer `assertActorOwnsVportActorController` check is required before any addon write.
Evidence: BW-SERV-002 (HIGH) — controller has no controller-layer ownership check; relies solely on unverified RLS.

CONSTRAINT: `reorderVportServiceAddonController` must not rely solely on RLS for ownership enforcement. A controller-layer ownership check is required before any reorder operation.
Evidence: BW-SERV-003 (HIGH) — controller has no controller-layer ownership check; relies solely on unverified RLS.

CONSTRAINT: The three DAL files referenced by service addon controllers must exist on disk before any of those controllers can be invoked without a runtime crash: `createVportServiceAddon.dal`, `updateVportServiceAddon.dal`, `reorderVportServiceAddon.dal`.
Evidence: BW-SERV-009 (HIGH) — three DAL files imported by controllers do not exist on disk; runtime import crash on first invocation.

CONSTRAINT: The locksmith service details upsert conflict key must include `actor_id` alongside `service_id` to prevent row overwrite if an upstream ownership gap is exploited.
Evidence: BW-SERV-006 (MEDIUM) — upsert conflict key is `service_id` alone; actor_id not in conflict key.

CONSTRAINT: RLS posture on `vport.services` must be verified by a CARNAGE DB audit before release.
Evidence: BW-SERV-007 (MEDIUM) — RLS posture on `vport.services` unverified.

CONSTRAINT: RLS posture on `vport.service_addons` must be verified by a CARNAGE DB audit before release.
Evidence: BW-SERV-008 (MEDIUM) — RLS posture on `vport.service_addons` unverified.

CONSTRAINT: `invalidateVportServices()` must be called after any mutation to vport services to prevent stale viewer cache (currently up to 60s).
Evidence: BW-SERV-004 (LOW) — `invalidateVportServices` is exported but never called anywhere.

CONSTRAINT: The dashboard services route must not expose raw actorId UUIDs in authenticated URLs. The platform rule prohibits raw UUIDs in any URL (no-raw-ids-in-urls memory rule).
Evidence: BW-SERV-005 (LOW) — dashboard services route exposes raw actorId UUID in URL path.

Sources: SECURITY.md, outputs/2026/06/04/Venom/..., outputs/2026/06/04/BlackWidow/...

---

## §7 Error Handling

**Documented error behaviors:**

| Surface | Error Behavior | Source |
|---|---|---|
| `uploadToCloudflare()` | Returns `{ url, error }` tuple — callers must check the error field | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| `onesignalClient.js` | Catches all SDK exceptions internally — does not propagate to callers | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| `authSession.js` | Throws on session read failure — callers must handle thrown errors | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| `monitoring.js` | Wraps errors for Sentry via captureMonitoringError; no-op if Sentry not initialized | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| Missing VITE env vars | Degrades gracefully with console warnings; does not throw or crash | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| `supabaseClient.debug` | Dev-only auth probe; Bearer tokens redacted in debug logs (but request bodies containing sensitive fields are not redacted — VEN-SERVICES-006) | INDEX.md §Security-Sensitive Surfaces |
| Addon controller calls with missing required args | Controllers throw explicit Error messages when required params (`callerActorId`, `targetActorId`, `identityActorId`) are absent | BW report §6 Session Mutation analysis |
| Delete addon from UI | ALWAYS throws — hook never provides `callerActorId`, so controller always throws "callerActorId is required" on every UI-triggered delete | BW-SERV-001 (CRITICAL) |

UNKNOWN — Error behavior for `getBackgroundJob()` is not documented in governance artifacts.

Sources: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX, ARCHITECTURE.md §MODULE RUNTIME READINESS, BlackWidow report §6.

---

## §8 Cross-Feature Dependencies

**Independence status:** INDEPENDENT — the services module has no upstream engine or feature imports. It is the base layer that all engines and features import from.

**Downstream consumers (modules that depend on this feature):**
All DALs, engines, and features in VCSM that query the database, upload media, send push notifications, or report errors consume one or more clients from this module.

**Cross-product coupling (RISK):**
`uploadToCloudflare.js` contains a fallback that reads from `globalThis.__WANDERS_SB__` — a VCSM/Wanders cross-product global Supabase client. This is an undocumented coupling that violates the product isolation contract. It is flagged as a boundary warning and an open security finding.
Evidence: ARCHITECTURE.md §MODULE BOUNDARY WARNINGS (warning 1), ARCHITECTURE.md §MODULE DEPENDENCY GRAPH (`globalThis.__WANDERS_SB__` row, RISK status), VEN-SERVICES-004.

**Dev-only dependencies:**
- `@debuggers/performance` — injected only in DEV via supabaseProxy wrapper
- `@debuggers/media` — `bugBunnyUploadStep`/`bugBunnyUploadError` called in uploadToCloudflare.js in DEV only

Evidence: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH.

UNKNOWN — Whether the Cloudflare Worker at `upload.vibezcitizens.com` is shared between VCSM and Wentrex, and whether R2 bucket paths are product-scoped. ARCHITECT follow-up recommended (noted in VEN-SERVICES-004 follow-up).

---

## §9 Must Never Happen — Security Invariants

**INVARIANT-001:** An actor must never mutate vport services for a vport they do not own.
Violated by: BW-SERV-002 (createOrUpdateVportServiceAddon has no controller-layer ownership check), BW-SERV-003 (reorderVportServiceAddon has no controller-layer ownership check).
Status: PARTIALLY UNANCHORED — upsert is protected; addon create/update/reorder rely on unverified RLS only.

**INVARIANT-002:** The delete addon UI path must never reach the controller without supplying `callerActorId`.
Violated by: BW-SERV-001 (CRITICAL) — `useDeleteVportServiceAddon` never passes `callerActorId`; every UI-triggered delete throws. The hook is non-functional.

**INVARIANT-003:** Disabled vport services must only be returned to the verified owner of the vport actor.
Status: ANCHORED — `getVportServicesController` gates the `asOwner=true` path behind ownership assertion before returning disabled services. Evidence: BlackWidow report §4 Inferred Invariant 2 (BLOCKED).

**INVARIANT-004:** A null or unauthenticated `identityActorId` must never allow upsert of vport services.
Status: ANCHORED — `upsertVportServicesController` throws "identityActorId is required" when the value is absent. Evidence: BlackWidow report §6 Session Mutation (BLOCKED).

**INVARIANT-005:** The Cloudflare upload endpoint must require authentication. Files must never be uploaded without a valid JWT.
Status: PARTIALLY ANCHORED — authentication is enforced server-side by the Worker. Client-side auth header may be empty if both the main session and `__WANDERS_SB__` fallback are absent; silent unauthenticated attempt is possible if Worker is misconfigured. Violated by: VEN-SERVICES-004 (cross-product auth fallback chain).

**INVARIANT-006:** Password reset operations must never execute without org-ownership verification of the target student.
Violated by: VEN-SERVICES-001 (HIGH) — ResetPasswordModal calls reset edge function without org check.

**INVARIANT-007:** A parent must never be able to reset a student's password unless a verified `parent_student_links` row exists for that parent-student pair.
Violated by: VEN-SERVICES-002 (HIGH) — `canParentReset` hardcoded `true`; unlinked parents can trigger reset.

**INVARIANT-008:** Temporary auth credentials must never appear in the browser DOM.
Violated by: VEN-SERVICES-003 (HIGH) — temporary password rendered in plain text in SchoolAccountCard.

**INVARIANT-009:** The `uploadToCloudflare` implementation must never use a cross-product global as an authentication source.
Violated by: VEN-SERVICES-004 (MEDIUM) — `globalThis.__WANDERS_SB__` fallback is present and active.

**INVARIANT-010:** The debug Supabase client must never be activatable at runtime in a production build.
Violated by: VEN-SERVICES-006 (LOW) — localStorage flag activates debug client in production.

Sources: SECURITY.md, outputs/2026/06/04/BlackWidow/..., outputs/2026/06/04/Venom/...

---

## §10 Module Responsibilities

The services module contains 10 substantive files across 4 subdirectories, plus 4 empty auto-generated barrel stubs. There are no controllers, DALs, hooks, models, screens, or components — the entire module is infrastructure service files.

**supabase/ — Database client layer**

| File | Responsibility | Status |
|---|---|---|
| `supabaseClient.js` | HMR-safe Supabase singleton (default schema). Single source of truth for all DB traffic. Enforces `storageKey: 'sb-auth-main'` isolation. | SOURCE_VERIFIED (BEH-SERVICES-001) |
| `vcClient.js` | Exposes `supabase.schema('vc')` for vc.* DALs. | SOURCE_VERIFIED (BEH-SERVICES-002) |
| `vportClient.js` | Exposes `supabase.schema('vport')` for vport.* DALs. | SOURCE_VERIFIED (BEH-SERVICES-002) |
| `reviewsClient.js` | Exposes `supabase.schema('reviews')` for reviews.* DALs. | SOURCE_VERIFIED (BEH-SERVICES-002) |
| `authSession.js` | Provides `readSupabaseSession()` and `readSupabaseAccessToken()`. Throws on failure — callers must catch. | SOURCE_VERIFIED (BEH-SERVICES-003) |
| `postgrestSafe.js` | UUID validation (`isUuid`, `assertUuid`) and search normalization helpers. Must be used by all DALs accepting user-supplied IDs or search strings. | SOURCE_VERIFIED (BEH-SERVICES-004) |
| `supabaseClient.debug.js` | Dev-only debug client factory. Proxies requests with logging. Must not activate in production. | SOURCE_VERIFIED (ARCHITECTURE.md §Security-Sensitive Surfaces) |
| `index.js` (barrel) | Auto-generated stub. Exports nothing. | INDEX.md |

**cloudflare/ — Media upload layer**

| File | Responsibility | Status |
|---|---|---|
| `uploadToCloudflare.js` | R2 media upload via Cloudflare Worker. JWT Bearer auth. Returns `{ success, url }` or `{ error }`. Contains undocumented `__WANDERS_SB__` fallback (VEN-SERVICES-004, BW-SERV boundary warning). | SOURCE_VERIFIED (BEH-SERVICES-005, BEH-SERVICES-006) |
| `index.js` (barrel) | Auto-generated stub. Exports nothing. | INDEX.md |

**onesignal/ — Push notification layer**

| File | Responsibility | Status |
|---|---|---|
| `initOneSignal.js` | OneSignal SDK initialization. Idempotent. SSR-safe. NotifyButton explicitly disabled. | SOURCE_VERIFIED (BEH-SERVICES-007) |
| `onesignalClient.js` | Push permission request, identity binding (login/logout), subscription state. `externalId` must be `auth.uid()` — not actorId. | SOURCE_VERIFIED (BEH-SERVICES-007, BEH-SERVICES-008) |

**monitoring/ — Error tracking layer**

| File | Responsibility | Status |
|---|---|---|
| `monitoring.js` | Sentry initialization and `captureMonitoringError()`. No-op when `VITE_SENTRY_DSN` absent. 10% trace sampling in production. | SOURCE_VERIFIED (BEH-SERVICES-009, BEH-SERVICES-010) |

**Root barrel**

| File | Responsibility | Status |
|---|---|---|
| `index.js` | Auto-generated stub. Exports nothing. Callers must use deep import paths. | INDEX.md |

**Stub module (no source):**
The `modules/services/BEHAVIOR.md` file (distinct from `modules/service/BEHAVIOR.md`) is a STUB with no source files at time of build. It references no implemented behavior.

Sources: modules/service/BEHAVIOR.md (SOURCE_VERIFIED behaviors), ARCHITECTURE.md §LAYER MAP, INDEX.md §File Manifest.

---

## §11 Known Gaps

**THOR Blockers (must resolve before release — see §13):**
- BW-SERV-001: `useDeleteVportServiceAddon` never passes `callerActorId` — delete addon is non-functional from UI
- BW-SERV-002: `createOrUpdateVportServiceAddonController` has no controller-layer ownership check
- BW-SERV-003: `reorderVportServiceAddonController` has no controller-layer ownership check
- BW-SERV-009: Three DAL files (`createVportServiceAddon.dal`, `updateVportServiceAddon.dal`, `reorderVportServiceAddon.dal`) do not exist on disk — runtime import crash on first invocation
- VEN-SERVICES-001: resetStudentPassword called without org-ownership check
- VEN-SERVICES-002: canParentReset hardcoded true
- VEN-SERVICES-003: Temporary credential in browser DOM

**Open security findings not yet blocking THOR:**
- VEN-SERVICES-004: `__WANDERS_SB__` cross-product auth fallback in uploadToCloudflare
- VEN-SERVICES-005: createStudent called without org-membership verification
- VEN-SERVICES-006: Debug client activatable in production via localStorage
- BW-SERV-004: `invalidateVportServices` exported but never called
- BW-SERV-005: Raw actorId UUID in authenticated dashboard route URL
- BW-SERV-006: locksmith service details upsert conflict key missing actor_id
- BW-SERV-007: RLS posture on `vport.services` unverified (no CARNAGE audit)
- BW-SERV-008: RLS posture on `vport.service_addons` unverified (no CARNAGE audit)

**Missing governance:**
- OWNERSHIP.md: does not exist — no formal ownership record
- TESTS.md: does not exist — 0 tests detected for any client initialization, UUID validators, search normalizers, or upload helpers
- ELEKTRA: never run on this feature — no ELEKTRA audit exists
- CARNAGE audit: never run on `vport.services` or `vport.service_addons` tables

**Placeholder modules:**
- `modules/services/BEHAVIOR.md` is a STUB — no source files, no documented behavior

**Undocumented behaviors (UNKNOWN):**
- Error behavior for `getBackgroundJob()` is not documented in governance artifacts
- Whether the Cloudflare Worker at `upload.vibezcitizens.com` validates product-scoped R2 paths (VCSM vs Wentrex)
- Whether barrel stubs (`index.js` files) should be populated or removed — IRONMAN decision pending
- Formal no-RLS-bypass contract for `vport.services` and `vport.service_addons` tables

Sources: SECURITY.md (THOR Release Blocker field), ARCHITECTURE.md §MODULE MISSING PIECES, ARCHITECTURE.md §MODULE GOVERNANCE LINKS, CURRENT_STATUS.md §Top gap, BlackWidow report §12, Venom report §10.

---

## §12 Validation Sources

| File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/services/CURRENT_STATUS.md` | READ | Architecture state STABLE; Independence INDEPENDENT; Completeness MOSTLY COMPLETE; Spaghetti WATCH; BEHAVIOR.md was placeholder; undocumented `__WANDERS_SB__` flagged as top gap |
| `ZZnotforproduction/APPS/VCSM/features/services/SECURITY.md` | READ | THOR blocked by 7 findings (VEN-001/002/003, BW-001/009/002/003); Highest severity CRITICAL; ELEKTRA never run; VENOM complete 2026-06-04; BlackWidow complete 2026-06-04 |
| `ZZnotforproduction/APPS/VCSM/features/services/ARCHITECTURE.md` | READ | Full module map: 10 substantive service files; no DAL/controller/hook/screen/component; entry points identified; dependency graph; data contract; runtime readiness; boundary warnings; missing pieces; spaghetti score |
| `ZZnotforproduction/APPS/VCSM/features/services/INDEX.md` | READ | Source inventory (14 total files: 10 substantive + 4 barrel stubs); write surface map (0 direct writes); security-sensitive surfaces table; file manifest |
| `ZZnotforproduction/APPS/VCSM/features/services/OWNERSHIP.md` | DOES NOT EXIST | No ownership record available |
| `ZZnotforproduction/APPS/VCSM/features/services/TESTS.md` | DOES NOT EXIST | No test documentation; scanner confirms 0 tests |
| `ZZnotforproduction/APPS/VCSM/features/services/modules/service/BEHAVIOR.md` | READ | SOURCE_VERIFIED behavior inventory: BEH-SERVICES-001 through BEH-SERVICES-010; includes code signatures for all 10 behaviors; full trigger mechanism explanation |
| `ZZnotforproduction/APPS/VCSM/features/services/modules/services/BEHAVIOR.md` | READ | STUB — no source files; no behaviors documented |
| `ZZnotforproduction/APPS/VCSM/features/services/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_services-security-review.md` | READ | IMPORTANT: Scanner misattributed Wentrex source as VCSM services. All VEN-SERVICES-* findings are from `apps/wentrex/src/features/services/` — Wentrex product. Upload surface (`uploadToCloudflare.js`) is shared infrastructure. 6 findings, 3 THOR blockers |
| `ZZnotforproduction/APPS/VCSM/features/services/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_services-adversarial-review.md` | READ | VCSM-specific review. Attack surface inventory of 4 write surfaces and 2 read surfaces. 9 findings (1 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW). §9 invariants are UNANCHORED (BEHAVIOR.md was placeholder at time of review) |

---

## §13 THOR Release Status

**THOR Release Blocker:** YES

**Exact text from SECURITY.md:** `THOR Release Blocker: YES — VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-003, BW-SERV-001, BW-SERV-009, BW-SERV-002, BW-SERV-003`

**Blocker details:**

| Finding | Severity | App Scope | Reason |
|---|---|---|---|
| VEN-SERVICES-001 | HIGH | Wentrex services (shared upload infra) | Password reset of arbitrary student without org-ownership check — privilege escalation |
| VEN-SERVICES-002 | HIGH | Wentrex services | Unlinked parent can reset any student password — account takeover vector |
| VEN-SERVICES-003 | HIGH | Wentrex services | Temporary auth credential in clear text in browser DOM — credential exposure |
| BW-SERV-001 | CRITICAL | VCSM services | Delete addon hook never passes callerActorId — ownership chain structurally broken; feature non-functional from UI |
| BW-SERV-009 | HIGH | VCSM services | Three DAL files imported by controllers do not exist — runtime import crash on first invocation of createOrUpdate and reorder |
| BW-SERV-002 | HIGH | VCSM services | No controller-layer ownership check on addon create/update; RLS sole barrier with unverified posture |
| BW-SERV-003 | HIGH | VCSM services | No controller-layer ownership check on addon reorder; RLS sole barrier with unverified posture |

**THOR GATE: BLOCKED** — 7 open findings must be resolved before release. ELEKTRA has never been run on this feature and is recommended before next THOR gate.

Sources: SECURITY.md (THOR Release Blocker field), BlackWidow report §12, Venom report §10.
