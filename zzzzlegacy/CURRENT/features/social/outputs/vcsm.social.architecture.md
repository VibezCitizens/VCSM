---
# Module Architecture Report — vcsm.social
# ARCHITECT §26.11 — Dated Immutable Module Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-SOCIAL-0001
# Feature: social
# Security Tier: MEDIUM
# Feature Status: ACTIVE
# Architecture State: EVOLVING
# Module Status: MOSTLY COMPLETE
---

## Feature Overview

The social feature owns the full actor-to-actor follow/subscription graph for the VCSM platform. It manages follow requests (for private/approval-required actors), direct follow edges (for open actors), unsubscribe flows, follower counts, social privacy policy reads, and actor social settings. It has no dedicated routes or screens — all social surfaces are embedded in profile cards, feed views, and notification flows. It coordinates with the block, notifications, feed, and identity features via adapter boundaries.

**Source Path:** apps/VCSM/src/features/social/
**Engine Path:** None — feature-only (no engine/* imports found)

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | friend/subscribe/controllers/, friend/request/controllers/, privacy/controllers/ |
| DALs | YES | friend/request/dal/, friend/subscribe/dal/, privacy/dal/ |
| Models | YES | friend/request/models/, friend/subscribe/model/ |
| Hooks | YES | friend/request/hooks/, friend/subscribe/hooks/, privacy/hooks/ |
| Screens | NO | None — social surfaces embedded in profiles and feed |
| Components | YES | components/, friend/subscribe/components/ |
| Adapters | YES | adapters/ (social.adapter.js, friend/request/hooks/, friend/subscribe/hooks/, privacy/) |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| ctrlSubscribe (follow.controller.js) | Insert or initiate a follow edge; routes to direct follow or follow request based on target privacy policy | OWNERSHIP GATE V-SUB-001: assertingActorId === followerActorId; also checks block status |
| ctrlUnsubscribe (unsubscribe.controller.js) | Deactivates follow edge + revokes any follow request; invalidates caches | OWNERSHIP GATE V-SUB-002: assertingActorId === followerActorId |
| ctrlSendFollowRequest (followRequests.controller.js) | Upserts pending follow request for private actors; idempotent; publishes follow_request notification | Implicit — block check only; no session gate (called internally by ctrlSubscribe) |
| ctrlAcceptFollowRequest (followRequests.controller.js) | Accepts pending request — inserts follow edge + marks request accepted; invalidates feed cache | OWNERSHIP GATE V-SUB-003: assertingActorId === targetActorId |
| ctrlDeclineFollowRequest (followRequests.controller.js) | Marks request declined | OWNERSHIP GATE: assertingActorId === targetActorId |
| ctrlCancelFollowRequest (followRequests.controller.js) | Requester cancels own pending request | OWNERSHIP GATE: assertingActorId === requesterActorId |
| ctrlListIncomingRequests (followRequests.controller.js) | Lists pending follow requests in target actor's inbox | OWNERSHIP GATE V-SUB-003: assertingActorId === targetActorId |
| ctrlGetFollowRequestStatus (followRequests.controller.js) | Thin read — returns request status (pending/accepted/null) | None — read only |
| ctrlGetFollowRelationshipState (getFollowRelationshipState.controller.js) | Composite read — returns full relation state (following/pending/not_following) + policy + isPrivate | None — read only |
| ctrlGetFollowStatus (getFollowStatus.controller.js) | Thin read — returns boolean follow status | None — read only |
| ctrlGetFollowerCount (getFollowerCount.controller.js) | Returns follower count for actor via RPC | None — intentional public read |
| ctrlGetActorPrivacy (getActorPrivacy.controller.js) | Returns { isPrivate } for actor | None — read only |
| ctrlInvalidateActorPrivacyCache (getActorPrivacy.controller.js) | Cache invalidation utility | None — utility |

**Note:** `ctrlSetActorPrivacy` referenced in SENTRY/ELEKTRA findings (ELEK-2026-05-27-002) as a missing controller. Not found in current source. Privacy write path may be unguarded at controller layer.

---

## Active DALs

| DAL | Tables / RPCs | Notes |
|---|---|---|
| actorFollows.dal.js | vc.actor_follows | Insert/reactivate follow edge, deactivate (unfollow), read follow status. TTL cache: 8s. |
| followRequests.dal.js | vc.social_follow_requests | Get/upsert/update/list follow requests. Explicit column selects. RLS status: UNKNOWN per DB audit. |
| subscriberCount.dal.js | RPC: vc.get_follower_count | Counts active followers per actor. TTL cache: 60s. RPC security context: UNKNOWN per DB audit. V-SUB-008: RPC may not exist in live DB. |
| actorPrivacy.dal.js | Delegates to actorSocialPublicPolicy.dal.js | Thin wrapper preserving { isPrivate } contract. Source of truth has migrated — compatibility shim. MAJOR DRIFT per SENTRY. |
| actorSocialPublicPolicy.dal.js | RPC: vc.get_actor_social_public_policy | Reads actor follow policy + visibility. TTL cache: 30s. Fail-closed default (approval_required). |
| actorSocialSettings.dal.js | vc.actor_social_settings | Owner read/write for social settings. RLS: actor_id = auth.uid() per code comments. |
| actorSignalVisibility.dal.js | RPC: vc.can_view_actor_signal | Checks if viewer can see follower_count / follower_list / following_list. No cache — viewer-dependent. |

---

## Active Hooks

| Hook | What It Calls | Purpose |
|---|---|---|
| useFollowActorToggle.js | ctrlSubscribe, ctrlUnsubscribe, ctrlCancelFollowRequest | Single toggle for follow/unfollow/cancel-request state machine |
| useFollowRequestActions.js | useIdentity (identity adapter), ctrlAcceptFollowRequest, ctrlDeclineFollowRequest | Accept/decline actions for incoming requests; pulls session actorId from identity |
| useFollowRequestStatus.js | ctrlGetFollowRequestStatus | Read status of a specific request |
| useIncomingFollowRequests.js | useIdentity (identity adapter), ctrlListIncomingRequests | Load incoming pending requests for session actor |
| useSendFollowRequest.js | ctrlSendFollowRequest | Send a follow request |
| useSocialFollowRequestOps.js | ctrlListIncomingRequests | Thin adapter-facing ops bundle |
| useSubscribeAction.js | (follow action hook) | Triggers subscribe action |
| useFollowStatus.js | ctrlGetFollowStatus | Read follow boolean |
| useFollowerCount.js | ctrlGetFollowerCount | Read follower count |
| useUnsubscribeAction.js | ctrlUnsubscribe | Triggers unsubscribe |
| useActorPrivacy.js | ctrlGetActorPrivacy | Reads isPrivate for actor; manages loading state |

Adapter re-export hooks (8): useFollowRequestActions.adapter.js, useIncomingFollowRequests.adapter.js, useSendFollowRequest.adapter.js, useSubscribeAction.adapter.js, useFollowActorToggle.adapter.js, useFollowStatus.adapter.js, useFollowerCount.adapter.js, useActorPrivacy.adapter.js

---

## Engine Dependencies

None — no imports from `engines/` found anywhere in the social feature.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction |
|---|---|---|
| block | ctrlGetBlockStatus | social → block (pre-write gate in ctrlSubscribe, ctrlSendFollowRequest) |
| notifications | publishVcsmNotification (notifications.adapter) | social → notifications (follow / follow_request / follow_request_accepted events) |
| feed | invalidateFeedFollowCache (feedCache.adapter) | social → feed (cache bust on follow edge change) |
| identity | useIdentity (identity.adapter) | social hooks → identity (session actorId in useFollowRequestActions, useIncomingFollowRequests) |
| profiles | PrivateProfileGate.adapter | PrivateProfileNotice.jsx → profiles (UI gate rendering) |

All cross-feature imports go through adapter boundaries. No direct cross-feature internal imports found.

---

## Authorization Pattern

All mutation controllers enforce `assertingActorId === [owned actor]` as a first-class ownership gate before any write:

```
if (!assertingActorId || assertingActorId !== [owned actor]) {
  throw new Error('session actor does not match [role]')
}
```

- V-SUB-001 (ctrlSubscribe): assertingActorId === followerActorId — PASS
- V-SUB-002 (ctrlUnsubscribe): assertingActorId === followerActorId — PASS
- V-SUB-003 (ctrlAcceptFollowRequest, ctrlDeclineFollowRequest): assertingActorId === targetActorId — PASS
- ctrlCancelFollowRequest: assertingActorId === requesterActorId — PASS
- ctrlListIncomingRequests: assertingActorId === targetActorId — PASS
- ctrlSetActorPrivacy: MISSING — ELEK-2026-05-27-002 HIGH OPEN

Block status is also checked in ctrlSubscribe and ctrlSendFollowRequest before any write proceeds.

---

## Module Independence Classification

**DEPENDENT**

The social feature has direct functional dependencies on four features (block, notifications, feed, identity) accessed via adapter boundaries. Cannot operate in isolation. All boundaries are properly respected.

---

## Architecture State

**EVOLVING**

Core follow/unfollow/request flows are structurally complete and ownership-gated. Known MAJOR DRIFT: privacy DAL split. Three DB unknowns unverified. Phase 0 migration ready but not applied. 17 CI tests intentionally failing. Active hardening in progress.

---

## Known Structural Risks

1. **Privacy DAL Split (MAJOR DRIFT — SENTRY):** actorPrivacy.dal.js is a shim wrapping actorSocialPublicPolicy.dal.js. Belongs in a dedicated privacy module. Creates source-of-truth confusion.

2. **ELEK-2026-05-27-002 (HIGH OPEN):** ctrlSetActorPrivacy missing — no ownership gate on the privacy settings write path. Any authenticated actor can potentially modify another actor's social settings.

3. **V-SUB-008 / get_follower_count RPC (HIGH OPEN):** vc.get_follower_count RPC unconfirmed in live DB. Follower counts return 0 for all user-kind actors until CARNAGE creates the RPC.

4. **ELEK-2026-05-27-003 (MEDIUM OPEN):** ctrlSubscribe has no actor-kind guard — VPORT can follow Citizen and gain read access to private posts.

5. **ELEK-2026-05-27-001 (HIGH OPEN):** count_subscribers/list_subscribers are SECURITY DEFINER — enable private subscriber enumeration via direct REST. Phase 0 migration 20260527060000 is ready to apply.

6. **17 CI Tests Intentionally Failing:** V-SUB-001/002/003 ownership gate tests are in CI but failing. Must be resolved before next release gate.

7. **3 DB Unknowns:** vc.actor_privacy_settings RLS, vc.social_follow_requests RLS, vc.get_follower_count security context — all unverified. Block Phase 1 RPC creation.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Feature clearly owns follow graph, privacy policy reads, social settings | None |
| Owner defined | FAIL | ownership.md states owner TBD; IRONMAN not run | Run IRONMAN |
| Entry points mapped | PASS | social.adapter.js exports useSocialFollowRequestOps; adapter hooks re-export all surfaces | social.adapter.js is thin — only exports 1 hook |
| Controllers present | PASS | 13 controller exports across 7 files | ctrlSetActorPrivacy missing (ELEK-002) |
| DAL/repository present | PASS | 7 DAL files; all tables/RPCs identified | 3 DB RPCs unverified in live DB |
| Models/transformers | PASS | followRequest.model.js, followRelationState.model.js present | None |
| Hooks/view models | PASS | 11 core hooks + 8 adapter hooks | None |
| Screens/components | PARTIAL | PrivateProfileNotice, SubscribeDebugPanel present; no dedicated screens | No dedicated route — by design |
| Authorization path mapped | PARTIAL | Mutation gates V-SUB-001/002/003 all present; ctrlSetActorPrivacy gate missing | ELEK-002 HIGH OPEN |
| Engine dependencies mapped | PASS (N/A) | No engine dependencies found | None required |
| Tests/validation noted | PARTIAL | 3 test files present; 17 tests CI-blocked | TESTS.md missing; SPIDER-MAN formal pass not run |

---

## Recommended Handoffs

- **CARNAGE** — V-SUB-008: Create vc.get_follower_count RPC in live DB. Requires Phase 0 first.
- **DB** — Verify vc.get_follower_count security context, vc.actor_privacy_settings RLS, vc.social_follow_requests RLS. Three unknowns block Phase 1.
- **VENOM** — Full pass to verify ownership gates end-to-end, especially missing ctrlSetActorPrivacy gate (ELEK-002).
- **SPIDER-MAN** — Formal test coverage audit. Resolve 17 failing CI tests. Create TESTS.md.
- **IRONMAN** — Feature ownership mapping. Owner is TBD.

---

## Final Module Status

**MOSTLY COMPLETE**

Core follow/unfollow/request graph is structurally sound and ownership-gated. Operationally functional for public actors. Three gaps prevent COMPLETE: (1) ctrlSetActorPrivacy ownership gate missing (ELEK-002 HIGH), (2) follower count broken for user-kind actors — missing DB RPC (V-SUB-008 HIGH), (3) 17 CI tests intentionally failing.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-SOCIAL-0001
- Architecture State: EVOLVING
- Module Status: MOSTLY COMPLETE
- Controller Count: 13
- DAL Count: 7
- Hook Count: 11 (core) + 8 (adapter)
- Engine Dependencies: None
- Structural Risks: 7 identified (3 HIGH, 2 MEDIUM, 2 operational)
- Recommended Next: CARNAGE (V-SUB-008) then DB verification then VENOM
