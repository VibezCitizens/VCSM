---
name: vcsm.hydration.index
description: VCSM hydration feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / hydration

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | Delegated to engines/hydration/src/controller/hydrateActor.controller.js |
| DAL files | 0 | Delegated to engines/hydration/src/dal.js and state/identity/identity.read.dal.js |
| Hooks | 0 | Delegated to engines/hydration/src/useActorSummary.js |
| Models | 0 | Delegated to state/identity/identity.model.js |
| Screens | 0 | Infrastructure module — no UI |
| Components | 0 | Infrastructure module — no UI |
| Adapters | 0 | No feature-level adapter barrel |
| Barrels | 0 | No barrel/index export |
| Tests | 0 | No tests (scanner confirmed 0) |
| Routes | 0 | No routes in route-map for this feature |
| Total source files | 2 | setup.js, vcsmActorHydrator.js |

### Source Files

| File | Purpose |
|---|---|
| `apps/VCSM/src/features/hydration/setup.js` | App boot entry — calls configureHydrationEngine() once with VCSM supabase client and hydrators; idempotent via _configured guard |
| `apps/VCSM/src/features/hydration/vcsmActorHydrator.js` | VCSM-specific actor hydrator — resolves user and vport actor kinds using state/identity DAL helpers and maps to canonical actor summary shape |

### Engine Source Files (engines/hydration — read reference)

| File | Purpose |
|---|---|
| `engines/hydration/index.js` | Engine public API barrel |
| `engines/hydration/src/config.js` | DI config — configureHydrationEngine, getHydrator, getSupabaseClient |
| `engines/hydration/src/store.js` | Zustand actor store — 5-minute TTL, safe-merge upsert, getMissingOrStale |
| `engines/hydration/src/hydrate.js` | Canonical hydration pipeline — extract IDs, skip fresh, fetch, normalize, upsert |
| `engines/hydration/src/dal.js` | getActorSummariesByIdsDAL — vc.get_actor_summaries RPC |
| `engines/hydration/src/normalize.js` | Actor row normalizer |
| `engines/hydration/src/extract.js` | Actor ID extractor from arbitrary row shapes |
| `engines/hydration/src/useActorSummary.js` | Consumer hook — reads from store; no network; returns displayName, username, avatar, route, missing, stale |
| `engines/hydration/src/controller/hydrateActor.controller.js` | Legacy single-actor hydration controller — routes to registered app hydrator |
| `engines/hydration/src/adapters/index.js` | Engine adapter barrel — re-exports configureHydrationEngine and hydrateActor |

## Write Surface Map

No write surfaces detected by scanner. This feature is read-only at the database level. All DB access is via reads (actor identity, profile, privacy, owner resolution).

## Security-Sensitive Surfaces

One attention item found in static scan:

- **vport.profile_actor_access inline query** in `vcsmActorHydrator.js` (lines 65–70): A raw `.schema("vport").from("profile_actor_access").select("actor_id")` query is issued directly inside the hydrator without a DAL wrapper. This reads the `is_primary` owner relationship. RLS is assumed to be enforced at the DB level, but there is no app-level auth gate in this code path. This should be wrapped in a named DAL function and audited for RLS coverage.

## Engine Dependencies

- `engines/hydration` — canonical dependency; `configureHydrationEngine` called in setup.js; all hydration pipeline, store, DAL, and consumer hook live here

## Routes

No routes in route-map for this feature. Hydration is a startup/infrastructure concern with no user-facing screens.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no real contract content) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
