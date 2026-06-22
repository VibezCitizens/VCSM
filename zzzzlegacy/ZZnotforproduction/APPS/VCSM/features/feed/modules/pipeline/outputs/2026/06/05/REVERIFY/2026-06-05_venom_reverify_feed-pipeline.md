# VENOM RE-VERIFY — Feed Pipeline Module

**Date:** 2026-06-05
**Scope:** VCSM:feed/modules/pipeline
**Trigger:** Post-patch re-evaluation (TICKET-FEED-PIPELINE-P0-PATCH-0001)
**Mode:** Source-verified re-evaluation of all VENOM findings
**Prior Report:** `outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md`

---

## Re-Evaluation Results

### VEN-PIPE-001 — No App-Layer Auth in readFeedPostsPage

**Prior Status:** OPEN
**Current Status:** OPEN — not in patch scope

**Source check:**
`feed.read.posts.dal.js`: No `supabase.auth.getUser()` call added. RLS dependency unchanged.

**Verdict:** UNCHANGED — architectural decision, acceptable for this module.

---

### VEN-PIPE-002 — null realmId Bypasses Realm Filter

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check (`feed.read.posts.dal.js:8–10`):**
```js
if (!realmId) {
  return { pageRows: [], hasMoreNow: false, nextCursorCreatedAt: null };
}
```

**Source check (`feed.read.posts.dal.js:31`):**
```js
.eq("realm_id", realmId)
```

**Verification:**
- null realmId → guard fires at line 8 → returns empty page result → NO DB call
- undefined realmId → same path (falsy check)
- The `if (realmId)` conditional block is removed — filter is now unconditional when execution reaches it
- No path exists where realmId=null reaches the Supabase query

**Verdict:** RESOLVED — null/undefined realmId cannot return cross-realm posts

---

### VEN-PIPE-003 — vport.profiles Owner-Only RLS

**Prior Status:** OPEN
**Current Status:** OPEN — DB deferral, not in patch scope

**Source check:** `feed.read.actorsBundle.dal.js` — vportSchema query unchanged. RLS policy unchanged.

**Verdict:** UNCHANGED — requires DB policy fix (DEFERRED-D001)

---

### VEN-PIPE-004 — Raw actorId UUID in Mention Route

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check (`buildMentionMaps.model.js:3–7`):**
```js
function makeActorRoute({ kind, username }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && username) return `/vport/${username}`;
  return "/feed";
}
```

**Verification:**
- `actorId` is no longer a parameter in `makeActorRoute` — removed from signature entirely
- vport kind: routes to `/vport/${username}` (username = row.slug from hydration)
- vport kind with no username: returns `/feed` — never `/profile/${uuid}`
- The `/profile/${actorId}` line in the function is GONE for vport kind
- Call site passes `actorId` and `vportId` but they are not destructured — JS ignores extra properties

**Bonus fix (linter-applied, `useCentralFeedActions.js:152–163`):**
```js
const handleOpenActorProfile = useCallback(() => {
  if (!postMenu?.postActorId) return
  const post = posts.find((p) => resolvePostActorId(p) === postMenu.postActorId)
  const actor = post?.actor ?? null
  const kind = actor?.kind ?? null
  const username = actor?.username ?? null
  const slug = actor?.vport_slug ?? actor?.slug ?? null
  const route = (kind === 'vport' && slug) ? `/vport/${slug}` : username ? `/u/${username}` : null
  if (!route) return
  closePostMenu()
  navigate(route)
}, [postMenu, posts, closePostMenu, navigate])
```
Profile navigation now resolves slug before navigating — raw UUID no longer in navigation route.
If no slug/username available, navigation does not occur (route is null → early return).
This extends the fix beyond mention routes to the profile open action.

**Verdict:** RESOLVED — no UUID exposed in mention routes; profile navigation also slug-based

---

### VEN-PIPE-005 — Missing UUID Validation in hiddenPosts + viewerReactions DALs

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check (`feed.read.hiddenPosts.dal.js:2, 7`):**
```js
import { isUuid } from "@/services/supabase/postgrestSafe";
// ...
if (!viewerActorId || !isUuid(viewerActorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return hiddenByMeSet;
}
```

**Source check (`feed.read.viewerReactions.dal.js:8, 15`):**
```js
import { isUuid } from "@/services/supabase/postgrestSafe";
// ...
if (!actorId || !isUuid(actorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return new Map();
}
```

**Verification:**
- Non-UUID actorId now caught by `!isUuid(...)` before DB call
- Returns empty Set/Map without hitting Postgres — no silent error, no throw
- Pattern now matches `readFeedBlockRowsDAL` and `readFeedFollowRowsDAL` (both had isUuid guards prior)

**Verdict:** RESOLVED — both DALs validate UUID format before querying

---

### VEN-PIPE-006 — Stale Block/Follow Cache Produces Incorrect Visibility

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check — block path (`useCentralFeedActions.js:188–190`):**
```js
await blockActor({ blockerActorId: actorId, blockedActorId })
invalidateFeedBlockCache(actorId)   // ← line 189
await fetchPosts(true)               // ← line 190
```
`invalidateFeedBlockCache` imported from `@/features/feed/adapters/feedCache.adapter` (line 10).

**Source check — unfollow path (`useCentralFeedActions.js:132–135`):**
```js
if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
  onFollowToast?.('Unsubscribed')
  invalidateFeedFollowCache(actorId)   // ← line 134
  await fetchPosts(true)               // ← line 135
}
```
`invalidateFeedFollowCache` imported from same adapter.

**Verification:**
- Block: cache cleared immediately after blockActor succeeds, before fetchPosts
- Unfollow: cache cleared immediately after unfollow succeeds, before fetchPosts
- fetchPosts is added to handleFollowActor deps array (line 150) — no stale closure
- Both functions called synchronously (not async) — cache is empty before fetchPosts triggers

**Verdict:** RESOLVED — both block and unfollow paths correctly invalidate cache before feed refresh

---

### VEN-PIPE-007 — Full Follow Graph Unbounded Fetch

**Prior Status:** OPEN
**Current Status:** OPEN — DEFERRED

`readFeedFollowRowsDAL` unchanged. Full follow graph still fetched per cache miss.

**Verdict:** UNCHANGED — scale concern, deferred (DEFERRED-PIPE-006)

---

### VEN-PIPE-008 — Blocked Actor Presentation Leaked via Mention Hydration

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check (`fetchFeedPage.pipeline.js:128–131`):**
```js
const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
const safeMentionActorIds = mentionedActorIds.filter((id) => !blockedActorSet.has(id));
if (safeMentionActorIds.length > 0) {
  const { rows: presentations } = await hydrateAndReturnSummaries({ actorIds: safeMentionActorIds });
```

**Verification:**
- `blockedActorSet` is built at lines 117–120 (Phase 3), before this code at lines 128–131 (Phase 4)
- `safeMentionActorIds` excludes any actor in `blockedActorSet`
- `hydrateAndReturnSummaries` receives ONLY safe actor IDs
- Blocked actor B: filtered from safeMentionActorIds → not hydrated → no presentation returned
- `enrichMentionRows`: B's mention edge has no matching presentation → excluded from enrichedMentionRows
- `buildMentionMaps`: B never added to any post's mention map

**Edge case (mention of blocked actor with all mentions blocked):**
If all mentioned actors are blocked: `safeMentionActorIds = []` → `if (safeMentionActorIds.length > 0)` → false → `enrichedMentionRows = []` → correct, no hydration call

**Verdict:** RESOLVED — blocked actors cannot appear in mention presentation maps

---

### VEN-PIPE-009 — Unguarded console.log with debugPostId

**Prior Status:** OPEN
**Current Status:** RESOLVED ✓

**Source check (`fetchFeedPage.pipeline.js:137`):**
```js
if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId)) {
```

**Verification:**
- `import.meta.env.DEV` evaluates to `false` in production builds (Vite tree-shakes this block)
- Even if debugPostId were somehow populated in production, the DEV guard prevents execution
- Consistent with other DEV-only patterns at lines 24, 28, 32, etc. in the same file

**Verdict:** RESOLVED — console.log cannot fire in production

---

### VEN-PIPE-010 — @debuggers/feed Unconditional Production Import

**Prior Status:** OPEN
**Current Status:** OPEN — DEFERRED

`import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler"` at line 22 unchanged.
Usage is DEV-conditional but import itself is unconditional.

**Verdict:** UNCHANGED — bundle size concern only; no production execution path (DEFERRED-PIPE-004)

---

## Re-Verify Summary

| Finding ID | Severity | Prior Status | Re-Verify Status | Change |
|---|---|---|---|---|
| VEN-PIPE-001 | HIGH | OPEN | OPEN | Unchanged — architectural |
| VEN-PIPE-002 | HIGH | OPEN | **RESOLVED** | Patched — null guard + unconditional filter |
| VEN-PIPE-003 | HIGH | OPEN | OPEN | Unchanged — DB required |
| VEN-PIPE-004 | MEDIUM | OPEN | **RESOLVED** | Patched — slug route; + profile nav bonus fix |
| VEN-PIPE-005 | MEDIUM | OPEN | **RESOLVED** | Patched — isUuid in both DALs |
| VEN-PIPE-006 | MEDIUM | OPEN | **RESOLVED** | Patched — both block + unfollow paths |
| VEN-PIPE-007 | MEDIUM | OPEN | OPEN | Unchanged — deferred |
| VEN-PIPE-008 | MEDIUM | OPEN | **RESOLVED** | Patched — safeMentionActorIds filter |
| VEN-PIPE-009 | LOW | OPEN | **RESOLVED** | Patched — DEV guard on console.log |
| VEN-PIPE-010 | LOW | OPEN | OPEN | Unchanged — deferred |

**RESOLVED this run:** 6 findings (VEN-PIPE-002, -004, -005, -006, -008, -009)
**Remaining OPEN:** 4 findings (VEN-PIPE-001, -003, -007, -010)
**THOR blocking:** VEN-PIPE-003 only (DB deferral)

---

## Highest Remaining Open Severity

HIGH — VEN-PIPE-001 (RLS dependency — architectural), VEN-PIPE-003 (DB change required)

VEN-PIPE-001 is not a THOR blocker (accepted architectural dependency).
VEN-PIPE-003 is the sole remaining THOR blocker — requires DB policy change.
