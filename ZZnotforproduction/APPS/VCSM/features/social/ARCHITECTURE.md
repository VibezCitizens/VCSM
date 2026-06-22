---
name: vcsm.social.architecture
description: ARCHITECT V2 module architecture report for VCSM:social
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** social
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/social
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The social module owns the follow/subscribe relationship graph between VCSM actors. It handles public follows (direct edge creation), private-profile follow requests (pending approval workflow), follow cancellation and unfollowing, follower count tracking, actor privacy/social-settings reads, and the social public policy that gates who can follow a given actor. It publishes follow and follow_request notifications through the notification engine and invalidates feed caches on state changes.

## OWNERSHIP

Social-graph domain. Owned by the VCSM platform engineering team. Responsible for all actor-to-actor subscription edges (vc.actor_follows), the pending-request queue (vc.social_follow_requests), actor privacy settings (vc.actor_social_settings), and the policy RPCs that determine visibility and follow eligibility.

## ENTRY POINTS

- `social.adapter.js` — public adapter surface; exports `useSocialFollowRequestOps` for cross-feature consumption
- `useFollowActorToggle` hook — consumed by profile screens and feed cards to toggle follow state
- `useFollowStatus` hook — consumed by profile headers to render subscribe/unsubscribe state
- `useFollowerCount` hook — consumed by profile stat bars
- `useIncomingFollowRequests` hook — consumed by Settings > Privacy for approval workflow
- `useActorPrivacy` hook (privacy sub-tree) — consumed by profile screens to gate content visibility

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 19 | actorFollows.dal.js, followRequests.dal.js, actorSocialSettings.dal.js, actorPrivacy.dal.js, actorSocialPublicPolicy.dal.js, actorSignalVisibility.dal.js, subscriberCount.dal.js |
| Model | 5 | followRelationState.model.js, followRequest.model.js |
| Controller | 15 | follow.controller.js, unsubscribe.controller.js, followRequests.controller.js, getFollowRelationshipState.controller.js, getFollowStatus.controller.js, getFollowerCount.controller.js, getActorPrivacy.controller.js |
| Service | N/A | — |
| Adapter | 2 | social.adapter.js, actorPrivacy.adapter.js (plus sub-adapters in adapters/friend/) |
| Hook | 13 | useFollowActorToggle.js, useFollowStatus.js, useFollowerCount.js, useIncomingFollowRequests.js, useSendFollowRequest.js, useFollowRequestActions.js, useSocialFollowRequestOps.js, useUnsubscribeAction.js, useSubscribeAction.js, useFollowRequestStatus.js, useActorPrivacy.js |
| Component | 3 | PrivateProfileNotice.jsx, SubscribeDebugPanel.jsx |
| Screen | 0 | No dedicated screens — consumed through profile and settings screens |
| Barrel | 3 | social.adapter.js + adapter sub-indices |

Counts derived from scanner callgraph data (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is PLACEHOLDER | No formal behavior contract written |
| Owner defined | PARTIAL | Domain evident from source; no OWNERSHIP record | Ownership record missing |
| Entry points mapped | PASS | social.adapter.js + 6 public hooks | Adapter exports only 1 hook — most hooks consumed by direct import |
| Controllers present/delegated | PASS | 15 controllers (cg count) | — |
| DAL/repository present/delegated | PASS | 19 DAL entries (cg count); explicit column selects enforced | console.error leaks in actorFollows.dal.js (debug logging rule violation) |
| Models/transformers present | PASS | 5 model entries; followRelationState.model.js is thorough | — |
| Hooks/view models present | PASS | 13 hooks | — |
| Screens/components present | PARTIAL | 3 components; 0 dedicated screens | Social has no standalone screens — intentional (embedded), but not documented |
| Services/adapters present | PARTIAL | adapter surface underexposes — only 1 hook exported from social.adapter.js | Most hooks accessed by direct @/ import, not through adapter |
| Database objects mapped | PASS | 8 write surfaces across vc.actor_follows, vc.social_follow_requests, vc.actor_social_settings + 3 read RPCs | — |
| Authorization path mapped | PASS | assertingActorId ownership gates on all mutating controllers; block check on follow/request | — |
| Cache/runtime behavior mapped | PASS | TTL caches in actorFollows.dal.js (8s), actorSocialSettings.dal.js (30s), actorSocialPublicPolicy.dal.js; invalidation on mutation | — |
| Error/loading/empty states mapped | PARTIAL | Error throws present in controllers; no documented empty-state UI | PrivateProfileNotice handles one gate state; others undocumented |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER | Full behavior contract required |
| Tests/validation noted | PASS | 3 test files present (follow.controller.test.js, unsubscribe.controller.test.js, followRequests.controller.test.js) | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | identity, notification, profile engines declared and used | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES | Actor resolution |
| engines/notification | engine | inbound | YES | follow + follow_request notifications published via publishVcsmNotification |
| engines/profile | engine | inbound | YES | Profile resolution for actor data |
| features/block | cross-feature | inbound via adapter | YES | ctrlGetBlockStatus called before follow and follow_request operations |
| features/notifications | cross-feature | inbound via adapter | YES | publishVcsmNotification imported from notifications.adapter.js |
| features/feed | cross-feature | inbound via adapter | YES | invalidateFeedFollowCache called on follow accept and unfollow |
| vc.actor_follows | DB write | outbound | YES | upsert (follow), update (deactivate) |
| vc.social_follow_requests | DB write | outbound | YES | upsert (pending), update (status transitions) |
| vc.actor_social_settings | DB write | outbound | YES | update (privacy settings patch) |
| vc.actor_social_settings | DB read | outbound | YES | follow_policy, account_visibility, follower counts |
| identity.search_actor_directory | RPC read | outbound | YES | via get_follower_count RPC |
| vc.get_actor_social_public_policy | RPC read | outbound | YES | policy evaluation for follow routing |
| vc.can_view_actor_signal | RPC read | outbound | YES | signal visibility gate |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actor_follows | upsert + update | social (DAL) | follow.controller.js, followRequests.controller.js | LOW — idempotent upsert; is_active soft-deactivate preserves history |
| vc.social_follow_requests | upsert + update | social (DAL) | followRequests.controller.js | MEDIUM — status transitions (pending→accepted/declined/cancelled) must be idempotent |
| vc.actor_social_settings | update | social (DAL) | actorSocialSettings.dal.js | MEDIUM — RLS restricts to actor_id = auth.uid(); VPORT path needs actor_owners gate (noted in source comment) |
| vc.get_follower_count | RPC read | social (DAL) | subscriberCount.dal.js | LOW |
| vc.can_view_actor_signal | RPC read | social (DAL) | actorSignalVisibility.dal.js | LOW |
| vc.get_actor_social_public_policy | RPC read | social (DAL) | actorSocialPublicPolicy.dal.js | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | EMBEDDED | No dedicated routes; consumed via profile/settings screens | Low risk — intentional design |
| Loading state | PARTIAL | Hooks use async/await; no standardized loading state shape observed | Callers must manage loading state |
| Empty state | PARTIAL | PrivateProfileNotice component handles private-profile gate; other empty states not documented | |
| Error state | PARTIAL | Controllers throw with descriptive messages; hook error handling delegated to callers | |
| Auth/owner gates | PASS | assertingActorId checks on all mutating operations; block check before follow and request; inbox ownership gate on ctrlListIncomingRequests | |
| Cache behavior | PASS | TTL caches (8s follow status, 30s social settings); explicit invalidation on write | |
| Runtime dependencies | PASS | identity, notification, profile engines + block, notifications, feed cross-feature adapters | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/social/BEHAVIOR.md | PRESENT (PLACEHOLDER — needs content) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No formal contract for follow states, privacy routing, or request lifecycle | LOGAN |
| social.adapter.js underexposes public surface | MEDIUM | Only exports useSocialFollowRequestOps; hooks like useFollowStatus, useFollowerCount, useFollowActorToggle are accessed via direct @/ imports by other features, bypassing the adapter boundary | ARCHITECT / IRONMAN |
| console.error calls in DAL files | LOW | Violates debug logging rule (no console.log/error in production code; debug output must be dev-only on screen) | Engineering |
| No CURRENT_STATUS.md | LOW | Missing in docs folder prior to this run | ARCHITECT (this run) |
| VPORT actor social settings mutation path | MEDIUM | Source comment in actorSocialSettings.dal.js notes VPORT updates need actor_owners gate via ctrlUpdateVportSocialSettings — no such controller found in static scan | VENOM / IRONMAN |
| No dedicated screen — undocumented design decision | LOW | Social is always embedded; this should be explicitly stated in BEHAVIOR.md | LOGAN |

---

## MODULE BOUNDARY WARNINGS

1. **Adapter underexposure:** `features/profile`, `features/feed`, and other features import hooks directly from `@/features/social/friend/subscribe/hooks/` and `@/features/social/friend/request/hooks/` instead of going through `social.adapter.js`. The adapter only exports one hook (`useSocialFollowRequestOps`). This is a soft boundary violation — direct internal imports bypass the adapter contract defined in VCSM CLAUDE.md.

2. **Cross-feature adapter imports inside controllers:** `follow.controller.js` and `followRequests.controller.js` import from `@/features/notifications/adapters/notifications.adapter` and `@/features/feed/adapters/feedCache.adapter` and `@/features/block` — these are approved cross-feature adapter imports, not raw internal imports, so they are compliant.

3. **No boundary violations in the DB layer** — all writes are scoped to vc schema tables owned by this module; no writes into other features' tables detected.

---

## SPAGHETTI SCORE

**Module:** social
**Score:** WATCH
**Reasons:** Adapter surface underexposes the public hook API, causing direct internal imports from other features. Sub-directory structure is deep (friend/request/, friend/subscribe/, privacy/) with per-sub-path adapters that duplicate the top-level adapter pattern. Controller count (15) is healthy but the adapter only re-exports 1 hook.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no meaningful content

**Check A (Source without behavior):** FAIL — source exists and is substantial; BEHAVIOR.md is a placeholder with no documented behavior
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no declared happy paths to check against source
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines: identity, notification, profile; source confirms notification engine (publishVcsmNotification), identity engine (actor resolution), profile engine (profile reads). No BEHAVIOR.md §13 to compare against.
**Check D (§6 data change consistency):** PARTIAL — scanner write surfaces match DAL reads: vc.actor_follows (upsert+update), vc.social_follow_requests (upsert+update), vc.actor_social_settings (update) + 3 RPCs. No BEHAVIOR.md §6 to compare against.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md — replace placeholder with full contract | Only governance gap blocking this module from COMPLETE status | LOGAN |
| P2 | Expand social.adapter.js to expose all public hooks | Direct internal imports from other features are an active boundary violation risk | IRONMAN |
| P3 | Verify/create ctrlUpdateVportSocialSettings with actor_owners gate | Source comment flags a VPORT mutation path that may be unguarded | VENOM |
| P4 | Remove console.error calls from DAL files (replace with dev-only debug pattern) | Violates project debug logging rules | Engineering |

## RECOMMENDED HANDOFFS

- **LOGAN** — write the BEHAVIOR.md contract (follow state machine, privacy routing, request lifecycle)
- **IRONMAN** — audit adapter surface and mandate hook exports through social.adapter.js
- **VENOM** — verify VPORT actor social settings mutation path has actor_owners gate
- **SENTRY** — confirm RLS on vc.actor_social_settings for VPORT actors specifically

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
