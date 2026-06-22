# Task Audit — vport-subscribers-full-audit
**Date:** 2026-05-27
**Scope:** VCSM
**Task:** Full audit of VPORT Subscribers module — VENOM + ARCHITECT + SPIDER-MAN + LOGAN
**Tracker:** zNOTFORPRODUCTION/_ACTIVE/planning/may/27/27-approval-tracker-12.md

---
---
## VENOM — vport-subscribers · 10:45
**Date:** 2026-05-27
**Reviewer:** VENOM
**Trigger:** First security pass on VPORT subscribers module — zero prior coverage
**Findings:** 2 CRITICAL | 3 HIGH | 3 MEDIUM | 1 LOW

---

### VENOM TARGET
- **Feature:** VPORT Subscribers (follow/subscribe cross-kind system)
- **Application Scope:** VCSM
- **Reason:** Zero prior security coverage. Cross-kind write surface with no actor ownership verification.
- **Primary trust boundary:** Authenticated Citizen → follow write surface

---

### SECURITY SURFACE
- **Entry points:** `VportSubscribersView` (public profile tab), `useFollowActorToggle` (follow/unfollow button)
- **Auth source:** Supabase session — implicit, not verified at controller layer for write paths
- **Authorization layer:** ASSUMED RLS on `vc.actor_follows` + `vc.social_follow_requests`
- **Identity surface:** `actorId` — correctly named but NOT session-verified in `ctrlSubscribe`, `ctrlUnsubscribe`, `ctrlListIncomingRequests`
- **Sensitive objects:** `actor_follows`, `social_follow_requests`, subscriber lists, follow request state, notification link paths

---

### TRUST BOUNDARY TRACE
- **Client input:** `followerActorId`, `followedActorId` — passed as params from UI hooks
- **Validated at:** Self-follow ✓ | Block check ✓ | Session ownership of `followerActorId`: ✗ NOT VERIFIED on write paths
- **Identity resolved at:** DAL layer only (via RPC — ASSUMED RLS)
- **Authorization enforced:** `ctrlAccept/Decline/Cancel` have `assertingActorId` ✓ | `ctrlSubscribe` / `ctrlUnsubscribe`: NO session binding ✗ | `ctrlListIncomingRequests`: NO ownership check ✗
- **Data returned to:** Public VPORT profile view (subscriber list + count)

---

### FINDING V-SUB-001 — Caller Identity Not Verified in ctrlSubscribe (CRITICAL)
- **Location:** `apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js:12`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (`vc.actor_follows`)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen can subscribe on behalf of any actor
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** `ctrlSubscribe({ followerActorId, followedActorId })` accepts `followerActorId` as a caller-supplied parameter with no session ownership assertion. Block check runs, self-follow check runs, but no verification that the session user actually owns `followerActorId`.
- **Risk:** Any authenticated user can subscribe on behalf of any actor, forging follow relationships if RLS allows it.
- **Severity:** CRITICAL
- **Exploitability:** HIGH
- **Attack Preconditions:** Authenticated account. Any target `followerActorId`. No ownership check at app layer.
- **Blast Radius:** Multi-actor — any actor's follow graph can be forged. Feed contamination. Notification spam.
- **Identity Leak Type:** Actor correlation
- **Cache Trust Type:** Identity-sensitive (feed cache busted on follow)
- **RLS Dependency:** ASSUMED — sole defense is DB-layer RLS
- **Why it matters:** Forged follows allow access to private posts of VPORTs victim "follows," enable notification spam, and corrupt the victim's social graph silently.
- **Recommended mitigation:** Add `assertingActorId` parameter and verify it matches `followerActorId`. Pattern already established in `ctrlAcceptFollowRequest`.
- **Follow-up command:** SPIDER-MAN
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

### FINDING V-SUB-002 — Caller Identity Not Verified in ctrlUnsubscribe (CRITICAL)
- **Location:** `apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js:8`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table (`vc.actor_follows`, `vc.social_follow_requests`)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen can unsubscribe on behalf of any actor
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** `ctrlUnsubscribe({ followerActorId, followedActorId })` deactivates follow edges and revokes follow requests. No session ownership check on `followerActorId`. Calls `invalidateFeedFollowCache(followerActorId)` — busts the privacy cache for the victim actor.
- **Risk:** Any authenticated user can silently destroy another actor's follow relationships. The feed cache bust is particularly dangerous — briefly exposes private content while cache rebuilds.
- **Severity:** CRITICAL
- **Exploitability:** HIGH
- **Attack Preconditions:** Authenticated account. Target `followerActorId`. No ownership check.
- **Blast Radius:** Multi-actor. Privacy cache bust for victim actor = potential brief private content exposure.
- **Identity Leak Type:** Actor correlation
- **Cache Trust Type:** Identity-sensitive, Public-profile-sensitive
- **RLS Dependency:** ASSUMED
- **Why it matters:** Silent social graph destruction. Privacy cache bust is a secondary risk vector.
- **Recommended mitigation:** Add `assertingActorId` verification symmetric to V-SUB-001 fix.
- **Follow-up command:** SPIDER-MAN
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

### FINDING V-SUB-003 — ctrlListIncomingRequests Has No Ownership Check (HIGH)
- **Location:** `apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js:186`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen can read any actor's private follow request inbox
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** `ctrlListIncomingRequests({ targetActorId })` returns all pending follow requests for `targetActorId` with no verification that the caller IS `targetActorId`.
- **Risk:** Any authenticated user can read any private account's pending follow request list, revealing who is trying to follow them.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:** Authenticated account. Target `actorId`.
- **Blast Radius:** Single actor per call, enumerable across all actors
- **Identity Leak Type:** Actor correlation (who wants to follow whom)
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED
- **Why it matters:** For private VPORT accounts, the incoming request list is sensitive. Exposure enables targeted harassment.
- **Recommended mitigation:** Add `assertingActorId` and assert `assertingActorId === targetActorId`.
- **Follow-up command:** SPIDER-MAN
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security

---

### FINDING V-SUB-004 — Raw UUID in VPORT Subscriber Route (HIGH)
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx:14` + fallback at line 19
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Public Identity Surface Contract
- **Contract Violated:** Public Identity Surface Contract
- **Current behavior:** For VPORT-kind subscribers: `/vport/${encodeURIComponent(id)}` where `id = row?.actor_id`. For no-handle users: fallback `/profile/${encodeURIComponent(id)}`. Both expose raw UUIDs in public route links.
- **Risk:** Raw UUID permanently exposed in public-facing profile links rendered on VPORT subscriber tab.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Blast Radius:** Any VPORT-kind actor appearing in a subscriber list
- **Identity Leak Type:** Internal UUID exposure, Actor correlation
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Recommended mitigation:** Route via slug: `slug ? /vport/${slug} : /feed`. Apply same to user-kind fallback.
- **Follow-up command:** Wolverine (fix)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Communication and Network Security

---

### FINDING V-SUB-005 — Raw UUID in Notification Link Paths (HIGH)
- **Location:** `follow.controller.js:93` — `linkPath: '/profile/${followerActorId}'`; `followRequests.controller.js:63` — `linkPath: '/profile/${requesterActorId}'`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (notification feed)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Public Identity Surface Contract
- **Contract Violated:** Public Identity Surface Contract
- **Current behavior:** Notification links built with raw `actorId` as route segment. Every follow and follow_request notification exposes the follower's UUID.
- **Risk:** UUID extraction from notification payload. Permanent association of UUID with known actor identity.
- **Severity:** HIGH
- **Exploitability:** MEDIUM (notification recipient only)
- **Blast Radius:** Every actor that sends a follow or follow_request notification
- **Identity Leak Type:** Internal UUID exposure
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Recommended mitigation:** Resolve slug before building `linkPath`. Use `/u/${slug}` or `/vport/${slug}` patterns.
- **Follow-up command:** Wolverine (fix)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Software Development Security

---

### FINDING V-SUB-006 — dalUpdateRequestStatus Accepts Arbitrary Status String (MEDIUM)
- **Location:** `followRequests.dal.js:64`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Software Development Security
- **Contract Violated:** None (pattern risk)
- **Current behavior:** `status` parameter not validated against known enum values. Any string can be written to `status` column.
- **Risk:** Future controller omitting ownership check could write arbitrary status (e.g., `'accepted'`) directly to DB.
- **Severity:** MEDIUM
- **Exploitability:** LOW
- **Blast Radius:** Single follow request
- **RLS Dependency:** ASSUMED (DB enum constraint may reject invalid values)
- **Recommended mitigation:** Validate `status` against `['pending','accepted','declined','cancelled','revoked']` at DAL entry.
- **Follow-up command:** Wolverine (hardening)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### FINDING V-SUB-007 — Production Console Logging of Actor Relationship Data (MEDIUM)
- **Location:** `actorFollows.dal.js:56-65` + `followRequests.dal.js:84-89`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (browser console)
- **Trust Boundary:** System Service
- **Boundary Violated:** Security Operations / Debug Logging Contract
- **Contract Violated:** None (platform rule violation)
- **Current behavior:** Error paths emit `console.error` with `followerActorId`, `followedActorId`, `requesterActorId`, `targetActorId`, and full Supabase error objects to the browser console.
- **Risk:** Social graph metadata (who follows whom) exposed in production console logs. Extractable by browser extensions or DevTools.
- **Severity:** MEDIUM
- **Exploitability:** LOW
- **Blast Radius:** Single actor interaction per event
- **Identity Leak Type:** Actor correlation
- **RLS Dependency:** NONE
- **Recommended mitigation:** Remove actor IDs from `console.error` payloads. Log only error codes/messages. Guard any debug detail behind `import.meta.env.DEV`.
- **Follow-up command:** Wolverine (cleanup)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Asset Security

---

### FINDING V-SUB-008 — Dual Subscriber Count DAL with Different RPCs (LOW)
- **Location:** `subscribersCount.dal.js` (VPORT) vs `social/friend/subscribe/dal/subscriberCount.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None (data integrity)
- **Contract Violated:** None
- **Current behavior:** Two DALs count subscribers via different RPCs (`count_subscribers` vs `get_follower_count`, latter without schema prefix). Separate caches. Potential count divergence between dashboard and public profile views.
- **Risk:** Divergent counts erode actor trust and could confuse moderation state checks.
- **Severity:** LOW
- **Exploitability:** LOW
- **Blast Radius:** VPORT subscriber count display consistency
- **RLS Dependency:** NONE (read path)
- **Recommended mitigation:** Consolidate to single RPC with explicit `schema('vc')` prefix. Remove VPORT-specific `subscribersCount.dal.js`.
- **Follow-up command:** ARCHITECT (consolidation plan)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Assessment and Testing

---

### MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-SUB-001 | ctrlSubscribe missing session ownership gate | Controller | P0 — CRITICAL | App | SPIDER-MAN |
| V-SUB-002 | ctrlUnsubscribe missing session ownership gate | Controller | P0 — CRITICAL | App | SPIDER-MAN |
| V-SUB-003 | ctrlListIncomingRequests no ownership check | Controller | P1 — HIGH | App | SPIDER-MAN |
| V-SUB-004 | Raw UUID in subscriber route links | UI | P1 — HIGH | App | Wolverine |
| V-SUB-005 | Raw UUID in notification link paths | Controller | P1 — HIGH | App | Wolverine |
| V-SUB-006 | dalUpdateRequestStatus no status enum validation | DAL | P2 — MEDIUM | App | Wolverine |
| V-SUB-007 | Production console.error with actor IDs | DAL | P2 — MEDIUM | App | Wolverine |
| V-SUB-008 | Dual subscriber count DAL + RPC mismatch | DAL | P3 — LOW | App | ARCHITECT |

---

### CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy/governance gaps found |
| Asset Security | 4 | V-SUB-004, V-SUB-005, V-SUB-003, V-SUB-007 |
| Security Architecture and Engineering | 3 | V-SUB-001, V-SUB-002, V-SUB-006 |
| Communication and Network Security | 1 | V-SUB-004 (route exposure) |
| Identity and Access Management | 3 | V-SUB-001, V-SUB-002, V-SUB-003 |
| Security Assessment and Testing | 1 | V-SUB-008 (dual DAL gap) |
| Security Operations | 1 | V-SUB-007 (production logs) |
| Software Development Security | 4 | V-SUB-001, V-SUB-005, V-SUB-006, V-SUB-008 |

**Uncovered domains:**
- Security and Risk Management: not applicable — no policy/governance gaps found at code level
- All other domains covered by at least one finding

---

### VENOM COMPLETION STATUS
- [x] Boundary isolation contract loaded
- [x] Read-only analysis only
- [x] Trust boundaries identified
- [x] Auth and authorization traced
- [x] Identity surfaces inspected
- [x] Exploitability classified for all findings
- [x] Blast radius classified for all findings
- [x] Platform surface classified
- [x] RLS dependency classified
- [x] Contract violations mapped
- [x] CISSP domains mapped
- [x] Mitigation plan produced
- [x] CISSP summary table included
- [x] Uncovered domains stated

**VENOM STATUS: 2 CRITICAL | 3 HIGH — RELEASE BLOCKED until V-SUB-001 and V-SUB-002 resolved**

---
---
## ARCHITECT — vport-subscribers · 11:10
**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Trigger:** Layer compliance map for VPORT subscribers stack — post-VENOM
**Scope:** VCSM

---

### MODULE ARCHITECTURE REPORT

**Module:** VPORT Subscribers / Follow-Subscribe System  
**Application Scope:** VCSM  
**Module Type:** Feature module (cross-kind social graph + VPORT display)  
**Primary Root:** `apps/VCSM/src/`  
**Independence Status:** FRAGMENTED  
**Completeness Status:** INCOMPLETE  

---

### PURPOSE

Manages the follow/subscribe social graph between actors. Citizens can subscribe to VPORTs; VPORT owners see their subscriber list and count on the dashboard. The module spans two distinct responsibilities:

1. **VPORT subscriber display** — read-only tab showing who follows a VPORT
2. **Social follow system** — read/write graph for follow, unfollow, follow requests, accept/decline/cancel across all actor kinds

---

### OWNERSHIP

- **VPORT display path:** VPORT profiles team (`features/profiles/kinds/vport/`)
- **Social follow engine:** Social feature team (`features/social/friend/`)
- **Feed integration:** Feed feature team (`features/feed/`)
- **Privacy settings:** Settings feature team (`features/settings/privacy/`)
- **Notifications:** Notifications feature team (`features/notifications/types/follow/`)
- **IRONMAN record:** NOT PRESENT — ownership not formally assigned

---

### ENTRY POINTS

| Entry Point | Type | Caller | Auth Required |
|---|---|---|---|
| `VportSubscribersView` | Public profile tab | VPORT profile screen | NO (public read) |
| `useSubscribeAction` | Subscribe/unsubscribe button | Profile screens | YES (viewer session) |
| `useFollowRequestActions` | Accept/decline panel | Settings privacy | YES (target actor session) |
| `PendingFollowRequests` | Settings privacy UI | `/settings/privacy` | YES (owner session) |

---

### LAYER MAP

**VPORT-Specific Display Path (read-only)**
```
DAL:
  profiles/kinds/vport/dal/subscribersCount.dal.js     → vc.rpc("count_subscribers")
  profiles/kinds/vport/dal/subscribersList.dal.js      → vc.rpc("list_subscribers")

Controller:
  profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js

Hook:
  profiles/kinds/vport/hooks/subscribers/useSubscribers.js

Screen/View:
  profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx
```

**Social Follow System (read/write path)**
```
DAL:
  social/friend/request/dal/actorFollows.dal.js        → vc.actor_follows (insert, deactivate, read)
  social/friend/request/dal/followRequests.dal.js      → vc.social_follow_requests
  social/friend/subscribe/dal/subscriberCount.dal.js   → rpc("get_follower_count") [no schema prefix]
  profiles/dal/readFollowState.dal.js                  → vc.actor_follows (read)
  feed/dal/feed.read.followRows.dal.js                 → vc.actor_follows (bulk read for feed)

Models:
  social/friend/subscribe/model/followRelationState.model.js   → FOLLOW_RELATION_STATES enum + resolvers
  social/friend/request/models/followRequest.model.js          → row → domain shape

Controllers:
  social/friend/subscribe/controllers/follow.controller.js             → ctrlSubscribe
  social/friend/subscribe/controllers/unsubscribe.controller.js        → ctrlUnsubscribe
  social/friend/subscribe/controllers/getFollowRelationshipState.controller.js
  social/friend/subscribe/controllers/getFollowStatus.controller.js
  social/friend/subscribe/controllers/getFollowerCount.controller.js
  social/friend/request/controllers/followRequests.controller.js       → send, accept, decline, cancel, list

Hooks (direct):
  social/friend/subscribe/hooks/useFollowActorToggle.js
  social/friend/subscribe/hooks/useFollowStatus.js
  social/friend/subscribe/hooks/useFollowerCount.js
  social/friend/subscribe/hooks/useUnsubscribeAction.js (referenced, not yet read)
  social/friend/request/hooks/useFollowRequestActions.js     ← CORRECT: uses useIdentity()
  social/friend/request/hooks/useSubscribeAction.js          ← RISK: passes viewerActorId from props, no session assert
  social/friend/request/hooks/useFollowRequestStatus.js
  social/friend/request/hooks/useIncomingFollowRequests.js
  social/friend/request/hooks/useSendFollowRequest.js
  social/friend/request/hooks/useSocialFollowRequestOps.js

Components:
  social/friend/subscribe/components/SubscribeDebugPanel.jsx  ← DEV-ONLY, correctly guarded ✓

Adapters (re-exports):
  social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter.js   → re-export
  social/adapters/friend/subscribe/hooks/useFollowStatus.adapter.js        → re-export
  social/adapters/friend/subscribe/hooks/useFollowerCount.adapter.js       → re-export
  social/adapters/friend/subscribe/components/SubscribeDebugPanel.adapter.js → re-export
  social/adapters/friend/request/hooks/useFollowRequestActions.adapter.js  → re-export
  social/adapters/friend/request/hooks/useIncomingFollowRequests.adapter.js → re-export
  social/adapters/friend/request/hooks/useSendFollowRequest.adapter.js     → re-export
  social/adapters/friend/request/hooks/useSubscribeAction.adapter.js       → re-export

State:
  state/social/followRequestsStore.js   → Zustand signal store (version bump only)
```

**Cross-Feature Integration Path**
```
Feed:
  feed/dal/feed.read.followRows.dal.js         → vc.actor_follows (bulk read, cached)
  feed/model/feedFollowVisibility.model.js     → set builder + viewer check

Notifications:
  notifications/types/follow/FollowNotificationItem.view.jsx
  notifications/types/follow/FollowRequestItem.view.jsx
  notifications/types/follow/AcceptFriendRequestItem.jsx

Settings:
  settings/privacy/hooks/usePendingFollowRequestActions.js
  settings/privacy/ui/PendingFollowRequests.jsx
```

---

### MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Two clear paths: VPORT display + social follow system | — |
| Owner defined | FAIL | No IRONMAN record; ownership split across 4+ features | Assign formal owner per path |
| Entry points mapped | PASS | 4 entry points identified and mapped | — |
| Controllers present/delegated | PASS | Full controller layer exists | V-SUB-001/002 ownership gate missing |
| DAL/repository present | PARTIAL | 5 DAL files; dual count DAL is inconsistency | Consolidate count DAL |
| Models/transformers present | PASS | `followRelationState.model.js` + `followRequest.model.js` | — |
| Hooks/view models present | PASS | Full hook layer; 9+ hooks identified | useSubscribeAction bypasses assertingActorId |
| Screens/components present | PASS | `VportSubscribersView` + `SubscribeDebugPanel` (dev-only) | Raw UUID in route build (V-SUB-004) |
| Services/adapters present | PASS | Full adapter re-export layer via `social/adapters/friend/` | Adapters are re-exports only — thin |
| Database objects mapped | PARTIAL | Tables: `vc.actor_follows`, `vc.social_follow_requests` | RPCs: `count_subscribers`, `list_subscribers`, `get_follower_count` — not all schema-prefixed |
| Authorization path mapped | FAIL | Write path (subscribe/unsubscribe) missing session assert | CRITICAL — V-SUB-001, V-SUB-002 |
| Cache/runtime behavior mapped | PARTIAL | TTL caches on count + follow status; feed follow bulk cache | Count cache divergence (V-SUB-008) |
| Error/loading/empty states | PARTIAL | Error + loading + empty in `VportSubscribersView` | `useSubscribeAction` error only shows toast, no structured state |
| Documentation linked | FAIL | No Logan module doc for subscribers system | Create dedicated spec |
| Tests/validation noted | FAIL | Zero test files found | Entire module untested |
| Native parity noted | FAIL | No FALCON transfer record | Subscribe/unfollow flows need parity audit |
| Engine dependencies mapped | PASS | No engine dependency — all app-layer | Notifications dispatched via `publishVcsmNotification` adapter |

---

### MODULE INDEPENDENCE STATUS

**Classification: FRAGMENTED**

**Reason:**  
The subscribers module spans 6 independent feature trees with no single owner:
- `features/profiles/kinds/vport/` — VPORT display
- `features/social/friend/` — write graph
- `features/feed/` — feed visibility
- `features/settings/privacy/` — request management
- `features/notifications/types/follow/` — notification rendering
- `state/social/` — cross-feature state signal

**Blocking gaps:**
1. No single controller owns the full write path — `ctrlSubscribe` and `ctrlListIncomingRequests` both lack ownership assertions
2. No consolidated DAL — dual count implementations
3. No Logan documentation spec
4. Zero test coverage
5. Authorization missing at write layer

---

### MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `vc.actor_follows` | database | read/write | YES (via DAL) | Accessed by 3 separate DAL files |
| `vc.social_follow_requests` | database | read/write | YES (via DAL) | Accessed by `followRequests.dal.js` |
| `vc.rpc("count_subscribers")` | rpc | read | YES (schema prefixed) | VPORT-specific DAL only |
| `vc.rpc("list_subscribers")` | rpc | read | YES (schema prefixed) | VPORT-specific DAL only |
| `rpc("get_follower_count")` | rpc | read | PARTIAL (no schema prefix) | Social DAL — inconsistent |
| `features/block` | feature | inbound call | YES (via import) | `ctrlGetBlockStatus` called in subscribe/request |
| `features/feed/adapters/feedCache.adapter` | adapter | inbound call | YES (adapter boundary) | `invalidateFeedFollowCache` called after follow/unfollow |
| `features/notifications/adapters/notifications.adapter` | adapter | inbound call | YES (adapter boundary) | `publishVcsmNotification` called in controllers |
| `features/identity/adapters/identity.adapter` | adapter | inbound call | PARTIAL | Only used in `useFollowRequestActions` — MISSING in `useSubscribeAction` |
| `state/social/followRequestsStore` | store | cross-feature | YES (Zustand) | Signal-only store, no data |
| `state/actors/profileGateStore` | store | cross-feature | YES (Zustand) | Accessed directly via `getState()` in `useSubscribeAction` |

---

### MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vc.actor_follows` | read/write | social/friend | feed, profiles, social | Multi-DAL access — consolidation needed |
| `vc.social_follow_requests` | read/write | social/friend/request | settings/privacy, notifications | No enum validation on status writes |
| Subscriber count | read (cached) | DUAL — VPORT + social | VportSubscribersView + follower count displays | Divergent caches possible |
| Subscriber list | read | VPORT-specific | `VportSubscribersView` | No privacy gate — public by default |
| Follow relationship state | derived | `getFollowRelationshipState.controller` | `useSubscribeAction`, profile screens | Correctly composed |
| Notification link | write | follow/request controllers | notifications engine | Raw UUID in linkPath (V-SUB-005) |

---

### MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `VportSubscribersView` rendered in VPORT profile tab | — |
| Loading state | PASS | `loading` state in `useSubscribers` | — |
| Empty state | PASS | "No subscribers yet." in `VportSubscribersView` | — |
| Error state | PARTIAL | Error string rendered in `VportSubscribersView`; `useSubscribeAction` uses toast only | Structured error missing from action hook |
| Auth/owner gate | FAIL | No session assertion on write controllers | V-SUB-001, V-SUB-002, V-SUB-003 |
| Cache behavior | PARTIAL | Count + status caches in place; feed follow cache properly busted | Count cache divergence (V-SUB-008) |
| Runtime dependencies | PARTIAL | `feedCache.adapter`, `notifications.adapter` — clean | `profileGateStore.getState()` direct access pattern |
| Hot paths identified | PASS | `ctrlSubscribe` → `dalInsertFollow` is the hot write path | Missing ownership gate on hot path |
| LOKI handoff | RECOMMENDED | Runtime trace of `useSubscribeAction` → `ctrlSubscribe` chain warranted | — |
| KRAVEN handoff | RECOMMENDED | `readFeedFollowRowsDAL` fetches entire follow graph per viewer | Cache miss cost on large follow graphs |

---

### MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
- **Location:** `social/friend/request/hooks/useSubscribeAction.js:116-119`
- **Module:** social/friend/subscribe
- **Current dependency:** Hook calls `ctrlSubscribe({ followerActorId: actionActorId })` where `actionActorId = viewerActorId` (from props). Session identity from `useIdentity()` is NOT verified against `followerActorId`. The correct pattern (from `useFollowRequestActions`) uses `sessionActorId` from `useIdentity()`.
- **Expected boundary:** Hooks must only pass session-verified actorIds to write controllers
- **Risk:** CRITICAL — same as V-SUB-001
- **Suggested correction:** Add `useIdentity()` call in `useSubscribeAction`, assert `sessionActorId === actionActorId`, throw if mismatch

**MODULE BOUNDARY WARNING**
- **Location:** `social/friend/subscribe/dal/subscriberCount.dal.js:13` — `supabase.rpc('get_follower_count', ...)`
- **Module:** social/friend/subscribe DAL
- **Current dependency:** RPC call without `schema('vc')` prefix
- **Expected boundary:** All `vc` schema RPCs must use `.schema('vc').rpc(...)`
- **Risk:** LOW — schema default may differ in future, causing silent read failure
- **Suggested correction:** `supabase.schema('vc').rpc('get_follower_count', ...)`

**MODULE BOUNDARY WARNING**
- **Location:** `social/friend/request/hooks/useSubscribeAction.js:97` — `useProfileGateStore.getState().invalidateGate()`
- **Module:** social/friend/subscribe
- **Current dependency:** Hook directly calls Zustand store's `getState()` outside of React hook pattern
- **Expected boundary:** State store access should be via hook selector, not imperative `getState()`
- **Risk:** LOW — works correctly but bypasses React lifecycle tracking
- **Suggested correction:** Use `useProfileGateStore(s => s.invalidate)` selector pattern

---

### MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| `assertingActorId` in `ctrlSubscribe` + `ctrlUnsubscribe` | CRITICAL | V-SUB-001/002 — write path has no session ownership gate | App (controller layer) |
| `assertingActorId` in `ctrlListIncomingRequests` | HIGH | V-SUB-003 — inbox readable by any actor | App (controller layer) |
| Slug routing in `VportSubscribersView` + notification linkPaths | HIGH | V-SUB-004/005 — raw UUIDs in public routes | App (view + controller) |
| Status enum validation in `dalUpdateRequestStatus` | MEDIUM | V-SUB-006 — arbitrary strings writable to DB | App (DAL layer) |
| Production console.error cleanup | MEDIUM | V-SUB-007 — actor IDs in browser logs | App (DAL layer) |
| Single subscriber count DAL | MEDIUM | V-SUB-008 — count divergence between display contexts | App (DAL consolidation) |
| IRONMAN ownership assignment | HIGH | Module spans 4+ features with no formal owner | IRONMAN |
| Logan documentation spec | HIGH | No canonical spec for follow/subscribe system | LOGAN |
| Test suite (zero coverage) | HIGH | No regression safety net for CRITICAL write paths | SPIDER-MAN |
| FALCON native parity audit | MEDIUM | Subscribe/unfollow behavior on native not audited | FALCON |
| `schema('vc')` prefix on social count DAL | LOW | RPC schema consistency | App (DAL layer) |

---

### CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| profiles/kinds/vport/subscribers | 5 | 4 (DAL/Ctrl/Hook/View) | 1 (social/friend DAL via controller) | 0 | 0 | CLEAN |
| social/friend/subscribe | 9 | 5 (DAL/Model/Ctrl/Hook/Component) | 3 (block, feed, notifications) | 0 | 0 | WATCH |
| social/friend/request | 7 | 4 (DAL/Model/Ctrl/Hook) | 3 (block, feed, notifications) | 0 | 0 | WATCH |
| social/adapters/friend | 8 | 1 (adapter re-exports) | 0 | 0 | 0 | CLEAN |
| feed/follow integration | 2 | 2 (DAL/Model) | 0 | 0 | 0 | CLEAN |
| **Cross-module total** | **31** | **6** | **7** | **0** | **1** | **WATCH** |

**Dead Code Signal:** `SubscribeDebugPanel.adapter.js` — re-exports the debug panel but is unlikely to be consumed directly (the panel renders into `debug-rail-right` portal). Verify usages before treating as dead.

---

### SPAGHETTI SCORE

**Module:** VPORT Subscribers  
**Score:** WATCH  
**Reasons:**
- `useSubscribeAction` hook contains business orchestration (calling multiple controllers, managing local state, store invalidation, toast dispatch). This approaches HOOK doing business logic — boundary drift.
- Dual count DAL with different RPCs — duplication without consolidation.
- FRAGMENTED ownership across 6 feature trees.

**Release risk:** MEDIUM — architecture is understandable but fragmented. CRITICAL security gaps (V-SUB-001/002) are the release-blocking issue, not the structure.

---

### MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vports/vcsm.vport.kinds-architecture-map.md` (partial) | PARTIAL |
| Ownership record | — | MISSING |
| Security audit | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_vport-subscribers-full-audit.audit.md` | PRESENT (BLOCKED) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Test coverage | — | MISSING — zero tests |

---

### MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Add `assertingActorId` to `ctrlSubscribe`, `ctrlUnsubscribe`, `ctrlListIncomingRequests` | V-SUB-001/002/003 — CRITICAL release blocker | Wolverine |
| P0 | Fix slug routing in `VportSubscribersView` + notification linkPaths | V-SUB-004/005 — platform contract violation | Wolverine |
| P1 | Write test suite — ownership gates, follow/unfollow path, request accept/decline | Zero coverage on CRITICAL write paths | SPIDER-MAN |
| P1 | Add `assertingActorId` in `useSubscribeAction` hook | Session ownership not asserted before calling `ctrlSubscribe` | Wolverine |
| P1 | Assign formal ownership via IRONMAN | 4+ feature trees with no owner | IRONMAN |
| P2 | Consolidate subscriber count DAL | Dual DAL, divergent caches | Wolverine |
| P2 | Add status enum validation in `dalUpdateRequestStatus` | Defense-in-depth on write path | Wolverine |
| P2 | Remove actor IDs from production `console.error` | Platform debug logging rule | Wolverine |
| P2 | Write Logan canonical spec for follow/subscribe system | No formal documentation | LOGAN |
| P3 | Add `schema('vc')` prefix to social count DAL RPC | Schema consistency | Wolverine |
| P3 | Refactor `useSubscribeAction` to extract business orchestration | HOOK doing business logic drift | Wolverine |
| P3 | FALCON native parity audit | Subscribe/unfollow not audited on native | FALCON |

---

### FINAL MODULE STATUS: INCOMPLETE

**RECOMMENDED HANDOFFS:**
- **SPIDER-MAN** — test suite for all ownership gates (P0/P1 — required before release)
- **IRONMAN** — formal ownership assignment across 4 feature trees
- **LOGAN** — canonical documentation spec
- **FALCON** — native subscribe/unfollow parity audit

---

---
## SPIDER-MAN — vport-subscribers · 11:31
**Date:** 2026-05-27  
**Status:** COMPLETE — 17 regression tests written (intentionally failing until security fixes land)  
**Full report:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_11-31_spiderman_vport-subscribers-tests.md`

### Test Files Created

| File | Tests | Passing | Failing |
|---|---|---|---|
| `social/friend/subscribe/controllers/__tests__/follow.controller.test.js` | 33 | 27 | 6 |
| `social/friend/subscribe/controllers/__tests__/unsubscribe.controller.test.js` | 18 | 12 | 6 |
| `social/friend/request/controllers/__tests__/followRequests.controller.test.js` | 32 | 28 | 4 |
| `profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js` | 15 | 14 | 1 |
| **TOTAL** | **98** | **81** | **17** |

### Intentionally Failing Tests (regression stubs — turn green when fixes land)

| Test Group | Count | Maps To |
|---|---|---|
| `[V-SUB-001 REGRESSION]` — ctrlSubscribe ownership gate | 5 | VENOM V-SUB-001 CRITICAL |
| `[V-SUB-005 REGRESSION]` — ctrlSubscribe notification linkPath | 1 | VENOM V-SUB-005 MEDIUM |
| `[V-SUB-002 REGRESSION]` — ctrlUnsubscribe ownership gate | 6 | VENOM V-SUB-002 CRITICAL |
| `[V-SUB-003 REGRESSION]` — ctrlListIncomingRequests ownership gate | 4 | VENOM V-SUB-003 HIGH |
| `[MISSING GATE]` — getSubscribersController access model | 1 | ARCHITECT FRAGMENTED |

### Existing Correct Behavior Locked (81 tests passing)

- `ctrlAcceptFollowRequest` assertingActorId gate — 4 tests ✓
- `ctrlDeclineFollowRequest` assertingActorId gate — 4 tests ✓
- `ctrlCancelFollowRequest` assertingActorId gate — 4 tests ✓
- `ctrlSendFollowRequest` guards + idempotency — 7 tests ✓
- `ctrlSubscribe` all behavioral paths (block, already-following, private, public) — 27 tests ✓
- `ctrlUnsubscribe` guard + successful flow — 12 tests ✓
- `getSubscribersController` guard + pagination + null handling — 14 tests ✓
- `ctrlListIncomingRequests` null guard — 1 test ✓

### SPIDER-MAN Status: BLOCKED
17 failing regression tests confirm 5 unfixed security findings. CI is red. Release gate open only after all 17 pass.
