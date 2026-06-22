# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: feed | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Command | BLACKWIDOW V2 (BW2.5 V2) |
| Feature | feed |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | Automated BW Agent |
| Report Path | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_feed-adversarial-review.md |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Map Freshness | FRESH (~7h old) |
| Security Paths in Feature | 1 |
| Total Platform Security Paths | 598 |
| Callgraph Nodes (feed) | 99 |
| Callgraph Edges (feed) | 92 |
| Write Paths (feed scanner) | 1 (LOW confidence — no confirmed route) |
| RPC Paths (feed scanner) | 0 |

---

## 3. Scanner Inputs

| Input | Value |
|---|---|
| security-path-map.json | apps/scanner/maps/security-path-map.json |
| callgraph.json | apps/scanner/maps/callgraph.json |
| write-execution-map.json | apps/scanner/maps/write-execution-map.json |
| rpc-execution-map.json | apps/scanner/maps/rpc-execution-map.json |
| BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md |
| SECURITY.md | ZZnotforproduction/APPS/VCSM/features/feed/SECURITY.md |

---

## 4. Attack Surface Inventory

### 4A. Behavior Contract Status

BEHAVIOR.md status: **PLACEHOLDER**

No §4 Failure Paths defined. No §9 Must Never Happen invariants defined.
All §9 invariant attacks are UNANCHORED — source-inferred attack surfaces used instead.

Pre-existing VENOM finding VEN-FEED-001 (HIGH): BEHAVIOR.md is PLACEHOLDER — this is a confirmed governance gap.

### 4B. Open VENOM / ELEKTRA Findings (Cross-Reference Targets)

| ID | Severity | Description | Status |
|---|---|---|---|
| VEN-FEED-001 | HIGH | BEHAVIOR.md PLACEHOLDER — no security rules defined | OPEN |
| VEN-FEED-002 | MEDIUM | Unguarded console.log in fetchFeedPage.pipeline.js:137 | OPEN |
| VEN-FEED-003 | MEDIUM | actorId passed as userId to readOwnedActorIdsByUserIdDAL — identity field confusion | OPEN |
| VEN-FEED-004 | MEDIUM | listActorPosts controller accepts viewerActorId but discards it — RLS-only | OPEN |
| VEN-FEED-005 | HIGH | vport.profiles owner-only RLS → null vport bundle entries → vport posts hidden | OPEN |
| VEN-FEED-006 | LOW | null realmId skips realm filter — all realms exposed to partially-onboarded users | OPEN |
| ELEK-* | N/A | ELEKTRA has never run | NOT RUN |

### 4C. Security Path Confidence Classification

| Path | Confidence | Write Surface | Table | Notes |
|---|---|---|---|---|
| feed → markWelcomeFeedCardSeenDAL | LOW | upsert | vc.actor_onboarding_steps | No confirmed route — PRIMARY ATTACK TARGET |

LOW confidence = no confirmed sourceRoute. Per BW-002, this is the primary attack target.

### 4D. Hook Entry Points (UI-Accessible)

| Hook | Write Surfaces Reachable |
|---|---|
| useFeedWelcomeCard | ctrlMarkWelcomeCardSeen → markWelcomeFeedCardSeenDAL (upsert) |
| useFeed | fetchFeedPagePipeline (read pipeline only) |
| useCentralFeed | fetchCentralFeedPage → fetchFeedPagePipeline (read pipeline only) |
| useCentralFeedActions | deletePost, followToggle, blockActor, hidePost (cross-feature adapters) |
| useDebugPrivacyRows | getDebugPrivacyRowsController (reads only) |

### 4E. DAL Write Surfaces

| DAL Function | Table | Operation | File |
|---|---|---|---|
| markWelcomeFeedCardSeenDAL | vc.actor_onboarding_steps | upsert | feed/dal/feedWelcomeCard.dal.js |

Note: All other DAL files in the feed feature are read-only. Cross-feature write surfaces (delete post, block, follow, hide) are invoked via adapter imports — those are owned by their respective features and are outside BW-FEED scope.

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| LOW confidence write paths | 1 (markWelcomeFeedCardSeenDAL) |
| HIGH confidence write paths | 0 |
| RPC paths | 0 |
| Callgraph layer breakdown | barrel:3, component:6, controller:8, dal:28, hook:19, model:11, module:21, screen:3 |

The scanner found 1 write surface with LOW confidence (no confirmed route). This matches BW-002 rule: LOW confidence paths are the PRIMARY attack target. All other feed surfaces are read-only at the DAL layer.

---

## 6. Adversarial Path Analysis

### 6A. Attack Scenario: OWNERSHIP BYPASS

**Target:** `ctrlMarkWelcomeCardSeen({ actorId })` → `markWelcomeFeedCardSeenDAL({ actorId })`

**Attack:** Attacker passes `actorId = victimActorId` to mark the welcome card as seen for another actor.

**Source Trace:**

`useFeedWelcomeCard.js:47` calls `ctrlMarkWelcomeCardSeen({ actorId })` where `actorId` is passed as a prop from the parent.

`feedWelcomeCard.controller.js:12`:
```
export async function ctrlMarkWelcomeCardSeen({ actorId }) {
  await markWelcomeFeedCardSeenDAL({ actorId })
}
```

`feedWelcomeCard.dal.js:20-42`:
```
export async function markWelcomeFeedCardSeenDAL({ actorId }) {
  if (!actorId) throw new Error('markWelcomeFeedCardSeenDAL: actorId required')
  // ... upsert into vc.actor_onboarding_steps with actor_id = actorId
```

**Analysis:** The controller accepts `actorId` from the caller without verifying it belongs to the authenticated session. There is no `actor_owners` check, no session-scoped ownership assertion, and no `viewerActorId` parameter. The only guard is `if (!actorId)` — a presence check, not an ownership check.

**RLS Dependency:** The vc.actor_onboarding_steps table's RLS policy is not verified in this scan. If RLS enforces that a user can only upsert rows for their own actor_ids, the bypass is blocked at DB level. If the table uses a permissive or missing write policy, the bypass is executable.

**Result:** PARTIAL — ownership check missing at app layer. RLS status unverified. Cannot confirm BYPASSED without DB access.

**Finding:** BW-FEED-001 (HIGH)

---

### 6B. Attack Scenario: SESSION MUTATION

**Target:** `useFeedWelcomeCard` — actorId sourced from caller

**Source Trace:**

`useFeedWelcomeCard.js:11`: `export function useFeedWelcomeCard({ actorId, kind })` — `actorId` is a prop, not read from session.

`useFeedWelcomeCard.js:47`: `if (actorId) ctrlMarkWelcomeCardSeen({ actorId }).catch(() => {})`

`useFeed.js:15`: `export function useFeed(viewerActorId, realmId, ...)` — `viewerActorId` is a parameter sourced from the caller. The hook does not independently read session state.

**Analysis:** The feed hooks do not self-authenticate. They receive `viewerActorId` / `actorId` as parameters. Whether these are sourced from a trusted session (e.g., `useIdentity()`) or from client-controlled state depends entirely on the calling component. This is an architectural pattern risk, not a confirmed bypass — the calling layer's session sourcing determines safety.

For `listActorPosts.controller.js:33-37`: `viewerActorId` is accepted but discarded — only `actorId` reaches the DAL. This confirms VEN-FEED-004. The viewerActorId guard check (`if (!viewerActorId) throw`) is present but the value is never used in the query, making it a false gate — it validates presence but provides zero access control benefit.

**Result:** PARTIAL — identity sourcing is caller-delegated; app layer does not enforce session binding.

**Finding:** BW-FEED-002 (MEDIUM)

---

### 6C. Attack Scenario: RUNTIME ABUSE — Privileged Endpoint Access

**Target:** `getDebugPrivacyRowsController` — debug endpoint exposing privacy state of all actors on the page

**Source Trace:**

`getDebugPrivacyRows.controller.js:31`: `export async function getDebugPrivacyRowsController({ actorId, postIds })`

`useDebugPrivacyRows.js:4`: hook calls this controller when `enabled` is true, passing caller-supplied `actorId`.

`getDebugPrivacyRows.controller.js:31-32`:
```
export async function getDebugPrivacyRowsController({ actorId, postIds }) {
  if (!actorId) return [];
```

**Analysis:** The debug privacy rows controller returns enriched visibility context: whether each post's actor is private, whether the viewer follows them, and whether the viewer owns them. There is no `enabled` = DEV-only guard at the controller layer. The `enabled` flag in `useDebugPrivacyRows.js:11` is passed from the hook caller — there is no enforcement that it is false in production.

Additionally, `readOwnedActorIdsByUserIdDAL(actorId)` (line 43 in controller) is called with the `actorId` parameter treated as a `userId` (VEN-FEED-003). The DAL function signature `readOwnedActorIdsByUserIdDAL(userId)` does a `.eq("user_id", userId)` query against `actor_owners`. Since an `actorId` (UUID) is different from a `userId` (auth.users UUID), this query would return 0 rows unless the values coincidentally match, producing an incorrect privacy calculation.

**Result:** PARTIAL (debug endpoint not gated at controller layer) + CONFIRMED SOURCE ISSUE (VEN-FEED-003 validated at controller:43 + dal:42-52).

**Finding:** BW-FEED-003 (MEDIUM) — debug controller has no production gate; BW-FEED-004 (LOW) — confirms VEN-FEED-003 identity field confusion.

---

### 6D. Attack Scenario: RLS VERIFICATION

**Target:** All DAL write surfaces — vc.actor_onboarding_steps

**Source Trace:**

`feedWelcomeCard.dal.js:26-42`: The upsert uses `actor_id` from the caller parameter with no additional filter:
```javascript
.upsert(
  {
    actor_id: actorId,
    step_key: STEP_KEY,
    status: 'completed',
    ...
  },
  { onConflict: 'actor_id,step_key' },
)
```

The anon/authenticated key determines what RLS policy governs this table. The scanner has not confirmed RLS coverage for `vc.actor_onboarding_steps`.

**Read DALs — RLS Assumptions:**
- `feed.read.posts.dal.js`: reads `vc.posts` without viewerActorId in query (no ownership filter). RLS-only.
- `listActorPostsByActor.dal.js`: reads `vc.posts` filtered by `actor_id = actorId`. Ownership filter present but this is a read-scoped filter, not a security gate.
- `feed.read.hiddenPosts.dal.js`: reads `moderation.actions` filtered by `.eq("actor_id", viewerActorId)` — correct scoping.
- `feed.read.blockRows.dal.js`: reads `moderation.blocks` with UUID validation (`isUuid(viewerActorId)`) and correct bilateral filter. BLOCKED.
- `feed.read.followRows.dal.js`: reads `vc.actor_follows` filtered by `.eq("follower_actor_id", viewerActorId)`. UUID validation present. BLOCKED.

**Result:** UNRESOLVED for write surface. Read surfaces are correctly scoped. The vc.actor_onboarding_steps write RLS posture is unverified.

**Finding:** BW-FEED-005 (MEDIUM) — write surface RLS unverified; app layer ownership check absent.

---

### 6E. Attack Scenario: VIEWER CONTEXT FUZZING

**Target:** Multiple controllers with null/undefined viewerActorId

**Test 1 — fetchFeedPagePipeline with null viewerActorId:**

`useFeed.js:73`: `if (!viewerActorId) { ... return; }` — early return. BLOCKED at hook layer.

`useCentralFeed.js:85`: `enabled: Boolean(viewerActorId)` — React Query disabled. BLOCKED.

`fetchFeedPagePipeline` itself has no null guard on `viewerActorId`. If called directly with null:
- `readHiddenPostsForViewer({ viewerActorId: null })` — guarded at line 6: `if (!viewerActorId ...) return hiddenByMeSet`. BLOCKED.
- `readFeedBlockRowsDAL({ viewerActorId: null })` — guarded at line 14: `if (!viewerActorId || !isUuid(viewerActorId)) return []`. BLOCKED.
- `readFeedFollowRowsDAL({ viewerActorId: null })` — guarded at line 13: `if (!viewerActorId || !isUuid(viewerActorId)) return []`. BLOCKED.

**Test 2 — listActorPosts with null viewerActorId:**

`listActorPosts.controller.js:35`: `if (!viewerActorId) throw new Error("Missing viewerActorId")` — throws. BLOCKED.

**Test 3 — ctrlMarkWelcomeCardSeen with null actorId:**

`feedWelcomeCard.controller.js:12-14`: no null guard on actorId in controller.
`feedWelcomeCard.dal.js:21`: `if (!actorId) throw new Error(...)` — throws at DAL layer. BLOCKED at DAL.

**Test 4 — getDebugPrivacyRowsController with null actorId:**

`getDebugPrivacyRows.controller.js:31-32`: `if (!actorId) return []` — returns empty, no error. BLOCKED.

**Result:** All null paths blocked before reaching write operations. BLOCKED overall.

**Finding:** No new finding — existing guards are adequate.

---

### 6F. Attack Scenario: MUTATION REPLAY

**Target:** `markWelcomeFeedCardSeenDAL` — upsert operation

**Analysis:** The welcome card seen operation is idempotent by design (upsert with `onConflict: 'actor_id,step_key'`). Replaying it results in the same final state: `status: 'completed'`. There is no terminal state that could be improperly replayed. The feed itself has no state-machine resources managed by its own DAL write surfaces. Cross-feature writes (post delete, block) are outside this feature's scope.

**Result:** BLOCKED — upsert is inherently idempotent; no state-machine vulnerability.

---

### 6G. Attack Scenario: HYDRATION POISONING

**Target:** Actor store upsert path in useFeed.js and useCentralFeed.js

**Source Trace:**

`useFeed.js:131-143`: `upsertActorsRef.current(actors.map(...))` — populates actor store from pipeline data.

`useFeed.js:150-157`: Background `hydrateActorsByIds(staleOrMissing)` — fetches canonical actor summaries for stale actors.

`useFeed.js:162-168`: Force hydration for vport actors with null names — `hydrateActorsByIds(vportActorsWithNoName, { force: true })`.

**Analysis:** The actor store receives data from two sources: the pipeline's readActorsBundle (direct table read, 30s TTL cache) and the hydration engine's `get_actor_summaries` RPC (SECURITY DEFINER). The pipeline upsert happens first with potentially incomplete data (null vport names for non-owners per VEN-FEED-005), then the force-hydration corrects it asynchronously.

The `bundleCache` in `feed.read.actorsBundle.dal.js` has a 30-second TTL. A poisoned bundle entry (e.g., injected via cache manipulation) would persist for up to 30 seconds before expiry. However, cache poisoning requires write access to the in-memory process — not a realistic remote attack vector.

The `blockCache` (60s TTL) and `followCache` (60s TTL) could cause stale block/follow state to persist if a block is reversed within the TTL window. This is a logic correctness issue, not a security bypass in the typical sense.

**Result:** BLOCKED for remote poisoning. PARTIAL for stale cache leading to incorrect visibility decisions within TTL windows.

**Finding:** BW-FEED-006 (LOW) — 60s stale follow/block cache could serve stale visibility decisions after relationship state changes.

---

### 6H. Attack Scenario: URL SURFACE

**Target:** Share links, notification links, deep links constructed by the feed feature

**Source Trace:**

`useCentralFeedActions.js:234`:
```javascript
const url = `${window.location.origin}/post/${postId}`
```

**Analysis:** The share URL uses `postId` directly as a path segment. `postId` is a UUID from the database (vc.posts.id). This violates the platform rule: "Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs."

This is a confirmed raw UUID in a public-facing share URL construction.

**Result:** BYPASSED — raw UUID exposed in share URL construction.

**Finding:** BW-FEED-007 (MEDIUM) — raw UUID in public share URL violates no-raw-IDs-in-URLs platform invariant.

Source: `useCentralFeedActions.js:234` — `const url = \`${window.location.origin}/post/${postId}\``

---

### 6I. Attack Scenario: §9 INVARIANT ATTACK

BEHAVIOR.md is a PLACEHOLDER. No §9 invariants are defined. All invariant attacks are UNANCHORED.

Source-inferred invariants from the feed domain:

**Inferred Invariant 1:** A viewer must not see posts from actors who have blocked them.

Attack: Attacker blocks viewer. Viewer loads feed. Block rows are fetched via `readFeedBlockRowsDAL` which uses UUID validation and correct bilateral filter. `buildBlockedActorSetModel` correctly adds both blocker→blocked and blocked→blocker relationships. `resolveFeedRowVisibilityModel` checks `isActorBlockedForViewerModel` first (highest priority). BLOCKED.

**Inferred Invariant 2:** A viewer must not see posts from private actors they do not follow (and do not own).

Attack: Target actor sets account to private. Viewer (non-follower, non-owner) loads feed. `canViewPrivateFeedActorModel` returns false when `isPrivate=true`, `isOwner=false`, `isFollowing=false`. Post filtered from normalized output. BLOCKED.

**Inferred Invariant 3:** A viewer must not mark another actor's welcome card as seen.

Attack: Attacker calls `ctrlMarkWelcomeCardSeen({ actorId: victimId })`. Controller has no ownership check. DAL has no ownership check. RLS status unknown. UNRESOLVED — cannot confirm BYPASSED without DB access. See BW-FEED-001.

**Inferred Invariant 4:** Feed must not serve deleted posts.

Attack: `readFeedPostsPage` DAL has `.is("deleted_at", null)` filter at line 23. BLOCKED.

**Inferred Invariant 5:** Debug privacy endpoint must not expose production visibility data to attackers.

Attack: Call `getDebugPrivacyRowsController` in production context with `enabled=true`. Controller has no environment gate. Returns full privacy visibility state (isPrivate, isFollower, isOwner) for all actors on the page. BYPASSED at controller layer — no production guard exists.

Source: `getDebugPrivacyRows.controller.js:31-84` — no `import.meta.env.DEV` guard; `useDebugPrivacyRows.js:11` — `enabled` flag is caller-controlled with no enforcement.

**Finding:** BW-FEED-008 (HIGH) — debug privacy controller exposes actor visibility state in production; no DEV-only gate at controller layer.

---

## 7. Exploitability Assessment

| Finding | Exploitability | Conditions Required |
|---|---|---|
| BW-FEED-001 | MEDIUM — requires attacker to control actorId prop; depends on RLS | Caller passes victim actorId to useFeedWelcomeCard |
| BW-FEED-002 | LOW — architectural risk; depends on caller session sourcing | Component passes stale/wrong actorId |
| BW-FEED-003 | LOW — debug endpoint; exposure depends on caller setting enabled=true | Production caller sets enabled=true |
| BW-FEED-004 | LOW — identity field confusion produces wrong privacy output, not a security bypass | getDebugPrivacyRowsController called in any context |
| BW-FEED-005 | MEDIUM — unverified RLS on write surface | DB has permissive write policy on actor_onboarding_steps |
| BW-FEED-006 | LOW — stale cache within 60s window | Block/follow state changed and feed loaded within TTL |
| BW-FEED-007 | HIGH — confirmed UUID in share URL; no conditions required | Any user opens share sheet on a post |
| BW-FEED-008 | HIGH — debug controller has no production gate | Production deployment; any caller sets enabled=true |

---

## 8. Source Verification Summary

| Finding | Source File | Line | Verification Status |
|---|---|---|---|
| BW-FEED-001 | apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js | 12-14 | SOURCE_VERIFIED |
| BW-FEED-001 | apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js | 20-42 | SOURCE_VERIFIED |
| BW-FEED-002 | apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js | 11, 47 | SOURCE_VERIFIED |
| BW-FEED-003 | apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js | 31-84 | SOURCE_VERIFIED |
| BW-FEED-003 | apps/VCSM/src/features/feed/hooks/useDebugPrivacyRows.js | 11 | SOURCE_VERIFIED |
| BW-FEED-004 | apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js | 43 | SOURCE_VERIFIED |
| BW-FEED-004 | apps/VCSM/src/features/feed/dal/feed.read.debugPrivacyRows.dal.js | 42-52 | SOURCE_VERIFIED |
| BW-FEED-005 | apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js | 26-42 | SOURCE_VERIFIED |
| BW-FEED-006 | apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js | 6 | SOURCE_VERIFIED |
| BW-FEED-006 | apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js | 6 | SOURCE_VERIFIED |
| BW-FEED-007 | apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js | 234 | SOURCE_VERIFIED |
| BW-FEED-008 | apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js | 31 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Finding | Severity | Result | Confidence | Exploit Chain Type |
|---|---|---|---|---|
| BW-FEED-001 | HIGH | PARTIAL | SOURCE_VERIFIED | Single-step (ownership bypass, RLS unverified) |
| BW-FEED-002 | MEDIUM | PARTIAL | SOURCE_VERIFIED | Single-step (session delegation) |
| BW-FEED-003 | MEDIUM | PARTIAL | SOURCE_VERIFIED | Single-step (debug exposure) |
| BW-FEED-004 | LOW | BYPASSED | SOURCE_VERIFIED | Single-step (identity field confusion) |
| BW-FEED-005 | MEDIUM | UNRESOLVED | SOURCE_VERIFIED | Single-step (RLS unverified) |
| BW-FEED-006 | LOW | PARTIAL | SOURCE_VERIFIED | Timing (stale cache) |
| BW-FEED-007 | MEDIUM | BYPASSED | SOURCE_VERIFIED | Single-step (URL construction) |
| BW-FEED-008 | HIGH | BYPASSED | SOURCE_VERIFIED | Single-step (no production gate) |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — no formal §9 invariants exist. Source-inferred invariants used.

| Inferred Invariant | Attack Designed | Result |
|---|---|---|
| Viewer must not see blocked-actor posts | readFeedBlockRowsDAL + buildBlockedActorSetModel bilateral check | BLOCKED |
| Viewer must not see private-actor posts without follow | canViewPrivateFeedActorModel logic path | BLOCKED |
| Viewer must not mark another actor's welcome card seen | ctrlMarkWelcomeCardSeen ownership check absent | UNRESOLVED (RLS dependency) |
| Deleted posts must not appear in feed | readFeedPostsPage .is("deleted_at", null) filter | BLOCKED |
| Debug privacy data must not reach production | getDebugPrivacyRows controller — no DEV gate | BYPASSED (BW-FEED-008) |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md: PLACEHOLDER

All BW findings are derived from source-code analysis. The absence of a behavior contract means:
- No §5 Security Rules to validate against
- No §9 Must Never Happen invariants to anchor attacks
- All findings are based on architectural review and platform-rule violations

Priority action: BEHAVIOR.md must be completed before the next BW run. This would likely surface additional §9 invariants related to realm isolation, adult content gating, and actor kind restrictions.

---

## 12. THOR Impact

THOR Release Blockers are findings classified as CRITICAL or HIGH with result BYPASSED.

| Finding | Severity | Result | THOR Blocker |
|---|---|---|---|
| BW-FEED-001 | HIGH | PARTIAL | NO (unresolved — needs DB verification) |
| BW-FEED-002 | MEDIUM | PARTIAL | NO |
| BW-FEED-003 | MEDIUM | PARTIAL | NO |
| BW-FEED-004 | LOW | BYPASSED | NO |
| BW-FEED-005 | MEDIUM | UNRESOLVED | NO |
| BW-FEED-006 | LOW | PARTIAL | NO |
| BW-FEED-007 | MEDIUM | BYPASSED | NO |
| BW-FEED-008 | HIGH | BYPASSED | YES — debug controller exposes actor privacy state in production |

**THOR Blocker Count: 1**

BW-FEED-008 must be resolved before feed ships to production. The debug controller (`getDebugPrivacyRowsController`) has no environment gate and exposes actor visibility metadata (isPrivate, isFollower, isOwner) to any caller that sets `enabled=true`.

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required to provide regression coverage for BW findings:

| Test ID | Finding | Test Description |
|---|---|---|
| TEST-BW-FEED-001 | BW-FEED-001 | Unit test: ctrlMarkWelcomeCardSeen must reject actorId not owned by session user |
| TEST-BW-FEED-002 | BW-FEED-002 | Unit test: useFeedWelcomeCard must source actorId from verified session, not prop |
| TEST-BW-FEED-003 | BW-FEED-003 | Integration test: getDebugPrivacyRowsController must return empty/throw in non-DEV environment |
| TEST-BW-FEED-004 | BW-FEED-004 | Unit test: readOwnedActorIdsByUserIdDAL called in getDebugPrivacyRows must receive userId not actorId |
| TEST-BW-FEED-005 | BW-FEED-005 | DB test: vc.actor_onboarding_steps RLS write policy must reject cross-actor upsert |
| TEST-BW-FEED-006 | BW-FEED-006 | Integration test: block/follow cache invalidation fires correctly on state change |
| TEST-BW-FEED-007 | BW-FEED-007 | Unit test: share URL construction must use slug not raw postId UUID |
| TEST-BW-FEED-008 | BW-FEED-008 | Unit test: getDebugPrivacyRowsController must be unreachable in production build |

---

## Summary

| Metric | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 (BW-FEED-001, BW-FEED-008) |
| MEDIUM | 3 (BW-FEED-002, BW-FEED-003, BW-FEED-005) |
| LOW | 2 (BW-FEED-004, BW-FEED-006) |
| INFO | 0 |
| BYPASSED (source-verified) | 3 (BW-FEED-004, BW-FEED-007, BW-FEED-008) |
| PARTIAL | 3 (BW-FEED-001, BW-FEED-002, BW-FEED-003) |
| UNRESOLVED | 1 (BW-FEED-005) |
| BLOCKED | Blocked paths counted per scenario above |
| THOR Blockers | 1 (BW-FEED-008) |
