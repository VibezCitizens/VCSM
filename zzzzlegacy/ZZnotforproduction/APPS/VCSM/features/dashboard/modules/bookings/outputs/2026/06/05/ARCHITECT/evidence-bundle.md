# Evidence Bundle — Dashboard Module: bookings
**ARCHITECT V2 | 2026-06-05 | TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001**

## Scope
VCSM:dashboard/bookings

## Source Files Read

| File | Layer | Lines Read |
|---|---|---|
| apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js | controller | 1-80 |
| apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js | controller | 1-30 |
| apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js | controller | 1-20 |
| apps/VCSM/src/app/routes/protected/app.routes.jsx | screen | 1-30, 205-217 |

## Layer Counts (callgraph)
| Layer | Count |
|---|---|
| controller | 7 |
| dal | 2 |
| hook | 3 |
| model | 3 |
| module/barrel | 6 |

## Security-Sensitive Surfaces
| Surface | Risk | Priority |
|---|---|---|
| insertVportBooking.write.dal.js | Public booking insert — actor ownership via assertActorOwnsVportActorController | HIGH |
| updateVportBooking.controller.js | Status update — TERMINAL_STATUSES guard present; ownership check confirmed | HIGH |

## Call Chains
| ID | Path | Ownership Checked |
|---|---|---|
| CHAIN-bookings-001 | VportDashboardBookingHistoryScreen → useVportBookingActions → updateBookingStatusController → updateVportBookingDAL | YES — assertActorOwnsVportActorController |
| CHAIN-bookings-002 | vportPublicBooking → insertVportBookingDAL | YES — assertActorOwnsVportActorController |

## Provenance
- sourceMaps: callgraph, route-map, write-surface-map, dependency-map
- sourceFilesValidated: 4
- confidence: HIGH
