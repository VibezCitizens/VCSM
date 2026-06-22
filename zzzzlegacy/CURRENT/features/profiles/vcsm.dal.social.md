# VCSM DAL — `social`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/social/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 4 |
| Exported functions | 12 |
| Tables accessed | 3 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `actorFollows.dal.js`

**Path:** `features/social/friend/request/dal/actorFollows.dal.js`  
**Operations:** `read` · `update` · `upsert`  

**Exported functions:**

| `dalDeactivateFollow` | `read` · `update` · `upsert` | `actor_follows` |
| `dalGetFollowStatus` | `read` · `update` · `upsert` | `actor_follows` |
| `dalInsertFollow` | `read` · `update` · `upsert` | `actor_follows` |

### `actorPrivacy.dal.js`

**Path:** `features/social/privacy/dal/actorPrivacy.dal.js`  
**Operations:** `read` · `delete`  

**Exported functions:**

| `dalGetActorPrivacy` | `read` · `delete` | `actor_privacy_settings` |
| `invalidateActorPrivacyCache` | `read` · `delete` | `actor_privacy_settings` |

### `followRequests.dal.js`

**Path:** `features/social/friend/request/dal/followRequests.dal.js`  
**Operations:** `read` · `update` · `upsert`  

**Exported functions:**

| `dalGetRequestStatus` | `read` · `update` · `upsert` | `social_follow_requests` |
| `dalListIncomingPendingRequests` | `read` · `update` · `upsert` | `social_follow_requests` |
| `dalListOutgoingRequests` | `read` · `update` · `upsert` | `social_follow_requests` |
| `dalUpdateRequestStatus` | `read` · `update` · `upsert` | `social_follow_requests` |
| `dalUpsertPendingRequest` | `read` · `update` · `upsert` | `social_follow_requests` |

### `subscriberCount.dal.js`

**Path:** `features/social/friend/subscribe/dal/subscriberCount.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalCountSubscribers` | `read` | `actor_follows` |
| `invalidateFollowerCount` | `read` | `actor_follows` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_follows` | READ, UPSERT | `dalCountSubscribers`, `dalDeactivateFollow`, `dalGetFollowStatus`, `dalInsertFollow`, `invalidateFollowerCount` |
| `actor_privacy_settings` | DELETE | `dalGetActorPrivacy`, `invalidateActorPrivacyCache` |
| `social_follow_requests` | UPSERT | `dalGetRequestStatus`, `dalListIncomingPendingRequests`, `dalListOutgoingRequests`, `dalUpdateRequestStatus`, `dalUpsertPendingRequest` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `actorFollows.dal.js`

**Direct callers:**

- `followRequests.controller.js` _Controller_
- `follow.controller.js` _Controller_
- `getFollowStatus.controller.js` _Controller_
- `unsubscribe.controller.js` _Controller_

**Full call chain to screen:**

```
`actorFollows.dal.js` → `follow.controller.js` → `useSubscribeAction.js` → `useSubscribeAction.adapter.js` → `ActorProfileHeader.jsx`
```

### `followRequests.dal.js`

**Direct callers:**

- `followRequests.controller.js` _Controller_
- `unsubscribe.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`followRequests.dal.js` → `followRequests.controller.js`
```
```
`followRequests.dal.js` → `unsubscribe.controller.js`
```
```
`followRequests.dal.js` → `followRequests.controller.js` → `useFollowRequestActions.js`
```

### `subscriberCount.dal.js`

**Direct callers:**

- `follow.controller.js` _Controller_
- `getFollowerCount.controller.js` _Controller_
- `unsubscribe.controller.js` _Controller_

**Full call chain to screen:**

```
`subscriberCount.dal.js` → `follow.controller.js` → `useSubscribeAction.js` → `useSubscribeAction.adapter.js` → `ActorProfileHeader.jsx`
```

### `actorPrivacy.dal.js`

**Direct callers:**

- `readActorProfile.dal.js` _DAL_
- `actorPrivacy.controller.js` _Controller_
- `getActorPrivacy.controller.js` _Controller_

**Full call chain to screen:**

```
`actorPrivacy.dal.js` → `readActorProfile.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `VportProfileViewScreen.jsx`
```
```
`actorPrivacy.dal.js` → `readActorProfile.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `ActorProfileViewScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `followRequest.model.js`, `followRelationState.model.js` |
| **Controller** | ✓ PRESENT | `followRequests.controller.js`, `follow.controller.js`, `getFollowRelationshipState.controller.js`, `getFollowStatus.controller.js`, `getFollowerCount.controller.js`, `unsubscribe.controller.js` +1 more |
| **Adapter** | ✓ PRESENT | `PrivateProfileNotice.adapter.js`, `useFollowRequestActions.adapter.js`, `useIncomingFollowRequests.adapter.js`, `useSendFollowRequest.adapter.js`, `useSubscribeAction.adapter.js`, `SubscribeDebugPanel.adapter.js` +5 more |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useFollowRequestActions.js`, `useFollowRequestStatus.js`, `useIncomingFollowRequests.js`, `useSendFollowRequest.js`, `useSocialFollowRequestOps.js`, `useSubscribeAction.js` +5 more |
| **Component** | ✓ PRESENT | `PrivateProfileNotice.jsx`, `SubscribeDebugPanel.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Model

_Pure transforms — no side effects, no DB access_

- `features/social/friend/request/models/followRequest.model.js`
- `features/social/friend/subscribe/model/followRelationState.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/social/friend/request/controllers/followRequests.controller.js`
- `features/social/friend/subscribe/controllers/follow.controller.js`
- `features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js`
- `features/social/friend/subscribe/controllers/getFollowStatus.controller.js`
- `features/social/friend/subscribe/controllers/getFollowerCount.controller.js`
- `features/social/friend/subscribe/controllers/unsubscribe.controller.js`
- `features/social/privacy/controllers/getActorPrivacy.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/social/adapters/components/PrivateProfileNotice.adapter.js`
- `features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter.js`
- `features/social/adapters/friend/request/hooks/useIncomingFollowRequests.adapter.js`
- `features/social/adapters/friend/request/hooks/useSendFollowRequest.adapter.js`
- `features/social/adapters/friend/request/hooks/useSubscribeAction.adapter.js`
- `features/social/adapters/friend/subscribe/components/SubscribeDebugPanel.adapter.js`
- `features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter.js`
- `features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter.js`
- `features/social/adapters/friend/subscribe/hooks/useFollowerCount.adapter.js`
- `features/social/adapters/privacy/hooks/useActorPrivacy.adapter.js`
- `features/social/adapters/social.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/social/friend/request/hooks/useFollowRequestActions.js`
- `features/social/friend/request/hooks/useFollowRequestStatus.js`
- `features/social/friend/request/hooks/useIncomingFollowRequests.js`
- `features/social/friend/request/hooks/useSendFollowRequest.js`
- `features/social/friend/request/hooks/useSocialFollowRequestOps.js`
- `features/social/friend/request/hooks/useSubscribeAction.js`
- `features/social/friend/subscribe/hooks/useFollowActorToggle.js`
- `features/social/friend/subscribe/hooks/useFollowStatus.js`
- `features/social/friend/subscribe/hooks/useFollowerCount.js`
- `features/social/friend/subscribe/hooks/useUnsubscribeAction.js`
- `features/social/privacy/hooks/useActorPrivacy.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/social/components/PrivateProfileNotice.jsx`
- `features/social/friend/subscribe/components/SubscribeDebugPanel.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## ARCHITECT Scan — 2026-05-11

_Scope: VCSM — live grep dead code audit_
_Method: Import trace + file read_
_Confidence: LIVE\_VERIFIED_

### Function Status (Live Verified)

| Function | File | Status | Callers | Notes |
|---|---|---|---|---|
| `dalDeactivateFollow` | `actorFollows.dal.js` | **ACTIVE** | 1 (`unsubscribe.controller.js`) | Correct layer — own feature |
| `dalGetFollowStatus` | `actorFollows.dal.js` | **ACTIVE** | 1 (`getFollowStatus.controller.js`) | Correct layer — own feature |
| `dalInsertFollow` | `actorFollows.dal.js` | **ACTIVE** | 2 (`follow.controller.js`, `followRequests.controller.js`) | Correct layer — own feature |
| `dalGetActorPrivacy` | `actorPrivacy.dal.js` | **ACTIVE — CROSS-FEATURE + DUPLICATE** | 3 external | DAL→DAL cross-feature from profiles; duplicate implementation exists in settings feature |
| `invalidateActorPrivacyCache` | `actorPrivacy.dal.js` | **ACTIVE — CROSS-FEATURE** | 1 external | `settings/privacy/controller` imports directly from social DAL — boundary violation |
| `dalGetRequestStatus` | `followRequests.dal.js` | **ACTIVE** | 1 (`followRequests.controller.js`) | Correct layer — own feature |
| `dalListIncomingPendingRequests` | `followRequests.dal.js` | **ACTIVE** | 1 (`followRequests.controller.js`) | Correct layer — own feature |
| `dalListOutgoingRequests` | `followRequests.dal.js` | **CONFIRMED DEAD** | 0 | Zero external callers. Defined at line 133 of `followRequests.dal.js` — never imported. |
| `dalUpdateRequestStatus` | `followRequests.dal.js` | **ACTIVE** | 2 (`unsubscribe.controller.js`, `followRequests.controller.js`) | Correct layer — own feature |
| `dalUpsertPendingRequest` | `followRequests.dal.js` | **ACTIVE** | 1 (`followRequests.controller.js`) | Correct layer — own feature |
| `dalCountSubscribers` | `subscriberCount.dal.js` | **ACTIVE — DUPLICATE** | 1 correct | `profiles/kinds/vport/dal/subscribersCount.dal.js` has a separate `dalCountSubscribers` reading same table |
| `invalidateFollowerCount` | `subscriberCount.dal.js` | **ACTIVE** | 2 (`follow.controller.js`, `unsubscribe.controller.js`) | Cache invalidation — correctly called on write paths |

### Schema Correction

Doc documented tables without schema prefix. All three tables use `vc` schema:

| Original doc | Corrected |
|---|---|
| `actor_follows` | `vc.actor_follows` |
| `actor_privacy_settings` | `vc.actor_privacy_settings` |
| `social_follow_requests` | `vc.social_follow_requests` |

### Operation Correction

`actorPrivacy.dal.js` was listed as `read · delete`. The actual implementation is read-only. `invalidateActorPrivacyCache` busts a module-level TTL cache — it does not perform a database DELETE. Corrected: `actorPrivacy.dal.js` operations are `read` only.

### `dalGetActorPrivacy` — Duplicate DAL Analysis (Live Verified)

Two separate DAL functions with the same name reading the same table exist in two different features:

| File | Feature | Calling Convention | Return Shape | Cache |
|---|---|---|---|---|
| `social/privacy/dal/actorPrivacy.dal.js` | `social` | `{ actorId }` (object) | `{ isPrivate: Boolean }` | TTL 30s + in-flight dedup |
| `settings/privacy/dal/visibility.dal.js` | `settings` | `actorId` (string) | `Boolean` | None |

Both read from `vc.actor_privacy_settings`. The social version is the canonical, performance-optimized implementation. The settings version is a simpler older pattern with no cache. Callers using both exist — different calling conventions mean they cannot be transparently merged without caller updates.

### `dalCountSubscribers` — Duplicate DAL Analysis (Live Verified)

Two separate `dalCountSubscribers` implementations reading `vc.actor_follows`:

| File | Feature | Local or Import |
|---|---|---|
| `social/friend/subscribe/dal/subscriberCount.dal.js` | `social` | Own definition |
| `profiles/kinds/vport/dal/subscribersCount.dal.js` | `profiles` | Own definition (not an import from social) |

`profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` imports from its own local `profiles/kinds/vport/dal/subscribersCount.dal.js` — this is within the profiles feature boundary (correct). However, two independent DAL implementations reading the same table is an ownership ambiguity.

### `dalGetActorPrivacy` — Cross-Feature Caller Map (Live Verified)

| Importing File | Feature | Import Path | Violation |
|---|---|---|---|
| `social/privacy/controllers/getActorPrivacy.controller.js` | `social` | own feature | NO |
| `profiles/dal/readActorProfile.dal.js` | `profiles` | `@/features/social/privacy/dal/actorPrivacy.dal` | YES — DAL→DAL cross-feature |
| `dev/diagnostics/groups/settingsPrivacyFeature.group.js` | dev | direct DAL import | DEV-ONLY — not production |

### `invalidateActorPrivacyCache` — Cross-Feature Caller Map (Live Verified)

| Importing File | Feature | Import Path | Violation |
|---|---|---|---|
| `settings/privacy/controller/actorPrivacy.controller.js` | `settings` | `@/features/social/privacy/dal/actorPrivacy.dal` | YES — controller importing across feature boundary from DAL directly |

Note: `settings/privacy/controller/actorPrivacy.controller.js` correctly imports its own read DAL from `@/features/settings/privacy/dal/visibility.dal` but bypasses the social adapter to bust the social cache. A social adapter export of `invalidateActorPrivacyCache` would fix this.

### Risk Findings

**RISK-1 — Dead export (LOW)**

`dalListOutgoingRequests` in `followRequests.dal.js` is exported but has zero callers outside its own file. Safely removable.

**Handoff:** IRONMAN

---

**RISK-2 — DAL→DAL cross-feature import (HIGH)**

`profiles/dal/readActorProfile.dal.js` imports `dalGetActorPrivacy` directly from `@/features/social/privacy/dal/actorPrivacy.dal`. A DAL in the profiles feature reaching into the social DAL layer — two violations at once: cross-feature AND DAL→DAL.

Corrective path: Expose `dalGetActorPrivacy` through `social/adapters/` and have `readActorProfile.dal.js` import from the adapter. Or restructure `readActorProfile.controller.js` to fetch privacy separately and pass it down.

**Handoff:** SENTRY

---

**RISK-3 — Cross-feature DAL import from controller (MEDIUM)**

`settings/privacy/controller/actorPrivacy.controller.js` imports `invalidateActorPrivacyCache` from `@/features/social/privacy/dal/actorPrivacy.dal` directly — skipping the social adapter layer. The write path (settings DAL) is correctly bounded, but the cache bust crosses the feature boundary at the DAL level.

Corrective path: Add `invalidateActorPrivacyCache` to `social/adapters/social.adapter.js` or a dedicated privacy adapter and re-import from there.

**Handoff:** SENTRY

---

**RISK-4 — Duplicate DAL ownership — `actor_privacy_settings` (MEDIUM)**

`vc.actor_privacy_settings` is read by two separate DAL implementations in two features (`social/privacy/dal/actorPrivacy.dal.js` and `settings/privacy/dal/visibility.dal.js`). Different calling conventions, different return shapes, no shared cache. Stale cache risk: writes bust only the social cache; if any path routes through the settings DAL implementation after a privacy write, stale data is served.

Corrective path: Designate one feature as the canonical read owner (social, which has the optimized TTL + in-flight dedup implementation). Route all reads through the social adapter. Remove the settings duplicate.

**Handoff:** IRONMAN (ownership decision) → SENTRY (migration enforcement)

---

**RISK-5 — Duplicate DAL ownership — `dalCountSubscribers` on `vc.actor_follows` (MEDIUM)**

`social/friend/subscribe/dal/subscriberCount.dal.js` and `profiles/kinds/vport/dal/subscribersCount.dal.js` both define `dalCountSubscribers` reading from `vc.actor_follows`. Both are bounded within their own features (no cross-feature import). But the same DB query exists in two places — any schema or behavior change to `actor_follows` count logic must be applied in both.

Corrective path: Designate social as the canonical owner. Expose via adapter. Profiles controller consumes the adapter.

**Handoff:** IRONMAN

---

## LOGAN Findings Append — 2026-05-11

**Task:** ARCHITECT live scan — dead code audit of social DAL. Logan findings appended.
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Final Logan Status:** MAJOR DRIFT — 0 risk findings reported, 5 found (1 HIGH, 2 MEDIUM boundary violations, 2 MEDIUM duplicate ownership, 1 LOW dead code). Schema undocumented. Operation classification incorrect.

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-01**
Finding ID: DF-01
Doc Path: `logan/vcsm/dal/vcsm.dal.social.md`
Code Path: `features/social/friend/request/dal/followRequests.dal.js`
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: LOW
Documentation Truth Status: CORRECTED (appended)
Current doc behavior: 0 risk findings. `dalListOutgoingRequests` treated as active.
Actual code behavior: Zero external callers. Exported but never imported anywhere in production code.
Risk: Dead exports accumulate maintenance cost and create confusion during refactors.
Recommended documentation update: APPLIED — status corrected to CONFIRMED DEAD.

**LOGAN DRIFT FINDING — DF-02**
Finding ID: DF-02
Doc Path: `logan/vcsm/dal/vcsm.dal.social.md`
Code Path: `features/profiles/dal/readActorProfile.dal.js` → `features/social/privacy/dal/actorPrivacy.dal.js`
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: HIGH
Documentation Truth Status: CORRECTED (appended)
Current doc behavior: `actorPrivacy.dal.js` call chain shows `readActorProfile.dal.js` as caller — presented as if this is normal. No violation flagged.
Actual code behavior: Direct DAL→DAL cross-feature import. Profiles DAL imports social DAL directly — violates both the DAL-calls-only-own-layer rule and the cross-feature boundary contract.
Risk: Any refactor of social DAL path or interface breaks profiles profile loading silently.
Recommended documentation update: APPLIED — RISK-2 documented, SENTRY handoff noted.

**LOGAN DRIFT FINDING — DF-03**
Finding ID: DF-03
Doc Path: `logan/vcsm/dal/vcsm.dal.social.md`
Code Path: `features/settings/privacy/controller/actorPrivacy.controller.js`
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: MEDIUM
Documentation Truth Status: CORRECTED (appended)
Current doc behavior: No mention of cross-feature consumers of social DAL.
Actual code behavior: Settings controller imports `invalidateActorPrivacyCache` directly from social DAL — bypassing social adapter layer.
Risk: Settings feature is coupled to social DAL internals. Social cache refactor breaks settings write path silently.
Recommended documentation update: APPLIED — RISK-3 documented, SENTRY handoff noted.

**LOGAN DRIFT FINDING — DF-04**
Finding ID: DF-04
Doc Path: `logan/vcsm/dal/vcsm.dal.social.md`
Code Path: `features/social/privacy/dal/actorPrivacy.dal.js` + `features/settings/privacy/dal/visibility.dal.js`
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: MEDIUM
Documentation Truth Status: CORRECTED (appended)
Current doc behavior: `actorPrivacy.dal.js` presented as sole reader of `actor_privacy_settings`.
Actual code behavior: Two separate implementations read the same table with incompatible interfaces. Social version has TTL cache + in-flight dedup; settings version has none. Both return different shapes.
Risk: Stale data served if write path only busts one cache. Dual ownership with no single source of truth.
Recommended documentation update: APPLIED — duplicate analysis documented, RISK-4 recorded.

**LOGAN DRIFT FINDING — DF-05**
Finding ID: DF-05
Doc Path: `logan/vcsm/dal/vcsm.dal.social.md`
Code Path: Both DAL files
Drift Status: MINOR DRIFT
Drift Severity: LOW
Documentation Truth Status: CORRECTED (appended)
Current doc behavior: Tables listed without schema prefix. `actorPrivacy.dal.js` listed as `read · delete`.
Actual code behavior: All tables use `vc` schema. `actorPrivacy.dal.js` is read-only — `invalidateActorPrivacyCache` is a cache bust, not a DB DELETE.
Risk: Developer confusion on schema and operation type.
Recommended documentation update: APPLIED — schema corrected, operation classification corrected.

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | (inline this session) | Dead code verification, cross-feature import trace, schema + operation audit, duplicate DAL detection | PRESENT |
| SENTRY | — | RISK-2 and RISK-3: cross-feature DAL imports require boundary fix | MISSING |
| IRONMAN | — | RISK-1, RISK-4, RISK-5: dead export removal + duplicate ownership decisions | MISSING |
| VENOM | — | Recommended — `vc.actor_privacy_settings` is a trust-sensitive read (privacy mode enforcement) | MISSING |
| FALCON | — | Recommended — social follow + privacy graph is native-critical | MISSING |

### RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| SENTRY | RISK-2 — `readActorProfile.dal.js` DAL→DAL cross-feature; RISK-3 — `settings` controller direct social DAL import |
| IRONMAN | RISK-1 — `dalListOutgoingRequests` dead export removal; RISK-4 — `actor_privacy_settings` ownership decision; RISK-5 — `dalCountSubscribers` ownership decision |
| VENOM | Privacy enforcement: `actor_privacy_settings` is the gate for private accounts — any cache or read path drift could expose private data |
| FALCON | Follow graph, privacy settings, and subscriber counts are all native-critical for social presence UX |

---

## ARCHITECT Scan — Full Call Chain Map — 2026-05-11

_Scope: VCSM — live grep trace: DAL → Model → Controller → Hook → Adapter → Component → Screen_
_Method: Recursive import trace_
_Confidence: LIVE\_VERIFIED_

---

### Final Screens That Touch This DAL

| Screen | Path | DAL Entry Points |
|---|---|---|
| `CentralFeedScreen.jsx` | `features/feed/screens/` | `dalGetFollowStatus`, `dalDeactivateFollow`, `dalInsertFollow` (via toggle follow) |
| `ActorProfileViewScreen.jsx` | `features/profiles/screens/views/` | `dalInsertFollow`, `dalDeactivateFollow`, `dalGetFollowStatus`, `dalCountSubscribers`, `dalGetActorPrivacy` |
| `VportProfileViewScreen.jsx` | `features/profiles/kinds/vport/screens/` | `dalInsertFollow`, `dalDeactivateFollow`, `dalGetFollowStatus`, `dalCountSubscribers`, `dalGetActorPrivacy` |
| `NotificationsScreen.jsx` | `features/notifications/screen/` | `dalGetRequestStatus`, `dalListIncomingPendingRequests`, `dalUpsertPendingRequest`, `dalUpdateRequestStatus` (via follow request accept/decline) |
| `SettingsScreen.jsx` → `PrivacyTab.view.jsx` | `features/settings/screen/` + `features/settings/privacy/ui/` | `dalGetActorPrivacy`, `invalidateActorPrivacyCache`, `dalListIncomingPendingRequests` (via pending follow requests panel) |

---

### Full Chain — `actorFollows.dal.js`

Functions: `dalInsertFollow`, `dalDeactivateFollow`, `dalGetFollowStatus`

#### Subscribe / Unsubscribe path → Actor Profile + Vport Profile

```
actorFollows.dal.js
 → follow.controller.js (ctrlSubscribe)
   → useSubscribeAction.js (hook) [also calls ctrlUnsubscribe, ctrlGetFollowStatus]
     → useSubscribeAction.adapter.js (adapter)
       → ActorProfileHeader.jsx (component)
         → ActorProfileViewScreen.jsx (VIEW SCREEN)
         → VportProfileHeader.jsx (component)
           → VportProfileViewScreen.jsx (VIEW SCREEN)
```

#### Subscribe / Unsubscribe path → Central Feed (follow toggle in feed)

```
actorFollows.dal.js
 → follow.controller.js (ctrlSubscribe)
   → useFollowActorToggle.js (hook) [also calls ctrlUnsubscribe, ctrlGetFollowStatus]
     → useFollowActorToggle.adapter.js (adapter)
       → useCentralFeedActions.js (feed hook)
         → CentralFeedScreen.jsx (VIEW SCREEN)
```

#### Follow Status check path → Profile Gate

```
actorFollows.dal.js
 → getFollowStatus.controller.js (ctrlGetFollowStatus)
   → useFollowStatus.js (hook)
     → useFollowStatus.adapter.js (adapter)
       → useProfileGate.js (profiles hook)
         → ActorProfileViewScreen.jsx (VIEW SCREEN)
         → VportProfileViewScreen.jsx (VIEW SCREEN)
       → useCentralFeedActions.js
         → CentralFeedScreen.jsx (VIEW SCREEN)
```

#### Unsubscribe path

```
actorFollows.dal.js
 → unsubscribe.controller.js (ctrlUnsubscribe)
   → useUnsubscribeAction.js (hook)
     → useSubscribeAction.js (hook) ← same adapter chain above
   → useFollowActorToggle.js (hook) ← same feed chain above
```

#### Intermediate controller — relationship state aggregator

```
actorFollows.dal.js
 → getFollowStatus.controller.js
   → getFollowRelationshipState.controller.js (aggregator — also calls ctrlSendFollowRequest, ctrlGetActorPrivacy)
     → follow.controller.js (on subscribe — checks existing state before inserting)
     → useSubscribeAction.js ← profile header chain
```

---

### Full Chain — `followRequests.dal.js`

Functions: `dalGetRequestStatus`, `dalListIncomingPendingRequests`, `dalUpsertPendingRequest`, `dalUpdateRequestStatus`
Dead: `dalListOutgoingRequests` (zero callers)

#### Send follow request → Notifications + Feed

```
followRequests.dal.js
 → followRequests.controller.js (ctrlSendFollowRequest)
   → useSendFollowRequest.js (hook)
     → social.adapter.js (barrel adapter)
       → useNotificationsInternal.js
         → useNotificationInbox.js
           → useNotifications.js
             → NotificationsScreenView.jsx
               → NotificationsScreen.jsx (FINAL SCREEN)
   → useFollowRequestActions.js (hook)
     → social.adapter.js ← same notifications chain
   → useFollowActorToggle.js (hook)
     → useFollowActorToggle.adapter.js
       → useCentralFeedActions.js
         → CentralFeedScreen.jsx (VIEW SCREEN)
```

#### List incoming follow requests → Settings Privacy Tab + Notifications

```
followRequests.dal.js
 → followRequests.controller.js (ctrlListIncomingRequests)
   → useIncomingFollowRequests.js (hook)
     → social.adapter.js
       → useNotificationsInternal.js ← notifications chain above
   → PendingFollowRequests.jsx (component — settings)
     → PrivacyTab.view.jsx (view)
       → SettingsScreen.jsx (FINAL SCREEN)
```

#### Accept / Decline follow request → Notifications + Settings

```
followRequests.dal.js
 → followRequests.controller.js (ctrlAcceptFollowRequest, ctrlDeclineFollowRequest)
   → useFollowRequestActions.js (hook)
     → social.adapter.js ← notifications chain
     → PendingFollowRequests.jsx ← PrivacyTab.view.jsx ← SettingsScreen.jsx
     → FollowRequestItem.view.jsx (notification item component)
       → NotificationItem.view.jsx
         → Notifications.view.jsx
           → NotificationsScreen.jsx (FINAL SCREEN)
```

#### Cancel follow request → same hooks as above

```
followRequests.dal.js
 → followRequests.controller.js (ctrlCancelFollowRequest)
   → useFollowRequestActions.js (hook) ← same chain
```

---

### Full Chain — `subscriberCount.dal.js`

Functions: `dalCountSubscribers`, `invalidateFollowerCount`

#### Subscriber count display → Profile Header

```
subscriberCount.dal.js
 → getFollowerCount.controller.js (ctrlGetFollowerCount)
   → useFollowerCount.js (hook)
     → useFollowerCount.adapter.js (adapter)
       → ActorProfileHeader.jsx (component)
         → ActorProfileViewScreen.jsx (VIEW SCREEN)
         → VportProfileHeader.jsx
           → VportProfileViewScreen.jsx (VIEW SCREEN)
```

#### Cache invalidation on write → triggered by subscribe/unsubscribe

```
subscriberCount.dal.js
 → follow.controller.js (calls invalidateFollowerCount after insert)
   → [same subscribe chain — ActorProfileHeader / CentralFeed]
 → unsubscribe.controller.js (calls invalidateFollowerCount after deactivate)
   → [same unsubscribe chain]
```

---

### Full Chain — `actorPrivacy.dal.js`

Functions: `dalGetActorPrivacy`, `invalidateActorPrivacyCache`

#### Privacy read → Profile Gate (private account enforcement)

```
actorPrivacy.dal.js
 → getActorPrivacy.controller.js (ctrlGetActorPrivacy)
   → useActorPrivacy.js (hook, social)
     → useActorPrivacy.adapter.js (adapter)
       → useProfileGate.js (profiles hook)
         → ActorProfileViewScreen.jsx (VIEW SCREEN)
         → VportProfileViewScreen.jsx (VIEW SCREEN)
```

#### Privacy read → Settings Privacy Toggle

```
actorPrivacy.dal.js
 → getActorPrivacy.controller.js (ctrlGetActorPrivacy)
   → usePrivacySettings.js (settings query hook)
     → settings/privacy/hooks/useActorPrivacy.js (settings hook — NOTE: different from social hook)
   → useActorPrivacy.adapter.js
     → ProfilePrivacyToggle.jsx (component)
       → PrivacyTab.view.jsx
         → SettingsScreen.jsx (FINAL SCREEN)
```

#### Privacy read → Relationship State (blocks subscribe if private)

```
actorPrivacy.dal.js
 → getActorPrivacy.controller.js (ctrlGetActorPrivacy)
   → getFollowRelationshipState.controller.js (aggregator)
     → follow.controller.js ← subscribe chain
     → useSubscribeAction.js ← ActorProfileHeader chain
```

#### Privacy read — CROSS-FEATURE DAL→DAL VIOLATION (RISK-2)

```
actorPrivacy.dal.js
 → profiles/dal/readActorProfile.dal.js  ← DAL→DAL cross-feature import
   → getProfileView.controller.js
     → useProfileView.js
       → VportProfileViewScreen.jsx (VIEW SCREEN)
       → ActorProfileViewScreen.jsx (VIEW SCREEN)
```

#### Cache invalidation → Settings Write Path (RISK-3)

```
actorPrivacy.dal.js (invalidateActorPrivacyCache)
 → settings/privacy/controller/actorPrivacy.controller.js  ← cross-feature direct DAL import
   → [settings write path — called by ProfilePrivacyToggle.jsx on toggle]
```

---

### Model Layer

| Model | Path | Used By |
|---|---|---|
| `followRequest.model.js` | `social/friend/request/models/` | `followRequests.controller.js` — shapes incoming request data |
| `followRelationState.model.js` | `social/friend/subscribe/model/` | `getFollowRelationshipState.controller.js` — composes follow + privacy + request state |

---

### Complete Surface Map

| Layer | File | Feature |
|---|---|---|
| **DAL** | `actorFollows.dal.js` | `social` |
| **DAL** | `actorPrivacy.dal.js` | `social` |
| **DAL** | `followRequests.dal.js` | `social` |
| **DAL** | `subscriberCount.dal.js` | `social` |
| **Model** | `followRequest.model.js` | `social` |
| **Model** | `followRelationState.model.js` | `social` |
| **Controller** | `follow.controller.js` | `social` |
| **Controller** | `unsubscribe.controller.js` | `social` |
| **Controller** | `getFollowStatus.controller.js` | `social` |
| **Controller** | `getFollowerCount.controller.js` | `social` |
| **Controller** | `getFollowRelationshipState.controller.js` | `social` (aggregator) |
| **Controller** | `followRequests.controller.js` | `social` |
| **Controller** | `getActorPrivacy.controller.js` | `social` |
| **Controller** ⚠ | `actorPrivacy.controller.js` | `settings` — cross-feature boundary violation |
| **Hook** | `useSubscribeAction.js` | `social` |
| **Hook** | `useUnsubscribeAction.js` | `social` |
| **Hook** | `useFollowStatus.js` | `social` |
| **Hook** | `useFollowerCount.js` | `social` |
| **Hook** | `useFollowActorToggle.js` | `social` |
| **Hook** | `useFollowRequestActions.js` | `social` |
| **Hook** | `useFollowRequestStatus.js` | `social` |
| **Hook** | `useIncomingFollowRequests.js` | `social` |
| **Hook** | `useSendFollowRequest.js` | `social` |
| **Hook** | `useSocialFollowRequestOps.js` | `social` |
| **Hook** | `useActorPrivacy.js` | `social` |
| **Hook** ⚠ | `usePrivacySettings.js` | `settings` — reaches social controller |
| **Hook** ⚠ | `useCentralFeedActions.js` | `feed` — cross-feature via adapter |
| **Hook** ⚠ | `useProfileGate.js` | `profiles` — cross-feature via adapter |
| **Adapter** | `useFollowActorToggle.adapter.js` | `social/adapters/` |
| **Adapter** | `useFollowStatus.adapter.js` | `social/adapters/` |
| **Adapter** | `useFollowerCount.adapter.js` | `social/adapters/` |
| **Adapter** | `useSubscribeAction.adapter.js` | `social/adapters/` |
| **Adapter** | `useActorPrivacy.adapter.js` | `social/adapters/` |
| **Adapter** | `useFollowRequestActions.adapter.js` | `social/adapters/` |
| **Adapter** | `useIncomingFollowRequests.adapter.js` | `social/adapters/` |
| **Adapter** | `useSendFollowRequest.adapter.js` | `social/adapters/` |
| **Adapter** | `SubscribeDebugPanel.adapter.js` | `social/adapters/` |
| **Adapter** | `PrivateProfileNotice.adapter.js` | `social/adapters/` |
| **Adapter** | `social.adapter.js` | `social/adapters/` (barrel) |
| **Component** | `ActorProfileHeader.jsx` | `profiles` |
| **Component** | `VportProfileHeader.jsx` | `profiles/kinds/vport/` |
| **Component** | `PrivateProfileNotice.jsx` | `social` |
| **Component** | `SubscribeDebugPanel.jsx` | `social` |
| **Component** | `ProfilePrivacyToggle.jsx` | `settings/privacy/ui/` |
| **Component** | `PendingFollowRequests.jsx` | `settings/privacy/ui/` |
| **Component** | `FollowRequestItem.view.jsx` | `notifications/types/follow/` |
| **Component** | `NotificationItem.view.jsx` | `notifications/inbox/ui/` |
| **View** | `ActorProfileViewScreen.jsx` | `profiles/screens/views/` |
| **View** | `VportProfileViewScreen.jsx` | `profiles/kinds/vport/screens/` |
| **View** | `PrivacyTab.view.jsx` | `settings/privacy/ui/` |
| **View** | `NotificationsScreenView.jsx` | `notifications/screen/views/` |
| **View** | `Notifications.view.jsx` | `notifications/inbox/ui/` |
| **Final Screen** | `CentralFeedScreen.jsx` | `feed/screens/` |
| **Final Screen** | `SettingsScreen.jsx` | `settings/screen/` |
| **Final Screen** | `NotificationsScreen.jsx` | `notifications/screen/` |

---

### Prompt Registry Entry

Timestamp: 2026-05-11
Planning File: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`

### Change Log Entry

Task: ARCHITECT dead code audit + Logan findings appended to social DAL doc.
Application Scope: VCSM
Code Status Before: 0 risk findings. Schema undocumented. Operations misclassified. Cross-feature violations invisible. Duplicate DALs undocumented.
Code Status After: 5 risk findings documented (1 HIGH, 2 MEDIUM, 1 LOW dead code, 1 LOW schema/operation). Schema corrected for all 3 tables. Operation classification corrected for actorPrivacy. Cross-feature import map recorded. Duplicate DAL ownership documented.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md` — findings appended
Documentation Truth Status: PARTIAL — findings appended. Full Logan 13-section restructure deferred.

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/social/adapters/privacy/actorPrivacy.adapter.js` | Added approved adapter functions for privacy read and social privacy cache invalidation. |
| `apps/VCSM/src/features/social/privacy/controllers/getActorPrivacy.controller.js` | Added controller-level cache invalidation export so the adapter does not import DAL directly. |
| `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js` | Replaced direct cross-feature social DAL import with the social privacy adapter. |
| `apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js` | Replaced direct cross-feature social DAL cache invalidator import with the social privacy adapter. |
| `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js` | DEV-gated the actor privacy DAL error log; fail-closed behavior is unchanged. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| RISK-2: profiles DAL directly imports social privacy DAL | DONE | `readActorProfile.dal.js` now imports `getActorPrivacyAdapter` from `features/social/adapters/privacy/actorPrivacy.adapter.js`. |
| RISK-3: settings controller directly imports social privacy DAL cache invalidator | DONE | `actorPrivacy.controller.js` now imports `invalidateActorPrivacyCacheAdapter` through the social adapter boundary. |
| Social privacy DAL production `console.error` | DONE | Error logging is DEV-only; the DAL still returns `{ isPrivate: true }` on read errors. |
| RISK-1: `dalListOutgoingRequests` dead export | DEFERRED | Verified export remains; no deletion performed under the no-delete instruction. |
| RISK-4: duplicate `actor_privacy_settings` ownership between social/settings | PARTIAL | Cross-feature callers now use the social adapter for social cache/read behavior. Settings still has its own DAL/read shape and ownership decision remains IRONMAN/SENTRY. |
| RISK-5: duplicate `dalCountSubscribers` between social/profiles | DEFERRED | Verified both implementations remain feature-local; consolidation requires ownership decision. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md`
  - `sed -n '1,280p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md`
  - `sed -n '281,620p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md`
  - `sed -n '621,840p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.social.md`
  - `sed -n '1,180p' apps/VCSM/src/features/social/adapters/social.adapter.js`
  - `sed -n '1,90p' apps/VCSM/src/features/social/adapters/privacy/hooks/useActorPrivacy.adapter.js`
  - `sed -n '1,90p' apps/VCSM/src/features/social/privacy/controllers/getActorPrivacy.controller.js`
  - `sed -n '1,90p' apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js`
  - `sed -n '1,80p' apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js`
  - `sed -n '1,90p' apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js`
  - `find apps/VCSM/src/features/social/adapters -type f -maxdepth 5 | sort`
  - `rg -n "features/social/privacy/dal/actorPrivacy\\.dal|dalListOutgoingRequests|dalCountSubscribers|invalidateActorPrivacyCache|dalGetActorPrivacy" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `rg -n "features/social/privacy/dal/actorPrivacy\\.dal|features/social/adapters/privacy/actorPrivacy\\.adapter|dalListOutgoingRequests|dalCountSubscribers|invalidateActorPrivacyCache|dalGetActorPrivacy|console\\.error" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `npm run build`
- Production callers checked:
  - `features/social/privacy/dal/actorPrivacy.dal`: direct imports now only occur inside social's own controller; cross-feature direct DAL imports removed.
  - `readActorProfile.dal.js`: now calls `getActorPrivacyAdapter`.
  - `settings/privacy/controller/actorPrivacy.controller.js`: now calls `invalidateActorPrivacyCacheAdapter`.
  - `dalListOutgoingRequests`: still no production caller found.
  - `dalCountSubscribers`: social and profiles implementations both remain feature-local.
- Remaining risks:
  - Dead `dalListOutgoingRequests` export remains pending IRONMAN due to no-delete instruction.
  - Duplicate privacy DAL ownership remains unresolved; settings still owns its own boolean read/write path.
  - Duplicate subscriber count ownership remains unresolved.
  - Build passed; existing Vite chunk-size warnings and the pre-existing `VerifyEmailRequiredScreen.jsx` mixed static/dynamic import warning remain.

### Status
PARTIAL
