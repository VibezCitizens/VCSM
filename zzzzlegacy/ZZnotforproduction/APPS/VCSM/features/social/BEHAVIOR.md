---
name: vcsm.social.behavior
description: Feature-level behavior contract for the VCSM social feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — social
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The social feature owns the follow/subscribe relationship graph between VCSM actors. It handles:
- Public follows (direct edge creation between actors)
- Private-profile follow requests (pending approval workflow)
- Follow cancellation and unfollowing
- Follower count tracking
- Actor privacy and social-settings reads and writes
- The social public policy that gates who can follow a given actor

It publishes follow and follow_request notifications through the notification engine and invalidates feed caches on state changes.

**Domain:** Social-graph domain. Owned by the VCSM platform engineering team.
**Database scope:** Responsible for all actor-to-actor subscription edges (vc.actor_follows), the pending-request queue (vc.social_follow_requests), actor privacy settings (vc.actor_social_settings), and the policy RPCs that determine visibility and follow eligibility.

Source: ARCHITECTURE.md §PURPOSE, CURRENT_STATUS.md

---

## §2 Entry Points

The social feature exposes the following public entry points. Social has no dedicated screens — all functionality is embedded in profile and settings screens (by design, undocumented prior to this contract).

| Entry Point | Type | Consumer |
|---|---|---|
| `social.adapter.js` | Public adapter surface | Cross-feature consumption — exports `useSocialFollowRequestOps` |
| `useFollowActorToggle` | Hook | Profile screens and feed cards (direct @/ import) |
| `useFollowStatus` | Hook | Profile headers (direct @/ import) |
| `useFollowerCount` | Hook | Profile stat bars (direct @/ import) |
| `useIncomingFollowRequests` | Hook | Settings > Privacy — approval workflow (direct @/ import) |
| `useActorPrivacy` (privacy sub-tree) | Hook | Profile screens — gates content visibility (direct @/ import) |

**Note:** The public adapter surface underexposes the hook API. Only `useSocialFollowRequestOps` is exported from `social.adapter.js`. All other hooks are consumed via direct internal `@/features/social/...` imports from other features, bypassing the adapter boundary. This is a documented architecture gap (ARCHITECTURE.md §BOUNDARY WARNINGS, §MODULE MISSING PIECES).

Source: ARCHITECTURE.md §ENTRY POINTS, §MODULE BOUNDARY WARNINGS, INDEX.md

---

## §3 User Flows

### 3.1 Follow a Public Actor
1. Viewer calls `useFollowActorToggle` or `useSubscribeAction` from a profile screen or feed card.
2. The hook calls `ctrlSubscribe` with `followerActorId`, `followedActorId`, and `assertingActorId`.
3. Controller checks block status before proceeding.
4. Controller enforces ownership gate: `assertingActorId === followerActorId`.
5. On pass: `dalInsertFollow` upserts a row into `vc.actor_follows`.
6. A follow notification is published via `publishVcsmNotification` with `linkPath: '/feed'`.
7. Feed cache is invalidated via `invalidateFeedFollowCache`.

Source: ARCHITECTURE.md §MODULE DATA CONTRACT, SECURITY.md (BW-SOCIAL-001 exploit trace), Venom output §7 VEN-SOCIAL-002 rationale

### 3.2 Send a Follow Request to a Private Actor
1. Viewer calls `useSendFollowRequest` from a profile gate screen.
2. The hook calls `ctrlSendFollowRequest` with `requesterActorId` and `targetActorId`.
3. Controller validates both IDs are non-null and that requester !== target.
4. Controller checks block status.
5. Controller checks existing request status — returns early if request is already `pending` or `accepted` (idempotent).
6. `dalUpsertPendingRequest` upserts a row into `vc.social_follow_requests` with status `pending`.
7. A follow_request notification is published with `linkPath: '/feed'`.

**SECURITY NOTE:** As of 2026-06-04, `ctrlSendFollowRequest` has no `assertingActorId` ownership gate. Any authenticated actor can spoof `requesterActorId` (VEN-SOCIAL-002, BW-SOCIAL-001 — THOR BLOCKER).

Source: ARCHITECTURE.md §MODULE DATA CONTRACT, Venom output §7 VEN-SOCIAL-002, BlackWidow output §6.A

### 3.3 Accept or Decline an Incoming Follow Request
1. Target actor views Settings > Privacy via `useIncomingFollowRequests`, which calls `ctrlListIncomingRequests`.
2. Controller enforces ownership gate: `assertingActorId === targetActorId` (rejects when null).
3. Actor calls `useFollowRequestActions` to accept or decline.
4. The hook derives `sessionActorId` from `useIdentity()` (session-bound, not from props).
5. `ctrlAcceptFollowRequest` enforces `assertingActorId === targetActorId`; on pass, updates request status to `accepted` and creates a follow edge via `dalInsertFollow`.
6. A follow_request_accepted notification is published with `linkPath: '/feed'`.
7. Feed cache is invalidated.
8. `ctrlDeclineFollowRequest` enforces the same ownership gate; updates status to `declined`; no follow edge created.

Source: ARCHITECTURE.md §MODULE DATA CONTRACT, BlackWidow output §6.A, §6.B

### 3.4 Cancel a Sent Follow Request
1. Requester calls `useFollowActorToggle`, which calls `ctrlCancelFollowRequest`.
2. Controller enforces `assertingActorId === requesterActorId`.
3. `dalUpdateRequestStatus` updates request status to `cancelled`.

Source: BlackWidow output §4.3, INDEX.md §Write Surface Map

### 3.5 Unfollow an Actor
1. Viewer calls `useFollowActorToggle` or `useUnsubscribeAction`.
2. Hook calls `ctrlUnsubscribe` with `followerActorId`, `followedActorId`, and `assertingActorId`.
3. Controller enforces `assertingActorId === followerActorId`.
4. `dalDeactivateFollow` soft-deactivates the follow edge: sets `is_active = false` (history preserved).
5. Feed cache is invalidated via `invalidateFeedFollowCache`.

**NOTE:** `dalDeactivateFollow` applies no precondition check on current `is_active` state — replaying unfollow on an already-inactive edge causes unnecessary cache invalidations (BW-SOCIAL-008).

Source: BlackWidow output §6.F, ARCHITECTURE.md §MODULE DATA CONTRACT

### 3.6 Update Actor Social/Privacy Settings
1. Actor navigates to Settings > Privacy.
2. Actor calls the relevant settings controller (user actor path or VPORT actor path).
3. For VPORT actors: `ctrlUpdateVportSocialSettings` applies an `ALLOWED_PATCH_KEYS` allowlist at the controller layer, then calls `assertActorOwnsVportActorController` before `dalUpdateActorSocialSettings`.
4. For user actors: `dalUpdateActorSocialSettings` is called directly. The DAL accepts an open patch with no column allowlist at the DAL layer (VEN-SOCIAL-003 / BW-SOCIAL-005 — THOR BLOCKER).
5. RLS on `vc.actor_social_settings` is documented in DAL comment as restricting to `actor_id = auth.uid()` — but this claim is unverified from DB (BW-SOCIAL-007 UNRESOLVED).

Source: Venom output §7 VEN-SOCIAL-003, BlackWidow output §6.C, modules/privacy/BEHAVIOR.md

---

## §4 Business Rules

| Rule | Evidence |
|---|---|
| An actor must check block status before creating a follow edge or sending a follow request. Block check is called before `dalInsertFollow` and before `dalUpsertPendingRequest`. | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH (features/block dependency); Venom output §4 Surfaces by Boundary |
| Follow requests to a public actor create a direct follow edge (no pending queue). | ARCHITECTURE.md §PURPOSE |
| Follow requests to a private actor enter the `pending` state in `vc.social_follow_requests` and require target actor approval. | ARCHITECTURE.md §PURPOSE |
| Follow request send is idempotent — if a `pending` or `accepted` request already exists, `ctrlSendFollowRequest` returns early without re-inserting. | BlackWidow output §6.F |
| Follow request accept is idempotent — if request status is not `pending`, `ctrlAcceptFollowRequest` returns false without re-inserting the follow edge. | BlackWidow output §6.F |
| Actor kind (user vs. VPORT) is NOT restricted on follow operations — VPORTs can follow profiles by design. No actor kind firewall on `ctrlSendFollowRequest`. | BlackWidow output §6.C (BW-SOCIAL-004 INFO/BLOCKED by design) |
| Follower count is served from a public RPC (`get_follower_count`) — no authentication required. | ARCHITECTURE.md §MODULE DATA CONTRACT; Venom output §4 |
| Social public policy evaluation uses a public RPC (`get_actor_social_public_policy`) — no authentication required. | ARCHITECTURE.md §MODULE DATA CONTRACT; Venom output §4 |
| Signal visibility gate uses a public RPC (`can_view_actor_signal`) — viewer may be null. | Venom output §4 |
| Follow edges are soft-deleted — `is_active = false` preserves history; hard deletes are not used. | ARCHITECTURE.md §MODULE DATA CONTRACT (vc.actor_follows: "is_active soft-deactivate preserves history") |
| Notification `linkPath` for follow, follow_request, and follow_request_accepted notifications must be `/feed` — raw actor UUID must never appear in linkPath. | SECURITY.md (VEN-SOCIAL-004); BlackWidow output §6.H (BW-SOCIAL-010 BLOCKED) |
| All social write operations publish notifications through the notification engine adapter (`publishVcsmNotification`), not through direct notification table writes. | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| Feed cache is invalidated on follow accept and unfollow via `invalidateFeedFollowCache` (feed cross-feature adapter). | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |

---

## §5 State Rules

### Follow Relationship State Machine (vc.actor_follows)

| State | Description | Transition In | Transition Out |
|---|---|---|---|
| Active follow edge | `is_active = true` row exists | `dalInsertFollow` (upsert) | `dalDeactivateFollow` (sets `is_active = false`) |
| Inactive follow edge | `is_active = false` row exists (history preserved) | `dalDeactivateFollow` | `dalInsertFollow` (re-upsert to re-follow) |
| No edge | Row does not exist | — | `dalInsertFollow` creates it |

Source: ARCHITECTURE.md §MODULE DATA CONTRACT; BlackWidow output §6.F

### Follow Request State Machine (vc.social_follow_requests)

| State | Description | Transition In | Transition Out |
|---|---|---|---|
| `pending` | Request sent, awaiting target response | `dalUpsertPendingRequest` | `accepted`, `declined`, or `cancelled` |
| `accepted` | Target accepted; follow edge created | `ctrlAcceptFollowRequest` → `dalUpdateRequestStatus` + `dalInsertFollow` | — (terminal) |
| `declined` | Target declined; no follow edge | `ctrlDeclineFollowRequest` → `dalUpdateRequestStatus` | — (terminal) |
| `cancelled` | Requester cancelled before target responded | `ctrlCancelFollowRequest` → `dalUpdateRequestStatus` | — (terminal) |

**Note:** `dalUpdateRequestStatus` enforces a status value allowlist in the DAL (verified safe per Venom output §8).

Source: ARCHITECTURE.md §MODULE DATA CONTRACT (MEDIUM risk — status transitions must be idempotent); BlackWidow output §6.F

### Cache State

| Cache | TTL | Invalidation Trigger |
|---|---|---|
| Follow status (actor_follows) | 8 seconds | On `dalInsertFollow` or `dalDeactivateFollow` write |
| Social settings (actor_social_settings) | 30 seconds | On `dalUpdateActorSocialSettings` write (returns updated row) |
| Social public policy | Present (TTL not specified in governance) | On mutation (not explicitly documented) |

Source: ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (Cache/runtime behavior mapped: PASS)

---

## §6 Security Constraints

All constraints are derived from VENOM and BlackWidow findings, which imply what must be true for each surface to be safe.

| Constraint | Evidence |
|---|---|
| CONSTRAINT: `ctrlSubscribe` must enforce `assertingActorId === followerActorId` before `dalInsertFollow`. — Evidence: VEN-SOCIAL-002 / BW-SOCIAL-001 describe the absence of this gate on `ctrlSendFollowRequest`; `ctrlSubscribe` was verified safe with this gate present. | Venom output §8 (ctrlSubscribe VERIFIED_SAFE); VEN-SOCIAL-002 |
| CONSTRAINT: `ctrlSendFollowRequest` must enforce `assertingActorId === requesterActorId` before `dalUpsertPendingRequest`. Currently ABSENT — THOR BLOCKER. | VEN-SOCIAL-002, BW-SOCIAL-001 (BYPASSED) |
| CONSTRAINT: `ctrlListIncomingRequests` must enforce `assertingActorId === targetActorId` before returning any pending request rows. | VEN-SOCIAL-001; Venom output §7 VEN-SOCIAL-001; BlackWidow output §6.E (BLOCKED) |
| CONSTRAINT: `ctrlAcceptFollowRequest` must enforce `assertingActorId === targetActorId`. | BlackWidow output §6.E (BLOCKED) |
| CONSTRAINT: `ctrlDeclineFollowRequest` must enforce `assertingActorId === targetActorId`. | BlackWidow output §6.E (BLOCKED) |
| CONSTRAINT: `ctrlCancelFollowRequest` must enforce `assertingActorId === requesterActorId`. | BlackWidow output §6.E (BLOCKED) |
| CONSTRAINT: `ctrlUnsubscribe` must enforce `assertingActorId === followerActorId`. | Venom output §8 (ctrlUnsubscribe VERIFIED_SAFE) |
| CONSTRAINT: `dalUpdateActorSocialSettings` must only accept patch keys from an approved column allowlist. Currently ABSENT at DAL layer — THOR BLOCKER. | VEN-SOCIAL-003, BW-SOCIAL-005 (BYPASSED) |
| CONSTRAINT: `ctrlUpdateVportSocialSettings` must enforce `assertActorOwnsVportActorController` before calling `dalUpdateActorSocialSettings`. | Venom output §8 (vportSocialSettings.controller.js VERIFIED_SAFE) |
| CONSTRAINT: Notification `linkPath` for all follow-related notifications must be `/feed` — never a raw UUID path. | VEN-SOCIAL-004; BW-SOCIAL-010 (currently BLOCKED/safe) |
| CONSTRAINT: `console.error` calls in DAL and hook files must be wrapped in `import.meta.env.DEV` guards before production. Currently ABSENT on two call sites. | VEN-SOCIAL-005 |
| CONSTRAINT: RLS on `vc.actor_follows` must restrict INSERT/UPDATE to the authenticated session actor as follower_actor_id. Unverified — THOR BLOCKER. | BW-SOCIAL-006 (UNRESOLVED) |
| CONSTRAINT: RLS on `vc.social_follow_requests` must restrict SELECT to `target_actor_id = auth.uid()`. Unverified. | VEN-SOCIAL-001; Venom output §7 VEN-SOCIAL-001 |
| CONSTRAINT: RLS on `vc.actor_social_settings` must restrict UPDATE to `actor_id = auth.uid()`. Documented in DAL comment only — unverified from DB. | BW-SOCIAL-007 (UNRESOLVED) |
| CONSTRAINT: All block status checks must precede follow edge creation and follow request upsert. | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH (features/block inbound via adapter) |
| CONSTRAINT: Actor IDs must never appear in public-facing URLs. Social notifications satisfy this in current code (`linkPath: '/feed'`). | Platform memory rule (feedback_no_raw_ids_in_urls.md); VEN-SOCIAL-004 |

---

## §7 Error Handling

Documented error states derivable from governance artifacts:

| Error Condition | Response | Source |
|---|---|---|
| `ctrlSubscribe`: `assertingActorId` is null or does not match `followerActorId` | Throws `'session actor does not match follower'` | BlackWidow output §6.E |
| `ctrlUnsubscribe`: `assertingActorId` is null or does not match `followerActorId` | Throws `'session actor does not match follower'` | BlackWidow output §6.E |
| `ctrlSendFollowRequest`: `requesterActorId` or `targetActorId` is null/undefined | Throws `'Missing actor ids'` | BlackWidow output §6.E |
| `ctrlSendFollowRequest`: `requesterActorId === targetActorId` | Early return / validation error (self-follow blocked) | BlackWidow output §6.A (source trace) |
| `ctrlListIncomingRequests`: `assertingActorId` is null or does not match `targetActorId` | Throws `'session actor does not own this inbox'` | BlackWidow output §6.E |
| `ctrlAcceptFollowRequest`: `assertingActorId` is null or does not match `targetActorId` | Throws (ownership gate) | BlackWidow output §6.E |
| `ctrlDeclineFollowRequest`: same | Throws (ownership gate) | BlackWidow output §6.E |
| `ctrlCancelFollowRequest`: same | Throws (ownership gate) | BlackWidow output §6.E |
| `ctrlAcceptFollowRequest`: request status is not `pending` | Returns `false` without re-inserting follow edge | BlackWidow output §6.F |
| `ctrlSendFollowRequest`: request already `pending` or `accepted` | Returns early — idempotent, no re-insert | BlackWidow output §6.F |
| Private profile gate (viewer lacks follow approval) | `PrivateProfileNotice` component rendered | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| Other empty states (non-private-profile gate) | UNKNOWN — not documented in governance artifacts | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX (empty state PARTIAL) |
| Hook-level error handling (non-ownership errors) | Delegated to callers — no standardized error shape documented | ARCHITECTURE.md §MODULE RUNTIME READINESS |

---

## §8 Cross-Feature Dependencies

| Dependency | Direction | Boundary | Role |
|---|---|---|---|
| `engines/identity` | Inbound (social consumes) | Approved engine boundary | Actor resolution — `useIdentity()` provides session-bound `actorId` to hooks |
| `engines/notification` | Inbound (social consumes) | Approved engine boundary | `publishVcsmNotification` called by `follow.controller.js` and `followRequests.controller.js` for all notification events |
| `engines/profile` | Inbound (social consumes) | Approved engine boundary | Profile resolution for actor data display |
| `features/block` | Inbound via adapter | Approved cross-feature adapter | `ctrlGetBlockStatus` called before follow and follow_request operations |
| `features/notifications` | Inbound via adapter | Approved cross-feature adapter | `publishVcsmNotification` imported from `notifications.adapter.js` |
| `features/feed` | Inbound via adapter | Approved cross-feature adapter | `invalidateFeedFollowCache` called on follow accept and unfollow |

**Independence status:** MOSTLY INDEPENDENT — all cross-feature calls go through approved adapters. No boundary violations in the DB layer.

Source: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH, CURRENT_STATUS.md

---

## §9 Must Never Happen — Security Invariants

Each invariant is derived from a confirmed or suspected exploit in the VENOM/BlackWidow governance record.

| Invariant | Status | Violated By |
|---|---|---|
| INVARIANT: An actor must never be able to send a follow request impersonating another actor (spoofed `requesterActorId`). | CURRENTLY VIOLABLE — BW-SOCIAL-001 BYPASSED | VEN-SOCIAL-002, BW-SOCIAL-001 |
| INVARIANT: An actor must never be able to write arbitrary column values to `vc.actor_social_settings` via unconstrained patch. | CURRENTLY VIOLABLE — BW-SOCIAL-005 BYPASSED | VEN-SOCIAL-003, BW-SOCIAL-005 |
| INVARIANT: An actor must never be able to read another actor's incoming follow request inbox. | Currently BLOCKED at controller layer; RLS unverified | VEN-SOCIAL-001 (regression test status uncertain), BW-SOCIAL-006 (UNRESOLVED RLS) |
| INVARIANT: An actor must never be able to accept or decline a follow request that does not belong to their inbox (`assertingActorId !== targetActorId`). | BLOCKED | BW-SOCIAL-001 inferred invariant I-3 |
| INVARIANT: An actor must never be able to force-unfollow another actor (i.e., deactivate a follow edge where they are not the follower). | PARTIALLY BLOCKED — caller-trust dependent on `useFollowActorToggle` and `useSubscribeAction`; ownership gate at controller layer is structurally present but self-signed from hook input | BW-SOCIAL-002, BW-SOCIAL-003 |
| INVARIANT: Notification linkPath must never contain a raw actor UUID — must always use a slug-based or fixed route. | CURRENTLY SAFE (`/feed`); regression risk documented | VEN-SOCIAL-004 (regression risk), BW-SOCIAL-010 (currently BLOCKED) |
| INVARIANT: Actor IDs must never be logged to the browser console in production (outside DEV guard). | CURRENTLY VIOLATED on two call sites | VEN-SOCIAL-005 |
| INVARIANT: Follow edge insertion must be scoped to the authenticated session's actor as follower — RLS must enforce this at DB layer. | UNRESOLVED — RLS on `vc.actor_follows` not verified | BW-SOCIAL-006 |
| INVARIANT: Actor social settings update must be scoped to the authenticated session's actor — RLS must enforce `actor_id = auth.uid()`. | UNRESOLVED — RLS on `vc.actor_social_settings` unverified from DB | BW-SOCIAL-007 |

---

## §10 Module Responsibilities

The social feature is organized into the following sub-modules, derived from the layer map and source inventory.

### 10.1 Module: follow (friend/subscribe sub-tree)

**Responsibility:** Manages direct follow edge creation and deactivation. Owns `vc.actor_follows` write surfaces (`dalInsertFollow`, `dalDeactivateFollow`). Provides follower count reads via `subscriberCount.dal.js`. Exposes `useFollowActorToggle`, `useFollowStatus`, `useFollowerCount`, `useUnsubscribeAction`, `useSubscribeAction` hooks.

**Module BEHAVIOR.md status:** STUB — expected behaviors listed as UNVERIFIED. Key gap: `ctrlSendFollowRequest` has no `assertingActorId` gate (BW-SOCIAL-001 BYPASSED). RLS on `vc.actor_follows` unverified (BW-SOCIAL-006 UNRESOLVED).

Source: modules/follow/BEHAVIOR.md, ARCHITECTURE.md §LAYER MAP

### 10.2 Module: request (friend/request sub-tree)

**Responsibility:** Manages the follow request lifecycle for private-profile actors. Owns `vc.social_follow_requests` write surfaces (`dalUpsertPendingRequest`, `dalUpdateRequestStatus`). Also participates in `vc.actor_follows` writes via accept path. Exposes `useSendFollowRequest`, `useFollowRequestActions`, `useFollowRequestStatus`, `useSocialFollowRequestOps`, `useIncomingFollowRequests` hooks.

**Module BEHAVIOR.md status:** No separate BEHAVIOR.md found for the request sub-module. Covered partially under modules/follow/BEHAVIOR.md.

Source: ARCHITECTURE.md §LAYER MAP, INDEX.md §Source Inventory

### 10.3 Module: privacy

**Responsibility:** Manages actor privacy settings and visibility policy. Owns `vc.actor_social_settings` write surface (`dalUpdateActorSocialSettings`). Provides read RPCs: `get_actor_social_public_policy`, `can_view_actor_signal`. Exposes `useActorPrivacy` hook. Renders `PrivateProfileNotice` component for private-profile gate state.

**Module BEHAVIOR.md status:** STUB — behaviors listed as UNVERIFIED. Key gap: `dalUpdateActorSocialSettings` has no DAL-layer column allowlist (BW-SOCIAL-005 BYPASSED). RLS on `vc.actor_social_settings` unverified (BW-SOCIAL-007 UNRESOLVED).

Source: modules/privacy/BEHAVIOR.md, ARCHITECTURE.md §LAYER MAP

### 10.4 Adapter layer

**Responsibility:** `social.adapter.js` is the public barrel for cross-feature consumption. Currently exports only `useSocialFollowRequestOps`. Other hooks (`useFollowStatus`, `useFollowerCount`, `useFollowActorToggle`, etc.) are accessed via direct internal `@/features/social/...` imports from other features — a documented boundary gap.

Source: ARCHITECTURE.md §MODULE BOUNDARY WARNINGS, §MODULE MISSING PIECES

---

## §11 Known Gaps

### UNKNOWN or unproven behavior sections

1. **§3 User flows — exact privacy routing logic:** The governance artifacts describe the routing rule (public actor → direct follow; private actor → follow request queue) but the specific policy evaluation steps (how `get_actor_social_public_policy` return value maps to routing decisions) are not documented in governance artifacts. UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

2. **§7 Error handling — non-ownership hook error states:** Hook-level error handling (network errors, DB failures in non-ownership paths) is not documented. Governance states only that controllers throw with descriptive messages and callers must manage loading state. UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

3. **§7 Error handling — empty states beyond PrivateProfileNotice:** Only the private-profile gate state is documented (via `PrivateProfileNotice` component). Other empty states (no followers, no follow requests, etc.) are not documented in governance artifacts. UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

4. **§5 State rules — social public policy cache TTL:** The exact TTL for `actorSocialPublicPolicy.dal.js` cache is not specified in governance artifacts. UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

### Missing governance artifacts

- **OWNERSHIP.md:** Not present. No formal ownership record exists for this feature. (ARCHITECTURE.md §MODULE COMPLETENESS MATRIX: Owner defined PARTIAL)
- **TESTS.md:** Not present. Test coverage is partially documented in INDEX.md (3 test files) and SECURITY.md (regression test IDs), but no formal test governance file exists.
- **Security audit (ELEKTRA):** ELEKTRA has never run on this feature (`ELEKTRA Status: NOT RUN` in SECURITY.md). No patch proposals exist.
- **Runtime audit:** Missing (ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- **Performance audit:** Missing (ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- **Migration audit:** Missing (ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- **Engine audit:** Missing (ARCHITECTURE.md §MODULE GOVERNANCE LINKS)
- **Module BEHAVIOR.md — request sub-module:** No BEHAVIOR.md exists for the request sub-module specifically.

### Open THOR blockers (full list in §13)

- VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003, BW-SOCIAL-001, BW-SOCIAL-005, BW-SOCIAL-006, MISSING_BEHAVIOR_CONTRACT (resolved by this file)

### Architecture gaps

- `social.adapter.js` underexposes public hook API — direct internal imports from other features bypass adapter boundary. (ARCHITECTURE.md §MODULE MISSING PIECES P2)
- `ctrlUpdateVportSocialSettings` path: source comment in DAL notes VPORT updates need `actor_owners` gate — this controller was not found in static scan. (ARCHITECTURE.md §MODULE MISSING PIECES P3)
- `console.error` calls in DAL files not wrapped in DEV guard (VEN-SOCIAL-005, ARCHITECTURE.md §MODULE MISSING PIECES P4)

---

## §12 Validation Sources

| File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/social/CURRENT_STATUS.md` | READ | Architecture state: STABLE. Independence: MOSTLY INDEPENDENT. Module status: MOSTLY COMPLETE. Spaghetti score: WATCH. Top gap: BEHAVIOR.md placeholder. Recommended handoffs: LOGAN, IRONMAN, VENOM, SENTRY. Last run: 2026-06-04. |
| `ZZnotforproduction/APPS/VCSM/features/social/SECURITY.md` | READ | Highest severity: HIGH. THOR Release Blocker: YES. 7 blockers: VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003, BW-SOCIAL-001, BW-SOCIAL-005, BW-SOCIAL-006, MISSING_BEHAVIOR_CONTRACT. VENOM: 0 CRITICAL / 3 HIGH / 1 MEDIUM / 1 LOW. ELEKTRA: NOT RUN. BlackWidow: 0 CRITICAL / 3 HIGH / 2 MEDIUM / 2 LOW / 3 INFO. |
| `ZZnotforproduction/APPS/VCSM/features/social/ARCHITECTURE.md` | READ | Purpose, entry points, layer map (19 DAL / 15 controllers / 13 hooks / 5 models / 3 components / 2 adapters), dependency graph, data contract, runtime readiness, boundary warnings, completeness matrix, missing pieces, spaghetti score. Scanner freshness: FRESH (2026-06-04). |
| `ZZnotforproduction/APPS/VCSM/features/social/INDEX.md` | READ | Source inventory (44 total files), write surface map (8 surfaces), security-sensitive surfaces, engine dependencies, route count (0 routes — embedded). |
| `ZZnotforproduction/APPS/VCSM/features/social/modules/follow/BEHAVIOR.md` | READ | STUB status. Expected behaviors UNVERIFIED. Key invariants: follow insert scoped to authenticated actor (NOT confirmed — BW-SOCIAL-006 UNRESOLVED); follow request sent by authenticated actor (NOT enforced — BW-SOCIAL-001 BYPASSED). |
| `ZZnotforproduction/APPS/VCSM/features/social/modules/privacy/BEHAVIOR.md` | READ | STUB status. Expected behaviors UNVERIFIED. Key gap: DAL accepts arbitrary patch (BW-SOCIAL-007 unverified). |
| `ZZnotforproduction/APPS/VCSM/features/social/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_social-security-review.md` | READ | Full VENOM V2 report: 5 findings (VEN-SOCIAL-001 through VEN-SOCIAL-005 + MISSING_BEHAVIOR_CONTRACT). Full source verification table. Trust boundary surfaces. THOR impact table. Mitigation plan. |
| `ZZnotforproduction/APPS/VCSM/features/social/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_social-adversarial-review.md` | READ | Full BW V2 report: 10 findings (BW-SOCIAL-001 through BW-SOCIAL-010). 2 BYPASSED exploit chains confirmed (BW-SOCIAL-001, BW-SOCIAL-005). 2 UNRESOLVED (BW-SOCIAL-006, BW-SOCIAL-007). Adversarial path analysis across 6 attack categories. §9 invariant attack map. SPIDER-MAN test requirements (SP-SOCIAL-001 through SP-SOCIAL-008). |
| `ZZnotforproduction/APPS/VCSM/features/social/OWNERSHIP.md` | MISSING | File does not exist. |
| `ZZnotforproduction/APPS/VCSM/features/social/TESTS.md` | MISSING | File does not exist. |

---

## §13 THOR Release Status

**THOR Release Blocker: YES**

Exact text from SECURITY.md:
> THOR Release Blocker: YES — VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003, BW-SOCIAL-001, BW-SOCIAL-005, BW-SOCIAL-006, MISSING_BEHAVIOR_CONTRACT

**Note on MISSING_BEHAVIOR_CONTRACT:** This blocker is resolved by the authoring of this BEHAVIOR.md file (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001). The remaining 6 blockers require engineering remediation.

### Active THOR Blockers

| Blocker ID | Type | Severity | Description | Required Action |
|---|---|---|---|---|
| VEN-SOCIAL-001 | VENOM | HIGH | `ctrlListIncomingRequests` V-SUB-003 regression tests marked WILL FAIL; RLS on `vc.social_follow_requests` unverified | Run V-SUB-003 regression tests (SPIDER-MAN); verify RLS on `social_follow_requests` (DB) |
| VEN-SOCIAL-002 | VENOM | HIGH | `ctrlSendFollowRequest` has no `assertingActorId` ownership gate — any actor can spoof `requesterActorId` | Add `assertingActorId` gate to `ctrlSendFollowRequest` (ELEKTRA patch); add regression test (SPIDER-MAN) |
| VEN-SOCIAL-003 | VENOM | HIGH | `dalUpdateActorSocialSettings` accepts open patch with no DAL-layer column allowlist | Add `ALLOWED_PATCH_KEYS` allowlist to DAL (ELEKTRA patch); verify RLS column restrictions (DB) |
| BW-SOCIAL-001 | BlackWidow | HIGH | BYPASSED: confirms VEN-SOCIAL-002 — spoofed follow request confirmed active | Same as VEN-SOCIAL-002 |
| BW-SOCIAL-005 | BlackWidow | HIGH | BYPASSED: confirms VEN-SOCIAL-003 — DAL column allowlist absent, controller-layer allowlist bypassable | Same as VEN-SOCIAL-003 |
| BW-SOCIAL-006 | BlackWidow | HIGH | UNRESOLVED: RLS on `vc.actor_follows` not verified — controller ownership gates are the only barrier | DB audit of `vc.actor_follows` RLS required |
| MISSING_BEHAVIOR_CONTRACT | Governance | HIGH | BEHAVIOR.md was a 9-line placeholder — no §5 Security Rules or §9 Must Never Happen defined | **RESOLVED** — this document replaces the placeholder |

### Non-Blocking Open Findings (must track)

| Finding ID | Severity | Description |
|---|---|---|
| VEN-SOCIAL-004 | MEDIUM | Notification linkPath UUID regression risk — currently safe but test CI enforcement not confirmed |
| BW-SOCIAL-002 | MEDIUM | `useFollowActorToggle` assertingActorId is caller-trust-dependent, not session-bound |
| BW-SOCIAL-007 | MEDIUM | RLS on `vc.actor_social_settings` relies on unverified DAL comment claim |
| VEN-SOCIAL-005 | LOW | Unguarded `console.error` in `dalInsertFollow` and `useSubscribeAction` logs actor IDs in production |
| BW-SOCIAL-003 | LOW | `useSubscribeAction` viewerActorId from prop — UI disabled guard is not a security invariant |
| BW-SOCIAL-008 | LOW | `dalDeactivateFollow` has no precondition on `is_active` — replay unsubscribe causes unnecessary cache invalidations |

### Required SPIDER-MAN Tests Before THOR Clearance

Per BlackWidow output §13 (SP-SOCIAL-001 through SP-SOCIAL-008):

| Test ID | Coverage Target | Finding |
|---|---|---|
| SP-SOCIAL-001 | `ctrlSendFollowRequest` throws when `assertingActorId !== requesterActorId` | BW-SOCIAL-001 |
| SP-SOCIAL-002 | `ctrlSendFollowRequest` throws when `assertingActorId` is null | BW-SOCIAL-001 |
| SP-SOCIAL-003 | `dalUpdateActorSocialSettings` rejects patch with unknown keys | BW-SOCIAL-005 |
| SP-SOCIAL-004 | `useFollowActorToggle` binds `assertingActorId` from session, not input param | BW-SOCIAL-002 |
| SP-SOCIAL-005 | RLS on `vc.actor_follows` verified — actor cannot insert follow edge for another actor | BW-SOCIAL-006 |
| SP-SOCIAL-006 | RLS on `vc.actor_social_settings` verified — update blocked for non-owning actor | BW-SOCIAL-007 |
| SP-SOCIAL-007 | `ctrlUnsubscribe` regression block (V-SUB-002) passes | VEN-SOCIAL-001 |
| SP-SOCIAL-008 | `ctrlSubscribe` V-SUB-001 regression block passes | VEN-SOCIAL-001 |
