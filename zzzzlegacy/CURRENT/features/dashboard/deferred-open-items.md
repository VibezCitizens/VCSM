# VPORT Dashboard — Deferred Open Items

**Last updated:** 2026-05-30 (TICKET-SEC-VERIFY-001 verification pass — VENOM-DELETE-001 fully closed; V-SUB-004/005 verified resolved in source)
**Maintained by:** WOLVERINE  
**Total open:** 8

These are specific findings, tasks, or items that were explicitly deferred to a named sprint during prior audit sessions. They are not blocking current production but must be resolved before a full THOR release gate can be cleared.

---

## P1 — Highest Priority

### DEFER-001 — `bookings_insert_owner` Carnage Migration — ✅ RESOLVED
- **Status:** RESOLVED — confirmed via live DB 2026-05-27
- **Resolution:** `bookings_insert_actor_owner` (actor_owners model) confirmed ACTIVE; legacy `bookings_insert_owner` policy confirmed ABSENT
- **Remaining follow-up:** CARNAGE to confirm migration file provenance (non-blocking — DB state is correct)
- **Reference:** `2026-05-27_thor_booking-module-defer001-resolved.md`

---

## P2 — Medium Priority

### DEFER-002 — `service_id` FK in `@reviews` Engine Schema
- **Priority:** P2
- **Deferred from:** 2026-05-23 reviews pipeline audit
- **Command owner:** CARNAGE
- **Affects module:** `modules/reviews/`
- **Description:** `@reviews` engine schema is missing a `service_id` FK for service-scoped review queries. Currently using in-memory fallback which is fragile.
- **Why deferred:** Database-level migration required. Deferred to CARNAGE migration sprint.
- **Status:** DEFERRED
- **Blocking release?** PARTIAL — review queries work but are not DB-enforced
- **Sprint target:** CARNAGE Migration Sprint
- **Reference audit:** `2026-05-23_carnage_reviews-schema-provenance-and-rls.md`

### DEFER-003 — BookingQrLinksPanel Booking Adapter
- **Priority:** P3-C
- **Deferred from:** 2026-05-26 QR security hardening
- **Command owner:** WOLVERINE (implementation)
- **Affects module:** `modules/booking/`
- **Description:** `BookingQrLinksPanel` component is ready but has `enabled: false`. Requires a booking adapter that resolves `actorId → profileId` internally without leaking IDs to the public surface.
- **Why deferred:** Booking adapter sprint not started.
- **Status:** DEFERRED
- **Blocking release?** NO — component disabled, no regression
- **Sprint target:** Booking Adapter Sprint

### DEFER-004 — VportDashboardGasScreen Final/View Screen Split
- **Priority:** S2
- **Deferred from:** 2026-05-26 gas module audit
- **Command owner:** SENTRY (compliance)
- **Affects module:** `modules/gas/`
- **Description:** `VportDashboardGasScreen` combines Final Screen and View Screen responsibilities (pre-existing pattern from before the architecture contract was enforced).
- **Why deferred:** Structural refactor, not a security or correctness issue. Deferred to dashboard structural sprint.
- **Status:** DEFERRED
- **Blocking release?** NO — pre-existing pattern, not a regression
- **Sprint target:** Dashboard Structural Sprint

---

## P3 — Low Priority

### DEFER-005 — iOS Clipboard API Audit (FALCON)
- **Priority:** P3
- **Deferred from:** 2026-05-26 QR copy-link hardening
- **Command owner:** FALCON
- **Affects module:** `modules/menu/`, `modules/gas/`, `modules/booking/`
- **Description:** `navigator.clipboard.writeText` reliability on iOS Safari has not been formally audited across all QR copy-link flows. May silently fail on older iOS versions.
- **Why deferred:** Platform-specific, requires physical device testing.
- **Status:** DEFERRED — awaiting FALCON iOS parity sprint
- **Blocking release?** NO — graceful degradation exists

### DEFER-006 — Fuel Price Cache (KRAVEN)
- **Priority:** P3
- **Deferred from:** 2026-05-27 gas module KRAVEN audit
- **Command owner:** KRAVEN → WOLVERINE (implementation)
- **Affects module:** `modules/gas/`
- **Description:** `fuel_price_submissions` and `station_price_settings` are fetched uncached on every gas tab mount. Currently 3× DB hits per tab visit.
- **Why deferred:** Cache implementation sprint not started.
- **Status:** DEFERRED
- **Blocking release?** NO — correctness not affected, performance impact is non-critical for current scale
- **Sprint target:** Cache Optimization Sprint

---

## Resolution Process

When a deferred item is resolved:

1. Update the relevant `modules/[module]/audit-status.md`
2. Update `modules/[module]/findings.md` with the resolution
3. Update `vport-dashboard-governance-matrix.md` row
4. Remove the entry from this file
5. If the item was blocking THOR, re-run THOR gate for the affected module

---

### DEFER-007 — Barber ELEK-027 — fetchJoinResourceByIdDAL resource_type filter — ✅ RESOLVED
- **Status:** RESOLVED 2026-06-01
- **Resolution:** DB confirmed `resource_type = 'staff'` for barber join QR resources (CHECK constraint + corroborated by `vportOwnerStats.controller.js` and `wanderexPublicHelpers.read.dal.js`). `.eq("resource_type", "staff")` added to `fetchJoinResourceByIdDAL` in `apps/VCSM/src/features/join/dal/joinInvite.dal.js`.
- **DB snapshot:** `_HISTORY/db/snapshots/2026-06-01_db_tier2-surgical-confirmations.md`

### DEFER-008 — External Site ELEK-005 — listUsers O(n) in send-citizen-invite
- **Priority:** P1
- **Deferred from:** 2026-05-29 surgical fix sprint
- **Command owner:** CARNAGE → WOLVERINE (implementation)
- **Affects module:** `modules/external-site/`
- **Description:** `send-citizen-invite` Edge Function calls `adminClient.auth.admin.listUsers()` — loads entire auth table into memory per invite request to check email existence. Requires `vc.check_email_registered` SECURITY DEFINER RPC.
- **Why deferred:** DB migration required before code fix.
- **Status:** DEFERRED
- **Blocking release?** PARTIAL — correctness not affected; performance + security impact grows with user count
- **Sprint target:** CARNAGE Migration Sprint

### DEFER-009 — External Site ELEK-008 — anon key as send-lead-confirmation auth
- **Priority:** P2
- **Deferred from:** 2026-05-29 surgical fix sprint
- **Command owner:** CARNAGE (API key schema) → WOLVERINE (implementation)
- **Affects module:** `modules/external-site/`
- **Description:** `send-lead-confirmation` accepts the publicly-known anon key as sole authorization. Any site with the anon key can trigger email sends. Fix requires a per-external-site secret API key infrastructure.
- **Why deferred:** Infrastructure change required — no code-only fix possible.
- **Status:** DEFERRED
- **Blocking release?** PARTIAL — email spam vector if anon key is extracted from bundle

---

## Sprint Groupings

| Sprint | Items | Commands Needed |
|---|---|---|
| CARNAGE Migration Sprint (P1) | DEFER-002, DEFER-008 + V-SUB-008 (HIGH — dead `get_follower_count` RPC; follower count always 0) | CARNAGE ×3 |
| Booking Adapter Sprint | DEFER-003 | WOLVERINE (implementation) + SENTRY |
| Dashboard Structural Sprint | DEFER-004 | SENTRY (compliance review) |
| FALCON iOS Sprint | DEFER-005 | FALCON |
| Cache Optimization Sprint | DEFER-006 | KRAVEN → WOLVERINE |
| External Site Infrastructure Sprint | DEFER-009 | CARNAGE + WOLVERINE |
| ~~DB Confirmation Sprint~~ | ~~DEFER-007~~ | RESOLVED 2026-06-01 |

---

## DEFER-013 — Schedule Cross-Card Booking Controller Import

**Priority:** P0
**Status:** RESOLVED — 2026-06-02
**Module:** schedule
**Command owner:** SENTRY → WOLVERINE
**Reference:** sprint/TICKET-0004/SCHEDULE_DEPENDENCY_MAP.md

**Finding:**
`useVportOwnerSchedule.js` lines 5–6 directly imported three booking controllers via
internal filesystem paths (`cards/bookings/controller/...`), bypassing the bookings card's
public module boundary. This created a silent compile-time dependency: any rename or split
of booking controllers (TICKET-BOOKING-RPC-001) would break the schedule card.

**Resolution:**
Created `scheduleBookingCoordinator.controller.js` inside the schedule card's
`controller/` directory. The coordinator imports the three booking operations from the
bookings public index (`@/features/dashboard/vport/dashboard/cards/bookings`) and
exposes them as `createScheduleBooking`, `updateScheduleBookingStatus`,
`rescheduleScheduleBooking`. Updated `useVportOwnerSchedule.js` to import from the
coordinator instead of the bookings internal paths.

**Remaining debt:**
`useVportOwnerSchedule.js` hook split into `useScheduleData`, `useScheduleModals`,
`useScheduleBookingOps` — deferred to follow-on sprint after coordinator is verified.
See `modules/schedule/architecture.md`.
