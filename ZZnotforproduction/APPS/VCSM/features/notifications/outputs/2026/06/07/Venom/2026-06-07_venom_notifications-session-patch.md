# VENOM V2 — notifications Session Guard Patch Verification
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Ticket:** TICKET-ARCH-NOTI-SESSION-001 DONE

---

## Patch Verified [SOURCE_VERIFIED]

### Session Guard — publish.js

**File:** apps/VCSM/src/features/notifications/publish.js (lines 62-64)
**Change:** `supabase.auth.getSession()` call added; if `!session`, returns `false` immediately
**Applies to:** Both `publishVcsmNotification` (line 62-64) and `publishVcsmNotificationBatch` (line 119)
**Effect:** Unauthenticated actors can no longer publish notification events via this surface
**DB Trigger:** BEFORE INSERT trigger on `notification.events` also deployed — enforces `source_actor_id` ownership via `vc.actor_owners`

---

## What the Patch Does NOT Close

**VEN-NOTIFICATIONS-004** (MEDIUM) — STILL OPEN:
The session guard confirms that A session exists (auth is present). It does NOT verify that the `actorId` parameter matches `session.user`. Scenario:
- Actor A is authenticated (session exists)
- Actor A calls `publishVcsmNotification({ actorId: actorB_id, recipientActorId: actorC_id, … })`
- Session guard: session exists → PASS ✅
- Notification is published with `sourceActorId = actorB_id` (actor B impersonated)

The DB trigger is the second defence. But at the app layer, the actor identity claim remains caller-supplied.

**BW-NOTI-005** (MEDIUM) — STILL OPEN: Same root cause as VEN-NOTIFICATIONS-004.

---

## Carry-Forward THOR Blockers

| Finding ID | Severity | Status |
|---|---|---|
| BW-NOTI-001 | CRITICAL | OPEN — inbox state mutations accept arbitrary recipientId |
| VEN-NOTIFICATIONS-002 | HIGH | OPEN — markRead/dismiss/archive no ownership guard |
| BW-NOTI-004 | HIGH | OPEN — RLS on notification.inbox_items UNVERIFIED |
| VEN-NOTIFICATIONS-004 | MEDIUM | OPEN — sourceActorId still caller-supplied at app layer |
| BW-NOTI-005 | MEDIUM | OPEN — same root cause as VEN-NOTIFICATIONS-004 |
| BW-NOTI-010 | HIGH | RESOLVING — BEHAVIOR.md now ACTIVE (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) |

---

## THOR Gate: BLOCKED

BW-NOTI-001 (CRITICAL) and VEN-NOTIFICATIONS-002 (HIGH) remain hard blockers. DB phase must verify RLS on notification.inbox_items UPDATE (BW-NOTI-004) before these can be cleared.
