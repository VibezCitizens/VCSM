---
# Module Architecture Report — ARCHITECT §26.11
# Feature: hydration
# App: VCSM
# Ticket: ARCHITECT-HYDRATION-0001
# Generated: 2026-06-02
# Status: IMMUTABLE DATED REPORT — do not modify; update ARCHITECTURE.md instead

---

# hydration — Module Architecture Report

## Feature Overview

The hydration feature is the actor identity resolution and caching system for VCSM. It bridges the shared hydration engine (`engines/hydration/`) and the VCSM app layer, providing: (1) a one-time DI setup that registers the VCSM-specific actor hydrator with the engine, and (2) a VCSM-specific hydrator (`hydrateVcsmActor`) that resolves `user` and `vport` actors from app-owned DAL helpers, mappers, and the identity controller. The feature owns only two source files; the bulk of the pipeline lives in the engine. Consumer-facing hooks (`useActorSummary`, `useActorStore`) and pipeline functions (`hydrateActorsFromRows`, `hydrateActorsByIds`, `hydrateAndReturnSummaries`) are re-exported through `apps/VCSM/src/state/actors/` proxy files.

**Source Path:** apps/VCSM/src/features/hydration/
**Engine Path:** engines/hydration/src/
**Security Tier:** LOW
**Feature Status:** ACTIVE

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | NO | None — no controller/ directory in feature layer |
| DALs | NO | None — no dal/ directory; DAL calls delegated to state/identity/ |
| Models | NO | None — model calls delegated to state/identity/identity.model.js |
| Hooks | NO | None — hook layer lives entirely in engines/hydration/src/useActorSummary.js |
| Screens | NO | None |
| Components | NO | None |
| Adapters | NO | None — no adapter boundary file; consumed via @hydration alias |
| Engine controllers | YES | engines/hydration/src/controller/hydrateActor.controller.js |
| Engine DALs | YES | engines/hydration/src/dal.js |

---

## Active Controllers

### Feature Layer

| Controller | Purpose | Auth Gate |
|---|---|---|
| vcsmActorHydrator.js (hydrator callback) | VCSM-specific actor resolver for user and vport kinds; resolves realm ID, privacy flag, ownerActorId | No auth gate — DI callback; actorId null-check is the only guard |

Note: `vcsmActorHydrator.js` is not a traditional controller file. It is a DI-registered callback registered with `appKey: 'vcsm'` and `actorSource: 'vc'`. It is never called directly by UI or hooks — it is invoked only by the engine pipeline when `hydrateActor({ appKey: 'vcsm', actorSource: 'vc' })` is dispatched. No app-layer consumers use the legacy `hydrateActor` engine controller directly; all app-layer hydration uses the batch pipeline.

### Engine Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| engines/hydration/src/controller/hydrateActor.controller.js | DI dispatch — resolves registered hydrator by appKey+actorSource and delegates | None — internal pipeline |

---

## Active DALs

### Feature Layer

| DAL | Tables | Notes |
|---|---|---|
| None in feature layer | — | All data access delegated to @/state/identity/identity.read.dal |

### Engine Layer

| DAL | Tables / RPC | Notes |
|---|---|---|
| engines/hydration/src/dal.js | `vc.get_actor_summaries` (RPC, `p_actor_ids` param) | Canonical batch actor summary fetch; deduplicates IDs before query |

### Cross-feature DAL dependencies in vcsmActorHydrator.js

| Imported From | Symbol | Access |
|---|---|---|
| @/state/identity/identity.read.dal | readIdentityActorByIdDAL | vc.actors |
| @/state/identity/identity.read.dal | readProfileIdentityDAL | platform.profiles |
| @/state/identity/identity.read.dal | readActorPrivacyDAL | actor privacy record |
| @/state/identity/identity.read.dal | readVportIdentityDAL | vport.profiles |
| @/state/identity/identity.read.dal | readActorOwnerUserDAL | vc.actor_owners |
| @/state/identity/identity.read.dal | readUserActorByProfileIdDAL | vc.actors by profile_id |
| Direct supabaseClient (inline, line 65) | vport.profile_actor_access | Fallback ownerActorId: `.select('actor_id').eq('profile_id', ...).eq('is_primary', true)` |

---

## Active Hooks

| Hook | Location | Calls | Purpose |
|---|---|---|---|
| useActorSummary | engines/hydration/src/useActorSummary.js | useActorStore (Zustand selector) | Read-only presentation hook; derives displayName, username, avatar, route, missing, stale; does NOT trigger network requests |

**Proxy re-exports:**
- `apps/VCSM/src/state/actors/useActorSummary.js` — re-exports `useActorSummary` from `@hydration`
- `apps/VCSM/src/state/actors/actorStore.js` — re-exports `useActorStore` from `@hydration`
- `apps/VCSM/src/state/actors/hydrateActors.js` — re-exports `hydrateActorsFromRows`, `hydrateActorsByIds` from `@hydration`

---

## Engine Dependencies

| Engine | Import Path | Purpose |
|---|---|---|
| hydration | @hydration (engines/hydration) | configureHydrationEngine, useActorStore, hydrateActorsFromRows, hydrateActorsByIds, hydrateAndReturnSummaries, useActorSummary, hydrateActor, fetchActorSummaries |

---

## Cross-Feature Dependencies

### Outbound (hydration depends on)

| Feature / Module | What Is Imported | Direction |
|---|---|---|
| state/identity/identity.read.dal | 6 DAL functions | hydration → identity |
| state/identity/identity.model | mapProfileActor, mapVportActor | hydration → identity |
| state/identity/identity.controller | resolveRealmId | hydration → identity |
| services/supabase/supabaseClient | supabase (DI arg + inline fallback) | hydration → infrastructure |

### Inbound (consumers of hydration)

| Feature | Import Path Used | What It Calls |
|---|---|---|
| feed | @hydration | hydrateActorsFromRows, useActorSummary |
| post (postcard + commentcard) | @hydration, @/state/actors/hydrateActors | hydrateAndReturnSummaries, hydrateActorsFromRows, useActorSummary |
| explore | @hydration | hydrateActorsByIds |
| booking | @hydration | hydrateAndReturnSummaries (listMyBookings) |
| dashboard/vport (schedule, bookings, team) | @hydration | hydrateActorsByIds, hydrateAndReturnSummaries, useActorSummary |
| notifications | @hydration | (setup.js + hooks) |
| profiles | @hydration | hydrateActorsByIds, useActorSummary |
| settings/profile | @hydration | useActorStore.upsertActors |
| settings/privacy | @/state/actors/useActorSummary | useActorSummary |
| block | @hydration | useActorSummary |
| chat | @/state/actors/* | useActorSummary, hydrateActorsFromRows |

---

## Authorization Pattern

The hydration feature has no authorization gate. It is a read-only infrastructure layer. The DI hydrator callback (`hydrateVcsmActor`) performs a null-check on `actorId` as the only guard. All security relies on:
1. Supabase RLS policies at the database level for the `vc.get_actor_summaries` RPC.
2. The calling feature having already validated the session before triggering hydration.
3. The inline fallback query against `vport.profile_actor_access` relies entirely on DB-level RLS — there is no application-layer ownership check on this path.

---

## Module Independence Classification

**DEPENDENT**

The feature layer (2 files) has zero standalone capability. It is a DI registration bridge that depends on the hydration engine for all pipeline logic and on the identity state module for all data access. The engine layer itself is self-contained.

---

## Architecture State

**STABLE**

The engine/app split is well-designed. The DI setup pattern (singleton guard + register on first call) is clean. The Zustand store with TTL-based staleness (5-minute freshness window, safe-merge semantics) is production-appropriate. The re-export proxy pattern in `state/actors/` gives consumers stable import paths. No dual implementations or orphaned code paths were found.

---

## Known Structural Risks

1. **Inline Supabase client call (vcsmActorHydrator.js:65):** The fallback `ownerActorId` resolution path queries `vport.profile_actor_access` directly via the imported `supabaseClient` rather than through a named DAL function. This bypasses the DAL abstraction contract and the `select('*')` ban audit trail. Risk: LOW (read-only, single column). Recommended fix: extract to `readVportPrimaryActorIdDAL` in identity.read.dal.
2. **No adapter boundary file:** The hydration feature has no `hydration.adapter.js`. Consumer features import from the `@hydration` engine alias directly or from `state/actors/` proxies. The proxy files are a de-facto adapter but are not formally governed as one.
3. **Zero test coverage:** No test files exist for the feature layer or the engine layer. The canonical hydration pipeline (`extract → skip-stale → fetch → normalize → upsert`) is untested. This is platform-critical infrastructure.
4. **Legacy hydrateActor engine controller path:** `engines/hydration/src/controller/hydrateActor.controller.js` exports a per-actor DI dispatch function. No app-layer consumers call it directly. All app hydration uses the batch pipeline. This path may be marked for deprecation or reserved for future engine-level consumers.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, source comments | — |
| Owner defined | FAIL | OWNERSHIP.md missing | IRONMAN not run |
| Entry points mapped | PASS | setup.js called from main.jsx; engine index fully documented | — |
| Controllers present | PARTIAL | Engine controller present; no feature-layer controller dir | vcsmActorHydrator is a hydrator callback, not a formal controller |
| DAL/repository present | PARTIAL | Engine DAL present; feature layer uses identity DAL | Inline supabase call bypasses DAL pattern |
| Models/transformers | PASS | normalize.js in engine; identity.model mappers used | — |
| Hooks/view models | PASS | useActorSummary + useActorStore in engine; proxy re-exports stable | — |
| Screens/components | N/A | Infrastructure layer — no UI expected | — |
| Authorization path mapped | PARTIAL | No app-layer auth gate; DB RLS + caller trust | Inline direct client call not DAL-gated |
| Engine dependencies mapped | PASS | engines/hydration fully mapped | — |
| Tests/validation noted | FAIL | Zero test files in feature or engine layer | SPIDER-MAN not run |

---

## Recommended Handoffs

- **IRONMAN** — Ownership not defined; OWNERSHIP.md missing.
- **SPIDER-MAN** — Zero test coverage on platform-critical infrastructure; hydration pipeline has no regression net.
- **VENOM** — Security posture unknown; inline non-DAL Supabase call requires trust boundary review.
- **DB** — `vc.get_actor_summaries` RPC is the canonical data source; RPC definition, column shape, and RLS policy should be audited.

---

## Final Module Status

**MOSTLY COMPLETE**

The engine layer is complete and well-structured. The feature layer is minimal but correct for its purpose as a DI registration bridge. Governance gaps: no adapter boundary, no tests, no OWNERSHIP.md, one inline non-DAL data access.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-HYDRATION-0001
- Architecture State: STABLE
- Feature: hydration
- Tier: LOW
- Controller Count: 1 (engine controller) + 1 (vcsmActorHydrator DI callback) = 2 total
- DAL Count: 1 (engine dal.js) + 6 delegated identity DAL calls
- Hook Count: 1 (useActorSummary in engine)
- Engine Deps: engines/hydration
- Structural Risks: inline-supabase-no-dal, no-adapter-boundary, zero-test-coverage, legacy-hydrateActor-unused
- Module Status: MOSTLY_COMPLETE
