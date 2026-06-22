---
title: Hydrator Module — Index
status: STUB
feature: hydration
module: hydrator
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/hydration/
scanner-version: 1.1.0
---

# hydration / modules / hydrator

VCSM actor hydration wiring — configures the engines/hydration engine at boot with the VCSM supabase client and VCSM-specific actor hydrator. **THOR BLOCKERS: PII fields in actor identity object, upsertActors publicly exported (store poisoning), mixed-shape return from hydrateAndReturnSummaries, raw UUID in useActorSummary.route fallback.**

## Module Summary

| Field | Value |
|---|---|
| Module | hydrator |
| Feature | hydration |
| Source Path | apps/VCSM/src/features/hydration/ |
| Screens | 0 (infrastructure — no UI) |
| Routes | 0 |
| Write Surfaces | None (actor store upsert via engine — in-memory only) |
| Feature Files | 2 (setup.js, vcsmActorHydrator.js) |
| Engine Delegation | engines/hydration (pipeline, store, DAL, consumer hook) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| setup.js | Bootstrap | Calls configureHydrationEngine() once at app boot; idempotent via _configured guard |
| vcsmActorHydrator.js | Hydrator | VCSM actor resolver — maps user + vport actor kinds to canonical actor summary; contains inline vport.profile_actor_access query (lines 65–70) |

## Engine Delegation Map

| Concern | Engine File | Notes |
|---|---|---|
| DI config | engines/hydration/src/config.js | configureHydrationEngine, getHydrator, getSupabaseClient |
| Actor store | engines/hydration/src/store.js | Zustand; 5-min TTL; upsertActors publicly exported (BW-HYDR-001) |
| Hydration pipeline | engines/hydration/src/hydrate.js | extract IDs → skip fresh → fetch → normalize → upsert |
| DAL | engines/hydration/src/dal.js | vc.get_actor_summaries RPC |
| Normalizer | engines/hydration/src/normalize.js | Actor row normalizer |
| Consumer hook | engines/hydration/src/useActorSummary.js | Returns displayName, username, avatar, route (raw UUID fallback — BW-HYDR-004) |
| Legacy controller | engines/hydration/src/controller/hydrateActor.controller.js | Routes to registered hydrator |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-HYDRATION-003 / BW-HYDR-002 — PII fields (email, birthdate, age, sex, is_adult, last_seen) fetched and mapped into identity hydration object in vcsmActorHydrator.js (mapProfileActor); adversarially confirmed BYPASSED
- **THOR BLOCKER** HIGH: BW-HYDR-001 — upsertActors publicly exported from engines/hydration/src/store.js; any caller can write arbitrary actor data into the hydration store (client-side store poisoning vector); adversarially confirmed PARTIAL
- **THOR BLOCKER** HIGH: BW-HYDR-003 — hydrateAndReturnSummaries returns mixed shape (fresh=camelCase, stale=snake_case); silent field access failures; adversarially confirmed BYPASSED
- **THOR BLOCKER** HIGH: BW-HYDR-004 — useActorSummary.route falls back to raw UUID when username is null; violates platform no-raw-IDs rule; adversarially confirmed BYPASSED
- MEDIUM: VEN-HYDRATION-002 — inline vport.profile_actor_access query in vcsmActorHydrator.js:65-70 bypasses DAL abstraction; no app-layer auth gate; RLS assumed
- MEDIUM: VEN-HYDRATION-001 — vc.get_actor_summaries RPC called with no app-layer auth gate; RLS assumed at DB layer
- MEDIUM: VEN-HYDRATION-004 — ownerActorId exposed in public useIdentity() surface via toPublicIdentity()
- MEDIUM: BW-HYDR-005 — hydration controllers have no session gate; arbitrary actorId triggers owner resolution
- LOW: VEN-HYDRATION-005 / BW-HYDR-008 — DEV debug events emit userId/allActorIds; production-safe via stub but no IS_DEV guard at call site
- LOW: VEN-HYDRATION-006 / BW-HYDR-007 — actor store has no eviction path for deleted/blocked/deactivated actors; 5-min stale window

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm which PII fields are fetched in vcsmActorHydrator.js mapProfileActor — exact column list
- [ ] Confirm upsertActors export visibility in engines/hydration/src/store.js — public or internal?
- [ ] Confirm hydrateAndReturnSummaries return shape — camelCase vs snake_case inconsistency
- [ ] Confirm useActorSummary.route null-username fallback — line number in engine
- [ ] Wrap vcsmActorHydrator.js:65-70 inline query in named DAL function
