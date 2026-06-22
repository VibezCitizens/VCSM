# SECURITY — social

**Last security audit:** ELEKTRA 2026-05-27
**Findings Summary:** 2 HIGH | 2 MEDIUM | 2 LOW
**False Positives Rejected:** 3

---

## THOR Release Gate

| Finding | Severity | THOR Gate |
|---|---|---|
| ELEK-2026-05-27-001 | HIGH | RELEASE BLOCKER |
| ELEK-2026-05-27-002 | HIGH | RELEASE BLOCKER |
| ELEK-2026-05-27-003 | MEDIUM | CAUTION |
| ELEK-2026-05-27-004 | MEDIUM | CAUTION |
| ELEK-2026-05-27-005 | LOW | PASS |
| ELEK-2026-05-27-006 | LOW | PASS |

---

## OPEN Findings

### ELEK-2026-05-27-001 — HIGH — OPEN
**list_subscribers / count_subscribers SECURITY DEFINER — private subscriber enumeration via direct REST**
- Category: Supabase RLS / IDOR/BOLA
- Location: `features/profiles/kinds/vport/dal/subscribersList.dal.js`, `subscribersCount.dal.js`, `getSubscribers.controller.js`; DB: `vc.list_subscribers`, `vc.count_subscribers` (SECURITY DEFINER confirmed)
- Source: Any HTTP client with Supabase anon or authenticated JWT + arbitrary `p_actor_id`
- Sink: `supabase.schema("vc").rpc("list_subscribers", { p_actor_id: actorId })`
- Trust Boundary: `getSubscribersController` — no privacy check before RPC call
- Impact: Full follower list of any actor enumerable including private accounts via direct REST POST to `/rest/v1/rpc/list_subscribers`. SECURITY DEFINER bypasses `actor_follows.select.self` RLS entirely.
- Confirmed live attack path (REPLAY-SUB-04): `POST /rest/v1/rpc/list_subscribers` with `{ "p_actor_id": "<any_uuid>", "p_limit": 1000, "p_offset": 0 }` returns paginated subscriber list for any actor.
- Fix (App): Add `ctrlGetActorPrivacy` check in `getSubscribersController` before calling RPCs
- Fix (DB): Phase 0 — apply TICKET-0006 migration `20260527060000` (adds vport.profiles guard); Phase 1 — create scoped `count_vport_subscribers` / `list_vport_subscribers` RPCs
- Mitigation path: TICKET-SUB-001 (Phases 0–3)

### ELEK-2026-05-27-002 — HIGH — OPEN
**ctrlSetActorPrivacy — no ownership gate, RLS is sole protection**
- Category: IDOR/BOLA
- Location: `features/settings/privacy/controller/actorPrivacy.controller.js:13–20`
- Source: `actorId` from hook props — not verified against session
- Sink: `vc.actor_privacy_settings` upsert
- Trust Boundary: `ctrlSetActorPrivacy` — no `assertingActorId` gate
- Impact: Foreign actor can flip another actor's private flag if RLS is absent or misconfigured
- DB status: `vc.actor_privacy_settings` RLS policies — UNKNOWN (not verified in session)
- Fix: Add `assertingActorId` parameter + ownership gate; derive from `useIdentity()` at call site; verify RLS
- Mitigation path: TICKET-SUB-002 (also requires DB RLS verification)
- Additional confirmed issue (REPLAY-SUB-05): exploitability depends on unverified RLS state

### ELEK-2026-05-27-003 — MEDIUM — OPEN
**ctrlSubscribe — no actor-kind guard allows VPORT to follow Citizens**
- Category: IDOR/BOLA
- Location: `features/social/friend/subscribe/controllers/follow.controller.js:12–113`
- Source: `followerActorId` from authenticated VPORT actor session
- Sink: `dalInsertFollow` → `vc.actor_follows` upsert
- Trust Boundary: `ctrlSubscribe` — V-SUB-001 passes for VPORT actors; no kind check
- Impact: VPORT actor gains read access to citizen's private posts via follow edge
- Fix: Resolve follower actor kind after V-SUB-001 gate; reject if kind is `vport`
- Mitigation path: TICKET-SUB-005

### ELEK-2026-05-27-004 — MEDIUM — OPEN
**notification.model.js — raw actor UUID in notification sender routes**
- Category: IDOR/BOLA (information disclosure)
- Location: `features/notifications/inbox/model/notification.model.js:107, 128`
- Source: `sourceActorId`/`sender.id` from DB when actor has no username/slug
- Sink: `route: actorId ? '/profile/${actorId}' : '#'`
- Impact: Raw UUID in notification link — enables actor ID enumeration; compounds with ELEK-001
- Fix: Replace UUID fallback with `'#'` in both `normalizeSender()` fallback paths
- Mitigation path: TICKET-SUB-003

### ELEK-2026-05-27-005 — LOW — OPEN
**dalUpdateRequestStatus — no enum validation**
- Location: `features/social/friend/request/dal/followRequests.dal.js:64–107`
- No current exploit — all callers use string literals
- Fix: Add `VALID_REQUEST_STATUSES` allowlist guard
- Mitigation path: TICKET-SUB-007 (or standalone)

### ELEK-2026-05-27-006 — LOW — OPEN
**dalListOutgoingRequests — exported without controller ownership gate**
- Location: `features/social/friend/request/dal/followRequests.dal.js:132–148`
- Currently zero callers
- Fix: Add `ctrlListOutgoingRequests` wrapper before any consumption
- Mitigation path: TICKET-SUB-008

---

## Additional Security Notes (TICKET-SUB-001 session)

**Privacy DAL default divergence — OPEN:**
- `social/privacy/dal/actorPrivacy.dal.js` missing-row default: `{ isPrivate: true }` (fail closed) — used by follow gate
- `settings/privacy/dal/visibility.dal.js` missing-row default: `false` (fail open) — used by settings write path
- Same table, opposite defaults. New read paths that import from the wrong file silently get the wrong default.
- Ticket: TICKET-SUB-007

**DAL naming collision — OPEN:**
- `dalCountSubscribers` exported from two files targeting different RPCs with different argument styles
- Collision is silent; depends entirely on import path
- Ticket: TICKET-SUB-006

**Cache invalidation gap — OPEN:**
- `follow.controller.js` does not call `invalidateSubscriberCount` from `subscribersCount.dal.js` after a follow
- VPORT subscriber count retains cached value for up to 60 seconds post-follow
- Ticket: standalone low-priority bug

**`vc.get_follower_count` security context — UNKNOWN:**
- prosecdef and search_path not confirmed in session
- Must be verified before Phase 1 migration

---

## False Positives Rejected (ELEKTRA 2026-05-27)

1. `dalDeactivateFollow` — unreachable without V-SUB-002 gate
2. `dalInsertFollow` — unreachable without V-SUB-001/003 gates
3. SSRF via notification linkPath — `linkPath` is a string literal, not user-controlled
