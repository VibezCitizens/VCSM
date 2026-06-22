# VCSM — Subscriber / Follow Architecture

## 1 Purpose

Defines the intended product and security model for the subscriber/follow system across the global actor model.

This document captures the architecture review conducted on 2026-05-27 from live code. It is the canonical reference for:
- what "subscriber" means in VCSM
- which actor pairs are allowed to follow each other
- what is publicly visible
- which RPCs are safe and how
- what the open gaps are before launch

---

## 2 Scope

Application Scope: VCSM
Code Roots: `apps/VCSM/src/features/social/friend/`, `apps/VCSM/src/features/profiles/kinds/vport/`
Related docs:
- `vcsm.profiles.subscribe-pipeline.md` — runtime flow trace, ownership gates, change log
- `vcsm.profiles.social-pipeline.md` — profile system context
- `vcsm.moderation.block-pipeline.md` — block ↔ follow interaction

---

## 3 Ownership

Application Scope: VCSM
Code Roots:
- `features/social/friend/subscribe/` — follow/unfollow controllers, hooks, DAL
- `features/social/friend/request/` — follow request controllers, hooks, DAL
- `features/social/privacy/` — actor privacy settings
- `features/profiles/kinds/vport/` — VPORT subscriber count/list display
Related Engines: notifications engine (publishVcsmNotification)
Primary Tables: `vc.actor_follows`, `vc.social_follow_requests`, `vc.actor_privacy_settings`

---

## 4 What "Subscriber" Means

In VCSM, "subscriber" is the public-facing UI label for what is technically a "follow" in the database.

- DB layer: `vc.actor_follows` — actor-global follow edges (any actor → any actor)
- UI layer: "Subscribe" / "Unsubscribe" buttons — appear on profile pages
- Product layer: Citizen follows a VPORT = "subscribes" to the business as a trust/discovery signal

The system conflates two semantic layers:
- **Social follow** — Citizen → Citizen, for feed visibility and social graph
- **Business subscriber** — Citizen → VPORT, for trust signal and discovery

Both use the same `vc.actor_follows` table and the same `ctrlSubscribe` controller. There is no schema-level distinction between them. The only difference is in the UI surface (subscriber count on VPORT profiles vs. follower count on citizen profiles).

---

## 5 Actor Relationship Matrix

The product-intended follow rules as of 2026-05-27 architecture review:

| Follower Actor | Followed Actor | Allowed? | Publicly Visible? | Requires Approval? | Notes |
|---|---|---|---|---|---|
| Citizen → VPORT | VPORT | YES | Count: yes. List: yes (public VPORT) / no (private VPORT) | Only if VPORT is private | Primary use case. `VportSubscribersView` renders this. |
| Citizen → Citizen | Citizen | YES (DB-capable, no UI) | No public count or list UI exists | Only if citizen is private | Social graph active for feed visibility. No subscriber product for citizens yet. |
| VPORT → Citizen | Citizen | YES | No public list UI exists | Only if citizen is private | Allowed — VPORT discovery, B2B social graph. No UI surface yet. |
| VPORT → VPORT | VPORT | YES | No public list UI exists | Only if target VPORT is private | Allowed — B2B connections. No UI surface yet. |
| System/Admin → Actor | Any | Out of scope | N/A | N/A | No app-layer path exists. |

**Note:** All actor-kind combinations are permitted by the follow system. `ctrlSubscribe` enforces ownership (V-SUB-001) and block status only. No actor-kind restriction exists. TICKET-SUB-005 closed — product decision 2026-05-27.

---

## 6 Entry Points

Controllers:
- `ctrlSubscribe` — `features/social/friend/subscribe/controllers/follow.controller.js`
- `ctrlUnsubscribe` — `features/social/friend/subscribe/controllers/unsubscribe.controller.js`
- `ctrlSendFollowRequest` — `features/social/friend/request/controllers/followRequests.controller.js`
- `ctrlAcceptFollowRequest` — same file
- `ctrlDeclineFollowRequest` — same file
- `ctrlCancelFollowRequest` — same file
- `ctrlListIncomingRequests` — same file
- `getSubscribersController` — `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`

Hooks:
- `useSubscribeAction` — primary profile page subscribe button
- `useFollowActorToggle` — toggle hook used by feed actions
- `useFollowerCount` — follower count display
- `useSubscribers` — VPORT subscriber list (public read)
- `useIncomingFollowRequests` — target actor's pending request inbox

Screens:
- `VportSubscribersView` — VPORT profile subscribers tab (public, no auth check)
- `PendingFollowRequests` — settings privacy page (owner-gated)
- `FollowNotificationItem` — notification inbox follow item
- `FollowRequestItem` — notification inbox request item with Accept/Decline

---

## 7 Data Flow

### Public follow (Citizen → VPORT, public profile)

```
useSubscribeAction (hook)
  → ctrlSubscribe (controller)
    → guard: missing IDs
    → guard: self-follow
    → 🔒 V-SUB-001 ownership gate: assertingActorId === followerActorId
    → ctrlGetBlockStatus (bidirectional)
    → ctrlGetFollowRelationshipState
      → ctrlGetActorPrivacy → vc.actor_privacy_settings
      → ctrlGetFollowStatus → vc.actor_follows
      → ctrlGetFollowRequestStatus → vc.social_follow_requests
    → if already following: short-circuit return
    → dalInsertFollow → vc.actor_follows (upsert)
    → invalidateFollowerCount(followedActorId)
    → invalidateFeedFollowCache(followerActorId)
    → publishVcsmNotification(kind='follow', linkPath='/feed')
```

### Private follow request

```
ctrlSubscribe detects isPrivate: true
  → ctrlSendFollowRequest
    → ctrlGetBlockStatus (independent guard)
    → dalUpsertPendingRequest → vc.social_follow_requests
    → publishVcsmNotification(kind='follow_request', linkPath='/feed')
```

### View VPORT subscriber list (public read)

```
VportSubscribersView (component)
  → useSubscribers(actorId) — no viewer ID, no auth check
    → getSubscribersController({ actorId }) — no ownership gate (INTENTIONAL — public read)
      → dalCountVportSubscribers(actorId) → count_vport_subscribers RPC (SECURITY DEFINER)
      → dalListVportSubscribers({ actorId }) → list_vport_subscribers RPC (SECURITY DEFINER)
```

IRONMAN decision (2026-05-27): Public read is intentional for VPORT profiles. Subscriber count and list are social proof for public business VPORTs. See subscribe-pipeline.md change log.

Exception: private VPORTs should not expose subscriber list. TICKET-SUB-002 tracks the missing privacy guard.

---

## 8 Source of Truth

| Signal | Table / RPC | Cache TTL |
|---|---|---|
| Follow edge (active) | `vc.actor_follows.is_active` | 8s (followStatusCache) |
| Follow request status | `vc.social_follow_requests.status` | None (always fresh) |
| Privacy flag | `vc.actor_privacy_settings.is_private` | 30s (privacyCache) |
| VPORT subscriber count | RPC `count_vport_subscribers` | 60s (subCountCache) |
| General follower count | RPC `get_follower_count` | 60s (followerCountCache) |
| Feed follow graph | `vc.actor_follows` (batch) | 60s (feedFollowCache) |

---

## 9 RPC Architecture

### Current RPCs

| RPC | Called From | Scope | SECURITY DEFINER? |
|---|---|---|---|
| `count_vport_subscribers` | `features/profiles/kinds/vport/dal/subscribersCount.dal.js` | VPORT-scoped — returns 0 for non-VPORT actors | YES — created 2026-05-27 (TICKET-SUB-001) |
| `list_vport_subscribers` | `features/profiles/kinds/vport/dal/subscribersList.dal.js` | VPORT-scoped — returns empty for non-VPORT actors | YES — created 2026-05-27 (TICKET-SUB-001) |
| `get_follower_count` | `features/social/friend/subscribe/dal/subscriberCount.dal.js` | Actor-global | YES — confirmed live DB 2026-05-27 |

`count_vport_subscribers` and `list_vport_subscribers` are SECURITY DEFINER. They include a `vport.profiles` visibility guard — both return 0 / empty if the actor is not an active, non-deleted VPORT. They bypass RLS on `actor_follows`. The remaining app-layer gap is the privacy check for private VPORTs — tracked by TICKET-SUB-002.

`get_follower_count` is also SECURITY DEFINER (confirmed live DB 2026-05-27) with no visibility guard. It is not called from the VPORT subscriber path.

### Previously Dropped RPCs

| RPC | Status | Replaced By |
|---|---|---|
| `count_subscribers` | DROPPED 2026-05-27 (20260527120000) | `count_vport_subscribers` |
| `list_subscribers` | DROPPED 2026-05-27 (20260527120000) | `list_vport_subscribers` |

### DAL Naming Collision — PARTIALLY RESOLVED

The VPORT DAL side of the collision is resolved. The social DAL side retains the old name pending TICKET-SUB-006.

| File | Export | RPC | Argument | Status |
|---|---|---|---|---|
| `features/profiles/kinds/vport/dal/subscribersCount.dal.js` | `dalCountVportSubscribers` | `count_vport_subscribers` | positional: `(actorId)` | RESOLVED |
| `features/social/friend/subscribe/dal/subscriberCount.dal.js` | `dalCountSubscribers` | `get_follower_count` | named: `({ actorId })` | TICKET-SUB-006 open |

### Canonical RPC Architecture (implemented 2026-05-27)

```
count_vport_subscribers(p_actor_id)  ← VPORT subscriber count UI (public, visibility-guarded)
list_vport_subscribers(p_actor_id)   ← VPORT subscriber list UI (public, visibility-guarded)
get_follower_count(p_actor_id)       ← internal follow graph, not a public VPORT UI signal
```

---

## 10 Visibility Model

### Current visibility rules

| Signal | Who sees it | Gate |
|---|---|---|
| VPORT subscriber count | Anyone visiting VPORT profile | None — public |
| VPORT subscriber list | Anyone visiting VPORT profile | None — public. TICKET-SUB-002: should require public-profile check |
| Citizen follower count | Header only — `useFollowerCount` | Rendered on profile, no visibility check |
| Citizen follow list | No UI surface exists | N/A |
| Incoming follow requests | Target actor only | V-SUB-003 ownership gate in controller |
| Outgoing follow requests | No current UI surface | `dalListOutgoingRequests` exists, no controller gate. TICKET-SUB-008. |
| Follow button | Any authenticated actor except self | `useSubscribeAction` — disabled if `actionActorId === targetActorId` |

### Recommended launch visibility rules

- Citizen → VPORT follow: public count only. List visible on public VPORT profiles.
- Private VPORT profiles: count and list hidden from non-owners.
- Citizen → Citizen follow: count and list private until citizen profile product ships.
- VPORT → Citizen follows: disabled. No UI. Kind guard in controller.
- VPORT → VPORT follows: disabled. Same guard.

---

## 11 Security / Trust Notes

### Ownership gates (all verified in current code)

| Gate | Controller | Check |
|---|---|---|
| V-SUB-001 | `ctrlSubscribe` | `assertingActorId === followerActorId` |
| V-SUB-002 | `ctrlUnsubscribe` | `assertingActorId === followerActorId` |
| V-SUB-003 | `ctrlListIncomingRequests` | `assertingActorId === targetActorId` |
| Pre-V-SUB | `ctrlAcceptFollowRequest` | `assertingActorId === targetActorId` |
| Pre-V-SUB | `ctrlDeclineFollowRequest` | `assertingActorId === targetActorId` |
| 2026-05-10 | `ctrlCancelFollowRequest` | `assertingActorId === requesterActorId` |

### Known gaps (open tickets)

| Gap | Ticket | Severity |
|---|---|---|
| No privacy check in `getSubscribersController` for private VPORTs | TICKET-SUB-002 | HIGH |
| Notification model fallback routes expose raw UUID (`/profile/${actorId}`) | TICKET-SUB-003 | MEDIUM |
| VPORT → Citizen and VPORT → VPORT follows need UI surface (no UI exists) | TICKET-SUB-005 | CLOSED — product decision, all kinds permitted |
| Follow notification `linkPath: '/feed'` — should use handle-based route | TICKET-SUB-004 | MEDIUM |
| `dalCountSubscribers` naming collision in social DAL (VPORT side resolved) | TICKET-SUB-006 | MEDIUM |
| `visibility.dal.js` missing-row default `false` vs `actorPrivacy.dal.js` default `true` | TICKET-SUB-007 | LOW |
| `dalListOutgoingRequests` missing controller ownership gate | TICKET-SUB-008 | LOW |

### Previously closed (2026-05-27)

| Finding | Status |
|---|---|
| V-SUB-001: `ctrlSubscribe` had no ownership gate | FIXED |
| V-SUB-002: `ctrlUnsubscribe` had no ownership gate | FIXED |
| V-SUB-003: `ctrlListIncomingRequests` had no ownership gate | FIXED |
| V-SUB-005: notification `linkPath` used `/feed` not raw UUID | CONFIRMED SAFE (linkPath was already `/feed`) |
| TICKET-0006: `count_subscribers` / `list_subscribers` SECURITY DEFINER with no visibility guard | FIXED — vport.profiles guard added (20260527060000) |
| TICKET-SUB-001: explicit VPORT RPCs, DAL migration, legacy RPC drop | FIXED — Phases 0–3 complete (20260527060000 / 20260527110000 / 20260527120000) |
| TICKET-SUB-006 (VPORT side): `dalCountSubscribers` → `dalCountVportSubscribers` | FIXED — social DAL side still open |

---

## 12 Privacy Settings Model

### Current model

Table: `vc.actor_privacy_settings`
Fields used: `is_private` (boolean only)
Missing-row behavior: varies by DAL file (see gap below)

Two DAL files read this table:

| File | Missing-row default | Used by |
|---|---|---|
| `features/social/privacy/dal/actorPrivacy.dal.js` | `{ isPrivate: true }` (fail closed) | Follow gate, profile gate |
| `features/settings/privacy/dal/visibility.dal.js` | `false` (fail open) | Settings write path |

TICKET-SUB-007 tracks aligning these defaults.

### No actor_visibility table exists

There is no `vc.actor_visibility` table or granular visibility model in the current schema. The follow gate is derived entirely from `is_private` + actor kind + follow status. A more granular model (subscriber_count_visible, subscriber_list_visible, can_receive_follow_requests) does not exist and is not required for launch.

---

## 13 Rules / Invariants

- `vc.actor_follows` is the single source of truth for active follow edges. Any consumer that bypasses it breaks feed visibility, profile follow state, and subscription counts.
- Ownership gates must fire before any DAL write on all mutating follow operations.
- `assertingActorId` must always derive from the session (`useIdentity()`), never from a prop or route param at the hook layer.
- `invalidateFeedFollowCache` must be called after every follow edge change (insert or deactivate). Skipping it creates a window where private post access is stale.
- `invalidateFollowerCount` must be called after every follow insert or deactivate. The 60s TTL cache does not self-correct quickly enough for optimistic UI.
- Follow notifications must use `linkPath: '/feed'` or a handle-based route. Raw actor UUIDs must never appear in `linkPath`.
- Blocking deactivates follow edges server-side via the `block_actor` RPC. The client does not need to call `dalDeactivateFollow` separately on block.
- SECURITY DEFINER RPCs bypass RLS. App-layer privacy checks must be applied before calling them for private actors.
- VPORT subscriber count and list are public signals for public VPORT profiles. They are intentionally readable without viewer authentication.

---

## 14 Failure Risks

1. `list_vport_subscribers` / `count_vport_subscribers` are SECURITY DEFINER with a `vport.profiles` visibility guard (added TICKET-0006 / TICKET-SUB-001). Non-VPORT and deleted VPORTs return 0 / empty. Private VPORT subscriber lists are still readable via direct REST if the app-layer privacy check (TICKET-SUB-002) is absent.
2. No actor-kind guard in `ctrlSubscribe` — VPORT actors can follow Citizens or other VPORTs.
3. Accept follow request is a two-step client-side write and is not atomic. Partial failure leaves the follow edge inserted but the request status not updated.
4. `notification.model.js` falls back to raw UUID routes when sender has no slug. This leaks internal actor IDs through notification links.
5. `dalListOutgoingRequests` has no controller ownership gate — if ever called from a hook directly, it can enumerate any actor's outgoing requests.

---

## 15 Debug Notes

To verify a follow edge exists:
```sql
SELECT follower_actor_id, followed_actor_id, is_active, created_at
FROM vc.actor_follows
WHERE follower_actor_id = '<actor_id>'
   OR followed_actor_id = '<actor_id>'
ORDER BY created_at DESC;
```

To verify VPORT subscriber RPC status:
```sql
SELECT proname, prosecdef, proconfig, prosrc LIKE '%vport.profiles%' AS has_visibility_guard
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vc' AND p.proname IN ('count_vport_subscribers', 'list_vport_subscribers', 'get_follower_count');
```

To check RLS on actor_follows:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_follows';
```

---

## 16 Files Map

| File | Role |
|---|---|
| `features/social/friend/request/dal/actorFollows.dal.js` | Source of truth for follow edge writes (insert/deactivate/read) |
| `features/social/friend/request/dal/followRequests.dal.js` | Follow request state reads and writes |
| `features/social/privacy/dal/actorPrivacy.dal.js` | Privacy flag read — fail-closed version |
| `features/settings/privacy/dal/visibility.dal.js` | Privacy flag read/write — fail-open version (settings path) |
| `features/profiles/kinds/vport/dal/subscribersCount.dal.js` | VPORT subscriber count via `count_vport_subscribers` RPC — exports `dalCountVportSubscribers`, `invalidateVportSubscriberCount` |
| `features/profiles/kinds/vport/dal/subscribersList.dal.js` | VPORT subscriber list via `list_vport_subscribers` RPC — exports `dalListVportSubscribers` |
| `features/social/friend/subscribe/dal/subscriberCount.dal.js` | General follower count via get_follower_count RPC |
| `features/social/friend/subscribe/controllers/follow.controller.js` | Subscribe — ownership gate, block check, privacy routing |
| `features/social/friend/subscribe/controllers/unsubscribe.controller.js` | Unsubscribe — ownership gate, parallel deactivation |
| `features/social/friend/request/controllers/followRequests.controller.js` | Request send/accept/decline/cancel/list — ownership gates |
| `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` | VPORT subscriber count + list — intentional public read |
| `features/social/friend/subscribe/model/followRelationState.model.js` | State constants and button labels |
| `features/social/friend/request/hooks/useSubscribeAction.js` | Profile page subscribe button — owns label, disabled state, click handler |
| `features/social/friend/subscribe/hooks/useFollowActorToggle.js` | Toggle hook for feed actions |
| `features/social/friend/subscribe/hooks/useFollowerCount.js` | Follower count with optimistic adjust |
| `features/profiles/kinds/vport/hooks/subscribers/useSubscribers.js` | VPORT subscriber list hook |
| `features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx` | VPORT subscribers tab UI |
| `features/notifications/inbox/model/notification.model.js` | Notification mapper — contains raw UUID fallback route gap |
| `features/feed/dal/feed.read.followRows.dal.js` | Feed follow graph reader — invalidated on follow/unfollow |

---

## Native Parity Notes

Native Relevance: YES
Falcon Review: COMPLETE (2026-05-27)
Related Native Module: Profile, Subscribe button, Notification inbox
Native Transfer Status: BLOCKED — no native iOS or Android codebase exists (PWA only)
Known Native Gaps: Subscribe button state (follow vs. requested vs. following), notification linkPath navigation on follow tap, private follow request approval flow, feedFollowCache invalidation (PRIVACY CRITICAL)
Winter Soldier Handoff: GENERATED (see FALCON report — Android parity blueprint pending)
Falcon Report: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_00-00_falcon_subscriber-follow-architecture.md`

Critical native invariants (when native is built):
- `assertingActorId` must come from session — never from UI props or route params
- `invalidateFeedFollowCache` must fire on every follow edge change — controls private post visibility
- Private actor follow must route to request flow, not direct insert
- Follow notification tap must navigate to /feed — not to /profile/{actorId}

---

## Audit References

Latest Engine Audit: N/A — no shared engine owns the follow system
Previous Engine Audit: N/A

---

## Change Log

### 2026-05-27

Task: Subscriber / Follow full architecture review — actor pair matrix, security model, RPC audit, visibility model
Application Scope: VCSM
Prompt Registry Entry: 27-20.md
Code Status Before: No canonical architecture doc existed for the global actor follow model
Code Status After: This document created. Social-pipeline.md stale notification claim fixed.
Files Changed:
- Created: `vcsm/social/vcsm.social.subscribe-architecture.md` (this file)
- Updated: `vcsm/profiles/vcsm.profiles.social-pipeline.md` — fixed stale DB-trigger notification claim
- Updated: `vcsm/profiles/vcsm.profiles.subscribe-pipeline.md` — appended architecture review findings
Architecture Contracts Checked: ARCHITECTURE.md, PROJECT_BOUNDARY_ISOLATION_CONTRACT.md
Security / Runtime / DB Notes:
- list_subscribers and count_subscribers confirmed SECURITY DEFINER from prior change log
- No app-layer privacy check on getSubscribersController for private VPORTs
- ctrlSubscribe has no actor-kind guard
Documentation Truth Status: VERIFIED (live code read, no prior audit file reliance)

---

### 2026-05-27 — Command Evidence Run (ELEKTRA / SENTRY / FALCON / DB)

Task: Run ELEKTRA, SENTRY, FALCON, DB against subscriber/follow architecture findings
Application Scope: VCSM
Prompt Registry Entry: 27-20.md (same session)
Code Status Before: Architecture review complete; ELEKTRA completed; SENTRY/FALCON/DB pending
Code Status After: All four commands run or formally blocked

Command Results:
- ELEKTRA: COMPLETE — 2 HIGH, 2 MEDIUM, 2 LOW findings (see ELEKTRA report)
- DB: BLOCKED — Docker not running; no psql credentials in env; supabase db query not available in v2.75.0. Must re-run when Docker is available.
- SENTRY: COMPLETE — MAJOR DRIFT (2 HIGH, 2 MEDIUM findings)
  - SENT-001: ctrlSetActorPrivacy missing assertingActorId gate (HIGH)
  - SENT-002: Privacy DAL split — actorPrivacy.dal.js vs visibility.dal.js divergent defaults (HIGH)
  - SENT-003: PendingFollowRequests.jsx raw UUID fallback in UI (MEDIUM)
  - SENT-004: dalCountSubscribers exported from two DAL files with different RPCs (MEDIUM)
- FALCON: COMPLETE — BLOCKED (no native app exists; PWA blueprint documented; Winter Soldier handoff generated)

New open tickets confirmed: SENT-001 and SENT-002 block release
Files Changed: None (all commands are analysis only)
Command Evidence Paths:
- ELEKTRA: `audits/security/2026-05-27_00-00_elektra_subscriber-follow-architecture.md`
- DB: `audits/security/2026-05-27_00-01_db_subscriber-follow-architecture.md`
- SENTRY: `audits/compliance/2026-05-27_00-00_sentry_subscriber-follow-architecture.md`
- FALCON: `audits/compliance/2026-05-27_00-00_falcon_subscriber-follow-architecture.md`
Documentation Truth Status: VERIFIED — all command findings logged and cross-referenced

---

### 2026-05-27 — TICKET-0006 + TICKET-SUB-001 (RPC hardening, explicit VPORT RPCs, DAL migration)

Task: Harden subscriber RPC visibility, create explicit VPORT-scoped RPCs, migrate DAL call sites, drop legacy RPCs
Application Scope: VCSM
Code Status Before: count_subscribers and list_subscribers were SECURITY DEFINER with no visibility guard; DAL called generic actor-global RPCs; naming collision on dalCountSubscribers
Code Status After: Explicit VPORT RPCs live with visibility guard; DAL fully migrated; legacy RPCs dropped; collision resolved on VPORT side
Migrations Applied:
- 20260527060000 — added vport.profiles visibility guard to count_subscribers / list_subscribers (CREATE OR REPLACE + DROP+CREATE for list_subscribers due to parameter default conflict)
- 20260527110000 — created count_vport_subscribers and list_vport_subscribers (SECURITY DEFINER, authenticated, visibility guard structural)
- 20260527120000 — dropped count_subscribers and list_subscribers (0 callers confirmed before drop)
Files Changed:
- `features/profiles/kinds/vport/dal/subscribersCount.dal.js` — renamed dalCountSubscribers → dalCountVportSubscribers, RPC → count_vport_subscribers, invalidateSubscriberCount → invalidateVportSubscriberCount
- `features/profiles/kinds/vport/dal/subscribersList.dal.js` — renamed dalListSubscribers → dalListVportSubscribers, RPC → list_vport_subscribers
- `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` — updated imports
- `features/profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js` — updated vi.mock factories and all references
Security / Runtime / DB Notes:
- get_follower_count confirmed SECURITY DEFINER (live DB 2026-05-27); no visibility guard; not called from VPORT subscriber path
- actor_privacy_settings RLS confirmed solid (is_actor_owner gates INSERT/UPDATE); TICKET-SUB-007 downgraded to LOW
- social_follow_requests RLS confirmed well-designed state machine; no gaps found
- Cache invalidation gap: invalidateVportSubscriberCount not wired to follow events (separate finding, not in scope)
Documentation Truth Status: VERIFIED (live DB queries, live code reads, no audit file reliance)
