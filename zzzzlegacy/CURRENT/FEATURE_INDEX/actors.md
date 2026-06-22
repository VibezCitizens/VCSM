# Feature Index: actors

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/actors`
Source Path: `apps/VCSM/src/features/actors/`

## DR. STRANGE Read Order

1. [README.md](../features/actors/README.md)
2. [CURRENT_STATUS.md](../features/actors/CURRENT_STATUS.md)
3. [SECURITY.md](../features/actors/SECURITY.md)
4. [ARCHITECTURE.md](../features/actors/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/actors/OWNERSHIP.md)
6. [TESTS.md](../features/actors/TESTS.md)
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/actors/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | YES |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 7 / 10

## Active Risks

- **SENTRY-2026-01 (BLOCKING)** — `checkVportOwnership.controller.js` imports `getActorByIdDAL` directly from booking feature's internal path, bypassing the adapter boundary. Must be fixed before new callers are added.
- **IRON-BOOK-WARN3 (HIGH, OPEN)** — Dual `assertActorOwnsVportActor` implementations: one in `features/booking/controller/` and one in `engines/booking/src/controller/`. Risk of drift between ownership assertion logic.
- **VENOM-PROFILES-VF001** — Open finding on actor-adjacent ownership surface (PROFILE_MUTATION — CRITICAL, never dedicated security audit).
- **SENTRY-BARBER-2026-06-01** — Open finding from barber/locksmith/barbershop gate pass.
- **SPIDER-MAN BRANCH BLOCKED** — `vport-booking-feed-security-updates` has 7 CRITICAL + 7 HIGH findings with zero regression tests. Minimum 5 test files required before merge.

## Open Blockers

- **SENTRY-2026-01** — Adapter boundary bypass via direct DAL import from booking path.
- **SPIDER-MAN BLOCKED** — Zero regression tests on current branch. Merge is unsafe.

## Deferred Items

DEFERRED.md — MISSING. No deferred items formally registered.

## Latest Ticket

TICKET-DOCS-CLEANUP-001 (governance bootstrap, 2026-06-02)

## Audit Coverage

| Command | Status |
|---------|--------|
| IRONMAN | COMPLETE — 2026-05-18 |
| SENTRY | PARTIAL — adjacent findings from 2026-06-01 barber gate |
| VENOM | NOT RUN (dedicated pass) |
| ELEKTRA | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ARCHITECT | COMPLETE — 2026-06-02 (TICKET-ACTORS-ARCHITECT-0001) |
| SPIDER-MAN | BLOCKED |
| KRAVEN | NOT RUN |
| LOKI | NOT RUN |
| THOR | NOT RUN |

## Related Output Files

- `features/dashboard/evidence/2026-05-18_ironman_dashboard-team-booking-ownership.md`
- `features/actors/ARCHITECTURE.md`
- `features/actors/SECURITY.md`
- `features/actors/TESTS.md`

## Recommended Next Command

VENOM — after resolving `SENTRY-2026-01`, audit actor-adjacent ownership and identity trust boundaries. ARCHITECT completed on 2026-06-02.

## Recommended Next Ticket

Open ticket to resolve SENTRY-2026-01 (adapter boundary bypass) and wire `getActorByIdDAL` through `booking.adapter.js`. Prerequisite for VENOM dedicated pass.

## DR. STRANGE Entry
- File: CURRENT/features/actors/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
