# Feature Index: vport

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/vport`
Source Path: `apps/VCSM/src/features/vport/` + dashboard cards + profile kinds + public menu/QR + settings + subscribers + content pages + feed system posts

## DR. STRANGE Read Order

1. [README.md](../features/vport/README.md)
2. [CURRENT_STATUS.md](../features/vport/CURRENT_STATUS.md)
3. [SECURITY.md](../features/vport/SECURITY.md)
4. [ARCHITECTURE.md](../features/vport/ARCHITECTURE.md)
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. HISTORY_INDEX.md — MISSING

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | MISSING |

Coverage Score: 4 / 10

## Active Risks

- **S-BLK-001 (HIGH, BEFORE RELEASE BLOCKER)** — Locksmith write paths: `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail` have NO `assertActorOwnsVportActorController`. Reconfirmed 2026-06-01 by SENTRY.
- **ELEK-007/008 (HIGH)** — Menu delete controllers (`deleteVportActorMenuCategoryController`, `deleteVportActorMenuItemController`) missing ownership gates. IDs returned by public read surface — cross-actor delete reachable.
- **ELEK-009 (HIGH, dual failure)** — `deleteVportServiceAddonController` missing ownership check AND the DAL file does not exist (runtime broken).
- **VENOM-DELETE-002 (HIGH)** — Delete RPCs (`soft_delete_vport`, `hard_delete_vport`, `restore_vport`) not in tracked migrations. DR hazard for fresh deployments.
- **VENOM-DELETE-003 (HIGH)** — Incomplete `hard_delete_vport` cascade — 5 tables orphaned.
- **VENOM-CONTENT-004 / BW-CONTENT-004 (HIGH, DB-BLOCKED)** — Former VPORT owners retain `content_pages` access via legacy RLS OR-merge.
- **Hardcoded PUBLIC_REALM_ID (HIGH)** — Gas price + menu system post controllers use hardcoded realm ID. Risk when Void Realm launches — must replace with `resolvePublicRealmIdDAL()`.
- **BW-VPD-002 (MEDIUM)** — Booking state machine replay — terminal states can be overwritten.
- **V-SUB-001/002/003 (CI BLOCKED)** — 17 tests intentionally failing for subscriber ownership gates.
- **TICKET-BOOKING-RPC-001 (P0, DB-BLOCKED)** — `customer_actor_id` injection + status overpermission.
- Total: 27 open findings across all VPORT sub-surfaces.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- **S-BLK-001** — Locksmith ownership gates missing. BEFORE RELEASE BLOCKER.
- **ELEK-009** — Broken runtime (missing DAL) on deleteVportServiceAddonController.
- **V-SUB-001/002/003** — 17 failing CI tests blocking merge.
- **TICKET-BOOKING-RPC-001** — DB-BLOCKED.
- **VENOM-CONTENT-004** — DB-BLOCKED (legacy content_pages RLS).
- **SPIDER-MAN BLOCKED** — 7 CRITICAL + 7 HIGH missing regression tests.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- VENOM-DELETE-002/003 — delete RPC migration tracking + cascade fix.
- Hardcoded PUBLIC_REALM_ID replacement (pre-void realm launch).
- TICKET-FEED-CARDS-002 — vportKind discriminator (LOW).
- TICKET-PLATFORM-RLS-001 — {public} policy cleanup.

## Latest Ticket

TICKET-BOOKING-RPC-001 (OPEN), TICKET-PLATFORM-RLS-001 (OPEN), TICKET-FEED-CARDS-002 (OPEN)

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — multiple passes (2026-05-10 to 2026-05-27) |
| ELEKTRA | COMPLETE — 2026-05-28 (delete lifecycle + schedule) |
| BLACKWIDOW | PARTIAL — 2026-05-23 (vport dashboard) |
| SENTRY | COMPLETE — 2026-06-01 (barber/locksmith/barbershop gate) |
| SPIDER-MAN | BLOCKED — 7 CRITICAL + 7 HIGH gaps |
| ARCHITECT | COMPLETE — extensive governance in `_CANONICAL/logan/marvel/architect/VPORT/` (432 files) |
| IRONMAN | PARTIAL — various dashboard card ownership passes |
| CARNAGE | PARTIAL — multiple migration passes |
| THOR | PARTIAL — multiple gate passes; locksmith NOT CLEARED |
| KRAVEN | PARTIAL — 2026-06-01 |

## Related Output Files

- `features/vport/SECURITY.md`
- `features/vport/ARCHITECTURE.md`
- `features/profiles/vport-tab-governance-matrix.md`
- `features/profiles/vport-tab-registry.md`
- `_NEEDS_TRIAGE/VPORT_FEATURE_INVENTORY.md`
- `_NEEDS_TRIAGE/vcsm.vport.architecture.md`
- `platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md`
- `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/` (432 files)

## Recommended Next Command

ARCHITECT — OWNER surface + full boundary mapping across all VPORT sub-surfaces. Then resolve S-BLK-001 (locksmith gates — BEFORE RELEASE) and fix ELEK-009 (missing DAL + ownership gate).

## Recommended Next Ticket

Open ticket for S-BLK-001 resolution (add `assertActorOwnsVportActorController` to 3 locksmith write paths) — this is the BEFORE RELEASE blocker with the simplest fix. Then separate ticket for subscriber ownership gates (V-SUB-001/002/003) to unblock 17 failing CI tests.

## DR. STRANGE Entry
- File: CURRENT/features/vport/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
