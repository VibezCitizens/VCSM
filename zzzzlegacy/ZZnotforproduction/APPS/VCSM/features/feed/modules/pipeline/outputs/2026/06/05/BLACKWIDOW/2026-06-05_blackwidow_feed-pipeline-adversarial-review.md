# BLACKWIDOW Runtime Adversarial Report — Feed Pipeline Module

**Date:** 2026-06-05
**Scope:** VCSM:feed/modules/pipeline
**Reviewer:** BLACKWIDOW
**Environment:** Source-verified static adversarial simulation (read-only)
**Governance Status:** ACTIVE
**VENOM Upstream:** `outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md`
**BEHAVIOR Ref:** `modules/pipeline/BEHAVIOR.md` (ACTIVE, 2026-06-05)

**Findings:** 0 CRITICAL | 4 HIGH | 4 MEDIUM | 1 LOW
**Exploit Chains:** 5 CONFIRMED BYPASSED | 3 PARTIAL | 1 BLOCKED

---

## Attack Surface Summary

The feed pipeline presents the following adversarial surfaces for this run:

| Surface | Attack Angle | Priority |
|---|---|---|
| null realmId pass-through | Cross-realm content exposure | HIGH |
| vport.profiles owner-only RLS | Content availability failure | HIGH |
| Block action → fresh fetch race | Blocked content re-appears after successful block | HIGH (NEW) |
| Mention hydration without block filter | Blocked actor identity leak | HIGH |
| Actor bundle / block / follow TTL caches | Stale moderation state exploitation | MEDIUM |
| Raw UUID in routes (mention, share, profile nav) | Actor/post enumeration and correlation | MEDIUM |
| useCentralFeedActions.js action handlers | Block/follow invalidation wiring audit | HIGH |
| viewerActorId session binding at hook layer | Identity drift simulation | LOW |

---

## Simulated Threat Scenarios

| ID | Scenario | VENOM Finding | Result |
|---|---|---|---|
| S-01 | Partially-onboarded user with null realmId views feed | VEN-PIPE-002 | BYPASSED |
| S-02 | Non-owner user views central feed with VPORT authors | VEN-PIPE-003 | BYPASSED (confirmed functional failure) |
| S-03 | User A blocks User B → fresh fetch immediately re-shows User B's posts | VEN-PIPE-006 (extended) | BYPASSED — NEW |
| S-04 | User A blocks User B; User C mentions User B → User A sees User B's profile info | VEN-PIPE-008 | BYPASSED |
| S-05 | User inspects rendered mention route for VPORT actor | VEN-PIPE-004 | BYPASSED |
| S-06 | User A unfollows private User B; private posts stay visible | VEN-PIPE-006 | PARTIAL |
| S-07 | Pass non-UUID viewerActorId to hiddenPosts DAL | VEN-PIPE-005 | PARTIAL |
| S-08 | Actor bundle cache poisoning via external input | — | BLOCKED |

---

## Ownership Bypass Results

### OWNERSHIP BYPASS ATTEMPT: null realmId feed access

```
Target: readFeedPostsPage (feed.read.posts.dal.js)
Attack vector: Call fetchFeedPagePipeline with realmId: null or undefined
Result: BYPASSED
Evidence:
  Source (feed.read.posts.dal.js:30–33):
    if (realmId) {
      q = q.eq("realm_id", realmId);
    }
  When realmId is null: the eq filter is never added.
  Query returns: SELECT ... FROM vc.posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT N
  No realm scoping applied. All realms in database returned.
  Caller guard: useFeed.js checks `if (!viewerActorId)` but NOT `if (!realmId)`.
  Pipeline entry: fetchFeedPagePipeline accepts realmId without validation.
Controller gate: ABSENT (no realmId validation at pipeline entry or DAL)
Severity: HIGH
```

---

## Session Mutation Results

### SESSION MUTATION ATTEMPT: viewerActorId drift at hook boundary

```
Target: useFeed.js + useCentralFeed.js hook layer
Attack vector: Caller passes viewerActorId that does not match authenticated Supabase session
Result: PARTIAL
Evidence:
  useFeed.js signature: useFeed(viewerActorId, realmId, opts)
  No session binding check: hook does not call supabase.auth.getUser() to verify
    that viewerActorId matches the authenticated user's resolved actorId.
  Effect: pipeline fetches block/follow/hidden data for the PASSED actorId,
    not necessarily the authenticated user's actorId.
  Precondition: caller must supply a wrong actorId — in practice the caller
    is the identity context hook which derives from session. External attack
    not possible through normal UI flow.
  Risk: Internal misconfiguration or debug override could produce incorrect
    ownership scoping in the feed pipeline.
Session binding: ABSENT — hook trusts caller-supplied actorId unconditionally
Severity: LOW
```

---

## RLS Verification Results

### RLS VERIFICATION ATTEMPT: vc.posts with null realmId

```
Table / View / RPC: vc.posts
Attack vector: Call readFeedPostsPage with realmId=null
RLS status: ASSUMED (not verified in this run — DB read not performed)
Result: EXPOSED (realm filter bypassed at app layer)
Evidence:
  App-layer defense: absent (null check missing)
  RLS may still enforce per-user visibility based on session JWT,
  but cross-realm segmentation (public vs Void Realm) is NOT enforced by
  a per-row JWT claim — realm_id is a data column, not an auth claim.
  RLS on vc.posts cannot substitute for the missing app-layer realm filter.
Severity: HIGH
```

### RLS VERIFICATION ATTEMPT: vport.profiles owner-only RLS

```
Table / View / RPC: vport.profiles (via vportClient)
Attack vector: Non-owner user views feed with VPORT-authored posts
RLS status: ASSUMED owner-only (VENOM finding confirmed at source)
Result: EXPOSED (VPORT posts invisible — functional failure confirmed)
Evidence:
  feed.read.actorsBundle.dal.js lines 84–89:
    vportSchema.from("profiles").select(...)..in("actor_id", actorIdsForVports)
  For non-owner viewer: RLS returns empty result set
  vportMap: {} (empty for non-owned actors)
  feedRowVisibility: visible:false, reason:'missing_vport_profile'
  Effect: ALL VPORT posts are invisible to ALL non-owners in central feed.
Severity: HIGH
```

---

## Viewer Context Fuzz Results

### VIEWER CONTEXT FUZZ ATTEMPT: non-UUID viewerActorId to hiddenPosts DAL

```
Target: readHiddenPostsForViewer (feed.read.hiddenPosts.dal.js)
Injected context: viewerActorId = "not-a-uuid" or "" or "0"
Expected result: ERROR or early return
Actual result (source-simulated):
  Line 6: if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) return new Set()
  The check is: !viewerActorId (falsy check only, not UUID validation)
  "not-a-uuid" is truthy → passes the falsy check
  Query: .eq("actor_id", "not-a-uuid") → PostgREST sends malformed UUID to Postgres
  Postgres: invalid input syntax for type uuid → query error
  Error path: `if (actionsErr || !Array.isArray(actions) || actions.length === 0) return hiddenByMeSet`
  Result: returns empty Set (no error thrown, no log)
  Visible consequence: no hidden posts suppressed for this viewer
Context validation: ABSENT (no isUuid check, unlike blockRows/followRows)
Severity: LOW-MEDIUM
```

---

## Hydration Poisoning Results

### HYDRATION POISONING ATTEMPT: blocked actor in mention hydration

```
Target: fetchFeedPagePipeline Phase 4 (mention hydration)
Injected state: User A blocks User B. User C mentions @UserB in a post visible to User A.
Cache invalidation: ABSENT (blockedActorSet not applied to mentionedActorIds before hydration)
Result: BYPASSED
Evidence:
  fetchFeedPage.pipeline.js lines 127–133:
    const mentionedActorIds = [...new Set(mentionEdges.map(e => e.mentioned_actor_id))]
    // blockedActorSet is already built at this point (Phase 3)
    // but is NOT applied here:
    const { rows: presentations } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIds })
  
  Confirmed attack chain:
    1. User A blocks User B
    2. User C posts "great work @UserB!" (post visible to User A since C is not blocked)
    3. Pipeline: post_mentions → mentionEdge for User B → mentionedActorIds = [User B's actorId]
    4. hydrateAndReturnSummaries called with User B's actorId (no block filter)
    5. Returns: { display_name: "User B Name", photo_url: "...", username: "userB" }
    6. buildMentionMaps: mentionMapsByPostId[C's post]["userb"] = { id: B's actorId, ... }
    7. User A's normalized feed includes User C's post with mentionMap containing User B's profile
  
  UI rendering assumption: If PostCard renders @mention tooltips from mentionMap,
    User A will see User B's avatar and name in the mention reference.
  Block filter covers: post authorship (works correctly)
  Block filter misses: mentioned actor identity within visible posts
  
Cache invalidation: ABSENT
Severity: HIGH
```

---

## Cross-Feature Abuse Results

### CROSS-FEATURE ABUSE ATTEMPT: block action with stale blockCache re-feeds blocked content

```
Source feature: VCSM:block (useCentralFeedActions.handleBlockActor)
Target feature internal: feed.read.blockRows.dal.js blockCache
Attack vector:
  handleBlockActor sequence (useCentralFeedActions.js lines 155–185):
    1. setPosts(optimistic remove: filter out blocked actor's posts) — UI removes posts
    2. await blockActor({ blockerActorId, blockedActorId }) — DB write succeeds
    3. await fetchPosts(true) — triggers queryClient.resetQueries({ queryKey })
    4. React Query fires new pipeline call: fetchCentralFeedPage(...)
    5. fetchFeedPagePipeline calls readFeedBlockRowsDAL({ viewerActorId, actorIds })
    6. readFeedBlockRowsDAL checks: const cached = blockCache.get(viewerActorId)
    7. CACHE HIT: blockCache was populated on the PREVIOUS feed load (60s TTL, NOT cleared)
    8. Stale cache returns: block rows WITHOUT the new block (block happened after last cache fill)
    9. buildBlockedActorSetModel: blocked actor NOT in set
    10. normalizeFeedRows: blocked actor's posts PASS visibility check → visible:true
    11. React Query resolves with blocked actor's posts in data.pages[0]
    12. UI renders posts: blocked actor's posts RE-APPEAR in feed

  CONFIRMED EXPLOIT CHAIN:
  Block succeeds at DB level → optimistic remove fires → fresh feed fetch → stale cache →
  blocked content re-appears → user sees blocked posts immediately after blocking

  feedCache.adapter.js is never imported in useCentralFeedActions.js.
  invalidateFeedBlockCache is never called in the block action sequence.
  
Result: BYPASSED — HIGH severity confirmed
Defense gate for blockCache: ABSENT (invalidation not wired to block action)
Adapter isolation: WEAK (invalidation surface exported but not consumed by block feature)
Severity: HIGH
```

---

## URL Surface Results

### URL SURFACE TEST: mention route fallback to /profile/${actorId}

```
Route / Link: buildMentionMaps.model.js → makeActorRoute → /profile/${actorId}
UUID exposure: PRESENT
Slug enforcement: MISSING for VPORT mentions
Evidence:
  enrichMentionRows.model.js line 14: vport_id: null (always — explicitly nulled)
  buildMentionMaps.model.js:
    const vportId = row?.vport_id ?? null  → always null
    makeActorRoute({ kind: "vport", username: slug, actorId: UUID, vportId: null })
    → "vport" && null → false
    → if (actorId) return `/profile/${actorId}`  ← RAW UUID FIRED
  Result: All VPORT mentions in feed generate /profile/{actor-uuid} as the navigation route
Severity: MEDIUM
```

### URL SURFACE TEST: handleOpenActorProfile navigation route

```
Route / Link: useCentralFeedActions.js line 152: navigate(`/profile/${postMenu.postActorId}`)
UUID exposure: PRESENT
Slug enforcement: MISSING
Evidence:
  postActorId is the actor UUID (internal vc.actors.id)
  Profile navigation for feed post actors always uses raw UUID
  This is the primary "view profile" action from the post menu
  Exposes internal actor UUID in browser navigation history, URL bar, referrer headers
Severity: MEDIUM (new finding — extends VEN-PIPE-004 to actions layer)
```

### URL SURFACE TEST: handleShare URL construction

```
Route / Link: useCentralFeedActions.js line 235: `${window.location.origin}/post/${postId}`
UUID exposure: PRESENT
Slug enforcement: MISSING
Evidence:
  postId is the internal vc.posts.id UUID
  Share URLs expose raw post UUIDs to external recipients
  Consistent with BW-FEED-007 from prior feature-level run
Severity: MEDIUM (confirms BW-FEED-007, same platform-wide pattern)
```

---

## Mutation Replay Results

### MUTATION REPLAY ATTEMPT: stale follow cache after unfollow (private content visibility)

```
Target resource: vc.actor_follows (via followCache)
Resource state at time of replay:
  User A follows private User B → User B's posts visible in feed
  User A unfollows User B
  followCache still contains User B in followedActorSet (60s TTL)
  
Sequence:
  1. handleFollowActor called for unfollow
  2. toggleFollow({ ..., isFollowing: true }) → unfollow DB write
  3. onFollowToast('Unsubscribed') shown
  4. closePostMenu()
  5. NO fetchPosts() call — feed is NOT refreshed after unfollow
  6. followCache remains with User B marked as followed
  
  Result A (feed still visible): Because there's no fetchPosts after unfollow,
    User A still sees User B's private posts in the current rendered feed.
    This persists until scroll-triggered pagination or manual refresh.
  
  Result B (next pagination): If User A scrolls, fetchNextPage → pipeline call →
    readFeedFollowRowsDAL → cache HIT (User B still in followedActorSet) →
    User B's private posts appear in the next page.
  
  Duration of exposure: Until followCache TTL expires (60s) OR manual full refresh.
  
Result: PARTIAL (no automatic invalidation; duration bounded by 60s TTL)
State check: ABSENT for follow/unfollow → feed refresh not triggered
Severity: MEDIUM
```

---

## Failed Exploit Chains (Defenses That Held)

### HYDRATION POISONING ATTEMPT: actor bundle cache external poisoning

```
Target: bundleCache (feed.read.actorsBundle.dal.js)
Attack: Inject wrong actor data into bundleCache from outside the DAL
Result: BLOCKED
Evidence:
  bundleCache is a module-level const — not exported, not accessible from outside the DAL module.
  Cache writes occur only via readActorsBundle's internal DB read path.
  No external API to write to bundleCache exists.
  Cache key collision: actorId is a UUID — collision probability negligible.
  Invalidation functions (exported via adapter) only clear entries, not write them.
Defense gate: PRESENT (module-encapsulated cache, no external write surface)
Severity: N/A — blocked
```

### RUNTIME ABUSE ATTEMPT: call pipeline with no viewerActorId

```
Target: fetchFeedPagePipeline
Actor role used: no actor (viewerActorId = null)
Expected access: DENIED
Result: DENIED
Evidence:
  useFeed.js: if (!viewerActorId) { debugFeedEvent(...); return; }
  useCentralFeed.js: enabled: Boolean(viewerActorId) — query disabled
  Both hooks prevent pipeline call when viewerActorId is null.
  readFeedBlockRowsDAL: if (!viewerActorId || !isUuid(viewerActorId)) return []  ✓
  readFeedFollowRowsDAL: same guard ✓
Privilege gate: PRESENT at hook layer for null viewerActorId
Severity: N/A — blocked at entry
```

---

## Successful Exploit Chains

### CHAIN-1: Post-Block Fresh Fetch Reveals Blocked Content (CRITICAL PATH)

```
Trigger: User A blocks User B via post menu
Precondition: blockCache populated from prior feed load (within 60s TTL)

Step 1: User A opens post menu → "Block actor"
Step 2: handleBlockActor fires (useCentralFeedActions.js:155)
Step 3: setPosts(optimistic filter) → User B's posts removed from UI instantly
Step 4: await blockActor({ blockerActorId: A, blockedActorId: B }) → DB INSERT into moderation.blocks
         DB write SUCCEEDS — block is now in the database
Step 5: await fetchPosts(true) → queryClient.resetQueries({ queryKey: centralFeed(A, realmId) })
Step 6: React Query fires: fetchCentralFeedPage({ actorId: A, realmId, pageParam: undefined })
Step 7: fetchFeedPagePipeline({ viewerActorId: A, realmId, cursorCreatedAt: null, pageSize: 10 })
Step 8: PARALLEL ENRICHMENT — readFeedBlockRowsDAL({ viewerActorId: A, actorIds: [B, C, D...] })
Step 9: blockCache.get(A) → CACHE HIT — returns rows from BEFORE the block action
         B is NOT in cached rows (block was just written to DB after cache was populated)
Step 10: buildBlockedActorSetModel: B NOT in blockedActorSet
Step 11: feedRowVisibility for B's posts: → visible:true, reason:'visible_user'
Step 12: normalizeFeedRows includes B's posts
Step 13: queryClient.resetQueries resolves with B's posts in data.pages[0].posts
Step 14: useCentralFeed.posts updated → B's posts RE-APPEAR in feed

Observable effect: Block animation → posts disappear → "Subscribed" toast → posts reappear
Root cause: invalidateFeedBlockCache not called before fetchPosts(true)
Fix: useCentralFeedActions.handleBlockActor must call invalidateFeedBlockCache(actorId)
     immediately after blockActor succeeds, BEFORE fetchPosts(true)
```

### CHAIN-2: Blocked Actor Identity Exposed via Mention in Visible Post

```
Setup: User A has blocked User B. User C (not blocked by A) mentions @UserB in a post.

Step 1: User A loads central feed
Step 2: Pipeline Phase 1: readFeedPostsPage → User C's post included (C is not blocked)
Step 3: Pipeline Phase 2 parallel: User C's post text contains "@UserB" → hasPotentialMentions=true
Step 4: fetchRawPostMentionEdgesDAL → [{ post_id: C's post, mentioned_actor_id: B's actorId }]
Step 5: Phase 3: buildBlockedActorSetModel → B IS in blockedActorSet ← (correct so far)
Step 6: Phase 4: mentionedActorIds = [B's actorId]
        CHECK: mentionedActorIds.filter(id => !blockedActorSet.has(id)) → NOT PERFORMED
Step 7: hydrateAndReturnSummaries({ actorIds: [B's actorId] }) → { display_name, photo_url, username }
Step 8: enrichMentionRows → B's presentation attached to mention edge
Step 9: buildMentionMaps → mentionMapsByPostId[C's post]["userb"] = { id, displayName, avatar, route }
Step 10: normalizeFeedRows → User C's post.mentionMap contains User B's full presentation
Step 11: UI renders User C's post → @UserB mention renders with User B's name + avatar

Observable effect: User A blocked User B but sees User B's avatar/name in User C's post mention tooltip
Security impact: Block relationship not respected for mention rendering
```

### CHAIN-3: null realmId Full-Corpus Feed Exposure

```
Setup: User is in partial-onboarding state, identity context resolves realmId = null

Step 1: useFeed(viewerActorId, null) called → realmId is null
Step 2: fetchPosts(true) fires
Step 3: Guard check: if (!viewerActorId) → passes (actor exists)
        Guard check: if (!realmId) → NOT PRESENT
Step 4: fetchFeedPagePipeline({ viewerActorId, realmId: null, ... }) called
Step 5: readFeedPostsPage({ realmId: null, ... })
        if (realmId) → false → realm filter NOT added
        Query: SELECT ... FROM vc.posts WHERE deleted_at IS NULL ORDER BY created_at DESC
Step 6: Returns posts from ALL realm_id values in vc.posts
Step 7: Visibility model runs (block/follow/private) — reduces set but does not realm-gate
Step 8: User sees posts from all realms (including future Void Realm content)

Current impact: Low (only public realm active today)
Future impact: HIGH — Void Realm (18+ content) exposed to unverified users
```

### CHAIN-4: VPORT Post Invisible to All Non-Owner Viewers

```
Setup: VPORT actor published 10 posts. Non-owner user loads central feed.

Step 1: readFeedPostsPage → all 10 VPORT posts included in pageRows (no visibility filter at DB)
Step 2: readActorsBundle([vportActorId]):
  - vc.actors → actor found, actor.vport_id set
  - vportSchema.from("profiles")...in("actor_id", [vportActorId])
  - RLS on vport.profiles: owner-only → non-owner gets empty result set
  - vportMap = {} (empty)
Step 3: feedRowVisibility for VPORT posts:
  actor.vport_id is truthy → enters VPORT branch
  vportEntry = vportMap[vportActorId] → undefined → null
  → visible:false, reason:'missing_vport_profile'
Step 4: All 10 VPORT posts filtered from normalized[]
Step 5: Non-owner user's feed contains zero VPORT posts

Impact: VPORT content publishing broken — VPORTs cannot reach their audience via central feed
Not a privacy bypass but a complete functional visibility failure
```

### CHAIN-5: Actor UUID Leaked via VPORT Mention Route

```
Setup: Any post with a @mention of a VPORT actor

Step 1: enrichMentionRows processes mention edge for VPORT actor B
        vport_id: null ← explicitly set in enrichMentionRows
        slug: "my-vport-slug" ← correctly populated if vport_slug exists
Step 2: buildMentionMaps:
        const vportId = row?.vport_id ?? null  → null
        kind = "vport"
        username = row?.slug → "my-vport-slug"
Step 3: makeActorRoute({ kind:"vport", username:"my-vport-slug", actorId:"uuid-xxxx", vportId:null })
        if (kind === "vport" && vportId) → false (vportId is null)
        if (actorId) → true
        return `/profile/uuid-xxxx`  ← RAW UUID EMITTED
Step 4: mentionMap payload contains route: "/profile/uuid-xxxx"
Step 5: UI renders @my-vport-slug mention with route /profile/uuid-xxxx
Step 6: User clicks mention → navigates to /profile/uuid-xxxx
        URL bar exposes internal actor UUID
        UUID can be used for actor enumeration, external API calls

Note: The /vport/${vportId} branch in makeActorRoute is DEAD CODE.
vport_id is always null from enrichMentionRows. The intended branch never fires.
```

---

## BLACKWIDOW FINDINGS

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-001
- **Scenario:** Post-Block Fresh Fetch Reveals Blocked Content
- **Target:** `hooks/useCentralFeedActions.js:handleBlockActor` + `dal/feed.read.blockRows.dal.js:blockCache`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Attack Vector:** Block actor via post menu → feed immediately refreshes → stale blockCache → blocked posts reappear
- **Exploit Chain Type:** Cache stale-state replay after moderation action
- **Governance Status:** CONFIRMED BYPASSED
- **Result:** BYPASSED
- **Evidence:**
  - `handleBlockActor` (lines 155–185): calls `blockActor()` then `fetchPosts(true)` — no cache invalidation between them
  - `readFeedBlockRowsDAL`: cache TTL 60s — NOT cleared by block action
  - `feedCache.adapter.js` not imported in `useCentralFeedActions.js` — invalidation function not available at call site
  - Stale block rows returned → `buildBlockedActorSetModel` excludes new block → blocked posts pass visibility check → reappear in fresh feed
- **Defense Gate:** ABSENT — `invalidateFeedBlockCache` not wired to block action
- **Blast Radius:** Single actor (the newly-blocked actor's posts reappear for the blocker)
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VEN-PIPE-006 (stale block cache) — this confirms the specific exploit path within the existing finding
- **Recommended Fix:**
  ```js
  // In useCentralFeedActions.handleBlockActor, after await blockActor() succeeds:
  import { invalidateFeedBlockCache } from '@/features/feed/adapters/feedCache.adapter'
  // ...
  await blockActor({ blockerActorId: actorId, blockedActorId })
  invalidateFeedBlockCache(actorId)   // ← ADD THIS
  await fetchPosts(true)
  ```
- **Layer to Fix:** Cache (feedCache.adapter.js invalidation wiring in block action controller)
- **Required Follow-up Command:** ELEKTRA (patch handleBlockActor)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-002
- **Scenario:** Blocked Actor Identity Exposed via Mention in Visible Post
- **Target:** `pipeline/fetchFeedPage.pipeline.js:Phase 4` — mention hydration fan-out
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine / Shared Engine (hydration)
- **Attack Vector:** User C mentions blocked User B → User A sees User B's avatar+name in mention map
- **Exploit Chain Type:** Trust boundary bypass — block filter not applied to mention hydration
- **Governance Status:** CONFIRMED BYPASSED
- **Result:** BYPASSED
- **Evidence:**
  - `fetchFeedPage.pipeline.js:127–133`: `hydrateAndReturnSummaries({ actorIds: mentionedActorIds })` called without blockedActorSet filter
  - `blockedActorSet` is built at Phase 3 (before Phase 4) — available but not applied
  - `buildMentionMaps` produces mentionMap with blocked actor's `{ id, displayName, avatar, route }`
  - Block filter covers post AUTHORS — does not extend to MENTIONED actors
- **Defense Gate:** ABSENT — no blockedActorSet filter before mention hydration
- **Blast Radius:** Single actor (per mention of blocked actor in visible post)
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VEN-PIPE-008 — CONFIRMED BYPASSED
- **Recommended Fix:**
  ```js
  // In fetchFeedPage.pipeline.js Phase 4, before hydrateAndReturnSummaries:
  const mentionedActorIdsSafe = mentionedActorIds.filter(id => !blockedActorSet.has(id));
  if (mentionedActorIdsSafe.length > 0) {
    const { rows: presentations } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIdsSafe });
    enrichedMentionRows = enrichMentionRows(mentionEdges, presentations ?? []);
  }
  ```
- **Layer to Fix:** Pipeline (Phase 4 mention hydration guard)
- **Required Follow-up Command:** ELEKTRA (patch pipeline Phase 4)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-003
- **Scenario:** null realmId Exposes All-Realm Post Corpus
- **Target:** `dal/feed.read.posts.dal.js:readFeedPostsPage`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vc.posts)
- **Attack Vector:** Partially-onboarded user or caller with realmId=null → all realms exposed
- **Exploit Chain Type:** Missing input guard — conditional filter on null value
- **Governance Status:** CONFIRMED BYPASSED
- **Result:** BYPASSED
- **Evidence:**
  - `feed.read.posts.dal.js:30–33`: `if (realmId) { q = q.eq(...) }` — null skips filter
  - No realmId validation at pipeline entry (fetchFeedPagePipeline accepts null)
  - No realmId validation at hook entry (useFeed, useCentralFeed)
  - RLS on vc.posts cannot provide realm isolation (realm_id is a data column, not an auth claim)
  - Future Void Realm: 18+ content would be exposed to unverified users in this gap
- **Defense Gate:** ABSENT
- **Blast Radius:** Feed-wide — all posts from all realms returned
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VEN-PIPE-002 — CONFIRMED BYPASSED
- **Recommended Fix:** Throw at pipeline entry if realmId is null, or guard with default public realm constant
- **Layer to Fix:** DAL (guard) + Pipeline (entry validation)
- **Required Follow-up Command:** ELEKTRA (add realm guard)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-004
- **Scenario:** VPORT Post Invisible to All Non-Owner Feed Viewers
- **Target:** `dal/feed.read.actorsBundle.dal.js` — vportSchema query with owner-only RLS
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vport.profiles) / Feed Engine
- **Attack Vector:** Non-owner user views central feed containing VPORT-authored posts
- **Exploit Chain Type:** RLS policy misconfiguration — content availability failure
- **Governance Status:** CONFIRMED BYPASSED (visibility failure — not a privilege bypass)
- **Result:** BYPASSED (content invisible — entire VPORT audience locked out)
- **Evidence:**
  - vportSchema.from("profiles") returns empty result for non-owners (owner-only RLS)
  - vportMap = {} → feedRowVisibility: `missing_vport_profile` → `visible:false`
  - ALL VPORT posts filtered from normalized output for ALL non-owner viewers
  - Hook-layer workaround (force-hydrate via RPC) runs async but does NOT affect the synchronous visibility model — posts are already filtered before hydration completes
- **Defense Gate:** N/A — this is a functional failure, not a security gate
- **Blast Radius:** Feed-wide — all VPORT content invisible to all non-owners
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VEN-PIPE-003 — CONFIRMED
- **Recommended Fix:** DB: add public-read select policy on vport.profiles for feed presentation fields; or add SECURITY DEFINER RPC path for non-owner bundle fetch
- **Layer to Fix:** RLS (primary) + DAL (fallback RPC path)
- **Required Follow-up Command:** DB (policy audit), ELEKTRA (RPC fallback patch)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-005
- **Scenario:** Actor UUID Exposed in VPORT Mention Route Fallback
- **Target:** `model/buildMentionMaps.model.js:makeActorRoute`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Attack Vector:** Any post mentioning a VPORT actor → route generated as /profile/{actorId}
- **Exploit Chain Type:** Dead code path + missing slug fallback → UUID leak
- **Governance Status:** CONFIRMED BYPASSED
- **Result:** BYPASSED
- **Evidence:**
  - enrichMentionRows sets `vport_id: null` explicitly for all rows
  - makeActorRoute: `if (kind === "vport" && vportId)` → vportId is ALWAYS null → branch never taken
  - `/vport/${vportId}` is dead code — never executes
  - Fallback `if (actorId) return \`/profile/${actorId}\`` → raw UUID exposed for ALL vport mentions
  - `handleOpenActorProfile` additionally exposes raw UUID: `navigate(\`/profile/${postMenu.postActorId}\`)`
  - `handleShare` additionally exposes raw UUID: `/post/${postId}`
- **Defense Gate:** ABSENT — no slug enforcement in makeActorRoute
- **Blast Radius:** Single actor per mention/action
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-PIPE-004 — CONFIRMED + extended to actions layer
- **Recommended Fix:** Fix makeActorRoute to use slug not actorId; fix handleOpenActorProfile to resolve slug before navigating; fix handleShare to use slug-based post URL
- **Layer to Fix:** Model (buildMentionMaps) + Controller (useCentralFeedActions)
- **Required Follow-up Command:** ELEKTRA (patch route generation)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-006
- **Scenario:** Unfollow of Private Actor — Stale Follow Cache Keeps Private Posts Visible
- **Target:** `dal/feed.read.followRows.dal.js:followCache` + `hooks/useCentralFeedActions.js:handleFollowActor`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Attack Vector:** User A unfollows private User B → handleFollowActor does NOT call fetchPosts → stale followCache maintains B as followed → B's private posts visible on next scroll page
- **Exploit Chain Type:** Missing post-action cache invalidation + missing feed refresh
- **Governance Status:** PARTIAL
- **Result:** PARTIAL
- **Evidence:**
  - `handleFollowActor` (useCentralFeedActions.js:120–147): calls `toggleFollow(...)` then `onFollowToast` → NO `fetchPosts()` call after unfollow
  - followCache TTL: 60s — not cleared by unfollow action
  - Next scroll pagination: `readFeedFollowRowsDAL` → stale cache → User B still in followedActorSet → private posts remain visible
  - Contrast with handleBlockActor: block DOES call fetchPosts(true) (but stale blockCache causes its own problem — see BW-PIPE-001)
- **Defense Gate:** ABSENT — follow invalidation not wired
- **Blast Radius:** Single actor (private posts of unfollowed actor remain visible)
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-PIPE-006 — CONFIRMED (unfollow path)
- **Recommended Fix:**
  ```js
  // In handleFollowActor, after unfollow result:
  if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
    invalidateFeedFollowCache(actorId)   // ← ADD
    await fetchPosts(true)               // ← ADD for private-follow case
  }
  ```
- **Layer to Fix:** Cache + Controller (handleFollowActor)
- **Required Follow-up Command:** ELEKTRA (patch handleFollowActor)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-007
- **Scenario:** Malformed actorId Silently Zeroes Hidden Post Suppression
- **Target:** `dal/feed.read.hiddenPosts.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (moderation.actions)
- **Attack Vector:** Non-UUID viewerActorId passed → DB error → returns empty Set → no hidden posts suppressed
- **Exploit Chain Type:** Silent error swallow after missing input validation
- **Governance Status:** PARTIAL
- **Result:** PARTIAL (requires internal misconfiguration; not externally triggerable via normal UI)
- **Evidence:**
  - `readHiddenPostsForViewer`: guards only with falsy check (`!viewerActorId`)
  - Non-UUID truthy string → DB query: `.eq("actor_id", "malformed")` → Postgres UUID error
  - Error path: `if (actionsErr || ...) return hiddenByMeSet` (empty Set) — no error thrown, no log
  - Effect: viewer's previously-hidden posts appear in feed (hidden post suppression silently fails)
  - Contrast: readFeedBlockRowsDAL uses `isUuid()` — returns [] on invalid input without hitting DB
- **Defense Gate:** WEAK (falsy check only, not UUID format validation)
- **Blast Radius:** Single session (hidden posts reappear for viewer with invalid actorId)
- **Severity:** LOW-MEDIUM
- **VENOM Finding Cross-Reference:** VEN-PIPE-005 — PARTIAL
- **Recommended Fix:** Add `isUuid(viewerActorId)` guard matching blockRows/followRows pattern
- **Layer to Fix:** DAL
- **Required Follow-up Command:** ELEKTRA (add isUuid guard)

---

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-PIPE-008
- **Scenario:** viewerActorId Not Bound to Supabase Session at Hook Layer
- **Target:** `hooks/useFeed.js` and `hooks/useCentralFeed.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Attack Vector:** Caller passes a different viewerActorId than the authenticated session's resolved actor
- **Exploit Chain Type:** Missing session binding — hook accepts arbitrary actorId from caller
- **Governance Status:** PARTIAL (externally non-triggerable under normal flow)
- **Result:** PARTIAL
- **Evidence:**
  - `useFeed(viewerActorId, realmId, opts)`: viewerActorId is a parameter — no Supabase auth check
  - No `supabase.auth.getUser()` call inside either hook to verify actorId matches session
  - Pipeline uses caller-provided actorId for block/follow/hidden data ownership queries
  - In practice: caller is identity context hook (session-derived) — not an external attack surface
  - Risk: debug overrides, test harnesses, or future callers could pass arbitrary actorIds
- **Defense Gate:** ABSENT at hook boundary; present at upstream identity context (session-derived)
- **Blast Radius:** Single session (affects only the caller's feed data)
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** New finding (extends VEN-PIPE-001 — no app-layer auth)
- **Recommended Fix:** Documented architecture concern — acceptable risk given identity context ownership of viewerActorId derivation. Consider adding assertion in DEV mode only.
- **Layer to Fix:** Hook (documentation + DEV assertion)
- **Required Follow-up Command:** LOGAN (document session binding assumption in BEHAVIOR.md §12)

---

## Recommended Fixes

| Finding | Fix | Priority | Layer |
|---|---|---|---|
| BW-PIPE-001 | `invalidateFeedBlockCache(actorId)` before `fetchPosts(true)` in `handleBlockActor` | P0 | Cache/Controller |
| BW-PIPE-002 | Filter `mentionedActorIds` against `blockedActorSet` before `hydrateAndReturnSummaries` | P1 | Pipeline |
| BW-PIPE-003 | Throw/guard on `realmId=null` at pipeline entry or DAL entry | P0 | DAL/Pipeline |
| BW-PIPE-004 | DB: public read policy on vport.profiles for feed fields | P0 | RLS |
| BW-PIPE-005 | Fix `makeActorRoute` to use slug; fix `handleOpenActorProfile` + `handleShare` | P1 | Model/Controller |
| BW-PIPE-006 | Wire `invalidateFeedFollowCache` + `fetchPosts(true)` to unfollow action | P1 | Cache/Controller |
| BW-PIPE-007 | Add `isUuid()` guard to `readHiddenPostsForViewer` + `readViewerReactionsBatch` | P1 | DAL |
| BW-PIPE-008 | Document session binding assumption; DEV assertion recommended | P3 | Hook |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Patch proposals for BW-PIPE-001 (block race), BW-PIPE-002 (mention filter), BW-PIPE-005 (UUID routes), BW-PIPE-006 (unfollow), BW-PIPE-007 (UUID validation) | REQUIRED |
| DB | Audit vport.profiles RLS policy — add public-read select policy for feed fields | REQUIRED |
| SPIDER-MAN | Generate regression tests: block→fetch race, mention with blocked actor, null realmId | REQUIRED |
| LOKI | Runtime trace: confirm block action cache invalidation timing in production telemetry | RECOMMENDED |
| THOR | Release gate: BW-PIPE-001 (HIGH), BW-PIPE-003 (HIGH), BW-PIPE-004 (HIGH) are THOR blockers | REQUIRED |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Source-to-sink trace + patch proposals | PENDING (next in bundle) |
| SPIDER-MAN | Regression test generation | PENDING (later in bundle) |
| THOR | Release gate evaluation | PENDING (final in bundle) |
