# VENOM V2 — booking Branch Delta
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Run type:** Patch verification + carry-forward confirmation

---

## Patches Confirmed Closed

### VEN-BOOKING-009 — CLOSED [SOURCE_VERIFIED]

**Finding:** createBookingController line ~171 stores raw owner actorId UUID in notification linkPath
**Patch:** `publishVcsmNotification({ …, linkPath: null })`
**Evidence:** apps/VCSM/src/features/booking/controllers/createBooking.controller.js — linkPath parameter passed as `null` to publishVcsmNotification; no raw UUID in published notification payload
**Cross-closes:** ELEK-2026-06-04-011, BW-BOOK-015

---

## Partial Fix Confirmed

### VEN-BOOKING-007 — PARTIAL [SOURCE_VERIFIED]

**Finding:** createBookingController accepts caller-supplied `customerActorId` for all sources
**Fix applied:** For `public` source: `customerActorId = requestActorId` (session-bound at controller layer, line 112)
**Evidence:** createBooking.controller.js line 112:
  `if (source === 'public') { customerActorId = requestActorId }` — session-bound ✅
**Remaining open:** Management sources (`owner`, `admin`, `import`, `sync`): `customerActorId` is still passed through from the caller-supplied `customerActorId` parameter — booking attribution injection remains possible for non-public sources.
**ELEK-2026-06-04-008:** PARTIAL (public path CLOSED; management path OPEN)

---

## Carry-Forward Open Findings

| Finding ID | Severity | Description |
|---|---|---|
| VEN-BOOKING-001 | CRITICAL | updateBookingStatusDAL issues UPDATE by bookingId only — no owner_actor_id filter |
| VEN-BOOKING-002 | CRITICAL | saveBookingServiceProfileDurationsDAL undefined `supabase` — dead DAL |
| VEN-BOOKING-003 | CRITICAL | upsertBookingResourceServicesDAL undefined `supabase` — dead DAL |
| VEN-BOOKING-004 | HIGH | createBookingController passes caller-supplied `status` directly — no allowlist for management sources |
| VEN-BOOKING-007 | HIGH | Management source customerActorId still caller-supplied |
| VEN-BOOKING-010 | MEDIUM | listBookingsByCustomerDAL returns profile_id |
| BW-BOOK-007 | MEDIUM | listOwnerBookingResourcesController no auth assertion |
| BW-BOOK-009 | HIGH | upsertAvailabilityRuleDAL onConflict:id cross-actor hijack |
| BW-BOOK-010 | HIGH | upsertAvailabilityExceptionDAL onConflict:id cross-actor hijack |
| BW-BOOK-012 | HIGH | confirmBookingController no terminal-state gate |
| BW-BOOK-013 | MEDIUM | cancelBookingController no terminal-state guard |
| ELEK-2026-06-04-001 | HIGH | Availability rule cross-actor hijack |
| ELEK-2026-06-04-002 | HIGH | Availability exception cross-actor hijack |
| ELEK-2026-06-04-003 | HIGH | confirmBookingController no terminal-state gate |
| ELEK-2026-06-04-004 | HIGH | Status not validated for management sources |
| ELEK-2026-06-04-005 | HIGH | updateBookingStatusDAL UPDATE scoped to bookingId only |
| ELEK-2026-06-04-006 | HIGH | saveBookingServiceProfileDurations dead DAL |
| ELEK-2026-06-04-007 | HIGH | upsertBookingResourceServices dead DAL |
| ELEK-2026-06-04-009 | MEDIUM | cancelBookingController no terminal-state guard |
| ELEK-2026-06-04-010 | MEDIUM | listOwnerBookingResourcesController no auth |
| ELEK-2026-06-04-012 | MEDIUM | listBookingsByCustomerDAL returns profile_id |

---

## THOR Gate: BLOCKED

THOR blockers from 2026-06-04 remain. VEN-BOOKING-001 (CRITICAL), VEN-BOOKING-002 (CRITICAL), VEN-BOOKING-003 (CRITICAL), VEN-BOOKING-004 (HIGH), ELEK-2026-06-04-001, ELEK-2026-06-04-002, ELEK-2026-06-04-003.

Three closes from this branch:
- VEN-BOOKING-009: CLOSED ✅
- ELEK-2026-06-04-011: CLOSED ✅
- BW-BOOK-015: CLOSED ✅
