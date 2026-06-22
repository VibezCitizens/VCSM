# FALCON Native Parity Report — Subscriber / Follow Architecture

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** FALCON
**Trigger:** Logan COMMAND EVIDENCE REGISTRY — MISSING (subscriber/follow architecture review session)
**Final Falcon Status:** BLOCKED — NO NATIVE APP EXISTS

---

## FALCON NATIVE PARITY REPORT

Application Scope: VCSM
Module: Subscriber / Follow System (Citizens and VPORTs)
PWA Blueprint: `apps/VCSM/src/features/social/friend/subscribe/` + `features/social/friend/request/`
Native Area: iOS (Falcon) / Android (Winter Soldier)
Transfer Classification: BLOCKED — NO NATIVE CODEBASE
Native Release Status: BLOCKED

---

## Native App Status

```
NATIVE APP STATUS: DOES NOT EXIST

Investigation performed:
- Searched for Swift, Kotlin, Objective-C, .xcodeproj, .kt, .m files in /Users/vcsm/Desktop/VCSM/
- Result: 0 files found

apps/VCSM/src/app/platform/ios/ contains:
- IOSDebugHUD.jsx
- IOSProdRouteDebugger.jsx
- IosInstallPrompt.jsx
- IosInstallSteps.jsx
- useIOSPlatform.js  (adds iOS CSS marker classes to <html>)
- useIOSKeyboard.js  (keyboard height handling for chat)
- ios.css            (safe area variables, keyboard offset)
- ios.env.js         (isIOS(), isIOSPWA() detection)

These are PWA-layer iOS adaptations (install flow, keyboard handling, safe area CSS).
They are NOT a native iOS app. No React Native, Capacitor, or Expo project exists.

FALCON cannot perform a parity diff when no native implementation exists.
FALCON's role in this session is to document the PWA blueprint so that when
a native app is built, these parity requirements are pre-established.
```

---

## PWA Blueprint — Subscribe / Follow System

This section is the canonical reference for native iOS (and Android via Winter Soldier) to match when building the subscribe/follow feature.

### State Machine

```
NOT_FOLLOWING
  ↓ subscribe (public actor)
FOLLOWING

NOT_FOLLOWING
  ↓ subscribe (private actor)
REQUEST_PENDING
  ↓ target accepts
FOLLOWING
  ↓ target declines / requester cancels
NOT_FOLLOWING

FOLLOWING
  ↓ unsubscribe
NOT_FOLLOWING
```

Source: `features/social/friend/subscribe/model/followRelationState.model.js`

### Subscribe Button Labels (i18n keys)

| State | Label Key |
|---|---|
| NOT_FOLLOWING | `profile.actions.subscribe` |
| REQUEST_PENDING | `profile.actions.requested` |
| FOLLOWING | `profile.actions.unsubscribe` |

Button disabled when:
- `actionActorId` is null (not logged in)
- `targetActorId` is null
- `actionActorId === targetActorId` (self-follow guard)
- `effectiveRequestStatus === 'pending'`

Source: `features/social/friend/request/hooks/useSubscribeAction.js:50-54`

### Controller Ownership Gates

All write controllers enforce `assertingActorId` at the controller layer:

| Controller | Gate | Pattern |
|---|---|---|
| ctrlSubscribe | V-SUB-001 | `assertingActorId === followerActorId` |
| ctrlUnsubscribe | V-SUB-002 | `assertingActorId === followerActorId` |
| ctrlAcceptFollowRequest | V-SUB-003 | `assertingActorId === targetActorId` |
| ctrlDeclineFollowRequest | V-SUB-003 | `assertingActorId === targetActorId` |
| ctrlCancelFollowRequest | V-SUB-003 | `assertingActorId === requesterActorId` |
| getSubscribersController | NONE | Intentional public read (IRONMAN decision) |

Native MUST source `assertingActorId` from the authenticated session — never from a URL param, route param, or passed argument from the UI.

### Privacy Flow

- Before inserting a follow edge, `ctrlSubscribe` checks target actor's `isPrivate` via `ctrlGetFollowRelationshipState` → `ctrlGetActorPrivacy`
- If `isPrivate === true` → sends follow request via `ctrlSendFollowRequest` instead of direct insert
- Privacy default (when no row exists): fail-closed (`isPrivate: true`) — treat actor as private

Native MUST replicate this flow. Never insert a follow edge directly for a private actor.

### Cache Invalidation Contract

When a follow edge is created or destroyed, the following caches MUST be invalidated:
1. `followStatusCache` (8s TTL) — per `follower:followed` pair key
2. `followerCountCache` (60s TTL) — by `followedActorId`
3. `feedFollowCache` (60s TTL) — by `followerActorId` — PRIVACY CRITICAL

The `feedFollowCache` invalidation determines whether the follower can see private posts from the followed actor. This MUST fire on every follow edge change in any native implementation.

Source:
- `features/social/friend/subscribe/controllers/follow.controller.js:89-91`
- `features/social/friend/subscribe/controllers/unsubscribe.controller.js:33-35`

### Notification Deep Link

Follow notification `linkPath: '/feed'` — navigate to main feed, not to actor's profile.
This is intentional (V-SUB-005 verified): no raw UUID is exposed in notification routing.

Native notification tap for `kind: 'follow'` → navigate to feed (not to `/profile/{actorId}`).

### Pending Follow Requests (Settings/Privacy)

PWA surface: `features/settings/privacy/ui/PendingFollowRequests.jsx`
Location: Settings → Privacy tab
Data: `useIncomingFollowRequests(actorId)` → calls `ctrlListIncomingFollowRequests` → `dalListIncomingPendingRequests`
Actions: Accept (ctrlAcceptFollowRequest with V-SUB-003) / Decline (ctrlDeclineFollowRequest with V-SUB-003)

Native MUST expose this flow in a Settings/Privacy equivalent surface.
Accept and Decline must carry `assertingActorId` from session.

### Subscriber List (VPORT Profile)

PWA surface: `features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`
Visibility: Owner-gated — `useSubscribers` is only enabled when `isOwner && ownerActorId`
Routes built: `/vport/{handle}` for VPORT actors, `/u/{handle}` for Citizens — NEVER raw UUID
Fallback when no handle: navigate to `/feed`

---

## NATIVE MODULE COMPLETENESS

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Screens | BLOCKED | No native screens exist | Subscribe button, subscriber list, pending requests |
| View models/hooks | BLOCKED | No native hooks exist | useSubscribeAction, usePendingFollowRequestActions |
| Controllers/services | BLOCKED | No native controllers exist | All 5 write controllers + getSubscribers |
| DTO/data mapping | BLOCKED | No native DTO mapping | followRelationState model, buildSubscriberActor mapper |
| Supabase/RPC integration | BLOCKED | No native RPC calls | actor_follows upsert/update, list_subscribers, get_follower_count |
| Loading states | BLOCKED | No native UI | Subscribe button loading, request list loading |
| Empty states | BLOCKED | No native UI | No subscribers, no pending requests |
| Error states | BLOCKED | No native UI | Permission denied (42501), follow failed |
| Moderation states | BLOCKED | No native UI | Cannot follow blocked actor (must replicate ctrlGetBlockStatus check) |
| Owner states | BLOCKED | No native UI | Owner-gated subscriber list |
| Booking states | N/A | Not applicable | Subscribe/follow is not booking-related |
| Cache/runtime handling | BLOCKED | No native cache | feedFollowCache invalidation is PRIVACY CRITICAL |
| Feature gates | BLOCKED | No native gating | Self-follow guard, pending state disable |
| Deep links | BLOCKED | No native routing | Follow notification → feed |
| Documentation | PARTIAL | Logan doc exists | `vcsm.social.subscribe-architecture.md` — parity notes present |
| Runtime testing notes | MISSING | No native runtime | No LOKI/KRAVEN native data |

---

## NATIVE DRIFT FINDINGS

```
NATIVE DRIFT FINDING
Drift Type: BLOCKED — native does not exist
PWA Behavior: Full subscribe/follow state machine with ownership gates, privacy routing,
              cache invalidation, and notification delivery
Native Behavior: NOT IMPLEMENTED
Risk: All PWA behavior must be replicated when native is built.
      The most critical invariants are:
      1. assertingActorId must come from session, not passed from UI
      2. feedFollowCache invalidation must fire on every follow edge change
      3. Private actor follow must route to request flow, not direct insert
      4. Notification tap must navigate to feed, not to raw actor UUID
Severity: N/A (no native app to drift from)
Recommended correction: Build against this PWA blueprint when native is implemented.
```

---

## NATIVE TRUST BOUNDARY WARNINGS

```
NATIVE TRUST BOUNDARY WARNING
Location: Future native subscribe controller
PWA enforcement: assertingActorId === followerActorId verified in ctrlSubscribe at controller layer
Native enforcement: NOT YET BUILT
Risk: If native passes actorId from route params or navigation state instead of session,
      ownership gate fails silently. CRITICAL to source assertingActorId from session only.
Severity: CRITICAL (pre-emptive) — must be enforced before native is shipped
Recommended correction: Native subscribe service must pull assertingActorId from the
                         authenticated session object, not from navigation props.
```

```
NATIVE TRUST BOUNDARY WARNING
Location: Future native privacy toggle (ctrlSetActorPrivacy equivalent)
PWA enforcement: MISSING — ctrlSetActorPrivacy has no assertingActorId gate (SENT-001)
Native enforcement: NOT YET BUILT
Risk: PWA already has this gap. Native must NOT replicate it.
      The native implementation should implement the gate that PWA is missing.
Severity: HIGH — do not copy the PWA gap into native
Recommended correction: When building native ctrlSetActorPrivacy equivalent,
                         include assertingActorId === actorId gate from the start.
```

---

## NATIVE RUNTIME PARITY REVIEW

| Runtime Area | PWA | Native | Drift | Severity |
|---|---|---|---|---|
| Subscribe toggle | Implemented | NOT BUILT | BLOCKED | N/A |
| Follow request send | Implemented | NOT BUILT | BLOCKED | N/A |
| Follow request accept/decline | Implemented | NOT BUILT | BLOCKED | N/A |
| Pending requests list | Implemented | NOT BUILT | BLOCKED | N/A |
| Subscriber count | Implemented | NOT BUILT | BLOCKED | N/A |
| Subscriber list | Implemented | NOT BUILT | BLOCKED | N/A |
| feedFollowCache invalidation | Implemented | NOT BUILT | BLOCKED | CRITICAL when built |
| Notification routing | /feed (no UUID) | NOT BUILT | BLOCKED | HIGH when built |

---

## NATIVE OWNERSHIP MAP

| Area | PWA Owner | Native Owner | Shared Engine | Risk |
|---|---|---|---|---|
| Subscribe controller | features/social/friend/subscribe | NOT ASSIGNED | None | Needs owner before native build |
| Follow request controller | features/social/friend/request | NOT ASSIGNED | None | Needs owner before native build |
| Privacy read DAL | features/social/privacy/dal + features/settings/privacy/dal | NOT ASSIGNED | None | DAL split must be resolved (SENT-002) before native |
| Subscriber list controller | features/profiles/kinds/vport | NOT ASSIGNED | None | Owner-gated read — needs owner |

---

## NATIVE PRIORITY MATRIX

| Priority | Module | Gap | Reason | Owner |
|---|---|---|---|---|
| P0 | feedFollowCache invalidation | Must fire on every follow edge change | Privacy-critical: controls private post visibility | Not assigned |
| P0 | assertingActorId gate in subscribe service | Must come from session | Ownership enforcement — not replicable from UI | Not assigned |
| P1 | Subscribe state machine | Full 3-state machine (not_following/pending/following) | Core UX and trust signal | Not assigned |
| P1 | Private actor follow request flow | Route to request, not direct insert | Privacy-critical | Not assigned |
| P1 | Pending requests (Settings/Privacy) | Full accept/decline flow with V-SUB-003 | Operational — private actors can't function without it | Not assigned |
| P2 | Subscriber list (VPORT profile) | Owner-gated, handle-based routes only | UX completeness | Not assigned |
| P2 | Notification routing | linkPath → feed (no raw UUID) | Identity surface contract | Not assigned |
| P3 | Follow count display | 60s TTL with invalidation | UX accuracy | Not assigned |

---

## NATIVE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vcsm/social/vcsm.social.subscribe-architecture.md` | PRESENT |
| SENTRY review | `audits/compliance/2026-05-27_00-00_sentry_subscriber-follow-architecture.md` | PRESENT |
| ELEKTRA review | `audits/security/2026-05-27_00-00_elektra_subscriber-follow-architecture.md` | PRESENT |
| DB review | `audits/security/2026-05-27_00-01_db_subscriber-follow-architecture.md` | BLOCKED |
| VENOM review | N/A | MISSING |
| THOR release gate | N/A | NOT RUN |
| Runtime audit (LOKI) | N/A | NOT RUN |
| Performance audit (KRAVEN) | N/A | NOT RUN |
| Ownership record (IRONMAN) | N/A | PARTIAL — IRONMAN decision on getSubscribersController documented in Logan |
| Engine audit | N/A | No engine modified |

---

## NATIVE RELEASE GATE

| Module | Status | Blocking Risk | Required Follow-Up |
|---|---|---|---|
| Subscribe/Follow — iOS | BLOCKED | No native codebase | Build from PWA blueprint |
| Subscribe/Follow — Android | BLOCKED | No native codebase | Winter Soldier after Falcon |

---

## SENTRY PARITY REVIEW

Required: YES — when native subscribe controllers are built
Scope: Native controller layer (subscribe, unsubscribe, followRequest, setActorPrivacy)
Timing: Post-implementation before native release gate
Reason: Native controllers must enforce same ownership gates as PWA — SENTRY must verify

---

## FINAL FALCON STATUS: BLOCKED — NO NATIVE APP EXISTS

No parity drift can be measured because no native codebase exists.
This report serves as the canonical PWA blueprint that native must match when built.

---

## FALCON → WINTER SOLDIER HANDOFF

Module: Subscriber / Follow System
PWA Blueprint: As documented above — state machine, ownership gates, cache contract, notification routing
Transfer Classification: BLOCKED — NO NATIVE CODEBASE
Known Drift Areas: None yet (no native implementation to diff against)
Trust-Boundary Risks:
  - assertingActorId must come from session (not UI props) in native subscribe service
  - feedFollowCache invalidation is privacy-critical — must fire on every follow edge change
  - Privacy controller (ctrlSetActorPrivacy) has a known ownership gate gap in PWA (SENT-001) — do not replicate in native
Runtime Risks: feedFollowCache is silent — no error if invalidation misses; private posts may leak
Booking Risks: N/A — subscribe/follow is not booking-gated
Lifecycle Risks: Private actor state — incorrect routing leads to direct insert bypassing request flow
Ownership Risks: getSubscribersController intentionally has no gate (public read) — must replicate this intentional design in native
Required Android Follow-Up: Winter Soldier must produce Android parity report against this same PWA blueprint
Recommended Priority: P0 for cache invalidation + assertingActorId gate; P1 for full state machine
Related Governance Reports: SENTRY SENT-001 (privacy controller gap), ELEKTRA ELEK-002 (same gap, security chain)

---

## WINTER SOLDIER HANDOFF STATUS: GENERATED

---

NEXT STEP — WINTER SOLDIER REQUIRED

Falcon has completed iOS parity review (PWA blueprint documented; no native iOS app exists yet).
Android parity review must now begin.

Run: `/WinterSoldier`
Input: Use the FALCON → WINTER SOLDIER HANDOFF section above as context.

Winter Soldier will consume Falcon findings as canonical parity evidence for Android transfer.
Android is also NOT YET BUILT — Winter Soldier should produce the same pre-emptive blueprint
documentation for Android-specific considerations.
