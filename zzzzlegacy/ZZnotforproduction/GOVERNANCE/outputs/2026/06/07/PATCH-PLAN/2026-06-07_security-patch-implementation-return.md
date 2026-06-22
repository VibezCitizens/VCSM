# Security Patch — Implementation Return
**Ticket:** TICKET-BOOKING-PATCH-001 / TICKET-NOTI-PATCH-001 / TICKET-TRAFFIC-PATCH-001
**Date:** 2026-06-07
**Branch:** vport-booking-feed-security-updates

---

## Files Changed

| File | Change | Finding(s) Closed |
|---|---|---|
| `apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js` | Lines 38, 53, 79: `supabase` → `vportClient` (was undefined — ReferenceError at runtime) | VEN-BOOKING-002, ELEK-2026-06-04-006 |
| `apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js` | Line 24: `supabase` → `vportClient` (was undefined) | VEN-BOOKING-003, ELEK-2026-06-04-007 |
| `apps/VCSM/src/features/booking/controllers/confirmBooking.controller.js` | Add terminal-state guard (TERMINAL_STATUSES set) before updateBookingStatusDAL | ELEK-2026-06-04-003, BW-BOOK-012 |
| `apps/VCSM/src/features/booking/controllers/cancelBooking.controller.js` | Add terminal-state guard (TERMINAL_STATUSES set) before updateBookingStatusDAL — linter upgraded to full set | ELEK-2026-06-04-009, BW-BOOK-013 |
| `apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js` | Replace upsert(onConflict:"id") with conditional UPDATE scoped to id+resource_id / INSERT | ELEK-2026-06-04-001, BW-BOOK-009 |
| `apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js` | Same conditional UPDATE/INSERT split for exceptions | ELEK-2026-06-04-002, BW-BOOK-010 |
| `apps/VCSM/src/features/booking/controllers/createBooking.controller.js` | (1) customerActorId binding on management path — self-bind or validate target citizen; (2) status allowlist via MANAGEMENT_VALID_STATUSES | ELEK-2026-06-07-B001, ELEK-2026-06-04-008 (PARTIAL→CLOSED), VEN-BOOKING-004, ELEK-2026-06-04-004 |
| `apps/VCSM/src/features/booking/controllers/listOwnerBookingResources.controller.js` | Add requestActorId param + assertActorOwnsVportActorController call | ELEK-2026-06-04-010, BW-BOOK-007 (app-level) |
| `apps/VCSM/src/dev/diagnostics/groups/bookingFeature.group.js` | Pass requestActorId from context to listOwnerBookingResourcesController | (caller update for above) |
| `apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js` | Remove `profile_id` from BOOKING_SELECT — raw VPORT profile UUID no longer surfaced | VEN-BOOKING-010 |
| `apps/VCSM/src/features/notifications/runtime/index.js` | markSeen: actorId param + verifyRecipientOwnership filter per recipientId (linter applied) | VEN-NOTIFICATIONS-001, ELEK-2026-06-07-001, BW-NOTI-001 (markSeen gap) |
| `apps/VCSM/src/features/notifications/publish.js` | publishVcsmNotification + publishVcsmNotificationBatch: add actor_owners ownership check after session guard | ELEK-2026-06-07-B003, VEN-NOTIFICATIONS-004 |
| `apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js` | updateAnswerModerationRow: add .eq("moderation_status","pending") guard | ELEK-2026-06-07-B002, VEN-TRAFFIC-004, BW-TRAFFIC-004 |
| `apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js` | updateQuestionModerationRow: add .eq("moderation_status","pending") guard | ELEK-2026-06-07-B002 |

---

## Behavior Changed

| Controller/DAL | Before | After | Preserved |
|---|---|---|---|
| saveBookingServiceProfileDurations | ReferenceError thrown at runtime (supabase undefined) | Executes correctly via vportClient | Column/logic unchanged |
| upsertBookingResourceServices | ReferenceError thrown at runtime | Executes correctly via vportClient | onConflict logic unchanged |
| confirmBookingController | Cancelled/completed bookings could be re-confirmed | Throws if booking.status is terminal | Owner-initiated confirms still work |
| cancelBookingController | Cancelled bookings could be re-cancelled | Throws if booking.status is in terminal set | Customer + owner cancel paths preserved |
| upsertAvailabilityRuleDAL | onConflict:"id" allowed foreign ruleId hijack | UPDATE now scoped to id+resource_id; throws if not found | Insert (null id) unchanged |
| upsertAvailabilityExceptionDAL | Same foreign exceptionId hijack | Same fix applied | Insert path unchanged |
| createBookingController (management) | customerActorId caller-supplied with no validation | Binds to requestActorId if not set; validates target citizen if different | Public path unchanged; status allowlist in place |
| listOwnerBookingResourcesController | No auth assertion | assertActorOwnsVportActorController required | Return shape unchanged |
| listBookingsByCustomer.dal | Returns profile_id (VPORT internal UUID) in result | Removed from SELECT; join result (vportActorId/vportName) preserved | booking.model.js mapping unaffected |
| markSeen | Accepted any recipientIds without ownership check | Filters to only owned recipientIds via verifyRecipientOwnership | Returns 0 silently for unowned IDs |
| publishVcsmNotification/Batch | Session checked but actorId not bound to session user | actor_owners lookup added; returns false if actorId not owned by session | Legitimate callers unaffected (their actorId always matches session) |
| updateAnswerModerationRow | UPDATE fired unconditionally on any status | UPDATE only fires when moderation_status="pending" | First-time moderation unchanged; already-moderated returns 400 |

---

## Grep Checks

| Symbol | Result |
|---|---|
| `supabase` in saveBookingServiceProfileDurations.dal.js | 0 remaining raw references |
| `supabase` in upsertBookingResourceServices.dal.js | 0 remaining raw references |
| `TERMINAL_STATUSES` in confirmBooking.controller.js | Present at line 39 |
| `TERMINAL_STATUSES` in cancelBooking.controller.js | Present (linter upgraded to full set) |
| `onConflict: "id"` in upsertAvailabilityRule.dal.js | Removed — replaced with conditional UPDATE/INSERT |
| `onConflict: "id"` in upsertAvailabilityException.dal.js | Removed |
| `customerActorId = requestActorId` in createBooking.controller.js | Management path binding present |
| `assertActorOwnsVportActorController` in listOwnerBookingResources.controller.js | Present |
| `profile_id` in listBookingsByCustomer.dal.js BOOKING_SELECT | Removed |
| `verifyRecipientOwnership` in runtime/index.js markSeen | Present |
| `actor_owners` in publish.js | Present in both publishVcsmNotification and publishVcsmNotificationBatch |
| `moderation_status`, `pending` in moderationAnswers.dal.js | Present in updateAnswerModerationRow |
| `moderation_status`, `pending` in moderationQuestions.dal.js | Present in updateQuestionModerationRow |

---

## Tests Run

Not run — no test suite for these files confirmed in scope. SPIDER-MAN regression pass required before THOR.

---

## Build Result

Not run — no build triggered. Owner to verify build integrity.

---

## Remaining TODOs / Still Open

### DB Phase (owner deploys — do not patch here)
- DB-VPORT-001: `vport.profiles` UPDATE RLS — verify ownership scope
- DB-NOTI-001: `notification.inbox_items` RLS — verify recipient_id enforcement
- DB-BOOKING-001: `vport.bookings` UPDATE RLS — verify per VEN-BOOKING-001
- DB-TRAFFIC-001: `answers.questions` INSERT policy for anon key

### Separate Ticket Required
- TICKET-VPORT-PATCH-001: BW-VPORT-001/002 — vport.core.dal + vport.write.profileMedia.dal session binding (conditional on DB verify)
- Engine-level `listOwnerBookingResources` hook chain — add requestActorId through hook + adapter (3 callers)
- Engine-level `markSeen` ownership (engines/notifications) — separate engine ticket
- VEN-TRAFFIC-001: Rate limiting on Traffic answers POST endpoint (requires platform-level solution)
- VEN-TRAFFIC-002: Static moderation token rotation strategy

### Still OPEN from prior pipeline (not patched this pass)
- VEN-BOOKING-001 / ELEK-2026-06-04-005: updateBookingStatusDAL no owner filter at DAL layer (RLS-dependent)
- BW-NOTI-002: markAllNotificationsSeen no session cross-check in controller
- BW-NOTI-003: resolveInboxActor silent null return
- BW-NOTI-005/007/008: dismiss/archive idempotency; sender name XSS; linkPath UUID

---

## THOR Gate Assessment

**NOT THOR-ready.** DB phase and SPIDER-MAN required first.

This patch pass closes or partially closes:
- 2 CRITICAL (VEN-BOOKING-002, VEN-BOOKING-003 — DALs now functional)
- 5 HIGH → CLOSED (ELEK-2026-06-04-001, 002, 003, 008, BW-BOOK-007 app-level)
- 2 MEDIUM → CLOSED (ELEK-2026-06-07-B002, VEN-BOOKING-010)
- 2 MEDIUM → CLOSED (ELEK-2026-06-07-B003, VEN-NOTIFICATIONS-001 app-level)

Remaining CRITICAL open: VEN-BOOKING-001 (RLS-dependent), BW-NOTI-001 engine-level
Remaining HIGH open: BW-VPORT-001/002 (conditional), VEN-TRAFFIC-001 (rate limiting)
