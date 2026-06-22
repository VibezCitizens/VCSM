# Runtime Feature Index: actors

## Metadata

| Field | Value |
|---|---|
| Feature | actors |
| CURRENT Folder | CURRENT/features/actors |
| Source Folder | apps/VCSM/src/features/actors |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| Classification | PLATFORM (reclassified from FEATURE — TICKET-0006A, 2026-06-02) |
| Security Tier | CRITICAL |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 1 | searchActors.controller.js |
| DALs | 1 | searchActors.dal.js |
| Models | 1 | searchActors.model.js |
| Adapters | 1 | adapters/actors.adapter.js |
| Hooks | 0 | NONE FOUND — headless service |
| Screens | 0 | NONE FOUND — headless service |
| Components | 0 | NONE FOUND |
| Routes | 0 | NONE FOUND — headless platform service |
| Tests | 0 | NONE FOUND |

**Total files in source:** 4

### Drift Alert — Previously Documented Files Not Found in Source

| File | Prior Status | Current Status | Drift ID |
|---|---|---|---|
| controllers/hydrateActors.controller.js | Documented PRESENT | NOT FOUND | ARCH-ACTORS-DRIFT-001 |
| dal/getActorSummariesByIds.dal.js | Documented PRESENT | NOT FOUND | ARCH-ACTORS-DRIFT-002 |
| model/extractActorIdsForHydration.model.js | Documented PRESENT | NOT FOUND | ARCH-ACTORS-DRIFT-003 |

The hydration half of the actors feature appears to have been removed or migrated to `engines/hydration/src/useActorSummary.js`. This drift is unresolved and must be confirmed by IRONMAN before any new callers reference hydration paths.

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE | — | — | Headless service — no routes or screens; consumed via actors.adapter.js |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| searchActors.controller.js | actors/controllers/ | READ (search query) | N/A — READ ONLY | LOW |
| searchActors.dal.js | actors/dal/ | READ (Supabase RPC) | N/A — READ ONLY | LOW |
| actors.adapter.js | actors/adapters/ | READ boundary | N/A — READ ONLY | LOW |

Note: actors feature is READ ONLY. No write surfaces exist. All actor creation and actor_owners write paths live in auth/identity features.

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| searchActors.dal.js | actors/dal/ | IDENTITY — batch actor search via identity.search_actor_directory RPC | Unauthenticated callers receive public-only results (p_filter:'public'). RPC-enforced visibility — no explicit app-layer auth check. |
| actors.adapter.js | actors/adapters/ | OWNERSHIP BOUNDARY — sole public entry point for actor search; VPORT team and privacy block search both route through this boundary | Adapter integrity critical: bypass of adapter (direct controller import) would be a boundary violation |
| assertActorOwnsVportActor (dual impl) | features/booking/controller/ + engines/booking/src/controller/ | OWNERSHIP | IRON-BOOK-WARN3 — dual implementations risk ownership assertion drift; all app callers use feature copy |

## Cross-Feature Consumer Map

| Consumer Feature | File | Import | Access Pattern |
|---|---|---|---|
| settings/privacy | Blocks.controller.js | searchActorsAdapter | Correct — via adapter boundary |
| dashboard/vport/team | vportTeamAccess.controller.js | searchActorsAdapter | Correct — via adapter boundary |

## Audit / Ticket Evidence From CURRENT

| Item | Status | Source CURRENT File |
|---|---|---|
| SENTRY-2026-01 — boundary violation: checkVportOwnership imports getActorByIdDAL directly from booking internal path | OPEN / BLOCKING | features/actors/CURRENT_STATUS.md |
| IRON-BOOK-WARN3 — dual assertActorOwnsVportActor implementations (feature vs engine) | HIGH, OPEN | features/actors/CURRENT_STATUS.md |
| SPIDER-MAN branch blocked — 7 CRITICAL + 7 HIGH on vport-booking-feed-security-updates | BLOCKED | features/actors/CURRENT_STATUS.md |
| ARCH-ACTORS-DRIFT-001/002/003 — 3 previously documented files absent from source | NEW, OPEN | This scan (ARCHITECT 2026-06-02) |
| ARCHITECT complete — TICKET-ACTORS-ARCHITECT-0001 (initial) | COMPLETE | features/actors/HISTORY_INDEX.md |
| ARCHITECT refresh — ARCHITECT-ACTORS-0001 (this run) | COMPLETE | This file |
| No dedicated VENOM/ELEKTRA/SENTRY pass on actors directly | NOT RUN | features/actors/CURRENT_STATUS.md |

## Runtime Risk Summary

Actors is a small (4-file) READ-ONLY headless platform service with no routes, screens, write paths, or hooks. The surviving search surface is structurally clean and enforces visibility via the `identity.search_actor_directory` RPC's `p_filter` parameter. The primary risks are: (1) three files previously documented as present are absent from source — the hydration half of the feature appears removed but is undocumented; (2) SENTRY-2026-01 remains a BLOCKING adapter boundary violation in the booking feature that depends on actors' adapter contract; (3) zero tests exist, keeping the branch blocked. The adapter is consumed correctly by both current consumers (privacy blocks and team access) via the adapter boundary.

## Recommended Next Command

IRONMAN — confirm the hydrateActors/getActorSummariesByIds/extractActorIdsForHydration removal is intentional, close drift tickets, and resolve 4 open ownership gaps. Then VENOM after SENTRY-2026-01 is resolved.

## Recommended Next Ticket

TICKET-ACTORS-DRIFT-001 — Confirm or deny intentional removal of hydrateActors.controller.js, getActorSummariesByIds.dal.js, and extractActorIdsForHydration.model.js. Update ARCHITECTURE.md and FEATURE_INDEX_RUNTIME accordingly. Prerequisite before any new caller adds a hydration dependency on the actors feature.
