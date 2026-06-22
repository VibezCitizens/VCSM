# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: feed / modules / feed | App: VCSM | Date: 2026-06-05

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Command | BLACKWIDOW V2 |
| Feature | feed / modules / feed |
| App | VCSM |
| Run Date | 2026-06-05 |
| Delta Reference | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_feed-adversarial-review.md |
| VENOM Source | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/outputs/2026/06/05/VENOM/2026-06-05_venom_feed-security-review.md |
| SECURITY.md Updated | ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/SECURITY.md |

---

## 2. Scope

This report validates exploitability of 18 VENOM findings from the 2026-06-05 module-level VENOM run
covering all DALs, hooks, controllers, pipeline, and model files in `apps/VCSM/src/features/feed/`.

All source files were read directly before classification. No finding is classified without code evidence.

---

## 3. Source Files Verified

| File | Status |
|---|---|
| `apps/VCSM/src/features/feed/dal/feed.posts.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.commentCounts.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.reactionCounts.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.media.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.mentions.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feed.read.debugPrivacyRows.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js` | READ |
| `apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js` | READ |
| `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` | READ |
| `apps/VCSM/src/features/feed/hooks/useFeed.js` | READ |
| `apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js` | READ |
| `apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js` | READ |
| `apps/VCSM/src/features/feed/model/buildMentionMaps.model.js` | READ |
| `apps/VCSM/src/features/feed/model/enrichMentionRows.model.js` | READ |
| `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js` | READ |
| `apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js` | READ |

---

## 4. Classification Definitions

| Classification | Meaning |
|---|---|
| EXPLOITABLE | Triggerable by a malicious actor with a realistic, no-privilege-required attack vector; source-code evidence confirms the path |
| REACHABLE | Finding exists and code path is reachable in production, but requires privileged access, partial conditions, or an unlikely sequence |
| THEORETICAL | Finding exists in code but is defended by one or more additional controls at a different layer |
| NOT_REACHABLE | Finding is not reachable due to architectural guards, RLS, or DEV-only rendering |

---

## 5. Finding-by-Finding Adversarial Analysis

---

### VEN-MOD-FEED-001 — Bare console.warn in production error path (useFeed.js)

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`useFeed.js:241`:
```javascript
} catch (e) {
  console.warn("[useFeed] error", e);
  setHasMore(false);
```

No `import.meta.env.DEV` guard. The caught exception `e` is passed directly to `console.warn` in the production catch block. A Supabase error object can contain `message`, `code`, `hint`, and `details` fields that expose schema names, column names, table names, and query structure.

**Attack Scenario (step-by-step):**

1. Attacker opens VCSM in a browser with DevTools open (production environment — no authentication bypass required).
2. Attacker provokes a feed fetch failure by sending an invalid `realmId` value or by intercepting a network request (via MITM proxy or service worker injection) to inject a malformed Supabase error response.
3. `fetchFeedPagePipeline` propagates the error to `useFeed.js:240` catch block.
4. `console.warn("[useFeed] error", e)` is called unconditionally.
5. The DevTools console shows the full Supabase error object including schema/table hints from the PostgREST error response (e.g., `"relation \"vc.posts\" does not exist"` or constraint violation messages).
6. Attacker extracts schema information from error output to inform further enumeration attacks.

**Realistic attacker profile:** Any authenticated user with DevTools open. No special access required beyond a standard browser session.

---

### VEN-MOD-FEED-002 — 5 bare console.* calls in production feed actions hook

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`useCentralFeedActions.js`:
- Line 68: `console.warn('[useCentralFeedActions] missing confirmAction; skipping confirm prompt', options)` — no DEV guard
- Line 139: `console.error('[CentralFeed] subscribe failed:', err)` — no DEV guard
- Line 182: `console.error('[CentralFeed] block failed:', err)` — no DEV guard
- Line 197: `console.warn('[CentralFeed] persist hide threw:', error)` — no DEV guard
- Line 221: `console.error('[CentralFeed] report submit failed:', err)` — no DEV guard

All five calls receive error objects from Supabase/PostgREST or cross-feature adapters. No DEV guard wraps any of them.

**Attack Scenario (step-by-step):**

1. Attacker opens VCSM production, opens DevTools console.
2. Attacker triggers a follow/block/report/hide action while the relevant adapter returns a Supabase RLS rejection error.
3. One of lines 139, 182, 197, or 221 fires unconditionally.
4. The Supabase error object (including `message`, `details`, `hint`, `code`) is logged to the browser console in plaintext.
5. Attacker reads RLS error messages (e.g., `"new row violates row-level security policy for table \"blocks\""`) which reveal table names, schema names, policy names, and constraint details.
6. This reconnaissance informs SQL injection probing and RLS bypass attempts against those table surfaces.

**Realistic attacker profile:** Any authenticated user who can trigger a mutation failure (e.g., attempts to block their own actor, reports a non-existent post).

---

### VEN-MOD-FEED-003 — Raw actor UUID in public profile navigation route

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`useCentralFeedActions.js:152`:
```javascript
navigate(`/profile/${postMenu.postActorId}`)
```

`postMenu.postActorId` is a raw UUID from `vc.actors.id`. It is inserted directly into the browser URL bar and navigation history. No slug lookup, no encoding, no transformation.

**Attack Scenario (step-by-step):**

1. Attacker opens any post in the feed and clicks "View Profile" from the post context menu.
2. Browser navigates to `/profile/<UUID>` — raw UUID visible in the URL bar, address bar history, and browser network tab.
3. Attacker observes the UUID for the target actor.
4. Attacker increments or permutes the UUID space to enumerate additional actor IDs (sequential or fuzzing approach).
5. With a known actor UUID, attacker can directly craft requests to the Supabase API (anon key is public in SPAs) targeting that actor's data across multiple tables.
6. Platform invariant violated: raw UUIDs must never appear in public-facing URLs per the no-raw-IDs-in-URLs platform rule.

**Realistic attacker profile:** Any authenticated user who can view the feed. Requires only clicking "View Profile" on any post.

---

### VEN-MOD-FEED-004 — Raw UUID postId in share URL construction

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`useCentralFeedActions.js:234-236`:
```javascript
const url = `${window.location.origin}/post/${postId}`
```

`postId` is a raw UUID from `vc.posts.id`. Passed to `shareNative()` and to `setShareState` which opens the ShareModal. This URL is then available to any share recipient or anyone who copies it.

**Attack Scenario (step-by-step):**

1. Attacker taps the share button on any post in the production feed.
2. Browser constructs `https://app.vibezcitizens.com/post/<raw-UUID>` and presents it via Web Share API or ShareModal.
3. Raw post UUID is visible in the share sheet and copy-link field — exposed to the attacker and any share recipient.
4. With a known post UUID, an attacker can enumerate post IDs by incrementing or brute-forcing the UUID space against the Supabase REST API.
5. Even private posts whose UUIDs are discovered this way may be probed through the API layer if post RLS is misconfigured.
6. Platform invariant violated: raw UUIDs must never appear in public-facing URLs.

**Realistic attacker profile:** Any authenticated user who can see the feed. Requires only tapping share on any post.

---

### VEN-MOD-FEED-005 — Legacy feed.posts.dal.js has no realm filter, no block/privacy enforcement, no DEV gate

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`feed.posts.dal.js:11-53`:
```javascript
export async function listFeedPosts({ limit = 20 } = {}) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(...)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
```

No `realmId` filter. No `viewerActorId` context. No block rows check. No privacy enforcement. The only visibility filter is `deleted_at IS NULL`.

The file header states `used by dev diagnostics only` but there is no `import.meta.env.DEV` guard on the function itself. Any JavaScript caller can import and invoke it in production.

**Why REACHABLE and not EXPLOITABLE:**

The file is used by diagnostics groups (`settingsAccountFeature.group.js`, `settingsPrivacyFeature.group.js`, `settingsProfileFeature.group.js` per the git status). These diagnostics groups are dev-only panels. However, the DAL function itself has no DEV gate — if a diagnostics group is accidentally rendered in production, or if another feature imports it, the unfiltered post query runs in production. The attack surface requires a calling path to exist in production, which currently requires a separate architectural failure at the diagnostics render layer. The DAL itself represents a latent cross-realm exposure.

---

### VEN-MOD-FEED-006 — readProfileAdultFlagDAL has no ownership assertion

**Classification: THEORETICAL**
**THOR Blocker: NO**

**Evidence:**

`feed.read.viewerContext.dal.js:17-28`:
```javascript
export async function readProfileAdultFlagDAL({ profileId }) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_adult")
    .eq("id", profileId)
    .maybeSingle();
```

No ownership assertion. Accepts any `profileId` without checking it belongs to the session user.

**Why THEORETICAL:**

The risk is defended by two layers:
1. RLS on `public.profiles` — Supabase's authenticated key enforces row-level policies. If `profiles` has a `select` policy scoped to the authenticated user, cross-actor reads return null.
2. The call chain: this DAL is called from `getFeedViewerIsAdult` controller which sources `viewerActorId` from `useIdentity()` in the calling hook — a session-bound caller. There is no code path in the current codebase where an arbitrary `profileId` is passed to this DAL outside the session context.

The trust gap is real (no DAL-layer ownership assertion is a pattern weakness), but exploitation requires: (a) RLS on `public.profiles.is_adult` to be absent or permissive, AND (b) a call path passing an attacker-controlled `profileId`. Neither condition is confirmed present.

---

### VEN-MOD-FEED-007 — useFeedWelcomeCard localStorage dismiss state overrides DB state

**Classification: THEORETICAL**
**THOR Blocker: NO**

**Evidence:**

`useFeedWelcomeCard.js:25-30`:
```javascript
const key = lsKey(actorId)
if (key && localStorage.getItem(key) === 'dismissed') {
  setShow(false)
  setLoading(false)
  return
}
```

`lsKey(actorId)` = `vcsm_wfc_${actorId}`. Any caller with DevTools can set this key to `'dismissed'` for any known actor ID. This suppresses the welcome card DB check entirely.

**Why THEORETICAL:**

The welcome card is a UX convenience feature, not a security gate. The consequence of an attacker suppressing the welcome card for an arbitrary actor ID is cosmetic (the target actor sees no welcome card). This does not:
- Grant access to data
- Bypass authentication
- Expose private information
- Create a privilege escalation path

The `actorId` used as the localStorage key suffix is the viewer's own actor ID (sourced from the authenticated session in the calling component). An attacker manipulating their own localStorage suppresses only their own welcome card. Suppressing another actor's welcome card requires knowing their actor ID (which is separately exposed via VEN-MOD-FEED-003) and is not a realistic attack because localStorage is per-origin and per-browser — a remote attacker cannot set localStorage for another user's browser session.

---

### VEN-MOD-FEED-008 — Unbounded comment row fetch for count aggregation

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`feed.read.commentCounts.dal.js:20-25`:
```javascript
const { data: rows, error } = await supabase
  .schema("vc")
  .from("post_comments")
  .select("post_id")
  .in("post_id", postIds)
  .is("deleted_at", null);
```

No `LIMIT` clause on the comment rows query. All comment rows for all posts in the current page are fetched and counted in JavaScript. A post with 100,000 comments transfers 100,000 row stubs over the network.

**Why REACHABLE and not EXPLOITABLE:**

This is a genuine performance DoS vector but requires a post to have extremely large comment counts to cause meaningful impact. A single page load with such a post would cause excessive data transfer and JavaScript memory pressure. However:
1. Creating such a post requires an authenticated account and significant effort (posting 100,000 comments is itself rate-limited).
2. The damage is localized to the feed page load for viewers of that specific post.
3. This is a resource exhaustion risk, not a data integrity or access control bypass.

The attack is reachable (no limit exists in code) but requires significant attacker-controlled preconditions (high-comment post) and causes performance degradation rather than security compromise.

---

### VEN-MOD-FEED-009 — Legacy useFeed.js coexists with useCentralFeed.js with no decommission plan

**Classification: THEORETICAL**
**THOR Blocker: NO**

**Evidence:**

Both `apps/VCSM/src/features/feed/hooks/useFeed.js` and `apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js` exist alongside the newer `useCentralFeed.js`.

**Why THEORETICAL:**

This is a governance/maintenance risk, not a direct attack vector. The concern is that security patches applied to one feed hook may not be applied to the other. However:
1. Both `useFeed.js` and the central feed pipeline share `fetchFeedPagePipeline` — the pipeline is the single location for DAL-layer security controls (block filtering, realm filtering, etc.).
2. The duplication risk is real for hook-level patches (e.g., error handling, console guards) but does not represent an independently exploitable attack surface.
3. Classification is THEORETICAL because the actual exploit requires a regression: a security fix applied to one path but not the other, AND a caller using the unpatched path in production.

---

### VEN-MOD-FEED-010 — vport_id in DAL return shape violates architecture contract

**Classification: THEORETICAL**
**THOR Blocker: NO**

**Evidence:**

`feed.read.viewerContext.dal.js:3-15`:
```javascript
const { data, error } = await supabase
  .schema("vc")
  .from("actors")
  .select("profile_id, vport_id")
  ...
return data ?? null;
```

Returns `{ profile_id, vport_id }` to callers. The architecture contract prohibits exposing `vportId` from any DAL or hook surface.

**Why THEORETICAL:**

This is an architecture contract violation and a precedent-setting antipattern. However:
1. The field is used internally to resolve the profile ID for the adult-flag lookup — it is a join-key, not a user-facing exposure.
2. There is no evidence of the returned `vport_id` reaching a public URL, a hook return value, or a UI component surface in the current codebase.
3. The risk is that future callers may propagate `vport_id` further into the system. The finding is valid as a governance concern but is not currently exploitable.

---

### VEN-FEED-001 — BEHAVIOR.md is a PLACEHOLDER

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/BEHAVIOR.md` is confirmed PLACEHOLDER from the previous BW report (2026-06-04) and VENOM finding. No §5 Security Rules. No §9 Must Never Happen invariants.

**Why REACHABLE:**

The absence of a BEHAVIOR.md contract is not itself exploitable — it is a governance gap that makes all other findings harder to anchor and regression-test. The risk is REACHABLE because without formal invariants:
1. Any security patch to the feed module cannot be validated against a contract.
2. Future regressions cannot be caught by SPIDER-MAN contract tests.
3. BW classifications in this report are source-inferred, not contract-anchored.

The finding represents a persistent risk multiplier for all other feed findings. It is not independently exploitable but enables future exploitation by removing the regression safety net.

---

### VEN-PIPE-002 — null realmId bypasses realm filter — cross-realm post exposure

**Classification: EXPLOITABLE**
**THOR Blocker: YES**

**Evidence:**

`feed.read.posts.dal.js:30-33`:
```javascript
if (realmId) {
  q = q.eq("realm_id", realmId);
}
```

When `realmId` is `null` or `undefined`, the `.eq("realm_id", realmId)` filter is skipped entirely. The query returns posts from ALL realms with no realm constraint.

The pipeline receives `realmId` from `fetchFeedPagePipeline({ viewerActorId, realmId, ... })` which receives it from `useFeed` hook which receives it as a parameter from the calling component. A partially onboarded user whose `realmId` is null (not yet assigned) triggers this path naturally.

**Attack Scenario (step-by-step):**

1. A partially onboarded user account has not yet been assigned a `realmId` (e.g., onboarding incomplete after account creation, or realm assignment is async).
2. The component passes `realmId = null` to `useFeed`.
3. `fetchFeedPagePipeline` is called with `realmId = null`.
4. `readFeedPostsPage({ realmId: null, ... })` skips the `eq("realm_id", ...)` filter.
5. The query returns posts from all realms — including the future Void Realm (18+ content with `void: true`).
6. Adult/NSFW content from the Void Realm appears in the feed of a potentially non-adult-verified user.
7. Additionally, any realm-partitioned content (private realms, restricted realms) becomes visible.

**Realistic attacker profile:** Any partially onboarded user (likely most new accounts between signup and onboarding completion). No special access required — the null realmId is a natural state during onboarding.

---

### VEN-PIPE-003 — vport.profiles owner-only RLS nulls vport actor bundle — vport posts invisible to non-owners

**Classification: EXPLOITABLE**
**THOR Blocker: YES**

**Evidence:**

`feed.read.actorsBundle.dal.js:84-89`:
```javascript
actorIdsForVports.length
  ? vportSchema
      .from("profiles")
      .select("actor_id, name, slug, avatar_url, is_active, is_deleted")
      .in("actor_id", actorIdsForVports)
  : Promise.resolve({ data: [] }),
```

`vportSchema` queries `vport.profiles` directly. RLS on this table is confirmed owner-only (verified via source analysis in SECURITY.md). Non-owner viewers receive an empty result set for vport actors.

`useFeed.js:159-168` (in-code comment confirms the issue):
```javascript
// vport.profiles has owner-only RLS → vportMap is empty for non-owner users.
```

The pipeline proceeds with `vportMap = {}` for non-owner viewers. `normalizeFeedRows` marks these rows as `missing_vport_profile` → `visible: false`. Vport posts are completely hidden from non-owner viewers.

**Attack Scenario (step-by-step):**

This is a functional breakage exploitable as a denial-of-service against VPORT businesses:

1. Any VPORT business owner posts content to the feed.
2. A non-owner viewer (any other user) loads the feed.
3. `readActorsBundle` queries `vport.profiles` and receives empty results due to owner-only RLS.
4. `vportMap` is empty for the non-owner viewer.
5. `normalizeFeedRows` marks all vport actor posts as `visible: false`.
6. The non-owner viewer sees zero posts from any VPORT on the platform.
7. VPORT businesses have zero organic reach to non-owner audiences.

**Secondary exploitation:** A competitor or malicious actor could argue this constitutes a platform-level DoS against VPORT merchant visibility.

**Realistic attacker profile:** Any authenticated user who is not the owner of a VPORT is automatically affected. This is a passive exploitation — no active attack needed.

**Note:** `useFeed.js:162-168` applies a mitigation path (force hydration via `get_actor_summaries` SECURITY DEFINER RPC for vport actors with null names), but this is asynchronous and race-prone. The pipeline itself is broken — the mitigation at the hook layer is a workaround, not a fix.

---

### VEN-FEED-003 — actorId passed as userId to readOwnedActorIdsByUserIdDAL

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`getDebugPrivacyRows.controller.js:42`:
```javascript
readOwnedActorIdsByUserIdDAL(actorId),
```

`feed.read.debugPrivacyRows.dal.js:42-52`:
```javascript
export async function readOwnedActorIdsByUserIdDAL(userId) {
  ...
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId);
```

`actorId` (a UUID from `vc.actors.id`) is passed where `userId` (a UUID from `auth.users.id`) is expected. These are distinct identifier spaces. The query `.eq("user_id", actorId)` will return 0 rows because no `actor_owners` row has `user_id` equal to an `actor_id`. `myActorIds` is always empty. `isOwner` is always false. Ownership detection is completely broken in this controller.

**Why REACHABLE and not EXPLOITABLE:**

The bug produces incorrect debug output (ownership always false) but does not grant unauthorized access. The controller reads-only. The broken ownership detection means the debug privacy view shows incorrect data, not that an attacker gains escalated privileges. The risk is that privacy visibility calculations in the debug panel are wrong, which could mask real privacy violations during debugging.

---

### VEN-FEED-004 — viewerActorId accepted but discarded in listActorPosts controller

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`listActorPosts.controller.js:33-37`:
```javascript
export async function listActorPosts({ actorId, viewerActorId, limit }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  return listActorPostsByActorDAL({ actorId, ...(limit != null && { limit }) });
}
```

`viewerActorId` is validated for presence (throws if null) but is never passed to the DAL. The DAL queries `vc.posts` filtered only by `actor_id`. No visibility enforcement at the app layer.

**Why REACHABLE and not EXPLOITABLE:**

The controller's API contract implies a viewerActorId visibility check (the presence validation suggests intent) but does not implement one. However:
1. `vc.posts` RLS is confirmed assumed (`posts_select_actor_based` policy exists per SECURITY.md).
2. If RLS is correctly scoped, unauthorized readers receive no rows regardless of app-layer filtering.
3. The attack is reachable (a non-follower can request posts for a private actor), but the RLS layer is the intended defense. The MEDIUM severity reflects that app-layer defense-in-depth is absent, not that RLS is bypassed.

---

### VEN-PIPE-004 — Raw actorId UUID in mention route fallback in buildMentionMaps

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`buildMentionMaps.model.js:6`:
```javascript
if (actorId) return `/profile/${actorId}`;
```

This fallback route fires when: (a) the actor has no username (vport without slug, or user without username), or (b) for vport actors where `vport_id` is always null from `enrichMentionRows.model.js`.

`enrichMentionRows.model.js:14`:
```javascript
vport_id: null,
```

`enrichMentionRows` hardcodes `vport_id: null` for all mentioned actors. This means the `if (kind === "vport" && vportId)` branch in `makeActorRoute` NEVER fires. Vport mentions always fall through to the `/profile/${actorId}` raw UUID fallback.

**Attack Scenario (step-by-step):**

1. A vport actor is mentioned in a post (e.g., `@MyShop`).
2. The feed pipeline fetches mention edges and enriches them.
3. `enrichMentionRows` returns `vport_id: null` for all actors.
4. `buildMentionMaps` → `makeActorRoute` evaluates `kind === "vport"` (true) and `vportId` (null) → falls through.
5. The mention link renders as `/profile/<raw-UUID>`.
6. The mention link is visible to all feed viewers. Any viewer can read the raw UUID from the rendered mention link.
7. Actor UUID enumeration requires only reading the feed — no special action required.

**Realistic attacker profile:** Any authenticated feed viewer. If vport mentions appear in the feed, the raw UUID is visible to all viewers via the mention link.

---

### VEN-PIPE-005 — Missing UUID validation on viewerActorId in hiddenPosts and viewerReactions DALs

**Classification: THEORETICAL**
**THOR Blocker: NO**

**Evidence:**

`feed.read.hiddenPosts.dal.js:3-8`:
```javascript
export async function readHiddenPostsForViewer({ viewerActorId, postIds }) {
  let hiddenByMeSet = new Set();

  if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) {
    return hiddenByMeSet;
  }
```

`feed.read.viewerReactions.dal.js:13-16`:
```javascript
export async function readViewerReactionsBatch({ postIds, actorId }) {
  if (!actorId || !Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }
```

Neither DAL calls `isUuid()` on the viewerActorId/actorId parameter before querying. Compare with `feed.read.blockRows.dal.js:14`:
```javascript
if (!viewerActorId || !isUuid(viewerActorId)) return [];
```

**Why THEORETICAL:**

The missing UUID validation is an input hygiene inconsistency, not a data bypass:
1. For `readHiddenPostsForViewer`: The query uses `viewerActorId` in `.eq("actor_id", viewerActorId)`. If a non-UUID string is passed, PostgREST will either reject it or return 0 rows. No cross-actor data is returned.
2. For `readViewerReactionsBatch`: The query uses `actorId` in `.eq("actor_id", actorId)`. Same behavior.
3. Both DALs are called from `fetchFeedPagePipeline` which receives `viewerActorId` from the hook, which gates on `if (!viewerActorId) return` at `useFeed.js:73`.
4. The attack requires a non-UUID string to reach the pipeline, which requires bypassing the hook-layer presence guard — itself a separate precondition.

The inconsistency is a trust boundary gap worth fixing but is not independently exploitable.

---

### VEN-PIPE-006 — 60s block/follow TTL cache + 30s React Query staleTime — stale moderation state after block

**Classification: REACHABLE**
**THOR Blocker: NO**

**Evidence:**

`feed.read.blockRows.dal.js:6`:
```javascript
const blockCache = createTTLCache(60_000);
```

`feed.read.followRows.dal.js:6`:
```javascript
const followCache = createTTLCache(60_000);
```

Cache invalidation functions (`invalidateFeedBlockCache`, `invalidateFeedFollowCache`) exist but the pipeline's calling hook (`useCentralFeedActions.js`) does not call them after a block action. The block action calls `await fetchPosts(true)` which triggers a fresh pipeline run, but the pipeline reads from the block cache if TTL has not expired.

After a block:
- Block action fires.
- `fetchPosts(true)` is called.
- Pipeline calls `readFeedBlockRowsDAL({ viewerActorId, actorIds })`.
- Cache is still warm (60s TTL, block action just completed).
- Cached block rows (pre-block) are returned.
- The newly blocked actor is NOT in the block rows.
- Blocked content may appear for up to 60s.

**Why REACHABLE and not EXPLOITABLE:**

This is a timing window, not a persistent bypass. The maximum stale window is 60s. The content is visible to the blocking user only (not leaked to third parties). After TTL expiry, correct block enforcement resumes. The blocked actor's content disappearing with a delay is a UX degradation, not a security bypass in the access-control sense. However, for abuse scenarios (e.g., harassment where the victim expects immediate blocking), the 60s window represents a real user harm.

---

### VEN-PIPE-008 — Blocked actor presentations leaked via mention hydration fan-out

**Classification: EXPLOITABLE**
**THOR Blocker: NO**

**Evidence:**

`fetchFeedPage.pipeline.js:127-133`:
```javascript
if (mentionEdges.length > 0) {
  const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
  if (mentionedActorIds.length > 0) {
    const { rows: presentations, error: presErr } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIds });
    if (presErr) throw presErr;
    enrichedMentionRows = enrichMentionRows(mentionEdges, presentations ?? []);
  }
}
```

`mentionedActorIds` is built from ALL mention edges in the page. There is no intersection with `blockedActorSet`. `hydrateAndReturnSummaries` is called for all mentioned actors including blocked actors. The hydration result (display_name, avatar, username) for blocked actors is embedded in `enrichedMentionRows` and returned to the frontend via `mentionMapsByPostId`.

**Attack Scenario (step-by-step):**

1. Viewer blocks ActorB.
2. ActorA (not blocked) posts a message mentioning @ActorB.
3. Viewer loads the feed. The feed pipeline fetches posts. ActorA's post is visible (not blocked).
4. Pipeline detects `@` in ActorA's post text. Fetches mention edges → finds `mentioned_actor_id = ActorB.id`.
5. `mentionedActorIds` includes ActorB's ID with no block check.
6. `hydrateAndReturnSummaries({ actorIds: [ActorB.id] })` returns ActorB's display_name, avatar_url, username.
7. `mentionMapsByPostId` contains ActorB's presentation data, keyed by their handle.
8. The frontend renders the mention link to ActorB's profile inside ActorA's visible post.
9. The viewer (who blocked ActorB) sees ActorB's display name, avatar, and handle via the mention inline display — a direct bypass of their block intent.

**Realistic attacker profile:** Any actor who is blocked by a viewer can arrange to be mentioned by a non-blocked third party. Their identity and profile information is then surfaced to the blocking viewer via the mention rendering path.

---

## 6. Classification Summary

| Finding ID | Severity | Classification | THOR Blocker |
|---|---|---|---|
| VEN-MOD-FEED-001 | HIGH | EXPLOITABLE | NO |
| VEN-MOD-FEED-002 | HIGH | EXPLOITABLE | NO |
| VEN-MOD-FEED-003 | HIGH | EXPLOITABLE | NO |
| VEN-MOD-FEED-004 | MEDIUM | EXPLOITABLE | NO |
| VEN-MOD-FEED-005 | MEDIUM | REACHABLE | NO |
| VEN-MOD-FEED-006 | MEDIUM | THEORETICAL | NO |
| VEN-MOD-FEED-007 | LOW | THEORETICAL | NO |
| VEN-MOD-FEED-008 | LOW | REACHABLE | NO |
| VEN-MOD-FEED-009 | INFO | THEORETICAL | NO |
| VEN-MOD-FEED-010 | INFO | THEORETICAL | NO |
| VEN-FEED-001 | HIGH | REACHABLE | NO |
| VEN-PIPE-002 | HIGH | EXPLOITABLE | YES |
| VEN-PIPE-003 | HIGH | EXPLOITABLE | YES |
| VEN-FEED-003 | MEDIUM | REACHABLE | NO |
| VEN-FEED-004 | MEDIUM | REACHABLE | NO |
| VEN-PIPE-004 | MEDIUM | EXPLOITABLE | NO |
| VEN-PIPE-005 | MEDIUM | THEORETICAL | NO |
| VEN-PIPE-006 | MEDIUM | REACHABLE | NO |
| VEN-PIPE-008 | MEDIUM | EXPLOITABLE | NO |

---

## 7. Metrics

| Metric | Count |
|---|---|
| EXPLOITABLE | 8 |
| REACHABLE | 6 |
| THEORETICAL | 5 |
| NOT_REACHABLE | 0 |
| THOR Blockers | 2 (VEN-PIPE-002, VEN-PIPE-003) |

---

## 8. THOR Gate Summary

### THOR Blockers (Release Gates)

**VEN-PIPE-002 — EXPLOITABLE / THOR BLOCKER**

null realmId bypasses realm filter. Cross-realm post exposure is trivially triggered by any partially onboarded user. Future Void Realm (18+ content) will be served to non-adult-verified users. This is a P0 data privacy violation. Feed cannot ship to production without this fix.

Patch: `readFeedPostsPage` must enforce non-null `realmId`. If `realmId` is null, throw or return empty result. Never allow realm-unscoped queries.

**VEN-PIPE-003 — EXPLOITABLE / THOR BLOCKER**

vport.profiles owner-only RLS causes all VPORT posts to be invisible to non-owner viewers. This is a complete business functionality break for VPORT merchants. Feed with vport content cannot ship to production in this state.

Patch: Replace direct `vport.profiles` SELECT in `readActorsBundle` with a SECURITY DEFINER RPC that provides slug/name/avatar for vport actors without exposing owner-restricted fields. The force-hydration workaround in `useFeed.js` is a race condition, not a fix.

---

## 9. Delta from Previous BlackWidow Run (2026-06-04)

Previous report (BW2 / 2026-06-04) covered 8 findings derived from the feature-level VENOM run.

This report covers 19 findings from the module-level VENOM run (includes pipeline module + feed module findings).

**New EXPLOITABLE findings vs. prior run:**

| Finding | Delta Status | Note |
|---|---|---|
| VEN-MOD-FEED-001 | NEW | Bare console.warn — same class as prior BW-FEED-007/008 but different surface |
| VEN-MOD-FEED-002 | NEW | 5 console.* calls — extends prior BW-FEED-008 scope |
| VEN-MOD-FEED-003 | NEW | Raw actorId in navigation URL — same class as prior BW-FEED-007 but different surface |
| VEN-MOD-FEED-004 | NEW | Raw UUID in share URL — prior BW-FEED-007 confirmed this exact finding |
| VEN-PIPE-002 | ESCALATED | Prior run classified as OPEN/HIGH; now confirmed EXPLOITABLE after source verification |
| VEN-PIPE-003 | ESCALATED | Prior run classified as OPEN/HIGH; now confirmed EXPLOITABLE after source verification |
| VEN-PIPE-004 | NEW | vport_id always null in enrichMentionRows — raw UUID fallback confirmed for all vport mentions |
| VEN-PIPE-008 | NEW | Mention hydration fan-out bypasses blocked actor filter |

**Carried findings (matching prior run classifications):**

| Prior Finding | New Finding | Status |
|---|---|---|
| BW-FEED-007 (BYPASSED — share UUID) | VEN-MOD-FEED-004 | CONFIRMED EXPLOITABLE |
| BW-FEED-006 (stale cache) | VEN-PIPE-006 | Confirmed REACHABLE |
| BW-FEED-003 (debug controller) | VEN-FEED-003 | REACHABLE (debug context) |

---

## 10. SPIDER-MAN Test Requirements

| Test ID | Finding | Test Description | Priority |
|---|---|---|---|
| TEST-BW-2025-001 | VEN-MOD-FEED-001 | useFeed.js catch block must not call console.warn in production build | P1 |
| TEST-BW-2025-002 | VEN-MOD-FEED-002 | useCentralFeedActions.js — all 5 console.* calls must be DEV-gated | P1 |
| TEST-BW-2025-003 | VEN-MOD-FEED-003 | handleOpenActorProfile must navigate to /u/{username} or /vport/{slug}, never /profile/{uuid} | P1 |
| TEST-BW-2025-004 | VEN-MOD-FEED-004 | Share URL must use slug-based path, never raw postId UUID | P1 |
| TEST-BW-2025-005 | VEN-PIPE-002 | readFeedPostsPage must throw or return empty when realmId is null | P0 |
| TEST-BW-2025-006 | VEN-PIPE-003 | Non-owner viewer must receive vport actor display data from SECURITY DEFINER RPC, not null | P0 |
| TEST-BW-2025-007 | VEN-PIPE-004 | buildMentionMaps must never produce /profile/{uuid} route for vport actors | P1 |
| TEST-BW-2025-008 | VEN-PIPE-008 | mention hydration must exclude actors in blockedActorSet | P1 |
| TEST-BW-2025-009 | VEN-PIPE-006 | invalidateFeedBlockCache must be called immediately after block action completes | P1 |
| TEST-BW-2025-010 | VEN-FEED-003 | getDebugPrivacyRowsController must receive userId not actorId for ownership query | P2 |
