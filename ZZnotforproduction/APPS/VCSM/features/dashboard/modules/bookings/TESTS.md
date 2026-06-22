# TESTS — Dashboard Bookings Module

**SPIDER-MAN Last Run:** 2026-06-05
**Release Safety:** WATCH
**Mode:** SECURITY_WARFARE_SIMULATION

---

## Existing Test Files

| Test File | Controller / DAL | Coverage | Status |
|---|---|---|---|
| `assertActorOwnsVportActor.controller.test.js` | assertActorOwnsVportActorController | COMPREHENSIVE — ELEK-004, self-shortcut, void, actor_owners | PASS |
| `insertVportBooking.write.dal.test.js` | insertVportBookingDAL | WRITE_COLS allowlist, 23505 (BOOK-001), required fields | PASS |
| `updateVportBooking.controller.test.js` | updateBookingStatusController, rescheduleBookingController | VPD-V-021 terminal gate, ownership, profileId scope | PASS |
| `vportPublicBooking.controller.test.js` | createVportPublicBookingController | BOOK-002 kind gate, guest booking, slot collision, VPD-V-019 | PASS |

## Missing Test Files (SPIDER-MAN 2026-06-05)

| Priority | Test File to Create | Covers | Finding |
|---|---|---|---|
| P0 | `__tests__/createOwnerBooking.controller.test.js` | ownership, BW-NEW-002 past-time, non-owner rejection | SPM-2026-06-05-003 |
| P1 | `__tests__/checkVportOwnership.controller.test.js` | VPORT-kind self-shortcut, user-kind passthrough, non-owner | SPM-2026-06-05-004 |
| P1 | Add to `vportPublicBooking.controller.test.js` | VENOM-WS-001: voided actor booking | SPM-2026-06-05-006 |

## Security Invariants Protected

| Invariant | Test | Status |
|---|---|---|
| ELEK-004: VPORT-kind self-match rejected in assertActorOwns | assertActorOwnsVportActor.controller.test.js | PROTECTED |
| VPD-V-021: Terminal booking immutability | updateVportBooking.controller.test.js | PROTECTED |
| BOOK-001: 23505 slot collision translation | insertVportBooking.write.dal.test.js | PROTECTED |
| BOOK-002: Kind gate for public booking | vportPublicBooking.controller.test.js | PROTECTED |
| VPD-V-019: customer_actor_id session-derived | vportPublicBooking.controller.test.js | PROTECTED |
| BW-NEW-002: Owner past-time booking | NOT PROTECTED — test needed | MISSING |
| VENOM-WS-001: Voided actor booking | NOT PROTECTED — test needed | MISSING |

## Report

Full SPIDER-MAN report: `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/SPIDER-MAN/spiderman-report.md`
