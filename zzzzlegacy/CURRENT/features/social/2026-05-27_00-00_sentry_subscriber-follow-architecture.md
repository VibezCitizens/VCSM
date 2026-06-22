# SENTRY Compliance Report — Subscriber / Follow Architecture

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** SENTRY
**Trigger:** Logan COMMAND EVIDENCE REGISTRY — MISSING (subscriber/follow architecture review session)
**Status:** MAJOR DRIFT

---

## SENTRY COMPLIANCE REPORT

Application Scope: VCSM
Review reason: Architecture review of subscriber/follow system for Citizens and VPORTs — post-analysis compliance check
Architecture contract: `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
Boundary contract: `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | NO (analysis only) | NONE | All reviewed files reside inside apps/VCSM |
| apps/wentrex | NO | NO | NONE | Not in scope |
| apps/Traffic | NO | NO | NONE | Not in scope |
| engines | NO | NO | NONE | No engine files touched — all logic is app-level |

Boundary compliance: PASS — work remained inside apps/VCSM only.

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| DAL / persistence layer | ALIGNED | NONE | DALs do not enforce authorization |
| Controller / orchestration layer | PARTIAL | MODERATE DRIFT | ctrlSetActorPrivacy missing assertingActorId gate |
| Hook / view model layer | ALIGNED | NONE | Hooks correctly pass assertingActorId from session |
| Adapter boundary | ALIGNED | NONE | Adapters re-export only; no DAL/model/controller leakage |
| Model / normalization layer | ALIGNED | NONE | followRelationState.model.js correctly normalizes state only |
| Cache ownership and invalidation | ALIGNED | NONE | All caches invalidated at correct layer (controller fires, DAL owns) |
| Engine isolation | ALIGNED | NONE | No engine files modified |
| Privacy DAL split | MAJOR DRIFT | HIGH | Two DAL files read same table with divergent missing-row defaults |
| Identity surface — UI | MINOR DRIFT | MEDIUM | PendingFollowRequests.jsx falls back to raw UUID text |
| DAL naming | MINOR DRIFT | MEDIUM | dalCountSubscribers exported from two DAL files, different RPC targets |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| ctrlSubscribe V-SUB-001 gate | PASS | LOW | assertingActorId === followerActorId enforced at line 26 |
| ctrlUnsubscribe V-SUB-002 gate | PASS | LOW | assertingActorId === followerActorId enforced at line 19 |
| ctrlAcceptFollowRequest V-SUB-003 gate | PASS | LOW | assertingActorId === targetActorId enforced |
| ctrlDeclineFollowRequest gate | PASS | LOW | assertingActorId === targetActorId enforced |
| ctrlCancelFollowRequest gate | PASS | LOW | assertingActorId === requesterActorId enforced |
| ctrlSetActorPrivacy gate | FAIL | HIGH | No assertingActorId — actorId passed directly from prop without session check |
| getSubscribersController | PASS | NONE | No gate by IRONMAN decision — intentional public read for public VPORT profiles |
| dalInsertFollow trust | PASS | LOW | DAL correctly does not enforce ownership — relies on controller + RLS |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| VportSubscribersView route building | PASS | NONE | /vport/{handle}, /u/{handle} only; falls back to /feed when no handle |
| follow.controller.js notification linkPath | PASS | NONE | linkPath: '/feed' — no raw UUID exposed |
| notification.model.js follow route | FAIL | HIGH | Line 107: raw actorId in /profile/{actorId} route (ELEK-001 cross-reference) |
| PendingFollowRequests.jsx fallback | FAIL | MEDIUM | Line 66: {requesterActorId} rendered as visible text when actor not loaded |
| actorId in subscribe action | PASS | NONE | useSubscribeAction uses viewerActorId from session — not from route params |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| engines/ not modified | PASS | NONE | All subscribe/follow logic is app-level only |
| feedCache.adapter consumed correctly | PASS | NONE | Controller accesses feed cache via adapter boundary |
| notifications.adapter consumed correctly | PASS | NONE | publishVcsmNotification called via adapter, not directly |
| block feature consumed correctly | PASS | NONE | ctrlGetBlockStatus imported via @/features/block adapter |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| iOS native app | NOT APPLICABLE | N/A | No native iOS app exists — PWA only (see FALCON report) |
| Android native app | NOT APPLICABLE | N/A | No native Android app exists |

---

## SENTRY FINDINGS

---

### SENTRY FINDING — SENT-2026-05-27-001

- **Finding ID:** SENT-2026-05-27-001
- **Location:** `apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js:13`
- **Drift Level:** MODERATE DRIFT
- **Severity:** HIGH
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:**
  `ctrlSetActorPrivacy({ actorId, isPrivate, refreshActorFn })` accepts `actorId` directly
  with no `assertingActorId` parameter. The caller (`useUpdateVportVisibility.js`) passes
  `actorId` from a hook parameter — not from a verified session token.
- **Expected behavior:**
  The controller must accept an `assertingActorId` parameter and verify it equals
  `actorId` before calling `dalSetActorPrivacy`. Ownership enforcement belongs at the
  controller layer, not the UI layer.
- **Risk:**
  If `actorId` can be supplied from a URL parameter, query param, or any non-session
  source, an actor could toggle another actor's privacy setting. The UI currently
  sources `actorId` from `useUpdateVportVisibility({ actorId })` which comes from
  component props — not directly from session state.
- **Recommended correction:**
  Add `assertingActorId` to `ctrlSetActorPrivacy`. Verify `assertingActorId === actorId`
  before proceeding. Update `useUpdateVportVisibility` to supply `assertingActorId` from
  the verified identity hook (e.g. `useIdentity()` → `actorId`).
- **Architectural rationale:**
  Per ARCHITECTURE.md: authorization and actor ownership enforcement belong at the
  controller layer. UI hooks are advisory only. DAL must not trust caller-provided actorId.
  This controller currently has no ownership gate — unlike all other write controllers
  reviewed in this session.

---

### SENTRY FINDING — SENT-2026-05-27-002

- **Finding ID:** SENT-2026-05-27-002
- **Location:**
  - `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js` (missing-row default: `{ isPrivate: true }` — fail closed)
  - `apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js` (missing-row default: `false` — fail open)
- **Drift Level:** MODERATE DRIFT
- **Severity:** HIGH
- **Contract Violated:** Architecture Contract — DAL layer must not have divergent source-of-truth representations for the same data shape
- **Current behavior:**
  Two DAL files read from what is effectively the same `vc.actor_privacy_settings` surface
  but disagree on what to return when no row exists:
  - `actorPrivacy.dal.js` returns `{ isPrivate: true }` when row is missing (fail closed — treats actor as private)
  - `visibility.dal.js` returns `false` when row is missing (fail open — treats actor as public)
  - The subscribe flow uses `actorPrivacy.dal.js` (fail closed path)
  - The settings UI uses `visibility.dal.js` (fail open path)
- **Expected behavior:**
  One canonical privacy DAL should own the `vc.actor_privacy_settings` read path.
  Both callers should use the same default. The correct default is fail-closed (isPrivate: true)
  to prevent private feed content from leaking before a privacy row is initialized.
- **Risk:**
  A newly created actor that has no privacy row will be treated as PRIVATE by the follow
  flow (preventing direct follows) but as PUBLIC by the settings UI. This split creates
  an inconsistent UX and can cause silent follow failures for new accounts.
- **Recommended correction:**
  Consolidate to a single privacy DAL or enforce one canonical missing-row default across
  both. The fail-closed default (`{ isPrivate: true }`) is the correct choice. Update
  `visibility.dal.js` to return `true` (or `{ isPrivate: true }`) when no row is found.
- **Architectural rationale:**
  A single table should have a single canonical DAL path. Split ownership of the same
  table creates the exact maintenance hazard that single-responsibility DAL design prevents.

---

### SENTRY FINDING — SENT-2026-05-27-003

- **Finding ID:** SENT-2026-05-27-003
- **Location:** `apps/VCSM/src/features/settings/privacy/ui/PendingFollowRequests.jsx:66`
- **Drift Level:** MINOR DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Public Identity Surface Contract
- **Current behavior:**
  ```jsx
  // Line 66 — fallback when actor not loaded
  <div className="truncate text-sm text-white/90">{requesterActorId}</div>
  ```
  When `actor?.actorId` is falsy (actor summary not loaded), the raw UUID is
  rendered as visible text in the pending follow requests UI.
- **Expected behavior:**
  Raw UUIDs must never appear in public-facing or user-facing surfaces. The fallback
  should show a neutral placeholder ("Unknown user") or suppress the row entirely
  until the actor summary loads.
- **Risk:**
  LOW exploitability — the screen is settings-private (visible to the account owner only).
  But exposing raw UUIDs in any UI surface violates the identity surface contract and
  may leak internal IDs if the screen is ever photographed or screen-shared.
- **Recommended correction:**
  Replace the fallback div with a skeleton loader or a neutral placeholder string.
  Do not render `requesterActorId` as visible text.
- **Architectural rationale:**
  Per repo memory and identity surface rules: raw UUIDs must never appear in user-facing
  surfaces, even in owner-only settings screens.

---

### SENTRY FINDING — SENT-2026-05-27-004

- **Finding ID:** SENT-2026-05-27-004
- **Location:**
  - `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js` — exports `dalCountSubscribers({ actorId })` (named param) → calls `vc.get_follower_count`
  - `apps/VCSM/src/features/profiles/kinds/vport/dal/subscribersCount.dal.js` — exports `dalCountSubscribers(actorId)` (positional) → calls `vc.count_subscribers`
- **Drift Level:** MINOR DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract — unique DAL symbol names per feature ownership
- **Current behavior:**
  Two files in different feature paths export the same function name `dalCountSubscribers`
  with different call signatures and different RPC targets. The social DAL uses named
  parameter `{ actorId }` and calls `get_follower_count`. The vport DAL uses positional
  `actorId` and calls `count_subscribers`.
- **Expected behavior:**
  Each DAL export must have a unique name reflecting its feature ownership. The name
  collision creates silent import confusion — a developer importing `dalCountSubscribers`
  from the wrong path gets a different RPC without any compile-time indication.
- **Risk:**
  Wrong RPC called silently if import path is wrong. Different RPCs may return different
  counts if their SQL differs (e.g. `count_subscribers` vs `get_follower_count` may have
  different filter conditions). Bug would be data-level and non-obvious.
- **Recommended correction:**
  Rename one of the two exports to be unambiguous:
  - `subscriberCount.dal.js` (social) → keep as `dalGetFollowerCount` to match the RPC name
  - `subscribersCount.dal.js` (vport) → rename to `dalGetVportSubscriberCount`
  Update all callers of each export.
- **Architectural rationale:**
  DAL exports must be named for their feature ownership and RPC target. Identical names
  for different persistence calls across two features violates naming discipline.

---

## CACHE ARCHITECTURE STATUS

| Cache | Owner | Invalidation Placement | Status | Notes |
|---|---|---|---|---|
| followStatusCache (8s) | actorFollows.dal.js | Fires in dalInsertFollow and dalDeactivateFollow | PASS | Correct — DAL owns, DAL invalidates |
| followerCountCache (60s) | subscriberCount.dal.js | `invalidateFollowerCount(actorId)` fires in ctrlSubscribe and ctrlUnsubscribe | PASS | Correct — controller triggers, DAL owns |
| feedFollowCache (60s) | feedCache.adapter | `invalidateFeedFollowCache(followerActorId)` fires in ctrlSubscribe and ctrlUnsubscribe | PASS | Privacy-critical path — correctly fires on every follow edge change |
| privacyCache (30s) | actorPrivacy.dal.js | `invalidateActorPrivacyCacheAdapter(actorId)` fires in ctrlSetActorPrivacy | PASS | Invalidation fires correctly, but split DAL ownership is a risk (see SENT-002) |

---

## FINAL SENTRY STATUS: MAJOR DRIFT

Two HIGH severity findings affect the actor ownership and privacy data integrity of the subscribe/follow system:
- SENT-001: `ctrlSetActorPrivacy` missing controller-layer ownership gate
- SENT-002: Privacy DAL split — divergent missing-row defaults between two files reading the same table

Two MEDIUM severity findings affect naming discipline and identity surface compliance:
- SENT-003: Raw UUID rendered in PendingFollowRequests fallback UI
- SENT-004: DAL naming collision — `dalCountSubscribers` exported from two files

---

## FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Priority | Blocking Release | Reason |
|---|---|---|---|
| SENT-001 | P1 | YES — HIGH | Actor ownership gap in ctrlSetActorPrivacy — write path without assertingActorId |
| SENT-002 | P1 | YES — HIGH | Privacy DAL split — new actor privacy state is inconsistent across flows |
| SENT-003 | P2 | NO | Low-risk identity surface issue in owner-only UI |
| SENT-004 | P2 | NO | Naming collision — risk of developer error, not user-facing security risk |

---

## COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ELEKTRA | `audits/security/2026-05-27_00-00_elektra_subscriber-follow-architecture.md` | SENT-001 cross-references ELEK-002; SENT-003 cross-references ELEK-001 | PRESENT |
| DB | `audits/security/2026-05-27_00-01_db_subscriber-follow-architecture.md` | RLS verification blocked — no live connection | BLOCKED |
| FALCON | `audits/compliance/2026-05-27_00-00_falcon_subscriber-follow-architecture.md` | Native parity — no native app yet | PRESENT |
| VENOM | N/A | Not run this session | MISSING |
| Logan canonical doc | `logan/vcsm/social/vcsm.social.subscribe-architecture.md` | Architecture doc for this review | PRESENT |
