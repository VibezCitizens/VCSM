---
name: vcsm.hydration.architecture
description: ARCHITECT V2 module architecture report for VCSM:hydration
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** hydration
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/hydration
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The hydration feature is a thin VCSM-specific bootstrap layer that configures and registers the shared `engines/hydration` engine for the VCSM application. It provides the VCSM-specific actor hydrator (`hydrateVcsmActor`) that resolves both `user` and `vport` actor kinds from VCSM-owned DAL helpers, and calls `configureHydrationEngine()` once at app startup to wire the supabase client and the VCSM hydrator into the engine. The actual hydration pipeline (store, caching, DAL, normalize, batch fetching) lives entirely in `engines/hydration`.

## OWNERSHIP

Platform infrastructure team. This module is the VCSM integration point for the shared hydration engine — it is not a product feature but a startup/configuration concern. The engine itself (`engines/hydration/`) is the canonical owner of all hydration runtime behavior.

## ENTRY POINTS

- `setupVcsmHydration()` — called once at app boot (in `setup.js`). No routes or screens exist. Consumers call the engine directly via `@hydration` alias.
- `hydrateVcsmActor()` — registered as the `vcsm/vc` hydrator; invoked by the engine's `hydrateActor()` controller when actor kind resolution is delegated.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | None (DAL is inside engines/hydration and state/identity) |
| Model | 0 | None (models are in state/identity) |
| Controller | 0 | None at feature level (controller lives in engines/hydration) |
| Service | N/A | — |
| Adapter | 0 | None |
| Hook | 0 | None |
| Component | 0 | None |
| Screen | 0 | None |
| Barrel | 0 | None |
| Module | 2 | setup.js, vcsmActorHydrator.js |

Scanner cg_layerCounts: `{ module: 2 }`. Both source files are classified as modules. The feature has no layers beyond the two module-level files.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is a placeholder | BEHAVIOR.md has no real contract content |
| Owner defined | PARTIAL | Implied by app root placement; no formal ownership record | No OWNER or explicit team assignment |
| Entry points mapped | PASS | `setupVcsmHydration()` is the sole entry point | No routes; boot call site not audited |
| Controllers present/delegated | PASS | Delegated to engines/hydration/src/controller | Engine controller is well-defined |
| DAL/repository present/delegated | PASS | Delegated to engines/hydration/src/dal.js (vc.get_actor_summaries RPC) | Feature-level has no direct DAL |
| Models/transformers present | PASS | Delegated to state/identity/identity.model.js (mapProfileActor, mapVportActor) | Cross-module dependency on state layer |
| Hooks/view models present | PASS | Delegated to engines/hydration/src/useActorSummary.js | No VCSM-local hook |
| Screens/components present | N/A | Hydration is infrastructure, not UI | — |
| Services/adapters present | FAIL | No feature-level adapter; vcsmActorHydrator is not barrel-exported | No adapter boundary for internal hydrator |
| Database objects mapped | PARTIAL | vc.get_actor_summaries RPC (engine DAL); vport.profile_actor_access direct query in vcsmActorHydrator | Direct supabase query in hydrator bypasses DAL pattern |
| Authorization path mapped | PARTIAL | Actor ownership resolved via actor_owners table + profile_actor_access fallback | No explicit auth gate; RLS relied upon |
| Cache/runtime behavior mapped | PASS | Zustand store in engines/hydration/src/store.js; 5-minute TTL; safe-merge strategy | Stale-while-revalidate not implemented |
| Error/loading/empty states mapped | PARTIAL | Engine hydrate.js returns `{ hydrated, errors }`; store errors silently dropped in most callers | No loading/empty UI (infrastructure module) |
| Documentation linked | FAIL | BEHAVIOR.md present but is a PLACEHOLDER with no content | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests (scanner confirmed) | No unit or integration coverage |
| Native parity noted | N/A | Not a UI feature | — |
| Engine dependencies mapped | PASS | engines/hydration declared; imports confirmed in source | Correct engine boundary |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/hydration | engine | feature → engine | YES | Canonical — configureHydrationEngine called in setup.js |
| state/identity/identity.read.dal | internal cross-module | vcsmActorHydrator → state | QUESTIONABLE | DAL imports from state/ instead of going through an adapter |
| state/identity/identity.model | internal cross-module | vcsmActorHydrator → state | QUESTIONABLE | Model imports from state/ instead of going through an adapter |
| state/identity/identity.controller | internal cross-module | vcsmActorHydrator → state | QUESTIONABLE | resolveRealmId imported from state directly |
| services/supabase/supabaseClient | service | vcsmActorHydrator → services | YES | Standard supabase client access |
| vport.profile_actor_access | DB (direct query) | vcsmActorHydrator → DB | RISK | Raw supabase query inline in hydrator — bypasses DAL layer |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actors | READ (via identity DAL) | state/identity | vcsmActorHydrator | Low — routed through DAL |
| vc.profiles (user profiles) | READ (via readProfileIdentityDAL) | state/identity | vcsmActorHydrator | Low |
| vport.profiles | READ (via readVportIdentityDAL) | state/identity | vcsmActorHydrator | Low |
| vc.actor_privacy_settings | READ (via readActorPrivacyDAL) | state/identity | vcsmActorHydrator | Low |
| vc.actor_owners | READ (via readActorOwnerUserDAL) | state/identity | vcsmActorHydrator | Low |
| vport.profile_actor_access | READ (raw supabase inline) | vport schema | vcsmActorHydrator | MEDIUM — no DAL wrapper, schema-level access inline in hydrator |
| vc.get_actor_summaries (RPC) | READ | engines/hydration | hydrateActorsFromRows | Low — engine-owned DAL |

No write surfaces detected by scanner. This module is read-only at the DB level.

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | Infrastructure module — no routes | — |
| Loading state | N/A | No UI layer | — |
| Empty state | PARTIAL | Engine returns `{ hydrated: 0, errors: [] }` on empty | Callers may not handle gracefully |
| Error state | PARTIAL | Engine logs warnings in DEV; errors returned but not surfaced to UI | Silent failures possible in production callers |
| Auth/owner gates | PARTIAL | Ownership resolved via actor_owners + profile_actor_access fallback; no explicit gate in hydrator | RLS enforced at DB; app-level auth assumed by caller context |
| Cache behavior | PASS | Zustand store with 5-minute TTL; getMissingOrStale filters; safe-merge on upsert | No persistence across sessions |
| Runtime dependencies | PASS | setupVcsmHydration() is idempotent (guarded by `_configured` flag); safe to call multiple times | Must be called before first hydration — boot order is a risk if not enforced |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/hydration/BEHAVIOR.md | PRESENT (PLACEHOLDER — no real content) |
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
| BEHAVIOR.md is a placeholder | HIGH | The behavior contract defines what this feature does, its failure modes, and its engine contract — none of which are documented | LOGAN |
| Direct supabase query in vcsmActorHydrator (vport.profile_actor_access) | MEDIUM | Bypasses the DAL abstraction boundary; if schema changes, the hydrator breaks silently | IRONMAN / VENOM |
| Direct state/ DAL/model/controller imports in vcsmActorHydrator | MEDIUM | vcsmActorHydrator imports from state/identity internals (DAL, model, controller) without going through an adapter — violates the adapter boundary rule | IRONMAN |
| Zero tests | MEDIUM | The hydrator runs on every actor resolution across the entire app — no regression coverage means hydration bugs go undetected | SPIDER-MAN |
| Boot call site not audited | LOW | setupVcsmHydration() must be called before any hydration use — if the call site is conditional or lazy, boot order races could silently return null actors | SENTRY / LOKI |
| No adapter export | LOW | vcsmActorHydrator is an internal module with no adapter barrel — other features have no approved way to reference it if needed | IRONMAN |
| CURRENT_STATUS.md missing | INFO | Standard governance file was absent before this run | ARCHITECT |
| ARCHITECTURE.md missing | INFO | No architecture record existed before this run | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

1. **Direct state/ layer imports in vcsmActorHydrator.js**: Imports `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readIdentityActorByIdDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` from `@/state/identity/identity.read.dal` — these are internal state module files, not adapter-exposed surfaces. This cross-module DAL import is a boundary violation per VCSM adapter rules.

2. **Direct supabase query in vcsmActorHydrator.js** (lines 65–70): The vport owner fallback path issues a raw `.schema("vport").from("profile_actor_access").select(...)` query inline. This bypasses the DAL layer entirely and introduces an ungated DB access point in the hydrator logic.

3. **Model imports from state/**: `mapProfileActor` and `mapVportActor` are imported directly from `@/state/identity/identity.model` — internal model files, not adapter-exposed.

4. **Controller imports from state/**: `resolveRealmId` imported directly from `@/state/identity/identity.controller` — internal controller, not adapter-exposed.

---

## SPAGHETTI SCORE

**Module:** hydration
**Score:** WATCH
**Reasons:** The feature module itself (2 files, 0 layers) is minimal. However, vcsmActorHydrator.js reaches across three internal state/ sub-layers (DAL, model, controller) without adapter boundaries, and contains an inline raw DB query. The engine it wraps is clean and well-structured. Boundary violations are present but contained to one file.
**Release risk:** LOW (hydration is read-only and the violations are stable existing patterns, not new regressions)

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no contract content; filed as pending source review

**Check A (Source without behavior):** FAIL — source exists (2 files) but BEHAVIOR.md has no documented behavior
**Check B (Behavior without source):** PASS — no phantom behaviors claimed in BEHAVIOR.md
**Check C (Engine consistency):** PASS — `engines/hydration` declared in scanner and confirmed in setup.js import of `configureHydrationEngine`
**Check D (Data change consistency):** PASS — scanner reports 0 write surfaces; source confirms read-only (no inserts/updates/deletes)

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write a real BEHAVIOR.md contract | BEHAVIOR.md is a placeholder — no documented behavior, failure modes, or engine contract | LOGAN |
| P2 | Extract vport.profile_actor_access query into a named DAL function | Inline raw DB access in hydrator violates the DAL boundary and creates a hidden schema dependency | IRONMAN |
| P2 | Gate state/ imports through adapter boundary | vcsmActorHydrator imports state/ internals directly — adapter-expose or co-locate the needed helpers | IRONMAN |
| P3 | Add at least one integration test for hydrateVcsmActor (user and vport paths) | No test coverage on the most-consumed cross-cutting concern in the entire platform | SPIDER-MAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — write a real BEHAVIOR.md for this feature
- **IRONMAN** — audit the adapter boundary violations (state/ DAL/model/controller direct imports, inline DB query)
- **SPIDER-MAN** — add regression coverage for hydrateVcsmActor (both actor kinds)
- **SENTRY** — confirm setupVcsmHydration boot call site and order guarantees
- **VENOM** — review the inline vport.profile_actor_access query for RLS and ownership trust assumptions

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
