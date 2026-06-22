# ARCHITECT Evidence Bundle
## Scope: VCSM:dashboard (modules 7–16)
Generated: 2026-06-05T00:00:00Z
Command: ARCHITECT V2 | Scanner Version: 1.1.0

---

## Source Files Read

| File | Layer | Lines | What Was Verified |
|---|---|---|---|
| bookings/dal/insertVportBooking.write.dal.js | DAL | 1-45 | WRITE_COLS whitelist, ownership comment, slot collision handling |
| vport/dal/write/updateVportBooking.write.dal.js | DAL | 1-35 | profile_id filter gate, UPDATABLE_COLS whitelist |
| bookings/controller/updateVportBooking.controller.js | CONTROLLER | 1-147 | Terminal status guard, actor ownership chain, notification integration |
| settings/controller/settingsCoordinator.controller.js | CONTROLLER | 1-60 | Validation orchestration, delegation to saveVportPublicDetailsByActorId |
| settings/dal/vportPublicDetails.write.dal.js | DAL | 1-45 | Session check, schema targeting (vport), upsert on conflict |
| gasprices/controller/reviewFuelPriceSuggestion.controller.js | CONTROLLER | 1-137 | Full ownership chain, multi-step write coordination, cache invalidation |
| exchange/VportDashboardExchangeScreen.jsx | SCREEN | 1-284 | Layer violation confirmed: business logic, optimistic state, error rollback in screen |
| flyerBuilder/designStudio/controller/designStudio.shared.controller.js | CONTROLLER | 1-37 | Auth chain: actor_owners lookup, document ownership verification |
| vport/controller/checkVportOwnership.controller.js | CONTROLLER | 1-20 | Dual-path ownership: vport self-view + user actor_owners check |
| schedule/controller/scheduleBookingCoordinator.controller.js | CONTROLLER | 1-17 | Barrel delegation to bookings module confirmed |

**Source files validated: 10 | Confidence: HIGH**

---

## Layer Counts (Scanner Callgraph)

| Module | adapter | component | controller | dal | hook | model | screen | style | barrel |
|---|---|---|---|---|---|---|---|---|---|
| flyerBuilder | 0 | 76 | 28 | 54 | 24 | 50 | 18 | 2 | 14 |
| bookings | 0 | 0 | 7 | 2 | 3 | 3 | 0 | 0 | 1 |
| gasprices | 0 | 10 | 9 | 18 | 7 | 11 | 4 | 0 | 2 |
| exchange | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| vport (root) | 0 | 116 | 45 | 47 | 20 | 37 | 4 | 0 | 46 |
| settings | 0 | 5 | 5 | 1 | 3 | 11 | 0 | 0 | 4 |
| calendar | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| reviews | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| schedule | 0 | 25 | 4 | 0 | 3 | 1 | 0 | 0 | 1 |
| services | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |

Note: `exchange` has 0 controller/dal/hook/model nodes — layer violation confirmed (all logic in screen component, not detected in callgraph as controller node).

---

## Call Chains Summary

| Chain ID | Path | Ownership Checked | Confidence |
|---|---|---|---|
| CHAIN-dashboard-001 | bookings screen → actions hook → updateBookingStatus → assertActorOwns → updateVportBookingDAL | YES | HIGH |
| CHAIN-dashboard-002 | gas screen → pending suggestions → reviewFuelPrice → checkVportOwnership → upsertFuelPrice | YES | HIGH |
| CHAIN-dashboard-003 | settings screen → coordinator → saveVportPublicDetailsByActorId → upsertPublicDetails | PARTIAL | MEDIUM |
| CHAIN-dashboard-004 | exchange screen.onSave → useUpsertVportRate (profiles adapter) → rates table | PARTIAL | LOW |
| CHAIN-dashboard-005 | designStudio → designStudio controllers → requireOwnerActorAccess → actor_owners → write DAL | YES | HIGH |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| insertVportBookingDAL | bookings/dal/insertVportBooking.write.dal.js | customer_actor_id caller-responsibility injection | HIGH |
| upsertVportPublicDetailsDAL | settings/dal/vportPublicDetails.write.dal.js | Ownership upstream only; DAL session check only | HIGH |
| VportDashboardExchangeScreen.onSave | exchange/VportDashboardExchangeScreen.jsx | Business logic + mutation in screen; controller gap | HIGH |
| designStudio.write.dal (all ops) | flyerBuilder/designStudio/dal/designStudio.write.dal.js | 6 tables; schema unknown to scanner; controller auth verified | MEDIUM |

---

## ARCHITECT Recommendation: CAUTION
3 stub modules (calendar, reviews, services) are live routes without implementation.
1 module (exchange) has a controller-layer violation.
CHAIN-dashboard-004 (exchange) has LOW confidence — mutation auth path partially unresolved.
Security commands required: VENOM → ELEKTRA → BLACKWIDOW before THOR consideration.
