# Runtime Feature Index: hydration

## Metadata
| Field | Value |
|---|---|
| Feature | hydration |
| CURRENT Folder | CURRENT/features/hydration |
| Source Folder | apps/VCSM/src/features/hydration |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 0 | None (vcsmActorHydrator.js is a DI callback, not a formal controller) |
| DALs | 0 | None in feature layer — delegates to @/state/identity/identity.read.dal |
| Hooks | 0 | None in feature layer — hooks live in engines/hydration/src/useActorSummary.js |
| Models | 0 | None in feature layer — mappers imported from @/state/identity/identity.model |
| Screens | 0 | None |
| Components | 0 | None |
| Routes | 0 | No routes — infrastructure layer, no UI entry point |
| Tests | 0 | Zero test files in feature layer or engine layer |

### Engine Layer (engines/hydration/src/)
| Layer | Count | Key Files |
|---:|---:|---|
| Engine Controllers | 1 | hydrateActor.controller.js |
| Engine DALs | 1 | dal.js |
| Engine Hooks | 1 | useActorSummary.js |
| Engine Store | 1 | store.js (Zustand, TTL=5min) |
| Engine Pipelines | 1 | hydrate.js (hydrateActorsFromRows, hydrateActorsByIds, hydrateAndReturnSummaries) |
| Engine Models | 1 | normalize.js |
| Engine Utilities | 2 | extract.js, config.js |
| Engine Adapters | 1 | adapters/index.js |

### Feature Layer Files
| File | Purpose |
|---|---|
| apps/VCSM/src/features/hydration/setup.js | One-time DI registration — calls configureHydrationEngine with supabaseClient + hydrateVcsmActor |
| apps/VCSM/src/features/hydration/vcsmActorHydrator.js | VCSM-specific actor resolver — handles user and vport kinds; resolves ownerActorId for vports |

### Proxy Re-export Files (state/actors/)
| File | Re-exports |
|---|---|
| apps/VCSM/src/state/actors/hydrateActors.js | hydrateActorsFromRows, hydrateActorsByIds from @hydration |
| apps/VCSM/src/state/actors/useActorSummary.js | useActorSummary from @hydration |
| apps/VCSM/src/state/actors/actorStore.js | useActorStore from @hydration |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE FOUND | — | — | Hydration is infrastructure — no routes or screens |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| useActorStore.upsertActors | engines/hydration/src/store.js | In-memory Zustand write (no DB mutation) | N/A — client-side cache only | LOW |
| configureHydrationEngine | engines/hydration/src/config.js | Module-level singleton config write | N/A — app boot only; idempotent guard in setup.js | LOW |

No database write operations exist in this feature. All mutations are in-memory cache operations.

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| Inline supabaseClient call in vcsmActorHydrator | apps/VCSM/src/features/hydration/vcsmActorHydrator.js:65 | LOW | Direct `.schema('vport').from('profile_actor_access').select('actor_id')` bypasses DAL abstraction; relies on DB RLS only |
| vc.get_actor_summaries RPC | engines/hydration/src/dal.js | LOW | Public actor data (display names, avatars, slugs); no PII beyond what actors have published publicly |
| readActorPrivacyDAL | vcsmActorHydrator.js (via identity DAL) | LOW-MEDIUM | Privacy flag (`is_private`) is read and returned in the hydrated actor; consumers must respect this flag |
