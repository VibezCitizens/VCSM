---
name: vcsm.actors.architecture
description: ARCHITECT V2 module architecture report for VCSM:actors
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-07
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** actors
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/actors
**Independence Status:** INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `actors` module provides a single, reusable actor search capability for the VCSM platform. It exposes a directory search against the `identity.search_actor_directory` Supabase RPC, normalizes raw DB rows into typed actor result objects, and gates visibility to public-only results when no viewer actor is present. It is a narrow, focused utility module — not a full identity or profile feature.

## OWNERSHIP

Platform identity domain. This module is a shared search utility consumed by other features (explore, chat, upload) that need actor lookup. There is no dedicated team; it is owned by whoever owns the identity domain surface. IRONMAN should establish explicit ownership.

## ENTRY POINTS

- No UI routes or screens — this module is API-only.
- Public surface: `actors.adapter.js` → `searchActorsAdapter(params)` which delegates to `searchActors` controller.
- Consumed by: `explore` feature, `chat` feature, `upload` feature (all via the adapter or the controller directly).

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 1 | searchActors.dal.js |
| Model | 2 | searchActors.model.js (mapSearchActorRow, mapSearchActorsRows) |
| Controller | 1 | searchActors.controller.js |
| Service | N/A | — |
| Adapter | 1 | actors.adapter.js |
| Hook | 0 | None |
| Component | 0 | None |
| Screen | 0 | None |
| Barrel | 0 | None |

Note: Callgraph reports model count as 2 (two exported functions in the model file: `mapSearchActorRow` and `mapSearchActorsRows`). Feature-map reports 1 model file.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md must be written |
| Owner defined | FAIL | No ownership record exists | No IRONMAN record, no OWNERS file |
| Entry points mapped | PASS | actors.adapter.js is the public surface | — |
| Controllers present/delegated | PASS | 1 controller (searchActors.controller.js) | — |
| DAL/repository present/delegated | PASS | 1 DAL (searchActors.dal.js) | — |
| Models/transformers present | PASS | searchActors.model.js with row mapper | — |
| Hooks/view models present | FAIL | 0 hooks detected | No useActorSearch hook — consumers wire search manually |
| Screens/components present | N/A | Module is API-only, no UI | — |
| Services/adapters present | PASS | actors.adapter.js wraps controller | — |
| Database objects mapped | PASS | identity.search_actor_directory RPC confirmed | — |
| Authorization path mapped | PARTIAL | DAL gates to public filter when viewerActorId is null; RPC enforces further | No explicit auth middleware layer |
| Cache/runtime behavior mapped | FAIL | No caching layer; no React Query or similar | Results are fetched fresh on every call |
| Error/loading/empty states mapped | PARTIAL | DAL returns [] on empty needle; throws on DB error | Consumers must handle loading/error — module provides no guards |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests | No unit tests for model mapper or DAL |
| Native parity noted | N/A | API-only module | — |
| Engine dependencies mapped | PASS | directory engine confirmed in scanner | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/directory | engine | inbound (actors uses identity schema RPC via Supabase client) | YES | identity.search_actor_directory |
| services/supabase/supabaseClient | service | inbound | YES | Standard platform DB client |
| services/supabase/postgrestSafe | service | inbound | YES | toContainsPattern utility |
| explore feature | consumer | outbound (explore calls actors) | YES — via adapter | — |
| chat feature | consumer | outbound (chat calls actors) | PARTIAL — chat may import controller directly | Review needed |
| upload feature | consumer | outbound (upload calls actors) | PARTIAL — upload may import controller directly | Review needed |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| identity.search_actor_directory | RPC read | identity schema (DB) | searchActorsDAL | PUBLIC filter enforced when no viewer; DB function controls final visibility |
| ActorSearchResult {actorId, kind, displayName, username, avatarUrl} | model output | actors module | explore, chat, upload, any feature via adapter | LOW — normalized, no raw IDs exposed in URLs |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes — API-only module | — |
| Loading state | DELEGATED | No loading state in module; consumers own it | Risk: inconsistent UX across consumers |
| Empty state | PASS | DAL returns [] when needle is empty or query is blank | — |
| Error state | PARTIAL | DAL throws on DB error; no boundary in controller | Consumers must catch; no standardized error shape |
| Auth/owner gates | PASS | viewerActorId=null forces public filter in DAL | — |
| Cache behavior | MISSING | No caching implemented in this module | Each consumer caches independently (or not at all) |
| Runtime dependencies | PASS | Supabase client always available at module load | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/actors/BEHAVIOR.md | PRESENT but PLACEHOLDER |
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
| BEHAVIOR.md is PLACEHOLDER | HIGH | No authoritative contract for how actor search behaves; consumers cannot verify expectations | LOGAN |
| 0 tests | HIGH | Model mapper and DAL are untested; silent regressions in result shape will not be caught | SPIDER-MAN |
| No useActorSearch hook | MEDIUM | All consumers must wire search logic manually; no consistent loading/error/debounce behavior enforced | Feature team |
| No error boundary in controller | MEDIUM | DB errors propagate raw to consumers; no standardized error shape contract | Feature team |
| No cache layer | LOW | Every keystroke causes a DB round-trip; consumers must cache independently | KRAVEN |
| Ownership record missing | LOW | No IRONMAN record; unclear who is responsible for the module | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

The `actors.adapter.js` correctly wraps the controller. However, the scanner shows that `chat` and `upload` features both call `identity.search_actor_directory` RPC directly in their own DAL files (`searchActors` in chat.dal, `searchMentionSuggestions` in upload.dal), bypassing this module entirely. These are functional duplicates of `searchActorsDAL`. This creates three separate code paths for the same DB function with no shared model normalization. This is not a boundary violation per se (they do not import actors' internals), but it is an architecture fragmentation risk — changes to the RPC signature must be replicated in three places.

---

## SPAGHETTI SCORE

**Module:** actors
**Score:** CLEAN
**Reasons:** 4 files, one clear data flow (DAL → Model → Controller → Adapter), single responsibility, no circular dependencies detected, no layer skipping within the module itself.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no contract content

**Check A (Source without behavior):** FAIL — source exists and is functional, but BEHAVIOR.md is a placeholder with no contract content.
**Check B (Behavior without source):** N/A — BEHAVIOR.md declares no happy paths to verify against source.
**Check C (§13 engine consistency):** PASS — scanner declares `directory` engine; DAL confirms `identity.search_actor_directory` RPC call, which belongs to the directory engine.
**Check D (§6 data change consistency):** PASS — scanner write surface is `searchActorsDAL → identity.search_actor_directory`; source confirms exactly this RPC call. No undeclared writes found.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md contract | PLACEHOLDER blocks governance, consumer expectations, and THOR eligibility | LOGAN |
| P2 | Add unit tests for model mapper and DAL | 0 tests on a shared search utility is a regression risk | SPIDER-MAN |
| P3 | Build useActorSearch hook | Consumers implement inconsistent loading/error/debounce handling | Feature team |
| P4 | Consolidate duplicate search DALs in chat and upload | RPC called in 3 places with no shared normalization | IRONMAN |

## RECOMMENDED HANDOFFS
- LOGAN — write the BEHAVIOR.md contract
- SPIDER-MAN — add unit tests for searchActors.model.js and searchActors.dal.js
- IRONMAN — establish module ownership, document consumer dependency graph
- KRAVEN — evaluate whether a shared cache layer is needed for actor search across consumers

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
