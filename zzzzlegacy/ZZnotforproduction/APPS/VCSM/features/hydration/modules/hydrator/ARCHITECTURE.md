---
title: Hydrator Module — Architecture
status: STUB
feature: hydration
module: hydrator
source: architect-derived
created: 2026-06-05
---

# hydration / modules / hydrator — ARCHITECTURE

## Boot Configuration

```
app boot (main.jsx or App.jsx)
  └── setup.js
        └── configureHydrationEngine(supabaseClient, { actor: vcsmActorHydrator })
              └── engines/hydration/src/config.js
                    └── stores hydrator + client in module-level DI container
```

## Hydration Pipeline (engine-owned)

```
[any feature calls hydrateActorsByIds(actorIds)]
  └── engines/hydration/src/hydrate.js
        ├── extract(rows) → actorIds
        ├── getMissingOrStale(actorIds) → missingIds (skip fresh within 5-min TTL)
        ├── vc.get_actor_summaries RPC (no app-layer auth gate — VEN-HYDRATION-001)
        ├── normalize(rows) → actor summaries
        └── upsertActors(summaries) → Zustand store (publicly exported — BW-HYDR-001)
```

## VCSM Actor Hydrator (feature-owned)

```
vcsmActorHydrator.js
  ├── [user kind]
  │     └── state/identity DAL helpers → profile read
  │           → maps email, birthdate, age, sex, is_adult, last_seen into identity object
  │                                       ↑ THOR BLOCKER: PII fields (VEN-HYDRATION-003)
  │
  └── [vport kind]
        └── inline query (lines 65–70):  ← no DAL wrapper (VEN-HYDRATION-002)
              vport.profile_actor_access
                .select("actor_id")
                .eq("is_primary", true)
```

## Consumer Hook (engine-owned)

```
[any component]
  └── useActorSummary(actorId)
        └── reads from Zustand store
              └── returns { displayName, username, avatar,
                            route: username ?? `/profile/${actorId}` }
                                               ↑ raw UUID fallback — THOR BLOCKER (BW-HYDR-004)
```

## Mixed Shape Bug

```
hydrateAndReturnSummaries():
  ├── fresh path  → normalize() → camelCase shape
  └── stale path  → store.get() → snake_case shape   ← THOR BLOCKER (BW-HYDR-003)
                                                          silent field access failures downstream
```

## TODO

- [ ] Wrap vcsmActorHydrator.js:65-70 in named DAL function
- [ ] Remove PII columns from user actor SELECT
- [ ] Make upsertActors internal to engine (not exported)
- [ ] Fix hydrateAndReturnSummaries to normalize both paths to camelCase
- [ ] Fix useActorSummary.route null-username fallback to slug-only or graceful error
