# Subscribers — Findings Log

**VENOM audit:** 2026-05-27
**Last updated:** 2026-05-30 (TICKET-SEC-VERIFY-001 — source verification pass)
**Status:** WATCH — V-SUB-001 through V-SUB-007 resolved. BW-SUB-003 open (governance rule required).

## VENOM Findings

| ID | Severity | Finding | Status | Resolution |
|---|---|---|---|---|
| V-SUB-001 | CRITICAL | `ctrlSubscribe` — no session ownership gate on `followerActorId` | RESOLVED 2026-05-27 | `assertingActorId !== followerActorId` guard added to `follow.controller.js` |
| V-SUB-002 | CRITICAL | `ctrlUnsubscribe` — no session ownership gate on `followerActorId` | RESOLVED 2026-05-27 | Matching ownership gate added to `unsubscribe.controller.js` |
| V-SUB-003 | HIGH | `ctrlListIncomingRequests` — no ownership check on `targetActorId` | RESOLVED 2026-05-27 | Ownership check added to `followRequests.controller.js` |
| V-SUB-004 | HIGH | Raw UUID in VPORT subscriber route `/vport/${actor_id}` | RESOLVED 2026-05-30 | `buildSubscriberActor` in `VportSubscribersView.jsx` routes via `slug → vport_slug → username`; falls back to `/feed` — raw UUID never exposed |
| V-SUB-005 | HIGH | Raw UUID in notification `linkPath` `/profile/${followerActorId}` | RESOLVED 2026-05-27 | `follow.controller.js` `linkPath` set to `/feed` |
| V-SUB-006 | MEDIUM | `dalUpdateRequestStatus` accepts arbitrary status string | RESOLVED 2026-05-29 | `VALID_REQUEST_STATUSES` enum guard added to DAL |
| V-SUB-007 | MEDIUM | Production `console.error` logs actor IDs in DAL error paths | RESOLVED 2026-05-29 | `console.error` guarded with `import.meta.env.DEV`; actor IDs removed from log output |
| V-SUB-008 | **HIGH** (escalated from LOW) | `dalCountSubscribers` in `social/friend/subscribe/dal/subscriberCount.dal.js` calls `vc.get_follower_count` — **RPC does not exist in live DB** (confirmed 2026-06-01). Every call silently fails → follower count is always 0 for all actors. `dalCountVportSubscribers` (in `profiles/kinds/vport/dal/subscribersCount.dal.js`) calls `vc.count_vport_subscribers` which IS live but only works for VPORT actors. A new `get_actor_follower_count(p_actor_id)` RPC is required to support user-kind actors. | **OPEN — CARNAGE Migration Sprint (HIGH priority)** |

## BLACKWIDOW Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| BW-SUB-003 | HIGH | VPORT actor-kind follow bypass — no controller kind guard (any kind can follow any kind without restriction) | OPEN — governance rule definition required before code can enforce |
| BW-SUB-004 | HIGH | `ctrlSetActorPrivacy` — no `assertingActorId` gate | RESOLVED 2026-05-29 — `callerActorId` + ownership check added; chain updated through `useUpdateVportVisibility` + `useActorPrivacy` |
