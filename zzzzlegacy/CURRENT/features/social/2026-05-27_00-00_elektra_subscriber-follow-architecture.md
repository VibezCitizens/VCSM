# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — Logan command evidence registry follow-up (TICKET-SUB-001, subscriber privacy, notification UUID, actor-kind guard)
**Findings Summary:** 2 HIGH | 2 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 6

## Executive Summary

The subscriber/follow system has two HIGH-severity findings. The first and most critical: `list_subscribers` and `count_subscribers` are confirmed SECURITY DEFINER RPCs with no internal privacy guard — any client can enumerate the full follower list of any actor via direct Supabase REST. The app-layer controller has no privacy check before calling these RPCs. The second HIGH finding: `ctrlSetActorPrivacy` has no ownership gate; only DB-layer RLS (unverified) protects against a foreign actor flipping another actor's private flag. Two MEDIUM findings cover the missing actor-kind guard in `ctrlSubscribe` and raw UUID leakage in notification sender routes.

## THOR Release Gate Summary

| Finding | Severity | THOR Gate |
|---|---|---|
| ELEK-2026-05-27-001: SECURITY DEFINER RPCs — private subscriber enumeration | HIGH | RELEASE BLOCKER |
| ELEK-2026-05-27-002: ctrlSetActorPrivacy — no ownership gate | HIGH | RELEASE BLOCKER |
| ELEK-2026-05-27-003: ctrlSubscribe — VPORT actor-kind guard absent | MEDIUM | CAUTION |
| ELEK-2026-05-27-004: notification.model.js — raw UUID in sender routes | MEDIUM | CAUTION |
| ELEK-2026-05-27-005: dalUpdateRequestStatus — no enum validation | LOW | PASS |
| ELEK-2026-05-27-006: dalListOutgoingRequests — no controller gate | LOW | PASS |

## Findings

### ELEK-2026-05-27-001 — HIGH
**list_subscribers / count_subscribers SECURITY DEFINER — private subscriber enumeration via direct REST**
- Category: Supabase RLS / IDOR/BOLA
- Location: features/profiles/kinds/vport/dal/subscribersList.dal.js, subscribersCount.dal.js, getSubscribers.controller.js; DB: vc.list_subscribers, vc.count_subscribers (SECURITY DEFINER confirmed)
- Source: Any HTTP client with Supabase anon or authenticated JWT + arbitrary p_actor_id
- Sink: supabase.schema("vc").rpc("list_subscribers", { p_actor_id: actorId })
- Trust Boundary: getSubscribersController — no privacy check before RPC call
- Impact: Full follower list of any actor enumerable including private actors via direct REST POST to /rest/v1/rpc/list_subscribers
- Fix (App): Add ctrlGetActorPrivacy check in getSubscribersController before calling RPCs
- Fix (DB): Add actor-kind guard + optional privacy guard inside RPC body
- Follow-up: DB, BLACKWIDOW

### ELEK-2026-05-27-002 — HIGH
**ctrlSetActorPrivacy — no ownership gate, RLS is sole protection**
- Category: IDOR/BOLA
- Location: features/settings/privacy/controller/actorPrivacy.controller.js:13–20
- Source: actorId from hook props — not verified against session
- Sink: vc.actor_privacy_settings upsert
- Trust Boundary: ctrlSetActorPrivacy — no assertingActorId gate
- Impact: Foreign actor can flip another actor's private flag if RLS is absent
- Fix: Add assertingActorId parameter + ownership gate; derive from useIdentity() at call site
- Follow-up: DB (verify RLS on actor_privacy_settings), BLACKWIDOW

### ELEK-2026-05-27-003 — MEDIUM
**ctrlSubscribe — no actor-kind guard allows VPORT → Citizen follow edges**
- Category: IDOR/BOLA
- Location: features/social/friend/subscribe/controllers/follow.controller.js:12–113
- Source: followerActorId from authenticated VPORT actor session
- Sink: dalInsertFollow → vc.actor_follows upsert
- Trust Boundary: ctrlSubscribe — V-SUB-001 passes for VPORT actors legitimately; no kind check
- Impact: VPORT actor gains read access to citizen's private posts via follow edge
- Fix: Resolve follower actor kind after V-SUB-001 gate; reject if kind is 'vport'
- Follow-up: BLACKWIDOW

### ELEK-2026-05-27-004 — MEDIUM
**notification.model.js — raw actor UUID in notification sender routes**
- Category: IDOR/BOLA (information disclosure)
- Location: features/notifications/inbox/model/notification.model.js:107, 128
- Source: sourceActorId/sender.id from DB when actor has no username/slug
- Sink: route: actorId ? '/profile/${actorId}' : '#'
- Impact: Raw UUID in notification link — enables actor ID enumeration; compounds with ELEK-001
- Fix: Replace UUID fallback with '#' in both normalizeSender() fallback paths
- Follow-up: BLACKWIDOW

### ELEK-2026-05-27-005 — LOW
**dalUpdateRequestStatus — no enum validation**
- Location: features/social/friend/request/dal/followRequests.dal.js:64–107
- No current exploit — all callers use string literals. Add VALID_REQUEST_STATUSES allowlist.

### ELEK-2026-05-27-006 — LOW
**dalListOutgoingRequests — exported without controller ownership gate**
- Location: features/social/friend/request/dal/followRequests.dal.js:132–148
- Currently zero callers. Add ctrlListOutgoingRequests wrapper before any consumption.

## False Positives Rejected
1. dalDeactivateFollow — unreachable without V-SUB-002 gate
2. dalInsertFollow — unreachable without V-SUB-001/003 gates
3. SSRF via notification linkPath — linkPath is a string literal, not user-controlled

## Suggested Patch Queue

| # | Finding ID | Severity | Layer | Complexity | DB Change |
|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | HIGH | Controller + RPC | MODERATE | YES |
| 2 | ELEK-2026-05-27-002 | HIGH | Controller | SIMPLE | YES (verify RLS) |
| 3 | ELEK-2026-05-27-003 | MEDIUM | Controller | SIMPLE | NO |
| 4 | ELEK-2026-05-27-004 | MEDIUM | Model | SIMPLE | NO |
| 5 | ELEK-2026-05-27-005 | LOW | DAL | SIMPLE | NO |
| 6 | ELEK-2026-05-27-006 | LOW | Controller | SIMPLE | NO |
