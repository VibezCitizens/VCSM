# ELEKTRA Patch Proposals — Feed Pipeline Module

**Date:** 2026-06-05
**Scope:** VCSM:feed/modules/pipeline
**Reviewer:** ELEKTRA
**Environment:** Source-verified static analysis
**Governance Status:** ACTIVE
**VENOM Upstream:** `outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md`
**BLACKWIDOW Upstream:** `outputs/2026/06/05/BLACKWIDOW/2026-06-05_blackwidow_feed-pipeline-adversarial-review.md`

**Patch Proposals:** 8 total (2 P0 | 4 P1 | 2 P2)
**DB-Level Deferrals:** 1 (vport.profiles RLS — not addressable in code)

> ELEKTRA proposes patches. ELEKTRA NEVER applies them.
> All patch proposals must be reviewed by a human before any code change is made.

---

## Source → Sink Chain Traces

---

### CHAIN-ELEK-PIPE-001 — Block Action Stale Cache (P0)

**Finding Reference:** BW-PIPE-001 / VEN-PIPE-006
**Severity:** HIGH
**Priority:** P0 — Confirmed exploit: safety feature reversal

```
SOURCE:  User A clicks "Block actor" in post menu
         apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:155
         handleBlockActor useCallback

HOP 1:   Optimistic UI remove
         useCentralFeedActions.js:170–173
         setPosts(prev => prev.filter(...blockedActorId))
         [User B's posts removed from rendered list]

HOP 2:   Block DB write
         useCentralFeedActions.js:178
         await blockActor({ blockerActorId: actorId, blockedActorId })
         → engines/block or features/block — INSERT into moderation.blocks
         [DB write SUCCEEDS — block now persisted]

HOP 3:   Feed refresh triggered — NO cache invalidation before this
         useCentralFeedActions.js:179
         await fetchPosts(true)
         → useCentralFeed.js:queryClient.resetQueries({ queryKey })

HOP 4:   React Query fires new pipeline call
         queries/fetchCentralFeedPage.js → fetchFeedPagePipeline(...)

HOP 5:   Block rows fetched
         dal/feed.read.blockRows.dal.js:readFeedBlockRowsDAL({ viewerActorId: A, actorIds })
         → blockCache.get(A)
         ← CACHE HIT (populated on prior feed load, 60s TTL, NOT cleared)
         ← Returns rows from BEFORE block action — B not in cached rows

HOP 6:   Block set built without B
         model/feedBlockVisibility.model.js:buildBlockedActorSetModel(cachedRows)
         ← blockedActorSet does NOT contain B

HOP 7:   Visibility check passes for B's posts
         model/feedRowVisibility.model.js:computeFeedRowVisibility(...)
         blockedActorSet.has(B) → false → continues to user/vport branch
         ← visible:true, reason:'visible_user'

HOP 8:   normalizeFeedRows includes B's posts
         model/normalizeFeedRows.model.js:normalizeFeedRows(...)
         ← B's posts in normalized[]

SINK:    queryClient.resetQueries resolves with B's posts in data.pages[0].posts
         React Query updates state → useCentralFeed.posts includes B's posts
         UI renders: B's posts reappear in User A's feed despite successful block
```

**Attack Chain:** Confirmed BYPASSED — block UI reverts after refresh

**Proposed Patch (ELEK-PIPE-001):**

```
File: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js

Current (line 178–179):
  await blockActor({ blockerActorId: actorId, blockedActorId })
  await fetchPosts(true)

Proposed:
  await blockActor({ blockerActorId: actorId, blockedActorId })
  invalidateFeedBlockCache(actorId)  // ← ADD: clear stale cache before fresh fetch
  await fetchPosts(true)

Required import (line 9, after existing imports):
  import { invalidateFeedBlockCache } from '@/features/feed/adapters/feedCache.adapter'

Note: invalidateFeedBlockCache(actorId) is already exported from
  apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js
  and re-exported from apps/VCSM/src/features/feed/adapters/feedCache.adapter.js
  This is a 2-line change: 1 import + 1 call.
```

---

### CHAIN-ELEK-PIPE-002 — null realmId All-Realm Corpus Exposure (P0)

**Finding Reference:** BW-PIPE-003 / VEN-PIPE-002
**Severity:** HIGH
**Priority:** P0 — Future Void Realm breach; no app-layer defense

```
SOURCE:  Partially-onboarded user or caller with realmId not yet resolved
         hooks/useFeed.js: useFeed(viewerActorId, null, opts)
         hooks/useCentralFeed.js: useCentralFeed({ actorId, realmId: null })

HOP 1:   Hook entry guard
         useFeed.js: if (!viewerActorId) return  ← passes (actor exists)
         [NO realmId null check present]

HOP 2:   Pipeline called with null realmId
         pipeline/fetchFeedPage.pipeline.js:fetchFeedPagePipeline({ viewerActorId, realmId: null })
         [NO realmId validation at pipeline entry]

HOP 3:   DAL called with realmId=null
         dal/feed.read.posts.dal.js:readFeedPostsPage({ realmId: null, cursorCreatedAt, pageSize })

HOP 4:   Conditional filter skipped
         feed.read.posts.dal.js:30–32
         if (realmId) {            ← null → false
           q = q.eq("realm_id", realmId);
         }
         [Filter NOT added to query]

HOP 5:   Unscoped query executes
         SELECT id, actor_id, text, ... FROM vc.posts
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         [No realm_id WHERE clause — ALL realms returned]

SINK:    Pipeline returns posts from ALL realms
         Current: only public realm exists → low immediate impact
         Future: Void Realm 18+ content exposed to unverified users
         RLS cannot compensate: realm_id is a data column, not an auth claim
```

**Attack Chain:** Confirmed BYPASSED — realm isolation entirely bypassed when realmId is null

**Proposed Patch (ELEK-PIPE-002):**

```
File: apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js

Current (line 30–32):
  if (realmId) {
    q = q.eq("realm_id", realmId);
  }

Proposed (lines 7–11, before query construction):
  // Realm is required — null realmId must never return cross-realm results
  if (!realmId) {
    return { pageRows: [], hasMore: false, nextCursorCreatedAt: null };
  }

  // Remove the conditional filter since realmId is now guaranteed non-null:
  q = q.eq("realm_id", realmId);  // ← unconditional

Rationale: fail-safe at the DAL is the deepest defense. Any caller that
  passes null will get an empty result rather than all-realm exposure.
  The pipeline and hooks should ALSO be updated to propagate a meaningful
  error to the UI (separate P2 task), but the DAL guard is the required safety net.

Alternative (if early-return is not acceptable):
  Throw with a developer error message at pipeline entry:
  fetchFeedPage.pipeline.js:
    if (!realmId) throw new Error('[feed-pipeline] realmId is required');
```

---

### CHAIN-ELEK-PIPE-003 — Blocked Actor Identity in Mention Hydration (P1)

**Finding Reference:** BW-PIPE-002 / VEN-PIPE-008
**Severity:** HIGH
**Priority:** P1

```
SOURCE:  User A has blocked User B. User C (not blocked) mentions @UserB in a visible post.
         moderation.blocks: (A, B) active block exists
         vc.post_mentions: post_id=C's post, mentioned_actor_id=B's actorId

HOP 1:   Phase 3 builds blockedActorSet (correct)
         pipeline/fetchFeedPage.pipeline.js:117–123
         blockedActorSet = buildBlockedActorSetModel({ blockRows })
         ← B IS in blockedActorSet

HOP 2:   Mention edges fetched
         pipeline/fetchFeedPage.pipeline.js:107–110 (in Phase 2 parallel)
         mentionEdges = [{ post_id: C's post, mentioned_actor_id: B's actorId }]

HOP 3:   mentionedActorIds built — NO block filter applied
         pipeline/fetchFeedPage.pipeline.js:128
         mentionedActorIds = [...new Set(mentionEdges.map(e => e.mentioned_actor_id))]
         ← [B's actorId] — block filter NOT applied at this step

HOP 4:   hydrateAndReturnSummaries called with blocked actor's ID
         pipeline/fetchFeedPage.pipeline.js:130
         const { rows: presentations } = await hydrateAndReturnSummaries({ actorIds: [B's actorId] })
         ← Returns B's { display_name, photo_url, username } from engines/hydration

HOP 5:   B's presentation attached to mention rows
         enrichMentionRows(mentionEdges, presentations) → mention row includes B's full profile

HOP 6:   Mention map built with B's data
         buildMentionMaps(enrichedMentionRows)
         ← mentionMapsByPostId[C's post]["userb"] = { id, displayName, avatar, route }

HOP 7:   normalizeFeedRows includes C's post with mention map
         normalizeFeedRows: C's post.mentionMap = { "userb": B's presentation }

SINK:    UI renders @userb mention in C's post with B's avatar + name
         User A (who blocked B) sees B's profile identity in mention tooltip
         Block relationship not respected for mentioned actors
```

**Attack Chain:** Confirmed BYPASSED — block filter not applied to mention hydration

**Proposed Patch (ELEK-PIPE-003):**

```
File: apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js

Current (lines 127–134):
  let enrichedMentionRows = [];
  if (mentionEdges.length > 0) {
    const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
    if (mentionedActorIds.length > 0) {
      const { rows: presentations, error: presErr } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIds });
      if (presErr) throw presErr;
      enrichedMentionRows = enrichMentionRows(mentionEdges, presentations ?? []);
    }
  }

Proposed:
  let enrichedMentionRows = [];
  if (mentionEdges.length > 0) {
    const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
    // Exclude blocked actors from mention hydration — block applies to all identity surfaces
    const safeMentionActorIds = mentionedActorIds.filter((id) => !blockedActorSet.has(id));
    if (safeMentionActorIds.length > 0) {
      const { rows: presentations, error: presErr } = await hydrateAndReturnSummaries({ actorIds: safeMentionActorIds });
      if (presErr) throw presErr;
      enrichedMentionRows = enrichMentionRows(mentionEdges, presentations ?? []);
    }
  }

Note: blockedActorSet is already in scope at this point (built in Phase 3 at line 117–123).
  This is a 1-line addition: filter before the hydrateAndReturnSummaries call.
  Mention edges for blocked actors remain in mentionEdges but receive no presentation data.
  buildMentionMaps will skip entries with no presentation — the @mention text will still
  render in the post body but the tooltip/profile link will be absent (safe degradation).
```

---

### CHAIN-ELEK-PIPE-004 — Stale Follow Cache After Unfollow (P1)

**Finding Reference:** BW-PIPE-006 / VEN-PIPE-006
**Severity:** MEDIUM
**Priority:** P1

```
SOURCE:  User A unfollows private User B via post menu
         hooks/useCentralFeedActions.js:120 handleFollowActor

HOP 1:   toggleFollow called — unfollow write succeeds
         useCentralFeedActions.js:125
         const result = await toggleFollow({ followerActorId: actorId, followedActorId: ..., isFollowing: true })
         ← result.mode === 'unfollow' → DB write: DELETE from vc.actor_follows

HOP 2:   Toast shown, menu closed — NO cache invalidation, NO feed refresh
         useCentralFeedActions.js:131–137
         if (result?.mode === 'unfollow' ...) onFollowToast?.('Unsubscribed')
         closePostMenu()
         [followCache NOT cleared; fetchPosts NOT called]

HOP 3:   User scrolls → next page fetched
         fetchCentralFeedPage → fetchFeedPagePipeline

HOP 4:   Follow rows fetched from stale cache
         dal/feed.read.followRows.dal.js:readFeedFollowRowsDAL({ viewerActorId: A, actorIds })
         → followCache.get(A)
         ← CACHE HIT (TTL 60s, populated pre-unfollow)
         ← B still in followedActorSet

HOP 5:   Private content passes visibility
         feedRowVisibility: isFollowing = true (from stale followedActorSet)
         feedPrivateVisibility: !isPrivate || isOwner || isFollowing → true (stale)
         ← B's private posts remain visible

SINK:    User A sees B's private posts in next page results after unfollow
         Duration: until followCache TTL (60s) or manual full refresh
```

**Attack Chain:** PARTIAL — duration-bounded (60s TTL), no persistent exploit

**Proposed Patch (ELEK-PIPE-004):**

```
File: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js

Current (lines 131–137):
  if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
    onFollowToast?.('Unsubscribed')
  } else {
    onFollowToast?.('Subscribed')
  }
  closePostMenu()

Proposed:
  if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
    onFollowToast?.('Unsubscribed')
    invalidateFeedFollowCache(actorId)  // ← ADD: clear stale follow data
    await fetchPosts(true)             // ← ADD: refresh feed to apply new visibility state
  } else {
    onFollowToast?.('Subscribed')
  }
  closePostMenu()

Required import (if not already present — check adapter re-exports):
  import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'

Note: invalidateFeedFollowCache is already exported from feedCache.adapter.js.
  fetchPosts is already available in scope (passed as prop to useCentralFeedActions).
  The fetchPosts(true) on unfollow matches the pattern already used for delete/report.
```

---

### CHAIN-ELEK-PIPE-005 — Missing UUID Validation in hiddenPosts DAL (P1)

**Finding Reference:** BW-PIPE-007 / VEN-PIPE-005
**Severity:** LOW-MEDIUM
**Priority:** P1 (consistency fix — matches blockRows/followRows pattern)

```
SOURCE:  readHiddenPostsForViewer({ viewerActorId: "not-a-uuid", postIds: [...] })
         dal/feed.read.hiddenPosts.dal.js:3

HOP 1:   Existing guard (line 6)
         if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) return new Set()
         "not-a-uuid" is truthy → guard passes

HOP 2:   DB query fires with malformed UUID
         .eq("actor_id", "not-a-uuid")
         → Postgres: invalid input syntax for type uuid
         → Supabase returns { data: null, error: { code: "22P02", ... } }

HOP 3:   Error caught silently
         if (actionsErr || !Array.isArray(actions) || actions.length === 0) return hiddenByMeSet
         ← returns empty Set — no error thrown, no log

SINK:    All previously-hidden posts appear in feed for this session
         (Silent failure — hidden post suppression completely disabled)

Contrast: feed.read.blockRows.dal.js:14
  if (!viewerActorId || !isUuid(viewerActorId)) return []  ← correct pattern
```

**Attack Chain:** PARTIAL (internal misconfiguration only)

**Proposed Patch (ELEK-PIPE-005):**

```
File: apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js

Add import at line 1:
  import { isUuid } from "@/services/supabase/postgrestSafe";

Current guard (line 6):
  if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) {
    return hiddenByMeSet;
  }

Proposed:
  if (!viewerActorId || !isUuid(viewerActorId) || !Array.isArray(postIds) || postIds.length === 0) {
    return hiddenByMeSet;
  }

Note: isUuid is already imported in blockRows.dal.js from "@/services/supabase/postgrestSafe"
  — same import path applies here.
```

---

### CHAIN-ELEK-PIPE-006 — Missing UUID Validation in viewerReactions DAL (P1)

**Finding Reference:** VEN-PIPE-005
**Severity:** LOW-MEDIUM
**Priority:** P1 (consistency fix — matches blockRows/followRows pattern)

```
SOURCE:  readViewerReactionsBatch({ postIds: [...], actorId: "not-a-uuid" })
         dal/feed.read.viewerReactions.dal.js:13

HOP 1:   Existing guard (line 14)
         if (!actorId || !Array.isArray(postIds) || postIds.length === 0) return new Map()
         "not-a-uuid" is truthy → guard passes

HOP 2:   DB query fires with malformed UUID
         .eq("actor_id", "not-a-uuid")
         → Postgres: invalid input syntax for type uuid
         → Supabase returns { data: null, error: { code: "22P02", ... } }

HOP 3:   Error thrown (unlike hiddenPosts — this one throws)
         if (error) throw error   ← line 25
         → pipeline crash OR silent failure depending on caller error handling

SINK:    Pipeline may throw during Phase 1 parallel enrichment
         Feed page fails to load for affected viewer
```

**Attack Chain:** PARTIAL (internal misconfiguration only; throwing is better than silent fail)

**Proposed Patch (ELEK-PIPE-006):**

```
File: apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js

Add import at line 7 (before supabase import):
  import { isUuid } from "@/services/supabase/postgrestSafe";

Current guard (line 14):
  if (!actorId || !Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }

Proposed:
  if (!actorId || !isUuid(actorId) || !Array.isArray(postIds) || postIds.length === 0) {
    return new Map();
  }
```

---

### CHAIN-ELEK-PIPE-007 — Raw Actor UUID in VPORT Mention Route (P2)

**Finding Reference:** BW-PIPE-005 / VEN-PIPE-004
**Severity:** MEDIUM
**Priority:** P2 — UUID enumeration; no content leakage

```
SOURCE:  Any post with a @mention of a VPORT actor in the feed

HOP 1:   enrichMentionRows explicitly nulls vport_id
         model/enrichMentionRows.model.js:14
         vport_id: null  ← intentional, always set

HOP 2:   buildMentionMaps calls makeActorRoute with vportId=null
         model/buildMentionMaps.model.js:32
         const vportId = row?.vport_id ?? null  ← always null

HOP 3:   makeActorRoute evaluates /vport/${vportId} branch
         buildMentionMaps.model.js:5
         if (kind === "vport" && vportId) return `/vport/${vportId}`
         ← vportId is null → FALSE — branch is DEAD CODE, never executes

HOP 4:   Fallback to /profile/${actorId}
         buildMentionMaps.model.js:6
         if (actorId) return `/profile/${actorId}`
         ← RAW UUID emitted for ALL VPORT actor mentions

HOP 5:   handleOpenActorProfile (separate path, same UUID exposure)
         hooks/useCentralFeedActions.js:152
         navigate(`/profile/${postMenu.postActorId}`)
         ← raw UUID in navigation URL for ALL profile open actions

SINK:    Internal actor UUIDs exposed in:
         - Mention route payloads (returned to UI in normalized feed data)
         - Browser navigation history
         - URL bar during profile view
         - Referrer headers on navigation
```

**Attack Chain:** Confirmed UUID leak — no content breach, actor enumeration risk

**Proposed Patch (ELEK-PIPE-007A — makeActorRoute):**

```
File: apps/VCSM/src/features/feed/model/buildMentionMaps.model.js

Current makeActorRoute (lines 3–8):
  function makeActorRoute({ kind, username, actorId, vportId }) {
    if (kind === "user" && username) return `/u/${username}`;
    if (kind === "vport" && vportId) return `/vport/${vportId}`;
    if (actorId) return `/profile/${actorId}`;
    return "/feed";
  }

Proposed:
  function makeActorRoute({ kind, username, actorId, vportId }) {
    if (kind === "user" && username) return `/u/${username}`;
    if (kind === "vport") {
      if (vportId) return `/vport/${vportId}`;
      if (username) return `/vport/${username}`;  // Use slug as safe fallback
      return "/feed";                             // No UUID fallback for vport kind
    }
    if (username) return `/profile/${username}`;  // Prefer slug over UUID for users
    if (actorId) return `/profile/${actorId}`;    // UUID fallback acceptable for legacy user routes
    return "/feed";
  }

Note: This also fixes enrichMentionRows.model.js:14 setting vport_id:null —
  the slug (row?.slug) is already available in enriched rows via the hydration engine.
  With this fix, VPORT mentions will correctly route to /vport/{slug} instead of /profile/{uuid}.

Pre-condition: Confirm that row?.slug is reliably populated by hydrateAndReturnSummaries.
  If slug is sometimes null for VPORT actors, the /vport/${username} fallback covers it via
  the existing `username` field (which is populated from vport_name/slug).
```

**Proposed Patch (ELEK-PIPE-007B — handleOpenActorProfile, separate ticket):**

```
File: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js

Current (line 152):
  navigate(`/profile/${postMenu.postActorId}`)

Proposed (requires resolving actor username from actorMap or actor data on the post):
  // Navigate using username/slug when available; fallback UUID is acceptable
  const actorUsername = postMenu?.postActorUsername ?? null;
  const route = actorUsername ? `/u/${actorUsername}` : `/profile/${postMenu.postActorId}`;
  navigate(route)

Note: This requires adding postActorUsername to the postMenu state shape.
  This is a multi-file change (postMenu population + useCentralFeedActions).
  Recommend as a separate ticket scoped to "profile navigation slug enforcement".
  ELEK-PIPE-007A (mention route fix) is higher priority and can ship independently.
```

---

### CHAIN-ELEK-PIPE-008 — Unguarded console.log with debugPostId (P2)

**Finding Reference:** VEN-PIPE-009
**Severity:** LOW
**Priority:** P2 — Low risk in current callers; belt-and-suspenders fix

```
SOURCE:  fetchFeedPagePipeline called with any value for debugPostId param
         pipeline/fetchFeedPage.pipeline.js:136–141

CURRENT CODE (lines 136–141):
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

CURRENT RISK ASSESSMENT:
  - In production callers (useFeed.js, fetchCentralFeedPage.js):
    debugPostId is undefined → outer guard is false → log never fires
  - If future caller adds debugPostId support without DEV guard:
    console.log fires in production → log exposure, potential pagePostIds leak

SINK:    Production console.log with array of post IDs on the current page
         Not a current exploit — a future regression risk
```

**Attack Chain:** Low risk (currently dead in production callers)

**Proposed Patch (ELEK-PIPE-008):**

```
File: apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js

Current (lines 136–141):
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

Proposed:
  if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

Note: Minimal change — add DEV guard at outer if-check.
  This matches the existing pattern at lines 145, 164 in the same file.
```

---

## Deferred Findings (Non-Code)

### DEFERRED-ELEK-PIPE-D001 — vport.profiles Owner-Only RLS (VEN-PIPE-003 / BW-PIPE-004)

```
Finding:     VPORT posts invisible to all non-owner viewers — owner-only RLS on vport.profiles
             prevents non-owners from reading vport presentation data needed for visibility check
Finding IDs: VEN-PIPE-003, BW-PIPE-004
Severity:    HIGH — functional visibility failure for all VPORT content in central feed
Priority:    P0

Why ELEKTRA cannot propose a code patch:
  The root cause is an RLS policy on vport.profiles in the Supabase database.
  No client-side code change can override or bypass RLS.
  The fix is a DB policy change.

Recommended action (DB team):
  Option A (preferred): Add a SELECT policy on vport.profiles that allows
    authenticated users to read a restricted set of feed-safe columns
    (actor_id, display_name, avatar_url, slug, is_public) for all profiles:
    
    CREATE POLICY "vport_profiles_feed_read" ON vport.profiles
      FOR SELECT
      TO authenticated
      USING (is_public = true);  -- or unconditionally if no privacy setting exists

  Option B (app-layer workaround — if DB change is gated):
    Add a SECURITY DEFINER RPC function `get_vport_profiles_for_feed(actor_ids uuid[])`
    that returns only feed-safe columns, bypasses RLS, and can be called by authenticated users.
    The DAL (feed.read.actorsBundle.dal.js) would call this RPC instead of direct table query.

  Affected file (if Option B): apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js
    Replace: vportSchema.from("profiles").select(...)..in("actor_id", actorIdsForVports)
    With:    supabase.rpc("get_vport_profiles_for_feed", { actor_ids: actorIdsForVports })

Required follow-up command: DB (Carnage for migration authoring if policy change is needed)
```

---

## Patch Summary

| Patch ID | Finding Refs | Priority | Layer | Change Complexity | File |
|---|---|---|---|---|---|
| ELEK-PIPE-001 | BW-PIPE-001 / VEN-PIPE-006 | P0 | Controller | 1 import + 1 line | `useCentralFeedActions.js` |
| ELEK-PIPE-002 | BW-PIPE-003 / VEN-PIPE-002 | P0 | DAL | 3 lines | `feed.read.posts.dal.js` |
| ELEK-PIPE-003 | BW-PIPE-002 / VEN-PIPE-008 | P1 | Pipeline | 1 line | `fetchFeedPage.pipeline.js` |
| ELEK-PIPE-004 | BW-PIPE-006 / VEN-PIPE-006 | P1 | Controller | 1 import + 2 lines | `useCentralFeedActions.js` |
| ELEK-PIPE-005 | BW-PIPE-007 / VEN-PIPE-005 | P1 | DAL | 1 import + 1 line | `feed.read.hiddenPosts.dal.js` |
| ELEK-PIPE-006 | VEN-PIPE-005 | P1 | DAL | 1 import + 1 line | `feed.read.viewerReactions.dal.js` |
| ELEK-PIPE-007A | BW-PIPE-005 / VEN-PIPE-004 | P2 | Model | 4 lines | `buildMentionMaps.model.js` |
| ELEK-PIPE-008 | VEN-PIPE-009 | P2 | Pipeline | 1 word | `fetchFeedPage.pipeline.js` |
| DEFERRED-D001 | BW-PIPE-004 / VEN-PIPE-003 | P0 | RLS (DB) | DB policy change | vport.profiles RLS |

---

## THOR Gate Impact

| Patch ID | THOR Impact |
|---|---|
| ELEK-PIPE-001 | Resolves BW-PIPE-001 THOR blocker |
| ELEK-PIPE-002 | Resolves BW-PIPE-003 / VEN-PIPE-002 THOR blocker |
| ELEK-PIPE-003 | Resolves VEN-PIPE-008 finding (HIGH) |
| ELEK-PIPE-004 | Resolves VEN-PIPE-006 (unfollow path) |
| ELEK-PIPE-005 | Resolves VEN-PIPE-005 (hiddenPosts) |
| ELEK-PIPE-006 | Resolves VEN-PIPE-005 (viewerReactions) |
| ELEK-PIPE-007A | Resolves VEN-PIPE-004 (mention route) |
| ELEK-PIPE-008 | Resolves VEN-PIPE-009 (console.log) |
| DEFERRED-D001 | VEN-PIPE-003 / BW-PIPE-004 remain OPEN — THOR blocker until DB fix |

---

## Required Follow-up Commands

| Command | Reason |
|---|---|
| SPIDER-MAN | Regression tests for each patch chain |
| SENTRY | Architecture compliance after patches applied |
| THOR | Release gate — patches must be applied before gate can clear |
| DB / Carnage | vport.profiles RLS policy (DEFERRED-D001) |
