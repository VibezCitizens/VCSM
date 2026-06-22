---
name: vcsm.identity.architecture
description: ARCHITECT V2 module architecture report for VCSM:identity
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** identity
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/identity
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The identity feature is the VCSM platform bootstrap and actor-directory sync layer. It provisions the full platform identity record for a user+actor pair via a single idempotent RPC (`platform.provision_vcsm_identity`), configures the shared identity engine with a VCSM-specific app-context resolver that reads multi-actor links from `platform.user_app_actor_links`, and provides reusable helpers to refresh the `identity.actor_directory` materialized view after any source-of-truth mutation elsewhere in the platform.

## OWNERSHIP

Platform / Identity domain. This module is the single VCSM-side owner of engine configuration (`setupVcsmIdentityEngine`) and platform provisioning. It is consumed by the auth feature at login/registration and by all features that need post-mutation directory refresh. Primary responsibility sits with the platform team.

## ENTRY POINTS

- `setup.js` — called once at app startup (`main.jsx`) to configure the identity engine before any component renders
- `adapters/identity.adapter.js` — public adapter exposing `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`, `useIdentity`, and `IdentityProvider` to other features
- `adapters/identityOps.adapter.js` — secondary adapter re-exporting the two controller operations for cross-feature use
- No screen or route entry points — this module has no UI

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 3 | provision.rpc.dal.js, refreshActorDirectory.dal.js |
| Model | 0 | N/A — no model files; resolver output is typed inline |
| Controller | 1 | ensureVcsmPlatformBootstrap.controller.js, refreshActorDirectory.controller.js (re-export only) |
| Service | N/A | — |
| Adapter | 2 | identity.adapter.js, identityOps.adapter.js |
| Hook | 1 | useIdentityOps.js |
| Component | 0 | N/A |
| Screen | 0 | N/A |
| Barrel | 7 | setup.js + adapter files act as barrels; scanner reports 7 barrel nodes in callgraph |

Note: The callgraph reports controller:1, dal:3, hook:1, barrel:7, module:2 — the refreshActorDirectory.controller.js is a thin re-export, not counted separately by fm_layerCounts. The `resolvers/` sub-directory (vcsmIdentity.resolver.js) does not fit a standard layer label; it is a resolver/adapter against the identity engine.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | BEHAVIOR.md is a placeholder; purpose inferred from source | BEHAVIOR.md needs authoring |
| Owner defined | PARTIAL | Platform domain ownership clear from source; no OWNERSHIP.md or doc record | No formal owner doc |
| Entry points mapped | PASS | setup.js + two adapter files map all entry points | — |
| Controllers present/delegated | PASS | 2 controller operations (bootstrap + directory refresh) | — |
| DAL/repository present/delegated | PASS | 3 DAL nodes: provision RPC, refreshActorDirectoryRow, refreshVcActorDirectory | — |
| Models/transformers present | FAIL | 0 models; resolver output shape is defined inline without a named model | No model file for resolver output |
| Hooks/view models present | PASS | useIdentityOps.js exposes both controller ops as a hook | — |
| Screens/components present | N/A | Identity has no UI screens | — |
| Services/adapters present | PASS | 2 adapter files with correct boundary exposure | — |
| Database objects mapped | PASS | platform.provision_vcsm_identity RPC + identity.refresh_actor_directory_row RPC both documented in source | — |
| Authorization path mapped | PASS | Provisioning RPC is SECURITY DEFINER; actorId guard in controller and DAL | — |
| Cache/runtime behavior mapped | PARTIAL | Engine is configured once at startup (_configured flag); no explicit cache invalidation beyond directory refresh | Refresh failure does not roll back primary write — fire-and-forget risk |
| Error/loading/empty states mapped | PARTIAL | Controllers return {ok, error} shape; no loading state (sync guard only) | No loading/retry contract for refresh failure |
| Documentation linked | FAIL | BEHAVIOR.md exists but is a placeholder | Needs authoring |
| Tests/validation noted | FAIL | 0 tests | No test coverage for bootstrap or refresh |
| Native parity noted | N/A | No UI layer | — |
| Engine dependencies mapped | PASS | Consumes engines: directory, hydration, identity | identity engine configured by this feature (circular dependency acceptable — this IS the setup feature) |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | INBOUND + OUTBOUND | YES — setup.js calls configureIdentityEngine | This feature configures the engine it also consumes |
| engines/directory | engine | OUTBOUND | YES — via adapters | directory search consumed transitively via identity adapter |
| engines/hydration | engine | OUTBOUND | YES | Hydration engine listed in scanner deps |
| @/state/identity/identityContext | state | OUTBOUND | YES — re-exported through adapter | useIdentity and IdentityProvider exposed via identity.adapter.js |
| @/services/supabase/supabaseClient | service | OUTBOUND | YES — standard service dependency | Used in both DAL files |
| @debuggers/identity | debugger | OUTBOUND | YES — dev-only debug surface | Used in controller and DAL; production-safe if debug guard is in place |
| platform.user_app_actor_links | DB table | READ | YES | Resolver reads actor links from platform schema |
| platform.provision_vcsm_identity | DB RPC | WRITE | YES — via SECURITY DEFINER RPC | Atomically provisions 6 platform rows |
| identity.refresh_actor_directory_row | DB RPC | WRITE | YES | Refreshes materialized directory row for one actor |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| platform.provision_vcsm_identity RPC | RPC (SECURITY DEFINER) | platform schema | ensureVcsmPlatformBootstrap controller | Returns user_app_account_id; no client-side table writes |
| identity.refresh_actor_directory_row RPC | RPC | identity schema | refreshActorDirectoryRow DAL | Fire-and-forget; failure does not roll back caller's write |
| platform.user_app_actor_links | SELECT | platform schema | vcsmIdentity.resolver | Multi-actor: all active vc-source links for the account |
| {ok, userAppAccountId, error} | Controller return shape | identity feature | auth feature (login/registration) | No model file formalizing shape |
| {actorLinks, roleKeys, capabilityKeys, isSuspended, defaultDestination} | Resolver return shape | identity feature | identity engine | Shape defined inline in resolver; no model |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No UI in this module | — |
| Loading state | PARTIAL | _configured guard prevents double-init; no async loading state | setup.js is sync after engine call |
| Empty state | PARTIAL | Resolver returns empty actorLinks array with safe defaults when no links found | ZERO_ROWS traced correctly |
| Error state | PASS | Both controllers return {ok: false, error} shape; DAL throws, controller catches | Fire-and-forget on directory refresh may silently fail |
| Auth/owner gates | PASS | userId and actorId required guards in controller and DAL | Missing either param returns {ok: false} before DB call |
| Cache behavior | WATCH | Engine configured once via _configured singleton flag | No cache invalidation contract documented |
| Runtime dependencies | PASS | Supabase client and identity engine must be ready before setup.js runs; called in main.jsx before render |  |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/identity/BEHAVIOR.md | PRESENT (placeholder only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A — no UI |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No behavior contract — consumers have no canonical reference for what identity provisioning guarantees | LOGAN |
| Zero test coverage | HIGH | Bootstrap and directory-refresh are critical auth-path operations; no regression safety net | SPIDER-MAN |
| No model file for resolver output shape | MEDIUM | {actorLinks, roleKeys, ...} shape defined inline; if engine contract changes, no single file to update | IRONMAN |
| No model file for controller return shape | MEDIUM | {ok, userAppAccountId, error} contract is implicit — consumers rely on convention | IRONMAN |
| Directory refresh is fire-and-forget with no retry | MEDIUM | If identity.refresh_actor_directory_row fails, the actor's directory row may be stale with no alert or retry | SENTRY |
| No security audit on provisioning RPC | MEDIUM | SECURITY DEFINER RPC with two critical identity params — needs VENOM review to confirm RLS and input sanitization | VENOM |
| CURRENT_STATUS.md was missing before this run | LOW | Feature status tracking absent | ARCHITECT |
| ARCHITECTURE.md was missing before this run | LOW | No module architecture record existed | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

The identity adapter (`identity.adapter.js`) re-exports `useIdentity` and `IdentityProvider` from `@/state/identity/identityContext` — a state module outside the feature directory. This is an intentional aggregation pattern (adapter surfaces the full identity contract from one import point), but it means the identity feature adapter has a hard dependency on the state layer. This is an approved pattern in VCSM (state is a shared layer, not a feature), but it should be noted: callers importing from `identity.adapter.js` are actually reaching into `apps/VCSM/src/state/identity/identityContext` indirectly.

No direct cross-feature DAL imports detected. All cross-boundary access is through adapters.

---

## SPAGHETTI SCORE

**Module:** identity
**Score:** CLEAN
**Reasons:** 9 source files, clear single responsibility (bootstrap + directory refresh + engine setup), proper adapter boundaries, no direct cross-feature DAL imports, all DB access through typed RPCs
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavior contract has been authored

**Check A (Source without behavior):** FAIL — source exists and is well-structured, but BEHAVIOR.md is a placeholder; no happy paths, data changes, or engine dependencies are documented there
**Check B (Behavior without source):** PASS — no behavior is claimed in BEHAVIOR.md that does not exist in source (placeholder makes no claims)
**Check C (§13 engine consistency):** PARTIAL — scanner reports engines [directory, hydration, identity]; source confirms identity engine (setup.js calls configureIdentityEngine), directory engine (referenced in adapter), hydration listed by scanner but not directly visible in the 9 source files scanned
**Check D (§6 data change consistency):** PASS — scanner write surfaces (platform.provision_vcsm_identity, identity.refresh_actor_directory_row) match exactly what is in the DAL files

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md | Placeholder contract blocks any governance review or security audit | LOGAN |
| P1 | Add test coverage for ensureVcsmPlatformBootstrap and refreshActorDirectoryRow | Zero tests on auth-critical bootstrap path | SPIDER-MAN |
| P2 | Add model files for controller and resolver return shapes | Implicit shape contracts create hidden coupling | IRONMAN |
| P3 | VENOM review of provision_vcsm_identity RPC input handling | SECURITY DEFINER with userId+actorId inputs — confirm no injection surface | VENOM |

## RECOMMENDED HANDOFFS

- **LOGAN** — author BEHAVIOR.md from source truth (this module has clear, documentable behavior)
- **SPIDER-MAN** — add regression tests for bootstrap controller and directory refresh DAL
- **IRONMAN** — formalize return shapes as model files
- **VENOM** — security review of SECURITY DEFINER RPC provisioning path
- **SENTRY** — alert contract for fire-and-forget directory refresh failures

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
