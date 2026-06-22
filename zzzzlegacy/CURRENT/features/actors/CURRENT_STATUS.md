# Current Status — actors
# Last Updated: 2026-06-02
# Ticket: TICKET-ARCHITECT-PROPAGATION-SYNC-0001
# Status: CURRENT SOURCE OF TRUTH

| Field | Value |
|---|---|
| Status | ACTIVE |
| Security Tier | CRITICAL |
| Auth Surface | OWNER |
| Priority | P0 |
| Last Audit | 2026-06-02 (ARCHITECT — TICKET-ACTORS-ARCHITECT-0001) |
| Open Security Findings | 4 (IRON-BOOK-WARN3, SENTRY-2026-01, VENOM-PROFILES-VF001, SENTRY-BARBER-2026-06-01) |
| Open Tickets | NONE |
| Recommended Next Command | VENOM after SENTRY-2026-01 remediation |
| Last Updated | 2026-06-02 |

## Known Blockers

### SENTRY-2026-01 — Architecture boundary violation (BLOCKING)
`checkVportOwnership.controller.js` (dashboard) imports `getActorByIdDAL` directly from the actors feature's internal booking DAL path (`@/features/booking/dal/getActorById.dal`) — bypasses the adapter boundary. Must be fixed before any new callers are added to this path.
- Fix: expose `getActorByIdDAL` via `booking.adapter.js` §5.3 exception
- Source: `2026-05-18_sentry_dashboard-dal-layer-boundary-violations.md`

### SPIDER-MAN BRANCH BLOCKED
Branch `vport-booking-feed-security-updates` has 7 CRITICAL + 7 HIGH findings with zero regression tests. Minimum 5 test files required before merge. This affects actor-adjacent surfaces (QR link auth gate, ownership gate behavioral tests).
- Source: `2026-05-27_00-00_spiderman_vport-booking-security-remediation.md`

### IRON-BOOK-WARN3 — Dual assertActorOwnsVportActor implementations (HIGH, OPEN)
Two implementations of `assertActorOwnsVportActor` exist: one in `features/booking/controller/` and one in `engines/booking/src/controller/`. Feature version is used by all app callers; engine version is canonical but not wired. Risk of drift between ownership assertion logic.
- Source: `2026-05-14_ironman_booking-feature-ownership.md`

## Recommended Next Action

ARCHITECT completed on 2026-06-02. Next action is to resolve `SENTRY-2026-01` by routing `getActorByIdDAL` through an approved adapter boundary, then run VENOM on actor-adjacent ownership and identity trust boundaries.

## DR. STRANGE Summary

The `actors` feature is ACTIVE and architecturally complete as a headless platform service: controllers, DAL, models, and adapter are present, with no routes, screens, or direct write paths. ARCHITECT completed on 2026-06-02 and confirmed the adapter boundary while carrying forward `SENTRY-2026-01`, `IRON-BOOK-WARN3`, and missing tests. No dedicated VENOM/ELEKTRA/SENTRY security audit has been run directly against this feature. The branch holding current security remediations is blocked pending regression test coverage (SPIDER-MAN). Classification was formally normalized from FEATURE to PLATFORM on 2026-06-02 per TICKET-0006A.
