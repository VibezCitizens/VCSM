# dashboard — OWNERSHIP.md
# Last Updated: 2026-06-02
# Ticket: TICKET-0008
# Ownership Status: PARTIAL — IRONMAN not yet run
# Status: CURRENT SOURCE OF TRUTH

Ownership map for the dashboard feature. Marked PARTIAL — full IRONMAN audit has not run.
Contents derived from ARCHITECTURE.md and TICKET-0004 evidence only.

---

## Ownership Clarity

**Overall:** PARTIAL
**Reason:** IRONMAN has not run. Ownership below is inferred from architecture evidence, not a formal ownership audit.

---

## Feature Ownership (Inferred)

| Area | Owner | Confidence | Notes |
|---|---|---|---|
| Dashboard feature root | VPORT dashboard governance | HIGH | Clearly scoped to vport owner surface |
| Architecture contract | ARCHITECT + WOLVERINE | HIGH | DASHBOARD_ARCHITECTURE_CONTRACT.md authored in TICKET-0004 |
| Schedule card | Schedule card team | HIGH | Coordinator pattern established |
| Bookings card public index | Bookings card team | HIGH | Boundary confirmed by coordinator |
| Settings card | UNKNOWN | LOW | Not yet audited — SETTINGS-ARCH-001 pending |
| All other cards (10) | UNKNOWN | LOW | NOT AUDITED per ARCHITECTURE.md card inventory |

---

## Layer Ownership (Inferred)

| Layer | Ownership Rule | Source |
|---|---|---|
| Controllers | Business workflows — card-scoped | DASHBOARD_ARCHITECTURE_CONTRACT.md rule 7 |
| DALs | Persistence only — not exported from public index | DASHBOARD_ARCHITECTURE_CONTRACT.md rules 2, 8 |
| Hooks | React state and lifecycle — no cross-domain workflows | DASHBOARD_ARCHITECTURE_CONTRACT.md rules 5, 6 |
| Screens | Routing/gating/composition only | DASHBOARD_ARCHITECTURE_CONTRACT.md rule 4 |
| Models | Pure validation, normalization, formatting, mapping | DASHBOARD_ARCHITECTURE_CONTRACT.md rule 12 |
| Components | Must not own hooks | DASHBOARD_ARCHITECTURE_CONTRACT.md rule 9 |

---

## Cross-Card Ownership Rule

Cross-card interactions are owned by coordinator controllers, not by hooks or screens.

Established pattern: `scheduleBookingCoordinator.controller.js` owns all schedule→booking domain interactions.

This pattern must be replicated for: settings card (SETTINGS-ARCH-001).

---

## Data Ownership (Inferred)

| Table / Domain | Read Owner | Write Owner | Notes |
|---|---|---|---|
| bookings | bookings card | scheduleBookingCoordinator (via bookings index) | RLS hardening live-verified — TICKET-BOOKING-RPC-001; direct reschedule field updates remain a source/product caution |
| vport settings | settings card | UNKNOWN | SETTINGS-ARCH-001 required |
| schedule/availability | schedule card | schedule card | Coordinator handles booking domain writes only |

---

## Pending

IRONMAN has not run on dashboard.

When IRONMAN runs, this file must be replaced with the full ownership record.
Recommended: run IRONMAN after SETTINGS-ARCH-001 completes, before next THOR gate.
