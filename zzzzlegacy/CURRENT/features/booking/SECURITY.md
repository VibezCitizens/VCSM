---
# booking — SECURITY.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

Security posture for the booking feature. Based on VENOM, ELEKTRA, BLACKWIDOW, SENTRY, and THOR audit evidence from 2026-05-14 through 2026-05-27.

---

## Security Posture Summary

**Overall:** PARTIAL — critical write paths secured; 9 open findings carry forward
**Highest Open Severity:** HIGH (V-BOOK-02, V-BOOK-03, V-BOOK-04) + MEDIUM (ELEK-001, BW-*)
**THOR Gate State:** CAUTION CLEARED (2026-05-27) — ELEK-001 required before customer cancel sees production volume
**VENOM Status:** RUN — 2026-05-14 (postfix verification) + 2026-05-27 (code review pass)
**ELEKTRA Status:** RUN — 2026-05-27 (defer-001 resolution review)
**BLACKWIDOW Status:** RUN — 2026-05-27 (schedule + calendar)
**SENTRY Status:** RUN — 2026-05-14 (DAL compliance) + 2026-05-27 (book tab)
**THOR Status:** RUN — three gate evaluations (2026-05-14, 2026-05-27 x2)

---

## Command Coverage

| Command | Status | Last Run |
|---|---|---|
| VENOM | RUN | 2026-05-27 |
| ELEKTRA | RUN | 2026-05-27 |
| BLACKWIDOW | RUN | 2026-05-27 |
| SENTRY | RUN | 2026-05-27 |
| THOR | RUN | 2026-05-27 (Gate 3 — CAUTION CLEARED) |

---

## Trust Boundary Architecture

```
Customer Path (PUBLIC):
  Client
    ↓ VportBookingView.jsx
    ↓ useVportPublicBooking.js
    ↓ createVportPublicBookingController
    ↓ createBooking.controller.js (engines/booking)
    ↓
    ┌──────────────────────────────────────────────────────┐
    │  DB RLS — bookings_insert_public_pending             │
    │  status='pending' enforced                           │
    │  customer_actor_id = vc.current_actor_id()           │
    └──────────────────────────────────────────────────────┘

Owner Write Path (OWNER):
  Client
    ↓ VportDashboardScheduleScreen / VportDashboardBookingHistoryScreen
    ↓ scheduleBookingCoordinator.controller.js (dashboard)
    ↓
    ┌──────────────────────────────────────────────────────┐
    │  BOUNDARY 1 — assertActorOwnsVportActorController    │
    │  requestActorId, targetActorId                       │
    │  → queries vc.actor_owners                           │
    └──────────────────────────────────────────────────────┘
    ↓
    ┌──────────────────────────────────────────────────────┐
    │  DB RLS — bookings_update_actor_owner /              │
    │  bookings_update_vport_owner (canonical)             │
    └──────────────────────────────────────────────────────┘
```

---

## Findings

### RESOLVED

**V-AVAIL-01 | CRITICAL | RESOLVED**
- Finding: No controller-level ownership assertion on availability write path — any authenticated Citizen could overwrite any VPORT's availability rules by supplying a known resourceId.
- Resolution: manageVportAvailabilityRule.controller.js deleted; write path migrated to booking engine with assertActorCanManageResource gate.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**V-AVAIL-02 | HIGH | RESOLVED**
- Finding: requestActorId silently dropped at hook boundary (useVportManageAvailability) — broke the ownership identity chain.
- Resolution: RC-06 FIXED — hook now forwards callerActorId + ownerActorId.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**S-BOOK-02 / V-BOOK-05 | HIGH | RESOLVED**
- Finding: profileId used as forbidden identity surface in useQuickBookingModal and listVportServicesForProfileController — allowed service enumeration for any VPORT.
- Resolution: RC-02 + RC-04 FIXED — ownerActorId accepted instead of profileId.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**S-BOOK-04 / V-BOOK-01 | CRITICAL | RESOLVED**
- Finding: Engine listBookingHistory unprotected — no callerActorId, no ownerActorId, no ownership assertion; returned customer PII to any caller with a resourceId; adapter exported useBookingHistory backed by this unprotected controller.
- Resolution: RC-03 + RC-05 FIXED — listBookingHistory now gated with callerActorId + ownerActorId + assertActorOwnsVportActor; useBookingHistory removed from adapter.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**RC-02 / DEFER-001 | HIGH | RESOLVED (confirmed live DB 2026-05-27)**
- Finding: bookings_insert_owner used legacy profiles.owner_user_id = auth.uid() pattern — inconsistent with actor_owners model used everywhere else.
- Resolution: bookings_insert_owner DOES NOT EXIST on live DB. bookings_insert_actor_owner (canonical actor_owners model) EXISTS AND ACTIVE.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**SENTRY-2026-01 | CRITICAL | RESOLVED**
- Finding: checkVportOwnership.controller.js (dashboard) directly imported getActorByIdDAL from booking feature DAL, bypassing booking.adapter.js boundary.
- Resolution: Import corrected to go through adapter boundary.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_ironman_dashboard-team-booking-ownership.md

**VPD-V-016 | CRITICAL | RESOLVED**
- Finding: vportLeads controller ownership check was naive string compare with no DB query — all 4 entry points (list, count, markContacted, delete) were unprotected.
- Resolution: All 4 entry points now use canonical assertActorOwnsVportActorController.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_14-00_spiderman_vport-booking-feed-security-updates.md

**VPD-V-020 | HIGH | RESOLVED**
- Finding: Raw UUID in notification linkPath on booking cancellation.
- Resolution: Replaced with slug-resolved path.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_14-00_spiderman_vport-booking-feed-security-updates.md

---

### OPEN — P1

**V-BOOK-02 | HIGH | OPEN (P1, carries forward)**
- Finding: updateBookingStatusDAL returns PII fields (customer_phone, customer_email, internal_note) to client state after every status update.
- Status: No fix applied. Slim the SELECT projection on status update DAL response.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**V-BOOK-03 | HIGH | OPEN (P1, carries forward)**
- Finding: listBookingsByCustomerDAL exposes member_actor_id (staff actor ID) to customer-facing reads.
- Status: No fix applied. Remove member_actor_id from customer-facing column select.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**V-BOOK-04 | HIGH | OPEN (P1, carries forward)**
- Finding: Raw owner_actor_id UUID embedded in notification linkPath on booking cancellation.
- Status: VPD-V-020 resolved the customer-facing slug path; this finding covers the notification linkPath specifically.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

---

### OPEN — P2

**V-BOOK-06 | MEDIUM | OPEN (P2, carries forward)**
- Finding: assertActorOwnsVportActor ownership assertion fragility — profile_id drift risk between actor_owners.user_id and vc.actors.profile_id.
- Status: Deferred. Risk is structural; no immediate exploit path confirmed.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md

**ELEK-001 | MEDIUM | OPEN — required before customer cancel sees production volume**
- Finding: cancelBooking customer path — no actor void/kind check; is_void actor can cancel a booking if session token is technically valid.
- Fix: Add dalGetActorById call on customer cancel path, verify is_void !== true before allowing cancel.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**BW-SCHED-001 | MEDIUM | OPEN**
- Finding: VportDashboardScheduleScreen has no screen-level Final Screen ownership gate — only controller-level gate; regression risk if controller gate removed.
- Status: Deferred — add VportScheduleFinalScreen with useVportOwnership gate.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_schedule-calendar.md

**BW-SCHED-002 | MEDIUM | OPEN**
- Finding: useVportOwnerSchedule stale closure — callerActorId missing from useCallback dep array; identity-context inversion possible on actor switch (within-session only, not cross-user).
- Fix: One-line dep array fix.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_schedule-calendar.md

**BW-SCHED-003 | MEDIUM | OPEN**
- Finding: loadDayScheduleController exported from module boundary index.js — architecture boundary violation.
- Fix: Remove loadDayScheduleController export from index.js.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_schedule-calendar.md

**BW-CAL-002 | MEDIUM | OPEN**
- Finding: VportDashboardCalendarScreen — combined Final+View screen; no structural second gate if individual enabled conditions regress.
- Fix: Split into VportDashboardCalendarFinalScreen + VportDashboardCalendarView.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_schedule-calendar.md

**{public} role on booking policies | MEDIUM | OPEN (governance/non-blocking)**
- Finding: Four UPDATE and one SELECT policy on vport.bookings use {public} role instead of {authenticated} — SECURITY DEFINER guards prevent anon access but bypasses PostgREST role enforcement layer.
- Status: Deferred to separate cleanup migration alongside availability_rules and fuel_price_submissions.
- Evidence: zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md

---

### OPEN — LOW / DEFERRED

**ELEK-002 | LOW (was MEDIUM) | OPEN (deferred)**
- Finding: createBooking status field caller-controlled — no allowlist on owner INSERT path; DB mitigates on public path (status='pending' enforced by bookings_insert_public_pending).
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**ELEK-003 | LOW (was MEDIUM) | OPEN (engine defense-in-depth only)**
- Finding: customerActorId not verified against requestActorId at engine layer — DB policy (bookings_insert_public_pending) enforces customer_actor_id = vc.current_actor_id() on public path, eliminating the exploit path.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**ELEK-004 | LOW | OPEN (deferred)**
- Finding: QR scan count non-atomic race condition — needs CARNAGE RPC migration.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**ELEK-005 | LOW | OPEN (deferred)**
- Finding: buildMenuShortDisplayUrl missing isQrSafeSlug guard.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

**ELEK-006 | LOW | OPEN (deferred)**
- Finding: createQrLink — destinationPath/qrType accept arbitrary strings.
- Evidence: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| booking/controller/ | BOOKING | PARTIAL | CRITICAL |
| engines/booking/src/controller/ | BOOKING | STRONG (assertActorCanManageResource) | HIGH |
| dashboard/vport/controller/ | BOOKING (owner) | STRONG (assertActorOwnsVportActorController) | HIGH |
| vport.bookings (INSERT — public) | DB RLS | bookings_insert_public_pending (canonical) | MEDIUM |
| vport.bookings (INSERT — owner) | DB RLS | bookings_insert_actor_owner (canonical) | LOW |
| vport.bookings (UPDATE — owner) | DB RLS | bookings_update_actor_owner + bookings_update_vport_owner | MEDIUM ({public} role cleanup pending) |

---

## History Index

| Date | Command | Security Event |
|---|---|---|
| 2026-05-14 | VENOM | Postfix verification — 4 RESOLVED, 4 carries forward |
| 2026-05-14 | THOR Gate 1 | BLOCKED — RC-01 through RC-06 |
| 2026-05-18 | IRONMAN | SENTRY-2026-01 RESOLVED — adapter boundary violation fixed |
| 2026-05-18 | CARNAGE | Phase 2 blockers cleared for RLS readiness |
| 2026-05-26 | SPIDER-MAN | VPD-V-016 + VPD-V-020 resolved; test coverage BLOCKED |
| 2026-05-27 | THOR Gate 2 | BLOCKED — DEFER-001 legacy RLS |
| 2026-05-27 | CARNAGE | DEFER-001 confirmed resolved on live DB; TICKET-0005 CLOSED |
| 2026-05-27 | ELEKTRA | ELEK-001 through ELEK-006 documented |
| 2026-05-27 | THOR Gate 3 | CAUTION CLEARED — condition: ELEK-001 before customer cancel production volume |
| 2026-05-27 | BLACKWIDOW | BW-SCHED-001/002/003 + BW-CAL-002 documented |
| 2026-05-27 | VENOM | {public} role finding on booking policies documented |

Evidence sources:
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_booking-postfix-verification.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_thor_booking-availability-write-release-gate.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-deferred-gate.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_thor_booking-module-defer001-resolved.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_schedule-calendar.md
- zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_14-00_spiderman_vport-booking-feed-security-updates.md
- zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_ironman_dashboard-team-booking-ownership.md
