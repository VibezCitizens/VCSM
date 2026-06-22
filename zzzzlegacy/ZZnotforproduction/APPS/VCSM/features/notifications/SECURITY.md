# Security Posture — notifications

Last Updated: 2026-06-07
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — BW-NOTI-001 (CRITICAL, partial — markSeen gap confirmed), BW-NOTI-004, BW-NOTI-010
VEN-NOTIFICATIONS-002 REMOVED from blockers — CLOSED_SOURCE_VERIFIED 2026-06-07

---

## VENOM STATUS
VENOM Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
VENOM Status: COMPLETE

Summary: 6 findings — 0 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW
2026-06-07 (batch pass): VEN-NOTIFICATIONS-002 CLOSED_SOURCE_VERIFIED; VEN-NOTIFICATIONS-001 confirmed SOURCE_VERIFIED
2026-06-07 (branch pass): publish.js session guard SOURCE_VERIFIED (TICKET-ARCH-NOTI-SESSION-001) — confirms auth; does NOT bind actorId to session.user; VEN-NOTIFICATIONS-004 remains OPEN at app layer

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-NOTIFICATIONS-001 | HIGH | OPEN — SOURCE_VERIFIED 2026-06-07 | markSeen() exported from runtime/index.js line 271 without verifyRecipientOwnership — any caller with recipientIds can bulk-mark any actor's notifications as seen; no actorId ownership assertion at any layer |
| VEN-NOTIFICATIONS-002 | HIGH | CLOSED_SOURCE_VERIFIED 2026-06-07 | markRead/dismiss/archive confirmed to have verifyRecipientOwnership calls at lines 279/292/305 — app-layer guard present; prior finding was stale |
| VEN-NOTIFICATIONS-003 | MEDIUM | OPEN | Diagnostics panel calls markRead({ recipientId: actorId }) — ID namespace mismatch; actorId used where recipientId is expected |
| VEN-NOTIFICATIONS-004 | MEDIUM | OPEN | publishEvent engine accepts caller-supplied sourceActorId with no session verification — actor impersonation in notification events (DB trigger 20260607000001 provides defense-in-depth) |
| VEN-NOTIFICATIONS-005 | MEDIUM | OPEN | window 'noti:optimistic:replace' event listener accepts unvalidated payload — XSS injection vector for fake notifications |
| VEN-NOTIFICATIONS-006 | LOW | OPEN | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants defined |

Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/notifications/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_notifications-security-review.md
Output (2026-06-07): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (Blue Team batch: ARCHITECT→VENOM→BLACKWIDOW→ELEKTRA, branch vport-booking-feed-security-updates)
ELEKTRA Status: COMPLETE

1 HIGH open | 1 MEDIUM open | 0 LOW

| Finding ID | Severity | Title | VEN Ref | BW Ref | Chain Confirmed | Status |
|---|---|---|---|---|---|---|
| ELEK-2026-06-07-001 | HIGH | markSeen bulk ownership bypass — recipientIds accepted without verifyRecipientOwnership; DAL UPDATE unconstrained; RLS UNVERIFIED | VEN-NOTIFICATIONS-001 | BW-NOTI-001 | SOURCE_VERIFIED | OPEN |
| ELEK-2026-06-07-B003 | MEDIUM | publish.js session guard confirms auth but NOT actorId identity — publishVcsmNotification actorId param remains caller-supplied after session guard; DB trigger is sole actor-binding control; defense-in-depth gap | VEN-NOTIFICATIONS-004 | BW-NOTI-005 / BW-BRANCH-002 | SOURCE_VERIFIED | OPEN |

Patch suggestions:
- ELEK-2026-06-07-001: Add `actorId` parameter to `markSeen`; call `verifyRecipientOwnership(id, actorId)` per recipient before DAL call.
- ELEK-2026-06-07-B003: After `getSession()` in publish.js, cross-check actorId against `session.user.id` (or derive actorId from session, removing it from the parameter surface).

DB Audit Note: notification.inbox_items RLS must be verified (DB-ELEK-004). If RLS absent, app-layer patch is the only defense.

THOR Blockers: ELEK-2026-06-07-001 (HIGH — confirmed exploitable chain)

Full Output (batch): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/ELEK-V1-SESSION-MASTER.md
Full Output (branch): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_branch-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 10 findings — 1 CRITICAL, 2 HIGH, 4 MEDIUM, 3 LOW

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-NOTI-001 | CRITICAL | Engine inbox state mutations (markRead/dismiss/archive/markSeen) accept arbitrary recipientId with no ownership assertion at any layer — actor A can tamper with actor B's inbox | BYPASSED | PARTIAL — markRead/dismiss/archive CLOSED_SOURCE_VERIFIED 2026-06-07; markSeen STILL OPEN |
| BW-NOTI-002 | MEDIUM | markAllNotificationsSeen actorId received as prop in useNotificationsHeader — no session cross-check in controller; stale/swapped actorId operates on wrong actor's inbox | PARTIAL | OPEN |
| BW-NOTI-003 | MEDIUM | resolveInboxActor vport branch with missing ownerActorId silently returns myActorId=null, disabling block filter for that session | PARTIAL | OPEN |
| BW-NOTI-004 | HIGH | RLS on notification.inbox_items is UNVERIFIED — inbox mutations filtered by recipient_id only; if RLS absent, any authenticated actor can modify any inbox item | UNRESOLVED | OPEN |
| BW-NOTI-005 | MEDIUM | publishEvent accepts caller-supplied sourceActorId with no session verification — actor impersonation in notification source (confirms VEN-NOTIFICATIONS-004) | BYPASSED | OPEN |
| BW-NOTI-006 | LOW | Engine markRead/dismiss/archive controllers have no null guard on recipientId — defense-in-depth gap (app-layer DAL has guard but engine does not) | PARTIAL | OPEN |
| BW-NOTI-007 | LOW | dismiss and archive lack idempotency guards (.eq is_dismissed=false / .is archived_at=null) unlike markSeen — replay updates timestamps | BYPASSED | OPEN |
| BW-NOTI-008 | MEDIUM | Sender display name falls back to payload-embedded context fields when hydration fails — stored XSS vector conditional on UI escaping | PARTIAL | OPEN |
| BW-NOTI-009 | LOW | publishVcsmNotification accepts linkPath without validation — diagnostics panel passes raw actorId UUID in linkPath violating no-raw-IDs-in-URLs rule | BYPASSED (dev) | OPEN |
| BW-NOTI-010 | HIGH | BEHAVIOR.md is PLACEHOLDER — all §9 invariants unanchored; governance blocker for THOR | FINDING | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/notifications/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_notifications-adversarial-review.md
