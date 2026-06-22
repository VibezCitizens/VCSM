# Security Posture — booking

Last Updated: 2026-06-07
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003, VEN-BOOKING-004, VEN-BOOKING-006, BW-BOOK-009, BW-BOOK-010, BW-BOOK-012, BW-BOOK-007, ELEK-2026-06-04-001, ELEK-2026-06-04-002, ELEK-2026-06-04-003

---

## VENOM STATUS
VENOM Last Run: 2026-06-07 (branch: vport-booking-feed-security-updates)
VENOM Status: COMPLETE

3 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW (3 CLOSED — 2 closed this pass)

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-BOOKING-001 | CRITICAL | updateBookingStatusDAL issues unscoped UPDATE by bookingId only — no owner_actor_id filter at DAL level; RLS is the only persistence-layer barrier | OPEN |
| VEN-BOOKING-002 | CRITICAL | saveBookingServiceProfileDurationsByServiceIds.dal.js references undefined `supabase` variable at lines 38, 53, 79 — DAL is completely non-functional, slot configuration is dead | OPEN |
| VEN-BOOKING-003 | CRITICAL | upsertBookingResourceServices.dal.js references undefined `supabase` variable at line 24 — DAL is completely non-functional, resource-service linking is dead | OPEN |
| VEN-BOOKING-004 | HIGH | createBookingController passes caller-supplied `status` directly to insertBookingDAL for all sources — no status allowlist enforced on insert | OPEN |
| VEN-BOOKING-006 | HIGH | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants declared; all security behavior is unanchored | OPEN |
| VEN-BOOKING-010 | MEDIUM | listBookingsByCustomer.dal.js selects and returns `profile_id` (internal DB identifier); surfaced as customerProfileId in booking.model.js — violates architecture contract | OPEN |
| VEN-BOOKING-008 | LOW | cancelBookingController resource-missing branch: finding downgraded — resource-missing path throws correctly; residual concern is orphaned bookings in DB | OPEN |
| VEN-BOOKING-005 | CLOSED | notification UUID exposure in cancel/confirm linkPath — FIXED; slug-based paths now used in cancelBookingController and confirmBookingController | CLOSED |
| VEN-BOOKING-007 | HIGH | createBookingController: public source PATCHED (customerActorId session-bound at line 112 [SOURCE_VERIFIED 2026-06-07]); management source (owner/admin/import/sync) still accepts caller-supplied customerActorId — booking attribution injection OPEN; ELEK-2026-06-04-008 OPEN | PARTIAL |
| VEN-BOOKING-009 | CLOSED | createBooking.controller.js raw owner actorId UUID in notification linkPath — FIXED 2026-06-07; linkPath: null confirmed at line 174 | CLOSED_SOURCE_VERIFIED |

Output (2026-06-07): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md
Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_booking-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (branch re-verify: vport-booking-feed-security-updates)
ELEKTRA Status: COMPLETE (2 closures, 1 new MEDIUM from branch pass)
Highest Open Severity: HIGH
THOR Release Blocker: YES — ELEK-2026-06-04-001, ELEK-2026-06-04-002, ELEK-2026-06-04-003,
  ELEK-2026-06-04-004, ELEK-2026-06-04-005, ELEK-2026-06-04-006, ELEK-2026-06-04-007,
  ELEK-2026-06-07-002

6 HIGH OPEN | 4 MEDIUM OPEN | 0 LOW | 0 INFO | 2 CLOSED (branch) | 2 FP Rejected

| Finding ID | Severity | Description | Cross-Ref | Status |
|---|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | Availability Rule Cross-Actor Hijack — upsertAvailabilityRuleDAL onConflict:id allows overwrite of foreign rule row; controller verifies resourceId ownership but not ruleId ownership | BW-BOOK-009 | OPEN |
| ELEK-2026-06-04-002 | HIGH | Availability Exception Cross-Actor Hijack — same onConflict:id vector for upsertAvailabilityExceptionDAL | BW-BOOK-010 | OPEN |
| ELEK-2026-06-04-003 | HIGH | confirmBookingController missing terminal-state gate — cancelled/completed bookings can be re-confirmed | BW-BOOK-012 | OPEN |
| ELEK-2026-06-04-004 | HIGH | createBookingController status not validated for management sources — any status including terminal can be inserted | VEN-BOOKING-004 | OPEN |
| ELEK-2026-06-04-005 | HIGH | updateBookingStatusDAL UPDATE scoped to bookingId only — no owner filter at DAL layer; RLS is sole barrier | VEN-BOOKING-001 | OPEN |
| ELEK-2026-06-04-006 | HIGH | saveBookingServiceProfileDurationsByServiceIds.dal.js uses undefined `supabase` at lines 38,53,79 — DAL completely non-functional | VEN-BOOKING-002 | OPEN |
| ELEK-2026-06-04-007 | HIGH | upsertBookingResourceServices.dal.js uses undefined `supabase` at line 24 — DAL completely non-functional | VEN-BOOKING-003 | OPEN |
| ELEK-2026-06-04-008 | HIGH | createBookingController accepts caller-supplied customerActorId for management sources — PUBLIC SOURCE PATCHED (session-bound 2026-06-07 SOURCE_VERIFIED); MANAGEMENT SOURCE STILL OPEN; assertActorOwnsVportActorController verifies VPORT ownership, not customerActorId; booking attribution injection remains on owner/admin/import/sync paths | VEN-BOOKING-007 | PARTIAL |
| ELEK-2026-06-04-009 | MEDIUM | cancelBookingController missing terminal-state guard — re-cancel mutates cancelled_at and internalNote | BW-BOOK-013 | OPEN |
| ELEK-2026-06-04-010 | MEDIUM | listOwnerBookingResourcesController no caller auth assertion — any actor can enumerate foreign booking resources | BW-BOOK-007 | OPEN |
| ELEK-2026-06-04-011 | MEDIUM | createBookingController line 138 raw UUID in notification linkPath — FIXED 2026-06-07; linkPath: null confirmed at controller:174 | VEN-BOOKING-009 / BW-BOOK-015 | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-04-012 | MEDIUM | listBookingsByCustomerDAL selects profile_id — internal DB identifier surfaced through booking model | VEN-BOOKING-010 | OPEN |

| ELEK-2026-06-07-002 | MEDIUM | createBookingController status not validated for management sources — chain re-verified 2026-06-07; patch advisory provided | VEN-BOOKING-004 | OPEN |
| ELEK-2026-06-07-B001 | HIGH | Management source customerActorId injection — chain traced SOURCE_VERIFIED 2026-06-07: customerActorId param flows from caller → insertBookingDAL(customer_actor_id: victimId) with no rebinding; VPORT owner can attribute booking to arbitrary citizen without consent | VEN-BOOKING-007 / BW-BOOK-017 | OPEN |

Output (2026-06-07 branch): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_branch-security-scan.md
Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/04/ELEKTRA/2026-06-04_14-00_elektra_booking-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (branch: vport-booking-feed-security-updates)
BLACKWIDOW Status: COMPLETE (branch pass — closure verification + adversarial)

0 CRITICAL, 4 HIGH, 3 MEDIUM, 1 LOW, 8 INFO (branch adds: 2 closures confirmed adversarially, 1 LOW new finding)

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-BOOK-001 | INFO | Ownership bypass at controller layer — BLOCKED; RLS dependency per VEN-BOOKING-001 still open | BLOCKED | OPEN |
| BW-BOOK-002 | INFO | Dashboard updateBookingStatusController ownership bypass — BLOCKED | BLOCKED | OPEN |
| BW-BOOK-003 | HIGH | createBookingController trusts caller-supplied requestActorId without session binding — PARTIAL; public path session-bound (SOURCE_VERIFIED 2026-06-07); management path assertActorOwnsVportActorController verifies VPORT ownership only — customerActorId still caller-supplied on management path | PARTIAL | OPEN |
| BW-BOOK-004 | INFO | Null requestActorId rejected at all controller gates | BLOCKED | CLOSED |
| BW-BOOK-005 | INFO | Stale/voided actor session blocked by live DB lookup in assertActorOwnsVportActorController | BLOCKED | CLOSED |
| BW-BOOK-006 | INFO | VPORT-kind actor impersonation at owner endpoints blocked by kind-check pre-self-shortcut | BLOCKED | CLOSED |
| BW-BOOK-007 | MEDIUM | listOwnerBookingResourcesController has no ownership/auth assertion — any caller can enumerate foreign actors' booking resources | BYPASSED | OPEN |
| BW-BOOK-008 | INFO | Owner-source booking gate enforced at controller layer regardless of client-side isOwner prop | BLOCKED | CLOSED |
| BW-BOOK-009 | HIGH | upsertAvailabilityRuleDAL onConflict:"id" without resource_id scope — attacker with known foreign ruleId can overwrite victim rule via owned resourceId | BYPASSED | OPEN |
| BW-BOOK-010 | HIGH | upsertAvailabilityExceptionDAL same onConflict:"id" hijack vector as BW-BOOK-009 for availability exceptions | BYPASSED | OPEN |
| BW-BOOK-011 | INFO | Null viewerActorId rejected at all controller gates | BLOCKED | CLOSED |
| BW-BOOK-012 | HIGH | confirmBookingController lacks terminal-state gate — cancelled/completed bookings can be re-confirmed | BYPASSED | OPEN |
| BW-BOOK-013 | MEDIUM | cancelBookingController lacks terminal-state guard — cancelled bookings can be re-cancelled mutating cancelled_at and internalNote | BYPASSED | OPEN |
| BW-BOOK-014 | INFO | Hydration interaction is read-only (fetchActorSummaries) — no poisoning vector | BLOCKED | CLOSED |
| BW-BOOK-015 | MEDIUM | createBookingController line 138 stores raw owner_actor_id UUID in notification linkPath — FIXED 2026-06-07; linkPath: null confirmed | BLOCKED | CLOSED_SOURCE_VERIFIED |
| BW-BOOK-016 | INFO | Dashboard updateBookingStatusController omits linkPath in notification — no UUID exposure | BLOCKED | CLOSED |
| BW-BOOK-017 | HIGH | Management source customerActorId injection confirmed [SOURCE_VERIFIED 2026-06-07] — VPORT owner can attribute bookings to any citizen without that citizen's consent; actorId does not need to be a customer of the VPORT; booking appears in victim's history | BYPASSED | OPEN |

Output (2026-06-07): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_branch-adversarial-review.md
Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_booking-adversarial-review.md
