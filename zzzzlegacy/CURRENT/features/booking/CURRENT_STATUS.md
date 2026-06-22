---
# booking — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Ticket: TICKET-ARCHITECT-PROPAGATION-SYNC-0001
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

| Field | Value |
|---|---|
| Status | ACTIVE / PARTIAL — security sprint complete, DB migration and regression tests blocked |
| Security Tier | CRITICAL |
| Auth Surface | OWNER (dashboard write) + PUBLIC (customer create) |
| Priority | P0 |
| Last VENOM Audit | 2026-05-14 (postfix verification), 2026-05-27 (code review pass) |
| Last ELEKTRA Audit | 2026-05-27 (defer-001 resolution review) |
| Last SPIDER-MAN Audit | 2026-05-26 / 2026-05-27 (security remediation pass) |
| Last THOR Gate | 2026-05-27 — CAUTION CLEARED with condition |
| Last ARCHITECT Audit | 2026-06-02 — TICKET-BOOKING-ARCHITECT-0001 |
| Open Security Findings | 9 open (V-BOOK-02, V-BOOK-03, V-BOOK-04, V-BOOK-06, ELEK-001 through ELEK-006, BW-SCHED-001 through BW-CAL-002) |
| Open Tickets | TICKET-BOOKING-RPC-001 |
| Recommended Next Command | VENOM+ELEKTRA (post-RPC migration), SPIDER-MAN (regression tests), CARNAGE (dead DAL/controller removal + RLS cleanup) |
| Last Updated | 2026-06-02 |

---

## Active Ticket State

| Ticket | Title | Status | Priority |
|---|---|---|---|
| TICKET-BOOKING-RPC-001 | Booking state-machine RPC migration | OPEN / DB-BLOCKED | P0 |
| TICKET-0005 | bookings_select_actor_owner RLS verification and repair | CLOSED | — |
| TICKET-FEED-CARDS-002 | Add payload.vportKind discriminator for barbershop_portfolio_update | LOW | — |
| TICKET-PLATFORM-RLS-001 | platform.media_assets {public} policy cleanup | OPEN | — |
| TICKET-BOOKING-ARCHITECT-0001 | Booking architecture audit | COMPLETE / PROPAGATED | P1 |

---

## THOR Gate History

| Gate | Date | Result | Notes |
|---|---|---|---|
| THOR Gate 1 | 2026-05-14 | BLOCKED | 6 release-blocking violations (RC-01 through RC-06) |
| THOR Gate 2 | 2026-05-27 (initial) | BLOCKED | DEFER-001 legacy RLS + ELEK-001/002/003 |
| THOR Gate 3 | 2026-05-27 (re-evaluation) | CAUTION CLEARED | DEFER-001 confirmed resolved; ELEK-001 required before customer cancel sees production volume |

---

## Known Blockers

### BLOCK-BOOK-001 — Booking RPC migration (DB-BLOCKED)
- Ticket: TICKET-BOOKING-RPC-001
- Status: OPEN / DB-BLOCKED
- Priority: P0
- Description: Replace broad booking INSERT/UPDATE with typed state-machine RPCs. customer_actor_id injection + status overpermission confirmed on live DB.
- Why blocked: Database-level change required before code change is safe.

### BLOCK-BOOK-002 — Zero regression tests for all booking security fixes
- Status: OPEN
- Priority: P0 (merge safety)
- Description: SPIDER-MAN status BLOCKED. All VENOM V-001 through V-008, VPD-V-016, VPD-V-020 fixes are unprotected. Minimum 5 test files must be written before merge is safe.
- Required: SPM-003, SPM-004, SPM-002, SPM-S2-001, SPM-S2-002

### BLOCK-BOOK-003 — ELEK-001 customer cancel void/kind check
- Status: OPEN
- Priority: MEDIUM (required before customer cancel sees production volume)
- Description: cancelBooking customer path has no actor void/kind check. is_void actor can cancel a booking if session token is technically valid.
- Fix: Add dalGetActorById call on customer cancel path, verify is_void !== true before allowing cancel.

---

## Security Findings Summary

| Finding | Severity | Status |
|---|---|---|
| V-AVAIL-01 | CRITICAL | RESOLVED |
| V-AVAIL-02 | HIGH | RESOLVED |
| S-BOOK-02 / V-BOOK-05 | HIGH | RESOLVED |
| S-BOOK-04 / V-BOOK-01 | CRITICAL | RESOLVED |
| V-BOOK-02 | HIGH | OPEN — P1, carries forward |
| V-BOOK-03 | HIGH | OPEN — P1, carries forward |
| V-BOOK-04 | HIGH | OPEN — P1, carries forward |
| V-BOOK-06 | MEDIUM | OPEN — P2, carries forward |
| RC-02 / DEFER-001 | HIGH | RESOLVED (confirmed live DB 2026-05-27) |
| ELEK-001 | MEDIUM | OPEN |
| ELEK-002 | LOW | OPEN (deferred) |
| ELEK-003 | LOW | OPEN (deferred) |
| ELEK-004 | LOW | OPEN (deferred) |
| ELEK-005 | LOW | OPEN (deferred) |
| ELEK-006 | LOW | OPEN (deferred) |
| BW-SCHED-001 | MEDIUM | OPEN |
| BW-SCHED-002 | MEDIUM | OPEN |
| BW-SCHED-003 | MEDIUM | OPEN |
| BW-CAL-002 | MEDIUM | OPEN |
| {public} role on booking policies | MEDIUM | OPEN — governance/non-blocking |

---

## Last Command Runs

| Command | Feature Area | Date | Result |
|---|---|---|---|
| VENOM | booking (postfix verification) | 2026-05-14 | 6 RESOLVED, 4 carries forward |
| VENOM | booking (code review) | 2026-05-27 | {public} role finding added |
| ELEKTRA | booking (defer-001 resolution) | 2026-05-27 | ELEK-001 through ELEK-006 documented |
| BLACKWIDOW | schedule + calendar | 2026-05-27 | 4 MEDIUM findings open |
| SPIDER-MAN | booking security updates | 2026-05-26 | BLOCKED — 7 CRITICAL + 7 HIGH gaps |
| SPIDER-MAN | booking security remediation | 2026-05-27 | 3 additional gaps (SPM-S2-001, SPM-S2-006, SPM-S2-007) |
| THOR | booking availability write gate | 2026-05-14 | BLOCKED |
| THOR | booking module deferred gate | 2026-05-27 | BLOCKED (initial) |
| THOR | booking defer-001 resolved | 2026-05-27 | CAUTION CLEARED |
| IRONMAN | booking feature ownership | 2026-05-14 | IRON-BOOK-01 CRITICAL (downgraded/resolved) |
| IRONMAN | dashboard-team-booking ownership | 2026-05-18 | SENTRY-2026-01 RESOLVED |
| KRAVEN | booking mutation bottleneck | 2026-05-14 | K-BOOK-01/02/03 documented |
| KRAVEN | vport book tab | 2026-05-27 | KPF-001 through KPF-003 documented |
| CARNAGE | bookings RLS readiness | 2026-05-18 | Phase 2 blockers cleared |
| CARNAGE | ticket-0005 bookings select RLS | 2026-05-27 | TICKET-0005 CLOSED |

---

## Recommended Next Action

1. Resolve ELEK-001 (customer cancel void/kind check) — one-file controller fix, no DB required.
2. Write minimum 5 regression test files (SPM-003, SPM-004, SPM-002, SPM-S2-001, SPM-S2-002) before merge.
3. Run CARNAGE for dead DAL/controller deletion (12 DALs + 8 controllers) and {public} role cleanup migration.
4. Advance TICKET-BOOKING-RPC-001 when DB migration window opens.
5. Run full VENOM+ELEKTRA pass post-RPC migration.

## ARCHITECT Propagation Sync — 2026-06-02

Completed audit: `TICKET-BOOKING-ARCHITECT-0001`
Final verdict: `ARCHITECT_BOOKING_COMPLETE`

Propagated findings:
- Source inventory: 15 controllers, 22 DALs, 16 hooks, 0 booking-owned screens, 1 booking-owned test.
- Adapter boundary: `booking.adapter.js` remains canonical cross-feature surface.
- DB/RPC blocker: `TICKET-BOOKING-RPC-001` remains P0 and DB-blocked.
- Architecture blockers: broad insert/update path, `cancelBookingController` customer void/kind gap, PII overfetch in status DAL response.
- Dead/orphan code: 12 DALs and 8 controllers still awaiting CARNAGE removal.
- Test posture: SPIDER-MAN remains blocked; minimum regression coverage required before merge.

---

## DR. STRANGE Summary

Booking is an ACTIVE P0 feature that has completed a significant security sprint. Six release-blocking violations from THOR Gate 1 (2026-05-14) have been resolved, the legacy bookings_insert_owner RLS policy has been replaced with the canonical actor_owners model (confirmed live DB 2026-05-27), and THOR Gate 3 was cleared with a condition. The remaining open blockers are: ELEK-001 (customer cancel void check — required before production volume on that path), zero regression tests across all security fixes (SPIDER-MAN BLOCKED), and TICKET-BOOKING-RPC-001 (DB-level RPC migration for customer_actor_id injection and status overpermission). Nine security findings are open, carrying forward at P1-P2 priority. Dead code (12 DALs + 8 controllers) is confirmed and awaiting a CARNAGE batch removal sprint.
---
