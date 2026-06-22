---
title: Hydrator Module — Behavior
status: STUB
feature: hydration
module: hydrator
source: architect-derived
created: 2026-06-05
---

# hydration / modules / hydrator — BEHAVIOR

## Confirmed Behaviors

### App Boot Configuration (setup.js)
- setup.js called once at app boot
- Calls configureHydrationEngine(supabaseClient, { actor: vcsmActorHydrator })
- Idempotent: _configured guard prevents double-initialization
- After this call, the engine is ready to hydrate actor IDs on demand

### Actor Hydration (vcsmActorHydrator.js)
- Given an actorId, resolves actor kind (user vs vport) and fetches display data
- User actors: reads profile data including PII fields (email, birthdate, age, sex, is_adult, last_seen) — THOR BLOCKER
- VPORT actors: reads vport.profile_actor_access inline query (lines 65–70) to resolve is_primary owner relationship — no DAL wrapper
- Maps result to canonical actor summary shape (displayName, username, avatar, route)
- route falls back to raw UUID when username is null — THOR BLOCKER

### Engine Pipeline (engines/hydration)
- hydrateActor / hydrateActorsByIds: extract IDs → getMissingOrStale → fetch via vc.get_actor_summaries RPC → normalize → upsertActors into Zustand store
- Store: 5-min TTL; getMissingOrStale returns IDs not in store or past TTL
- Consumer: useActorSummary(actorId) reads from store; returns displayName, username, avatar, route, missing, stale

### Mixed Shape Bug (hydrateAndReturnSummaries)
- Fresh hydration returns camelCase shape
- Stale/cached results return snake_case shape
- Silent field access failures downstream for stale results — adversarially confirmed BYPASSED

## Must Never Happen

- Actor identity object must never contain PII (email, birthdate, age, sex, is_adult, last_seen)
- route must never be a raw UUID — must fail gracefully when username is null
- upsertActors must not be callable from outside the hydration engine

## TODO

- [ ] Confirm setup.js _configured guard implementation — module-level boolean or singleton?
- [ ] Confirm vcsmActorHydrator.js column list for user actor fetch
- [ ] Confirm hydrateAndReturnSummaries return shape discrepancy — confirm in engine source
