# Feature Index: booking

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/booking`
Source Path: `apps/VCSM/src/features/booking/` + `engines/booking/` + `apps/VCSM/src/features/dashboard/vport/controller/`

## DR. STRANGE Read Order

1. [README.md](../features/booking/README.md)
2. [CURRENT_STATUS.md](../features/booking/CURRENT_STATUS.md)
3. [SECURITY.md](../features/booking/SECURITY.md)
4. [ARCHITECTURE.md](../features/booking/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/booking/OWNERSHIP.md) — note: listed as `ownership.md` (lowercase)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/booking/PERFORMANCE.md) — note: listed as `performance.md` (lowercase)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/booking/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 7 / 10

## Active Risks

- **TICKET-BOOKING-RPC-001 (P0, DB-BLOCKED)** — `customer_actor_id` injection + status overpermission confirmed on live DB. Replace broad booking INSERT/UPDATE with typed state-machine RPCs.
- **V-BOOK-02/03/04 (HIGH, OPEN)** — Carry-forward open security findings (P1).
- **V-BOOK-06 (MEDIUM, OPEN)** — Carry-forward finding (P2).
- **ELEK-001 (MEDIUM)** — `cancelBooking` customer path has no actor void/kind check. `is_void` actor can cancel if session token is valid.
- **BW-SCHED-001/002/003, BW-CAL-002 (MEDIUM)** — Schedule and calendar BLACKWIDOW open findings.
- **BLOCK-BOOK-002 (P0)** — Zero regression tests for all booking security fixes. SPIDER-MAN BLOCKED. Minimum 5 test files required before merge.
- **Dead code** — 12 dead DALs + 8 dead controllers confirmed, not yet removed.
- **{public} role** — Six booking policies use {public} role instead of {authenticated}.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- **BLOCK-BOOK-001** — TICKET-BOOKING-RPC-001 DB-BLOCKED. Database-level change required before code change.
- **BLOCK-BOOK-002** — Zero regression tests. SPIDER-MAN BLOCKED. Merge unsafe.
- **BLOCK-BOOK-003** — ELEK-001 customer cancel void/kind check required before production volume on cancel path.

## Deferred Items

DEFERRED.md — MISSING. Deferred items inferred from CURRENT_STATUS:
- ELEK-002 through ELEK-006 (LOW, deferred)
- {public} role governance cleanup (separate migration)
- Dead DAL/controller removal (12+8 files — CARNAGE sprint pending)

## Latest Ticket

TICKET-BOOKING-RPC-001 (OPEN / DB-BLOCKED)

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — multiple passes (2026-05-14, 2026-05-27) |
| ELEKTRA | COMPLETE — 2026-05-27 (defer-001 resolution) |
| BLACKWIDOW | COMPLETE — 2026-05-27 (schedule + calendar) |
| SPIDER-MAN | BLOCKED — 7 CRITICAL + 7 HIGH gaps; zero regression tests |
| THOR | COMPLETE — CAUTION CLEARED (gate 3, 2026-05-27) with condition |
| KRAVEN | COMPLETE — 2026-05-14 (bottleneck), 2026-05-27 (vport book tab) |
| IRONMAN | COMPLETE — 2026-05-14, 2026-05-18 |
| CARNAGE | COMPLETE — 2026-05-18, 2026-05-27 (TICKET-0005 CLOSED) |
| LOKI | COMPLETE — 2026-05-14 |
| SENTRY | COMPLETE — 2026-05-14, 2026-05-27 |
| ARCHITECT | COMPLETE — 2026-06-02 (TICKET-BOOKING-ARCHITECT-0001) |

## Related Output Files

- `features/booking/SECURITY.md`
- `features/booking/ARCHITECTURE.md`
- `features/booking/CURRENT_STATUS.md`
- `features/booking/ticket_booking_rpc_001.md`
- `features/booking/2026-05-27_thor_booking-module-deferred-gate.md`
- `features/booking/2026-05-28_elektra_availability.md`
- `platform/security/2026-05-14_carnage_booking-rls-policies.md`

## Recommended Next Command

VENOM + ELEKTRA (post-RPC migration). Before that: resolve ELEK-001 (customer cancel void check — one-file fix), then SPIDER-MAN (minimum 5 regression test files before merge).

## Recommended Next Ticket

Advance TICKET-BOOKING-RPC-001 when DB migration window opens. Open separate ticket for dead DAL/controller removal (12 DALs + 8 controllers) scoped to CARNAGE.

## DR. STRANGE Entry
- File: CURRENT/features/booking/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
