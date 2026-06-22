# Feature Index: dashboard

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/dashboard`
Source Path: `apps/VCSM/src/features/dashboard/`

## DR. STRANGE Read Order

1. [README.md](../features/dashboard/README.md)
2. [CURRENT_STATUS.md](../features/dashboard/CURRENT_STATUS.md)
3. [SECURITY.md](../features/dashboard/SECURITY.md)
4. [ARCHITECTURE.md](../features/dashboard/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/dashboard/OWNERSHIP.md)
6. [TESTS.md](../features/dashboard/TESTS.md)
7. [PERFORMANCE.md](../features/dashboard/PERFORMANCE.md)
8. [BLOCKERS.md](../features/dashboard/BLOCKERS.md)
9. [DEFERRED.md](../features/dashboard/DEFERRED.md)
10. [HISTORY_INDEX.md](../features/dashboard/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | YES |
| PERFORMANCE | YES |
| BLOCKERS | YES |
| DEFERRED | YES |
| HISTORY_INDEX | YES |

Coverage Score: 10 / 10 — FULL

## Active Risks

- **SECURITY.md** — Seeded from evidence; full VENOM run post-TICKET-0009 still PENDING.
- **Remaining P1 debt** — `useVportOwnerSchedule.js` overloaded (mixes data, modals, booking ops). Split deferred from TICKET-0004.
- **ELEK-001 (verified resolved)** — `ctrlSetVportBusinessCardPublishState` ownership gate confirmed present.
- **Settings card** — Full VENOM+ELEKTRA pass post-TICKET-0009 still PENDING.
- **TICKET-BOOKING-RPC-001 (DB-BLOCKED)** — When RPC migration resolves, only `scheduleBookingCoordinator.controller.js` needs updating in dashboard.
- **TESTS.md/PERFORMANCE.md/OWNERSHIP.md** — Files exist but are PARTIAL; full audits (SPIDER-MAN, KRAVEN, IRONMAN) not yet run.
- **Promoted module coverage** — calendar, exchange, locksmith, reviews, and services are now first-class dashboard modules; each lacks BEHAVIOR.md and SPIDER-MAN coverage.

## Dashboard Module Count

| Tier | Modules | Count |
|---|---|---:|
| Tier 1 — Security Critical | flyerBuilder, designStudio, vportOwnerStats, bookings, team, settings, leads | 7 |
| Tier 2 — Operational | portfolio, schedule, gas prices | 3 |
| Tier 3 — Newly Promoted Modules | calendar, exchange, locksmith, reviews, services | 5 |
| Tier 4 — Read Only | qrcode, shared | 2 |

Total dashboard modules: **17**.

## Open Blockers

From BLOCKERS.md:
- **BLOCK-DASH-001** — TICKET-BOOKING-RPC-001 (OPEN / DB-BLOCKED). Affects `scheduleBookingCoordinator.controller.js`.
- **SECURITY.md governance blocker** — VENOM + ELEKTRA not yet run post-contract.
- **TESTS.md governance blocker** — SPIDER-MAN not yet run after SETTINGS-ARCH-001.
- **PERFORMANCE.md governance blocker** — KRAVEN not yet run.
- **OWNERSHIP.md governance blocker** — IRONMAN not yet run.

## Deferred Items

From DEFERRED.md:
- **DEFER-DASH-001 (P1, OPEN)** — Schedule hook split: `useVportOwnerSchedule.js` → `useScheduleData.js` / `useScheduleModals.js` / `useScheduleBookingOps.js`.
- **DEFER-DASH-002 (P1, RECOMMENDED)** — Settings coordinator (SETTINGS-ARCH-001 — now RESOLVED as TICKET-0009).
- **DEFER-DASH-003 (P1, RECOMMENDED)** — `ctrlSetVportBusinessCardPublishState` ownership gate — ELEK-001 verified resolved.
- **DEFER-013 (P0, RESOLVED 2026-06-02)** — Schedule cross-card booking controller import resolved via `scheduleBookingCoordinator.controller.js`.

## Latest Ticket

TICKET-0009 (RESOLVED 2026-06-02), TICKET-0004 (RESOLVED), TICKET-BOOKING-RPC-001 (OPEN)

## Audit Coverage

| Command | Status |
|---------|--------|
| WOLVERINE | COMPLETE — 2026-06-02 (TICKET-0004 + TICKET-0009) |
| ARCHITECT | COMPLETE — 2026-06-02 (TICKET-DASHBOARD-ARCHITECT-0001; Rule 9 violations found in gasprices/leads/portfolio) |
| VENOM | PARTIAL — security sprint runs; full post-contract pass PENDING |
| ELEKTRA | PARTIAL — findings resolved; full pass PENDING |
| BLACKWIDOW | PARTIAL — 2026-05-27 |
| SENTRY | RECOMMENDED NEXT |
| SPIDER-MAN | PARTIAL — 2026-05-26/27 (BLOCKED) |
| KRAVEN | NOT RUN (dedicated pass) |
| IRONMAN | PARTIAL — 2026-05-14/18 |
| THOR | PARTIAL — multiple gate passes |

## Related Output Files

- `features/dashboard/ARCHITECTURE.md`
- `features/dashboard/SECURITY.md`
- `features/dashboard/BLOCKERS.md`
- `features/dashboard/DEFERRED.md`
- `features/dashboard/DASHBOARD_ARCHITECTURE_CONTRACT.md`
- `features/dashboard/HISTORY_INDEX.md`
- `features/dashboard/evidence/` (305 files — full evidence tree)

## Recommended Next Command

CARNAGE — verify `vc.design_*` RLS before designStudio can clear THOR. Then WOLVERINE for ELEK-001/002/003 patches, BLACKWIDOW re-verification, and SPIDER-MAN coverage for promoted modules.

## Recommended Next Ticket

TICKET-CARNAGE-DESIGN-RLS-001, then TICKET-ELEK-PATCH-001. Follow with TICKET-SPIDER-MAN-PROMOTED-MODULES-001 for calendar/exchange/locksmith/reviews/services coverage.

## DR. STRANGE Entry
- File: CURRENT/features/dashboard/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
