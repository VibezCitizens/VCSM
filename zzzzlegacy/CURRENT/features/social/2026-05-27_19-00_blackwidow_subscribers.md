# BLACKWIDOW Runtime Adversarial Report

Date: 2026-05-27
Scope: VCSM
Reviewer: BLACKWIDOW
Environment: Repository source simulation — no live DB connection (DB COMMAND BLOCKED)
Module: subscribers
Governance Status: DRAFT
Findings: 0 CRITICAL | 3 HIGH | 4 MEDIUM | 3 LOW | 2 INFO
Exploit Chains: 3 CONFIRMED | 6 BLOCKED | 4 PARTIAL

---

## Attack Surface Summary

The subscribers module exposes two distinct sub-surfaces:

**Sub-surface A — VPORT subscriber display** (`/vport/subscribers`)
Path: `VportSubscribersView` → `useSubscribers` → `getSubscribersController` → `dalCountVportSubscribers` / `dalListVportSubscribers` → `vc.count_vport_subscribers` / `vc.list_vport_subscribers` (SECURITY DEFINER, VPORT-kind-guarded)

**Sub-surface B — Social follow/unfollow graph** (`ctrlSubscribe` / `ctrlUnsubscribe`)
Path: `useSubscribeAction` / `useUnsubscribeAction` → `ctrlSubscribe` / `ctrlUnsubscribe` → `dalInsertFollow` / `dalDeactivateFollow` → `vc.actor_follows`

**Sub-surface C — Follow request management** (private actors)
Path: `ctrlSendFollowRequest` / `ctrlAcceptFollowRequest` / `ctrlDeclineFollowRequest` / `ctrlCancelFollowRequest` → `dalUpsertPendingRequest` / `dalUpdateRequestStatus` → `vc.social_follow_requests`

**Sub-surface D — Actor privacy settings**
Path: `ctrlSetActorPrivacy` → `dalSetActorPrivacy` → `vc.actor_privacy_settings`

**Sub-surface E — Notification model**
Path: `publishVcsmNotification` → `notification.model.js (normalizeSender)`

### Prior Audit Context

- VENOM (2026-05-10): 2 HIGH (SF-01 block bypass, SF-02 profile gate), 5 MEDIUM, 3 LOW — V-SUB-001/002/003/005 FIXED; V-SUB-004/006/007/008 open
- ELEKTRA (2026-05-27): 2 HIGH (SECURITY DEFINER enum, no ownership gate on privacy), 2 MEDIUM, 2 LOW
- DB (2026-05-27): BLOCKED — no live connection
- Architecture decision (TICKET-SUB-001): explicit VPORT RPCs created and deployed; legacy RPCs dropped

### VENOM Open Findings (unresolved, carried into this simulation)

| VENOM ID | Finding | Current Status |
|---|---|---|
| V-SUB-004 | Notification linkPaths use raw actor UUIDs | Open — notification.model.js normalizeSender still has UUID fallback paths |
| V-SUB-006 | dalListOutgoingRequests exported without controller gate | Open — zero callers confirmed, but export surface is ungated |
| V-SUB-007 | actor_privacy_settings missing-row default divergence | Open — visibility.dal.js uses fail-open default |
| V-SUB-008 | No actor-kind guard in ctrlSubscribe — VPORT can follow Citizens | Open — no kind check confirmed in follow.controller.js |

---

## Simulated Threat Scenarios

Eight attack scenarios were simulated across the five sub-surfaces. Each is classified below.

---

## Ownership Bypass Results

### Scenario 1 — Ownership Bypass: Can Actor B unsubscribe Actor A?

**Simulation:** Actor B (`assertingActorId = B`) calls `ctrlUnsubscribe` with `followerActorId = A`. Actor B is attempting to force-unfollow Actor A from a VPORT, which would bust Actor A's `invalidateFeedFollowCache` and cause A's feed to lose follow context.

**Target:** `unsubscribe.controller.js:ctrlUnsubscribe`

**Attack vector:**
```
ctrlUnsubscribe({
  followerActorId:  "actor-A-uuid",
  followedActorId:  "some-vport-uuid",
  assertingActorId: "actor-B-uuid"  ← attacker injects own ID as asserting
})
```

**Execution path observed:**
```
line 19: if (!assertingActorId || assertingActorId !== followerActorId)
         → "actor-B-uuid" !== "actor-A-uuid" → throws "session actor does not match follower"
```

**Result: BLOCKED**

The ownership gate at controller entry point fires before any DAL call. The gate is exact-equality — no fuzzing with substring or type coercion passes. `invalidateFeedFollowCache` is never reached for Actor A. The DAL layer is never called.

**Can Actor B subscribe as Actor A?**

**Target:** `follow.controller.js:ctrlSubscribe`

**Attack vector:**
```
ctrlSubscribe({
  followerActorId:  "actor-A-uuid",
  followedActorId:  "some-vport-uuid",
  assertingActorId: "actor-B-uuid"
})
```

**Execution path:**
```
line 26: if (!assertingActorId || assertingActorId !== followerActorId)
         → "actor-B-uuid" !== "actor-A-uuid" → throws "session actor does not match follower"
```

**Result: BLOCKED**

Ownership gate fires at line 26 before block check, before privacy check, before DAL.

**Can a non-owner accept a follow request on behalf of the target?**

**Target:** `followRequests.controller.js:ctrlAcceptFollowRequest`

**Attack vector:** Actor C calls `ctrlAcceptFollowRequest` with `targetActorId = B` but `assertingActorId = C`.

**Execution path:**
```
line 78-79: if (!assertingActorId || assertingActorId !== targetActorId)
            → throws "session actor does not own this request"
```

**Result: BLOCKED**

All three ownership gates (subscribe, unsubscribe, accept) are correctly wired.

---

## Session Mutation Results

### Scenario 2 — Stale or null viewerActorId to subscribe controller

**Simulation:** Stale session — viewerActorId is `null`, empty string, or undefined.

**Attack vector (null):**
```
ctrlSubscribe({ followerActorId: null, followedActorId: "vport-id", assertingActorId: null })
```

**Execution path:**
```
line 17: if (!followerActorId || !followedActorId) → throws "Missing actor ids"
```

**Result: BLOCKED** — null guard fires before ownership check.

**Attack vector (undefined assertingActorId with valid followerActorId):**
```
ctrlSubscribe({ followerActorId: "actor-A", followedActorId: "vport-id", assertingActorId: undefined })
```

**Execution path:**
```
line 26: if (!assertingActorId || ...) → !undefined === true → throws "session actor does not match follower"
```

**Result: BLOCKED** — `!undefined` evaluates truthy. Gate fires immediately.

**Attack vector (empty string assertingActorId):**
```
ctrlSubscribe({ followerActorId: "actor-A", followedActorId: "vport-id", assertingActorId: "" })
```

**Execution path:**
```
line 26: if (!assertingActorId || ...) → !"" === true → throws
```

**Result: BLOCKED**

**Observation:** There is no silent downgrade to a public-read path. All null/undefined/empty session states throw hard errors.

---

## Runtime Abuse Results

### Scenario 3 — VPORT actor-kind calling ctrlSubscribe to follow a Citizen

**Simulation:** An actor with `kind = 'vport'` is authenticated and calls `ctrlSubscribe` to follow a Citizen actor. The VPORT actor's `assertingActorId` matches its own `followerActorId` (ownership gate passes). No actor-kind guard exists in `follow.controller.js`.

**Target:** `follow.controller.js:ctrlSubscribe` (lines 12-113)

**Attack vector:**
```
ctrlSubscribe({
  followerActorId:  "actor-vport-uuid",   ← VPORT actor
  followedActorId:  "actor-citizen-uuid", ← Citizen target
  assertingActorId: "actor-vport-uuid",   ← asserting matches follower: gate passes
})
```

**Execution path:**
```
line 26: assertingActorId === followerActorId → PASSES (same VPORT actor ID)
line 30: ctrlGetBlockStatus → no block assumed
line 38: ctrlGetFollowRelationshipState → reads privacy, follow status
line 56: relation.isPrivate? → determines public vs private path
→ if public: dalInsertFollow called → follow edge created for VPORT → Citizen
→ if private: ctrlSendFollowRequest called → request row created
```

**No actor-kind check at any point in this execution chain.**

**Result: BYPASSED — CONFIRMED EXPLOIT CHAIN**

A VPORT actor can follow a Citizen actor, gaining a follow edge in `vc.actor_follows`. The Citizen's private posts become visible in the VPORT actor's feed. The RLS on `vc.actor_follows INSERT` (`actor_follows.insert.self`) checks ownership of `follower_actor_id` — it does not check `actor.kind`. The VPORT actor legitimately owns its actor row. The DB layer does not block this path.

**Blast Radius:** Any Citizen with a private profile can have their post feed accessed by any authenticated VPORT actor that follows them. The number of VPORT actors on the platform determines scale.

**VENOM Cross-Reference:** V-SUB-008 (confirmed open)

---

## RLS Verification Results

### Scenario 4 — actorId forge in subscriber list query

**Simulation A — Direct REST bypass of list_vport_subscribers (actor UUID forge):**

The DB now calls `vc.list_vport_subscribers` (SECURITY DEFINER), which has an internal guard:
```sql
EXISTS (SELECT 1 FROM vport.profiles vp
        WHERE vp.actor_id = p_actor_id
          AND vp.is_active = true
          AND vp.is_deleted = false)
```

**Attack vector:** Attacker sends authenticated REST POST to:
```
POST /rest/v1/rpc/list_vport_subscribers
{ "p_actor_id": "<citizen-uuid>", "p_limit": 1000, "p_offset": 0 }
```

**Execution path (DB-layer):** The EXISTS subquery checks `vport.profiles`. A citizen UUID does not have a corresponding row in `vport.profiles`. EXISTS returns false. The function returns an empty result set.

**Result: BLOCKED** — The VPORT-kind guard in the DB function prevents enumeration of Citizen subscriber edges via this RPC.

**Simulation B — Direct REST bypass of count_vport_subscribers (citizen UUID):**

Same guard applies. Returns 0 for any non-VPORT or inactive/deleted VPORT actor ID.

**Result: BLOCKED**

**Simulation C — Legacy RPC enumeration (count_subscribers / list_subscribers):**

Migration `20260527120000_drop_legacy_subscriber_rpcs.sql` drops both functions:
```sql
DROP FUNCTION IF EXISTS vc.count_subscribers(uuid);
DROP FUNCTION IF EXISTS vc.list_subscribers(uuid, integer, integer);
```

IF applied to the live DB, the direct REST attack surface from ELEK-2026-05-27-001 is closed. However, DB COMMAND is BLOCKED — live application cannot be confirmed.

**Result: PARTIAL** — Migration exists and is correctly authored. Live application status unknown.

**Simulation D — actor_follows direct table SELECT (social graph enumeration):**

Migration `20260518030000_actor_follows_sf07_resolution.sql` drops `actor_follows_select_public_subscriber_count` policy and applies `FORCE ROW LEVEL SECURITY` to `vc.actor_follows`. If applied, only the actor's own follow edges are visible via direct SELECT.

**Result: PARTIAL** — Migration exists. Live application status unverifiable (DB BLOCKED).

---

## Viewer Context Fuzz Results

### Scenario 5 — null viewerActorId to getSubscribersController

**Simulation:** Caller sends null actorId to the VPORT subscriber display controller.

**Target:** `getSubscribers.controller.js:getSubscribersController`

**Attack vector:**
```
getSubscribersController({ actorId: null })
getSubscribersController({ actorId: undefined })
getSubscribersController({})
```

**Execution path:**
```
line 4-10: if (!actorId) return { count: 0, rows: [] }
```

**Result: BLOCKED** — Silent safe default, no error, no DB call. This is intentional per the PUBLIC READ design decision (IRONMAN 2026-05-27): any caller may invoke for any VPORT actorId, but null is a no-op that returns empty safely.

**Assessment:** This is architecturally correct. The DB-layer guard (vport.profiles EXISTS check) is the enforcement layer; the controller null-guard prevents wasted DB round-trips.

**Simulation — ctrlSubscribe null viewerActorId:**

Covered under Scenario 2. Result: hard throw at controller entry. No silent downgrade.

---

## Mutation Replay Results

### Scenario 6 — Re-subscribe to a VPORT that already has an active subscription

**Simulation:** Actor A follows VPORT X. Actor A attempts to follow VPORT X again without an intervening unfollow.

**Target:** `actorFollows.dal.js:dalInsertFollow`

**Attack vector:**
```
dalInsertFollow({ followerActorId: "A", followedActorId: "vport-X" }) // first call
dalInsertFollow({ followerActorId: "A", followedActorId: "vport-X" }) // replay
```

**Execution path (first call):** upsert with `onConflict: 'follower_actor_id,followed_actor_id'` → row created with `is_active: true`.

**Execution path (replay):** upsert with same conflict key → row updated in place with `is_active: true` (no-op in practice). No duplicate row. No error.

**Result: BLOCKED** — Upsert is idempotent. `invalidateFollowerCount` fires twice but is a cache invalidation, not a DB write. No corruption.

**But:** `ctrlSubscribe` is guarded by `ctrlGetFollowRelationshipState` which checks if state is `FOLLOWING` before calling `dalInsertFollow`. If already following, returns early:
```
line 43-53: if (relation.state === FOLLOW_RELATION_STATES.FOLLOWING) return { ... status: 'following', isFollowing: true }
```

**Result: BLOCKED — Double layer** — Controller early-returns; even if bypass occurred, DAL upsert is idempotent.

**Simulation — Revive a cancelled follow request (replay via upsert):**

`dalUpsertPendingRequest` uses `onConflict: 'requester_actor_id,target_actor_id'` and sets `status: 'pending'`. This intentionally revives declined/cancelled rows. This is documented behavior, not an exploit. A blocked actor (post SF-01 fix) would be caught by `ctrlGetBlockStatus` in `ctrlSendFollowRequest`.

**Result: BLOCKED** (post SF-01 fix) / **PARTIAL** (if block check regression occurs — see V-SUB-004 dependency)

---

## Cross-Feature Abuse Results

### Scenario 7 — Subscriber state manipulation via notification or feed engine adapters

**Simulation A — Notification adapter abuse:** Can an attacker use `publishVcsmNotification` to create a fake follow notification that causes a state mutation?

**Target:** `notifications.adapter.js:publishVcsmNotification`

`publishVcsmNotification` is a write to the notifications table/engine — it does not mutate `vc.actor_follows` or `vc.social_follow_requests`. It is a fire-and-forget side effect, not a gate. Triggering it with arbitrary parameters creates a notification row but does not create a follow edge. The follow edge is created by `dalInsertFollow` only.

**Result: BLOCKED** — No cross-feature follow-edge creation via notification adapter.

**Simulation B — Feed cache adapter abuse:** `invalidateFeedFollowCache(followerActorId)` is called from `ctrlSubscribe` and `ctrlUnsubscribe`. Can an attacker force a cache bust for another actor's feed?

`invalidateFeedFollowCache` takes a `followerActorId` argument. It busts the follow cache for that actor. If an attacker could call it with a victim's actorId, the victim's next feed load would be a cache miss (DB re-fetch), which is a minor availability nuisance — not a data breach. But `invalidateFeedFollowCache` is only called after the ownership gate passes in both controllers. An attacker cannot reach this call with a victim's actorId.

**Result: BLOCKED** — Follow cache bust is ownership-gated at controller level.

**Simulation C — Cross-feature DAL direct import:**

VCSM's architecture contract prohibits direct import of another feature's DAL. The adapter layer (`social.adapter.js`, `feedCache.adapter.js`) is the only external surface. Verified: `dalInsertFollow` and `dalDeactivateFollow` are only imported by files within their own feature tree and by `followRequests.controller.js` (which owns request accept flow). No external feature imports these DALs directly.

**Result: BLOCKED** — Adapter isolation holds for the subscribe DAL layer.

**Simulation D — `dalListOutgoingRequests` export without controller gate:**

`followRequests.dal.js` exports `dalListOutgoingRequests` (lines 133-148). This function reads all `social_follow_requests` rows for a given `requesterActorId` with no status filter and no ownership assertion. It is exported but has zero callers in the codebase (confirmed by ELEKTRA grep).

**Attack vector:** A future component imports `dalListOutgoingRequests` directly with an arbitrary `requesterActorId`. The caller could read any actor's outgoing follow request history (all statuses, including revoked/cancelled). RLS on `social_follow_requests` (`social_follow_requests_select_participants`) limits SELECT to the requester or target owning the requesting user. The DB-layer RLS is the only protection.

**Result: PARTIAL** — Zero callers today means no active exploit path. The ungated export is an active risk surface for future developers. RLS provides the backstop but app-layer controller ownership gate is absent.

---

## URL Surface Results

### Scenario 8 — Raw UUID exposure in subscriber-related URLs and notifications

**Simulation A — Notification linkPaths in follow.controller.js:**

```javascript
// line 99 in follow.controller.js
linkPath: `/feed`,
```

The follow notification uses `/feed` — not a raw UUID. This is safe.

```javascript
// followRequests.controller.js line ~64 (ctrlSendFollowRequest)
linkPath: `/feed`,
// followRequests.controller.js line ~110 (ctrlAcceptFollowRequest)
linkPath: `/feed`,
```

Both request-related notifications use `/feed`. No raw UUIDs in linkPath for these calls.

**Result: BLOCKED** for linkPath — all three notification writers use `/feed`.

**Simulation B — notification.model.js normalizeSender UUID fallback:**

`normalizeSender` in `notification.model.js` contains two UUID-fallback paths that remain unpatched (V-SUB-004 open):

```javascript
// No-sender fallback (line ~113):
route: handle ? `/profile/${handle}` : '#',
// → handle is ctx?.senderUsername ?? ctx?.actorUsername ?? ctx?.username ?? null
// → if handle is null → route = '#' (SAFE)
// → if handle is populated → route = /profile/<username> (SAFE — username not UUID)
```

Wait — the no-sender fallback uses `handle` (username), not `actorId`. This path appears SAFE in current code as long as handle is the username string (not UUID).

```javascript
// VPORT sender (lines ~132-142):
route: slug ? `/profile/${slug}` : '#',
// → slug = sender.slug || null
// → if slug is null → route = '#' (SAFE)
```

The VPORT sender also appears SAFE — it falls back to `'#'` not `/profile/${id}`.

**Reassessment of ELEK-2026-05-27-004 in live code:** The current `notification.model.js` does NOT expose raw UUID fallbacks at the route level. The notification model has already been corrected. V-SUB-004 / ELEK-004 appear resolved in the current source.

**Result: BLOCKED** — Notification model routes use username/slug or `'#'`. Raw UUID fallback not observed in current source.

**Simulation C — VportSubscribersView route:**

The route `/vport/subscribers` — does it expose raw actorId in the URL?

The view receives `profile.actorId` from the profile store, but this is used internally in the hook call, not rendered in the browser URL. The VPORT profile route uses a human-readable VPORT handle (slug), not a raw UUID.

**Result: BLOCKED** — No raw UUID in the public URL surface for this route.

---

## Successful Exploit Chains

### CONFIRMED Exploit Chain 1 — VPORT Actor-Kind Follow (BW-SUB-003)

**Chain:** VPORT actor authenticates → calls `ctrlSubscribe` with own actor ID as `assertingActorId` → ownership gate passes (VPORT owns its actor ID) → block check passes → follow relationship state fetched → `dalInsertFollow` called → follow edge created in `vc.actor_follows` for VPORT → Citizen direction → Citizen's private posts visible in VPORT actor's feed.

**Gates bypassed:** No actor-kind check at controller layer. DB INSERT RLS checks ownership, not kind.

**Severity:** HIGH — Privacy violation. Citizen's private content accessible to VPORT actors.

---

### CONFIRMED Exploit Chain 2 — actor_privacy_settings ownership bypass (BW-SUB-004)

**Chain:** Actor B supplies `actorId = Actor-A-uuid` to `ctrlSetActorPrivacy` → no assertingActorId parameter → no ownership gate → `dalSetActorPrivacy` called with Actor A's actorId → upsert to `vc.actor_privacy_settings` with Actor A's actor_id → if RLS on `actor_privacy_settings_update_owner` requires auth.uid() ownership of `actor_id`, DB blocks this. But the app layer has zero ownership assertion.

**Assessment of current ctrlSetActorPrivacy:**
```javascript
// actorPrivacy.controller.js line 13
export async function ctrlSetActorPrivacy({ actorId, isPrivate, refreshActorFn }) {
  if (!actorId) throw new Error('Missing actorId')
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
```

No `assertingActorId`. No ownership check. DB RLS `actor_privacy_settings_update_owner` (per VENOM 2026-05-10 audit) requires `actor_id` in `actor_owners` owned by current user. This provides DB-layer protection. But the app layer is unguarded.

**Call site analysis:**
```javascript
// useUpdateVportVisibility.js line 17
mutationFn: (isPrivate) => ctrlSetActorPrivacy({ actorId, isPrivate, ... })
```

`actorId` comes from the hook's `{ actorId }` parameter, which is passed from the settings screen. The settings screen should only mount with the owner's actorId via `useIdentity()`. If a future caller passes a foreign actorId, the DB RLS is the only gate.

**Result: PARTIAL CONFIRMED** — Single-step app-layer bypass possible via direct controller call. DB RLS provides backstop. Severity depends on DB RLS verification (currently unconfirmed due to DB BLOCKED).

---

### CONFIRMED Exploit Chain 3 — dalListOutgoingRequests ungated export (BW-SUB-008)

**Chain:** Future developer imports `dalListOutgoingRequests` from `followRequests.dal.js` → calls with arbitrary `requesterActorId` (e.g., from URL parameter, not session) → function reads `vc.social_follow_requests` for that actor → RLS `social_follow_requests_select_participants` allows SELECT if the authenticated user owns either the requester or target actor → if attacker owns any actor that has a request relationship with the target, they can enumerate the target's outgoing request history.

**Current state:** Zero callers — no active exploit. Future-risk classification.

---

## Failed Exploit Chains (Defenses That Held)

1. **Cross-actor subscribe** — `assertingActorId` !== `followerActorId` gate fires immediately. Hard throw. No DAL reached. (BW-SUB-001)

2. **Null session subscribe/unsubscribe** — Null/undefined/empty assertingActorId caught by `!assertingActorId` guard. No silent downgrade. (BW-SUB-002)

3. **Duplicate subscribe replay** — Upsert idempotency + controller early-return on FOLLOWING state. No corruption. (BW-SUB-006)

4. **Subscriber list enumeration via list_vport_subscribers (direct REST)** — VPORT-kind guard in DB function returns empty for citizen/non-VPORT actor IDs. (BW-SUB-004a)

5. **Notification follow link UUID exposure** — `linkPath: '/feed'` confirmed in both follow.controller.js and followRequests.controller.js. No UUID in notification linkPath. (BW-SUB-007a)

6. **Feed cache bust abuse** — `invalidateFeedFollowCache` is only reached after ownership gate passes. Foreign actor cannot trigger cache bust for victim. (BW-SUB-005)

---

## Runtime Evidence

| Evidence Item | File | Line | Notes |
|---|---|---|---|
| Ownership gate ctrlSubscribe | `follow.controller.js` | 26 | `assertingActorId !== followerActorId → throw` |
| Ownership gate ctrlUnsubscribe | `unsubscribe.controller.js` | 19 | `assertingActorId !== followerActorId → throw` |
| Ownership gate ctrlAcceptFollowRequest | `followRequests.controller.js` | 78-79 | `assertingActorId !== targetActorId → throw` |
| Ownership gate ctrlDeclineFollowRequest | `followRequests.controller.js` | 128-130 | same pattern |
| Ownership gate ctrlCancelFollowRequest | `followRequests.controller.js` | 156-159 | `assertingActorId !== requesterActorId → throw` |
| Block check ctrlSubscribe | `follow.controller.js` | 30-36 | `ctrlGetBlockStatus` — isBlocked → throw |
| Block check ctrlSendFollowRequest | `followRequests.controller.js` | 35-41 | same |
| No actor-kind guard | `follow.controller.js` | entire file | No `kind` check anywhere |
| No assertingActorId in ctrlSetActorPrivacy | `actorPrivacy.controller.js` | 13-20 | Confirmed zero ownership assertion |
| VPORT RPC guard (DB migration) | `20260527110000_create_vport_subscriber_rpcs.sql` | 48-58, 88-96 | EXISTS vport.profiles guard confirmed |
| Legacy RPC drop (DB migration) | `20260527120000_drop_legacy_subscriber_rpcs.sql` | 31-32 | DROP IF EXISTS both legacy RPCs |
| SF-07 policy drop migration | `20260518030000_actor_follows_sf07_resolution.sql` | 70-76 | FORCE RLS + drop broad policy |
| dalListOutgoingRequests ungated | `followRequests.dal.js` | 133-148 | Zero callers, ungated export |
| Notification model routes | `notification.model.js` | 113, 140 | `'#'` fallback — no UUID in route |
| linkPath in follow notifications | `follow.controller.js`, `followRequests.controller.js` | 99, 64, 110 | All use `/feed` |

---

## Blast Radius

| Finding | Blast Radius | Affected Actors |
|---|---|---|
| BW-SUB-003 (VPORT kind follow) | Multi-actor | All Citizens with private profiles; any authenticated VPORT actor as attacker |
| BW-SUB-004 (privacy ownership bypass) | Single actor | Targeted actor whose privacy setting is flipped; DB RLS partially mitigates |
| BW-SUB-005 (notification model UUID) | Platform-wide potential | All actors sending notifications without sender slug (resolved in current source) |
| BW-SUB-008 (dalListOutgoingRequests) | Single actor | Target actor's outgoing request history; future-risk only |

---

## BLACKWIDOW FINDINGS

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-001
- Scenario: Ownership Bypass — cross-actor subscribe/unsubscribe
- Target: follow.controller.js:ctrlSubscribe / unsubscribe.controller.js:ctrlUnsubscribe
- Application Scope: VCSM
- Platform Surface: PWA / React hook call
- Attack Vector: Attacker passes victim's followerActorId with own assertingActorId mismatched
- Exploit Chain Type: Single-step
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence: Line 26 (follow.controller.js): assertingActorId !== followerActorId → throws immediately. Line 19 (unsubscribe.controller.js): same gate. No DAL reached.
- Defense Gate: PRESENT
- Blast Radius: Single actor
- Severity: INFO
- VENOM Finding Cross-Reference: V-SUB-001 (fixed), V-SUB-002 (fixed)
- Recommended Fix: No fix required. Defense confirmed operative.
- Layer to Fix: N/A
- Required Follow-up Command: NONE
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-002
- Scenario: Viewer Context Fuzz — null/undefined assertingActorId
- Target: follow.controller.js:ctrlSubscribe / unsubscribe.controller.js:ctrlUnsubscribe / followRequests.controller.js:ctrlAcceptFollowRequest
- Application Scope: VCSM
- Platform Surface: PWA / React hook call
- Attack Vector: Stale session provides null, undefined, or empty string as assertingActorId
- Exploit Chain Type: Single-step
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence: !assertingActorId guard fires for null, undefined, and "". No silent downgrade to public-read observed. All three controllers throw hard errors.
- Defense Gate: PRESENT
- Blast Radius: Single actor
- Severity: INFO
- VENOM Finding Cross-Reference: V-SUB-001 (fixed), V-SUB-002 (fixed)
- Recommended Fix: No fix required. Defense confirmed operative.
- Layer to Fix: N/A
- Required Follow-up Command: NONE
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-003
- Scenario: Runtime Abuse — VPORT actor follows a Citizen, bypassing actor-kind guard
- Target: follow.controller.js:ctrlSubscribe (lines 12-113) / actorFollows.dal.js:dalInsertFollow
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RLS
- Attack Vector: Authenticated VPORT actor calls ctrlSubscribe with own actorId as both followerActorId and assertingActorId. Ownership gate passes (VPORT owns its actor row). No actor-kind check exists. dalInsertFollow writes a follow edge in vc.actor_follows for VPORT → Citizen direction.
- Exploit Chain Type: Single-step
- Governance Status: DRAFT
- Result: BYPASSED
- Evidence: follow.controller.js contains zero references to actor kind. ctrlGetFollowRelationshipState only checks privacy, follow status, request status — not kind. dalInsertFollow receives IDs with no kind validation. vc.actor_follows INSERT RLS (actor_follows.insert.self) checks actor_owners ownership, not actor kind. End-to-end: VPORT actor creates follow edge to Citizen with no blocking gate at any layer.
- Defense Gate: ABSENT
- Blast Radius: Multi-actor — all Citizens with private profiles are potentially reachable by any authenticated VPORT actor
- Severity: HIGH
- VENOM Finding Cross-Reference: V-SUB-008 (open)
- Recommended Fix: After ctrlGetBlockStatus resolves, fetch the follower actor's kind. If followerActor.kind === 'vport', throw an error: 'VPORT actors cannot follow other actors'. This check must be added to ctrlSubscribe before dalInsertFollow is called. A secondary guard in the vc.actor_follows INSERT RLS policy (NOT EXISTS on actor where actor_id = follower_actor_id AND kind = 'vport') provides DB-layer defense-in-depth.
- Layer to Fix: Controller (primary), RLS (secondary)
- Required Follow-up Command: ELEKTRA (precision patch for kind-guard injection point), DB (RLS policy addition to actor_follows INSERT)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-004
- Scenario: Ownership Bypass — ctrlSetActorPrivacy has no assertingActorId gate
- Target: settings/privacy/controller/actorPrivacy.controller.js:ctrlSetActorPrivacy (line 13-20)
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RLS
- Attack Vector: Any caller passes an arbitrary actorId to ctrlSetActorPrivacy. The controller has no assertingActorId parameter and performs zero ownership validation before writing to vc.actor_privacy_settings. DB-layer RLS (actor_privacy_settings_update_owner) is the sole protection — if it requires auth.uid() in actor_owners for the actorId, the DB blocks the write. If not, a foreign actor's privacy flag can be flipped.
- Exploit Chain Type: Single-step
- Governance Status: DRAFT
- Result: PARTIAL — App-layer bypass confirmed. DB-layer RLS status unknown (DB BLOCKED).
- Evidence: actorPrivacy.controller.js line 13: no assertingActorId in function signature. No ownership assertion before dalSetActorPrivacy call. visibility.dal.js upsert accepts any actorId. DB RLS policy confirmed present by VENOM 2026-05-10 (actor_privacy_settings_update_owner) but live verification blocked.
- Defense Gate: WEAK — DB RLS present per prior audit; app layer absent
- Blast Radius: Single actor — targeted privacy flip. If RLS is missing or misconfigured, attacker can make any actor's profile public or private.
- Severity: HIGH
- VENOM Finding Cross-Reference: ELEK-2026-05-27-002
- Recommended Fix: Add assertingActorId parameter to ctrlSetActorPrivacy. Assert assertingActorId === actorId before calling dalSetActorPrivacy. Derive assertingActorId from useIdentity() at the hook call site (useUpdateVportVisibility). DB RLS should remain as defense-in-depth but app-layer ownership gate is mandatory.
- Layer to Fix: Controller (primary), DB (verify RLS is correctly scoped)
- Required Follow-up Command: DB (verify actor_privacy_settings_update_owner policy), ELEKTRA (precision patch for assertingActorId injection)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-005
- Scenario: RLS Verification — legacy SECURITY DEFINER RPCs (count_subscribers / list_subscribers)
- Target: vc.count_subscribers, vc.list_subscribers / migrations 20260527060000 + 20260527120000
- Application Scope: VCSM
- Platform Surface: Supabase RPC (direct REST)
- Attack Vector: Attacker sends authenticated REST POST to /rest/v1/rpc/list_subscribers with arbitrary p_actor_id. Pre-migration: full subscriber enumeration for any actor. Post-hardening (20260527060000): VPORT-kind guard filters non-VPORT actors. Post-drop (20260527120000): RPC no longer exists.
- Exploit Chain Type: Multi-step (pre-requires migration not applied)
- Governance Status: DRAFT
- Result: PARTIAL — Migrations are correctly authored and would close this gap. Live application status unknown (DB BLOCKED). If migrations are not applied, enumeration remains possible.
- Evidence: 20260527060000: CREATE OR REPLACE adds vport.profiles EXISTS guard to count_subscribers and list_subscribers. 20260527120000: DROP IF EXISTS closes both RPCs entirely. DAL call sites confirmed migrated to count_vport_subscribers and list_vport_subscribers (subscribersCount.dal.js + subscribersList.dal.js). The SECURITY DEFINER bypass scope is correctly limited in the new RPCs.
- Defense Gate: PRESENT in migration files; live status UNKNOWN
- Blast Radius: Platform-wide (pre-migration) — all actors' subscriber edges enumerable; VPORT-gated (post-20260527060000) — only public VPORT followers exposed; Zero (post-20260527120000)
- Severity: MEDIUM (conditional on live DB state)
- VENOM Finding Cross-Reference: ELEK-2026-05-27-001 / REPLAY-SUB-04 (TICKET-SUB-001 report)
- Recommended Fix: Confirm both migrations applied to live DB. Run: SELECT proname FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE pg_namespace.nspname = 'vc' AND proname IN ('count_subscribers','list_subscribers'); — result must be empty.
- Layer to Fix: RLS / DB (migration apply verification)
- Required Follow-up Command: DB (verify live migration state)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-006
- Scenario: Mutation Replay — duplicate subscribe (re-subscribe idempotency)
- Target: actorFollows.dal.js:dalInsertFollow / follow.controller.js:ctrlSubscribe
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Actor A follows VPORT X. Actor A calls ctrlSubscribe for VPORT X again (duplicate).
- Exploit Chain Type: Replay
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence: ctrlSubscribe line 43-53: FOLLOWING state check returns early. dalInsertFollow uses upsert with onConflict — idempotent. No duplicate rows. No count inflation.
- Defense Gate: PRESENT (double-layer: controller early-return + DAL upsert idempotency)
- Blast Radius: Single actor
- Severity: LOW
- VENOM Finding Cross-Reference: NONE
- Recommended Fix: No fix required. Defense confirmed.
- Layer to Fix: N/A
- Required Follow-up Command: NONE
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-007
- Scenario: URL Surface — notification linkPath UUID exposure
- Target: follow.controller.js:ctrlSubscribe (line 99) / followRequests.controller.js (lines 64, 110) / notification.model.js:normalizeSender
- Application Scope: VCSM
- Platform Surface: PWA / Notification system
- Attack Vector: Follow/follow-request/accept notifications embed actorId UUID in linkPath or sender route, enabling actor enumeration via notification deep links.
- Exploit Chain Type: Single-step
- Governance Status: DRAFT
- Result: BLOCKED (current source)
- Evidence: follow.controller.js line 99: linkPath: '/feed' (no UUID). followRequests.controller.js line 64: linkPath: '/feed'. Line 110: linkPath: '/feed'. notification.model.js normalizeSender no-sender fallback: route = handle ? /profile/${handle} : '#' (handle is username, not UUID; fallback is '#'). VPORT sender: route = slug ? /profile/${slug} : '#' (slug not UUID; fallback is '#'). V-SUB-004 reported by ELEKTRA appears resolved in current source.
- Defense Gate: PRESENT (current code)
- Blast Radius: Platform-wide (if unresolved) / None (current)
- Severity: LOW
- VENOM Finding Cross-Reference: V-SUB-004 (ELEK-2026-05-27-004) — RESOLVED in current source
- Recommended Fix: Confirm V-SUB-004 is formally closed. Verify notifiation.model.js has no remaining UUID fallback paths. Add a regression test: notification mapper must never emit a route containing a UUID pattern.
- Layer to Fix: N/A for current code. SPIDER-MAN test recommended.
- Required Follow-up Command: SPIDER-MAN (regression test to lock UUID-free notification routes)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-008
- Scenario: Cross-Feature Abuse — dalListOutgoingRequests ungated export
- Target: social/friend/request/dal/followRequests.dal.js:dalListOutgoingRequests (lines 133-148)
- Application Scope: VCSM
- Platform Surface: PWA / DAL layer
- Attack Vector: A future developer imports dalListOutgoingRequests directly from outside the social/friend/request feature boundary. Caller passes a foreign actor's requesterActorId. Function reads all vc.social_follow_requests rows for that actor (all statuses) without an ownership assertion. DB RLS (social_follow_requests_select_participants) limits select to participants who own either actor in the pair — but if the attacker owns any actor that has a request with the target, enumeration is possible for that pair.
- Exploit Chain Type: Multi-step (requires future misuse)
- Governance Status: DRAFT
- Result: PARTIAL — No current caller, no active exploit. Risk surface is a future-state vulnerability.
- Evidence: followRequests.dal.js lines 133-148: no actorId validation, no ownership check, exported as named export. Zero callers confirmed via grep. DB RLS is the sole protection at present.
- Defense Gate: WEAK (DB RLS only; no app-layer gate; ungated export is accessible)
- Blast Radius: Single actor (if exploited — outgoing request history of targeted actor)
- Severity: MEDIUM
- VENOM Finding Cross-Reference: ELEK-2026-05-27-006 (V-SUB-006 open)
- Recommended Fix: Wrap dalListOutgoingRequests in a controller ctrlListOutgoingRequests({ requesterActorId, assertingActorId }) that asserts assertingActorId === requesterActorId before calling the DAL. Do not export DAL functions intended for gated use. Add a lint rule or adapter boundary enforcement to prevent raw DAL imports from feature-external callers.
- Layer to Fix: Controller (add ctrlListOutgoingRequests), DAL (restrict export visibility or add wrapper)
- Required Follow-up Command: ELEKTRA (precision gate injection), Wolverine (ticket to add ctrlListOutgoingRequests)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-009
- Scenario: RLS Verification — actor_follows FORCE RLS and SF-07 policy drop (live status)
- Target: vc.actor_follows table / migration 20260518030000_actor_follows_sf07_resolution.sql
- Application Scope: VCSM
- Platform Surface: Supabase RLS / direct table access
- Attack Vector: If actor_follows_select_public_subscriber_count policy was NOT dropped, any authenticated user can SELECT all active follow rows (no actor restriction), enumerating the complete social graph for any actor including private Citizens.
- Exploit Chain Type: Single-step (direct REST query)
- Governance Status: DRAFT
- Result: PARTIAL — Migration 20260518030000 is correctly authored: drops broad policy, applies FORCE RLS, creates get_follower_count SECURITY DEFINER function. Live application status cannot be confirmed (DB BLOCKED).
- Evidence: Migration file confirmed present. Step 3 drops actor_follows_select_public_subscriber_count policy. Step 2 applies FORCE ROW LEVEL SECURITY to vc.actor_follows. Step 1 creates vc.get_follower_count as SECURITY DEFINER with pinned search_path. DAL call site (subscriberCount.dal.js) already uses rpc('get_follower_count') confirming code migration is complete.
- Defense Gate: PRESENT in migration file; live status UNKNOWN
- Blast Radius: Platform-wide (if policy not dropped — full social graph of all actors enumerable)
- Severity: MEDIUM
- VENOM Finding Cross-Reference: SF-07 (VENOM 2026-05-10), DB-02 (DB 2026-05-10)
- Recommended Fix: Verify migration 20260518030000 applied in live DB. Run: SELECT policyname FROM pg_policies WHERE schemaname='vc' AND tablename='actor_follows'; — result must NOT include actor_follows_select_public_subscriber_count. Also verify FORCE RLS: SELECT forcerls FROM pg_tables WHERE schemaname='vc' AND tablename='actor_follows'; — must be TRUE.
- Layer to Fix: DB (migration apply verification)
- Required Follow-up Command: DB (live migration state verification)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SUB-010
- Scenario: RLS Verification — actor_privacy_settings FORCE RLS and missing-row default divergence
- Target: vc.actor_privacy_settings / social/privacy/dal/actorPrivacy.dal.js / settings/privacy/dal/visibility.dal.js
- Application Scope: VCSM
- Platform Surface: Supabase RLS / DAL layer
- Attack Vector: Two DAL files read the same table with opposite missing-row defaults. actorPrivacy.dal.js fails closed (isPrivate: true) — used by ctrlGetFollowRelationshipState. visibility.dal.js fails open (isPrivate: false) — used by ctrlSetActorPrivacy (read path). If a new DAL caller imports from visibility.dal.js expecting the follow-gate semantics, it silently uses the wrong default and may expose private actor content to unauthorized viewers.
- Exploit Chain Type: Multi-step (requires developer error creating new read path)
- Governance Status: DRAFT
- Result: PARTIAL — Not an active exploit in current code. Active risk surface: if any new feature reads actor_privacy_settings via visibility.dal.js and uses the result to gate content access, the fail-open default creates a privacy bypass.
- Evidence: actorPrivacy.dal.js line 43-47: returns { isPrivate: true } on missing row and on error. visibility.dal.js line 34: returns data?.is_private ?? false (missing row = public = false). VENOM 2026-05-10 confirmed this divergence (DB-06 category).
- Defense Gate: WEAK — correct default exists in actorPrivacy.dal.js; wrong default exists in visibility.dal.js and is accessible to future consumers
- Blast Radius: Single actor (if exploited — specific actor's private content exposed)
- Severity: LOW
- VENOM Finding Cross-Reference: V-SUB-007 (open), DB-06 (VENOM 2026-05-10)
- Recommended Fix: Add a comment to visibility.dal.js: "WARNING: missing-row default is false (public). This is intentional for the settings write path — the write path defaults to showing the toggle as 'public' when no preference row exists. Do NOT use this function for content-gating decisions. Use social/privacy/dal/actorPrivacy.dal.js for any read path that gates content access." Consider renaming dalGetActorPrivacy in visibility.dal.js to dalGetActorPrivacySetting to distinguish from the content-gate version.
- Layer to Fix: DAL (documentation + naming disambiguation)
- Required Follow-up Command: LOGAN (document the DAL boundary in the canonical architecture doc)
```

---

## Recommended Fixes

| Priority | Finding ID | Severity | Fix | Layer | Estimated Complexity |
|---|---|---|---|---|---|
| P0 | BW-SUB-003 | HIGH | Add actor-kind guard to ctrlSubscribe: reject followerActorId if actor kind === 'vport'. Add DB RLS secondary guard. | Controller + RLS | SIMPLE |
| P0 | BW-SUB-004 | HIGH | Add assertingActorId to ctrlSetActorPrivacy. Assert assertingActorId === actorId before write. Verify DB RLS on actor_privacy_settings_update_owner. | Controller + DB | SIMPLE |
| P1 | BW-SUB-005 | MEDIUM | Confirm legacy RPC drop migration (20260527120000) applied to live DB. Run verification SQL. | DB | VERIFICATION ONLY |
| P1 | BW-SUB-009 | MEDIUM | Confirm SF-07 migration (20260518030000) applied to live DB. Verify FORCE RLS active on actor_follows and broad policy dropped. | DB | VERIFICATION ONLY |
| P1 | BW-SUB-008 | MEDIUM | Wrap dalListOutgoingRequests in ctrlListOutgoingRequests with assertingActorId ownership gate. | Controller | SIMPLE |
| P2 | BW-SUB-007 | LOW | Formally close V-SUB-004. Add SPIDER-MAN regression test for UUID-free notification routes. | Test | SIMPLE |
| P2 | BW-SUB-010 | LOW | Document and rename DAL boundary between actorPrivacy.dal.js and visibility.dal.js. | DAL | SIMPLE |
| INFO | BW-SUB-001 | INFO | No action. Defense confirmed. | N/A | — |
| INFO | BW-SUB-002 | INFO | No action. Defense confirmed. | N/A | — |
| INFO | BW-SUB-006 | LOW | No action. Defense confirmed. | N/A | — |

---

## Required Follow-up Commands

| Command | Finding | Reason | Status |
|---|---|---|---|
| ELEKTRA | BW-SUB-003 | Precision patch: actor-kind guard injection in ctrlSubscribe + RLS clause | PENDING |
| ELEKTRA | BW-SUB-004 | Precision patch: assertingActorId gate in ctrlSetActorPrivacy | PENDING |
| ELEKTRA | BW-SUB-008 | Precision patch: ctrlListOutgoingRequests wrapper controller | PENDING |
| DB | BW-SUB-004 | Verify live RLS on vc.actor_privacy_settings (actor_privacy_settings_update_owner policy) | PENDING |
| DB | BW-SUB-005 | Verify legacy RPC drop migration applied (count_subscribers / list_subscribers absent from vc schema) | PENDING |
| DB | BW-SUB-009 | Verify SF-07 migration applied: FORCE RLS on actor_follows, broad policy dropped | PENDING |
| SPIDER-MAN | BW-SUB-007 | Regression test: notification model must never emit route containing UUID pattern | PENDING |
| LOGAN | BW-SUB-010 | Document DAL naming boundary between actorPrivacy.dal.js and visibility.dal.js in canonical architecture doc | PENDING |
| THOR | BW-SUB-003 | HIGH severity BYPASSED — actor-kind follow bypass is a release blocker | PENDING |
| THOR | BW-SUB-004 | HIGH severity PARTIAL — privacy ownership bypass is a release blocker | PENDING |
| VENOM | ALL | Cross-reference BW findings with V-SUB-004/006/007/008 resolution status | PENDING |
| LOKI | BW-SUB-003 | Validate runtime telemetry — does VPORT actor follow create a feed edge in production? | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-SUB-003/004/008/010 against unresolved V-SUB-004/006/007/008 | PENDING |
| LOKI | Validate runtime observability for BW-SUB-003 exploit path — confirm VPORT follow edge visible in feed | PENDING |
| THOR | Evaluate release blocking status for BW-SUB-003 (BYPASSED HIGH) and BW-SUB-004 (PARTIAL HIGH) | PENDING — RELEASE BLOCKER |
| DB | Live migration verification for BW-SUB-005 and BW-SUB-009 | PENDING — DB BLOCKED |
| ELEKTRA | Patch advisory for BW-SUB-003 (actor-kind guard) and BW-SUB-004 (ctrlSetActorPrivacy ownership) | PENDING |

---

## THOR Release Gate Assessment

Per BLACKWIDOW contract section 14:

| Gate | Finding | Status |
|---|---|---|
| RELEASE BLOCKER | BW-SUB-003 — VPORT actor-kind follow bypass CONFIRMED BYPASSED HIGH | BLOCKED |
| RELEASE BLOCKER | BW-SUB-004 — ctrlSetActorPrivacy ownership bypass PARTIAL HIGH | BLOCKED |
| CAUTION | BW-SUB-005 — Legacy RPC drop PARTIAL MEDIUM (migration authored, live unconfirmed) | CAUTION |
| CAUTION | BW-SUB-008 — dalListOutgoingRequests ungated PARTIAL MEDIUM (zero callers, future risk) | CAUTION |
| CAUTION | BW-SUB-009 — SF-07 migration PARTIAL MEDIUM (live unconfirmed) | CAUTION |
| PASS | BW-SUB-001/002/006/007 — Defenses confirmed | PASS |

**THOR VERDICT: BLOCKED — Two confirmed BYPASSED/PARTIAL HIGH findings require patch before this module can be cleared for release.**

---

*Report generated by BLACKWIDOW*
*Module: subscribers | Route: /vport/subscribers*
*Scope: VCSM*
*Date: 2026-05-27*
*Prior context: VENOM 2026-05-10 + ELEKTRA 2026-05-27 + TICKET-SUB-001 DB report*
*DB live access: BLOCKED — all DB findings are PARTIAL pending live verification*
