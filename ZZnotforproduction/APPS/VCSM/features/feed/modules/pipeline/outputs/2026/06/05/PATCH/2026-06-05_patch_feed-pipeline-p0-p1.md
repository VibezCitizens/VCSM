# PATCH Report — Feed Pipeline P0/P1 Security Findings

**Date:** 2026-06-05
**Ticket:** TICKET-FEED-PIPELINE-P0-PATCH-0001
**Scope:** VCSM:feed/modules/pipeline — P0/P1/P2 code patches from VENOM + BLACKWIDOW + ELEKTRA
**Applied By:** Source-verified code patch run
**Status:** COMPLETE — 7 code patches applied; 1 DB deferral

---

## Files Changed

| File | Finding IDs Addressed | Change |
|---|---|---|
| `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` | VEN-PIPE-002, BW-PIPE-003 | Added null realmId early return guard; made realm filter unconditional |
| `apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js` | VEN-PIPE-006, BW-PIPE-001, BW-PIPE-006 | Added feedCache adapter import; invalidateFeedBlockCache before fetchPosts; invalidateFeedFollowCache + fetchPosts on unfollow |
| `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` | VEN-PIPE-008, BW-PIPE-002, VEN-PIPE-009 | safeMentionActorIds filters blockedActorSet; console.log wrapped with DEV guard |
| `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js` | VEN-PIPE-005, BW-PIPE-007 | Added isUuid import; isUuid guard on viewerActorId |
| `apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js` | VEN-PIPE-005 | Added isUuid import; isUuid guard on actorId |
| `apps/VCSM/src/features/feed/model/buildMentionMaps.model.js` | VEN-PIPE-004, BW-PIPE-005 | makeActorRoute: vport kind uses slug; no actorId UUID fallback for vport |

---

## Finding IDs Addressed

| Finding ID | Severity | Patch Applied | Status |
|---|---|---|---|
| VEN-PIPE-002 | HIGH | ELEK-PIPE-002 | PATCHED |
| VEN-PIPE-004 | MEDIUM | ELEK-PIPE-007A | PATCHED |
| VEN-PIPE-005 | MEDIUM | ELEK-PIPE-005 + ELEK-PIPE-006 | PATCHED |
| VEN-PIPE-006 | MEDIUM | ELEK-PIPE-001 + ELEK-PIPE-004 | PATCHED |
| VEN-PIPE-008 | MEDIUM | ELEK-PIPE-003 | PATCHED |
| VEN-PIPE-009 | LOW | ELEK-PIPE-008 | PATCHED |
| BW-PIPE-001 | HIGH | ELEK-PIPE-001 | PATCHED |
| BW-PIPE-002 | HIGH | ELEK-PIPE-003 | PATCHED |
| BW-PIPE-003 | HIGH | ELEK-PIPE-002 | PATCHED (same root as VEN-PIPE-002) |
| BW-PIPE-005 | MEDIUM | ELEK-PIPE-007A | PATCHED |
| BW-PIPE-006 | MEDIUM | ELEK-PIPE-004 | PATCHED |
| BW-PIPE-007 | MEDIUM | ELEK-PIPE-005 | PATCHED |

---

## Finding IDs Deferred

| Finding ID | Severity | Reason |
|---|---|---|
| VEN-PIPE-001 | HIGH | RLS architectural dependency — acceptable; no code fix possible |
| VEN-PIPE-003 / BW-PIPE-004 | HIGH | vport.profiles RLS policy change — DB team required (DEFERRED-D001) |
| VEN-PIPE-007 | MEDIUM | Unbounded follow graph — scale concern, no privacy bypass (DEFERRED-PIPE-006) |
| VEN-PIPE-010 | LOW | @debuggers unconditional import — bundle only, deferred (DEFERRED-PIPE-004) |
| BW-PIPE-008 | LOW | Session binding — internal risk only, acceptable (DEFERRED-PIPE-ARCH) |

---

## Exact Before / After Behavior

### Patch 1 — null realmId guard (`feed.read.posts.dal.js`)

**Before:**
```js
// No guard — null realmId silently removes the WHERE realm_id = ? clause
let q = supabase.schema("vc").from("posts").select(`...`)
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(pageSize + 1);

if (realmId) {
  q = q.eq("realm_id", realmId);  // skipped when realmId is null
}
```
Behavior: null realmId → all posts from all realms returned

**After:**
```js
if (!realmId) {
  return { pageRows: [], hasMoreNow: false, nextCursorCreatedAt: null };
}

let q = supabase.schema("vc").from("posts").select(`...`)
  .is("deleted_at", null)
  .eq("realm_id", realmId)          // unconditional — realmId guaranteed non-null
  .order("created_at", { ascending: false })
  .limit(pageSize + 1);
```
Behavior: null/undefined realmId → empty page result, no DB call

---

### Patch 2 — Block cache invalidation (`useCentralFeedActions.js`)

**Before:**
```js
await blockActor({ blockerActorId: actorId, blockedActorId })
await fetchPosts(true)  // fresh fetch uses STALE block cache — blocked posts reappear
```
Behavior: Blocked actor's posts re-appear in the feed after the block action

**After:**
```js
await blockActor({ blockerActorId: actorId, blockedActorId })
invalidateFeedBlockCache(actorId)  // clears 60s TTL cache for this viewer
await fetchPosts(true)              // fresh fetch now reads updated block list from DB
```
Behavior: Fresh feed fetch correctly excludes the newly-blocked actor's posts

---

### Patch 3 — Follow cache invalidation on unfollow (`useCentralFeedActions.js`)

**Before:**
```js
if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
  onFollowToast?.('Unsubscribed')
  // NO cache clear, NO feed refresh
}
// followCache persists with unfollowed actor for up to 60s
// private posts remain visible until TTL expires or manual refresh
```
Behavior: Private posts of unfollowed actor remain visible for up to 60s

**After:**
```js
if (result?.mode === 'unfollow' || result?.mode === 'cancel_request') {
  onFollowToast?.('Unsubscribed')
  invalidateFeedFollowCache(actorId)  // clears follow cache immediately
  await fetchPosts(true)               // feed refresh applies updated visibility
}
```
Behavior: Private posts of unfollowed actor removed from feed immediately after unfollow

deps array: added `fetchPosts` to handleFollowActor dependency array

---

### Patch 4 — Mention block filter (`fetchFeedPage.pipeline.js`)

**Before:**
```js
const mentionedActorIds = [...new Set(mentionEdges.map(e => e.mentioned_actor_id).filter(Boolean))];
if (mentionedActorIds.length > 0) {
  // hydrates ALL mentioned actors including blocked ones
  const { rows } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIds });
  ...
}
```
Behavior: Blocked actor B's display_name + avatar returned via mention in User C's post

**After:**
```js
const mentionedActorIds = [...new Set(mentionEdges.map(e => e.mentioned_actor_id).filter(Boolean))];
const safeMentionActorIds = mentionedActorIds.filter((id) => !blockedActorSet.has(id));
if (safeMentionActorIds.length > 0) {
  // hydrates only non-blocked mentioned actors
  const { rows } = await hydrateAndReturnSummaries({ actorIds: safeMentionActorIds });
  ...
}
```
Behavior: Blocked actors receive no hydrated presentation; their @mention text renders without profile data

Note: `blockedActorSet` is already in scope at this point (built in Phase 3 at lines 117–120). No additional computation added.

---

### Patch 5 — isUuid validation in hiddenPosts DAL (`feed.read.hiddenPosts.dal.js`)

**Before:**
```js
if (!viewerActorId || !Array.isArray(postIds) || postIds.length === 0) {
  return hiddenByMeSet;
}
// "not-a-uuid" passes the falsy check → DB error → silent empty Set
```
Behavior: Non-UUID actorId causes DB error, returns empty Set silently — hidden posts not suppressed

**After:**
```js
if (!viewerActorId || !isUuid(viewerActorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return hiddenByMeSet;
}
// Non-UUID caught before DB call; behavior consistent with blockRows/followRows DALs
```
Behavior: Invalid actorId returns empty Set without DB call; no silent error swallowing

---

### Patch 6 — isUuid validation in viewerReactions DAL (`feed.read.viewerReactions.dal.js`)

**Before:**
```js
if (!actorId || !Array.isArray(postIds) || postIds.length === 0) {
  return new Map();
}
// "not-a-uuid" passes → DB error → if (error) throw error — pipeline crash
```
Behavior: Non-UUID actorId causes DB error, throws — pipeline may fail

**After:**
```js
if (!actorId || !isUuid(actorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return new Map();
}
// Non-UUID caught before DB call; returns empty Map safely
```
Behavior: Invalid actorId returns empty Map without DB call; no throw

---

### Patch 7 — VPORT mention route slug fix (`buildMentionMaps.model.js`)

**Before:**
```js
function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;  // dead: vportId always null
  if (actorId) return `/profile/${actorId}`;  // FIRES for all vport mentions — UUID exposed
  return "/feed";
}
```
Behavior: All VPORT mentions generate `/profile/{actorId}` — raw UUID in route

**After:**
```js
function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport") {
    if (vportId) return `/vport/${vportId}`;      // vportId path (future-safe)
    if (username) return `/vport/${username}`;    // slug fallback (username = row?.slug)
    return "/feed";                               // no UUID fallback for vport kind
  }
  if (actorId) return `/profile/${actorId}`;     // non-vport only
  return "/feed";
}
```
Behavior: VPORT mentions route to `/vport/{slug}` when slug available; `/feed` if no slug; never `/profile/{uuid}` for vport kind

---

### Patch 8 — console.log DEV guard (`fetchFeedPage.pipeline.js`)

**Before:**
```js
if (debugPostId && pagePostIds.includes(debugPostId)) {
  console.log(...)  // could fire in production if debugPostId somehow populated
}
```

**After:**
```js
if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId)) {
  console.log(...)  // only fires in DEV; belt-and-suspenders on top of caller guard
}
```
Behavior: Zero change in production behavior (debugPostId always undefined in production callers); removes future regression risk

---

## Grep Verification

### Realm guard — no conditional filter remaining
```
$ grep -n "if (realmId)" apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js
(no output)

$ grep -n "!realmId\|eq.*realm_id" apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js
8:  if (!realmId) {
31:    .eq("realm_id", realmId)
```
PASS — conditional filter replaced with early return + unconditional filter

### Cache invalidation calls wired correctly
```
$ grep -n "invalidateFeedBlockCache\|invalidateFeedFollowCache" apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js
10: import { invalidateFeedBlockCache, invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'
134:       invalidateFeedFollowCache(actorId)
182:     invalidateFeedBlockCache(actorId)
```
PASS — both functions imported and called at correct sites

### Block cache called before fetchPosts
```
$ grep -n "invalidateFeedBlockCache\|await fetchPosts" apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js
182:     invalidateFeedBlockCache(actorId)
183:     await fetchPosts(true)
```
PASS — invalidation on line 182 precedes fetchPosts on line 183

### safeMentionActorIds filters blockedActorSet
```
$ grep -n "safeMention\|blockedActorSet.has" apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js
129:    const safeMentionActorIds = mentionedActorIds.filter((id) => !blockedActorSet.has(id));
130:    if (safeMentionActorIds.length > 0) {
131:      const { rows: presentations, ... } = await hydrateAndReturnSummaries({ actorIds: safeMentionActorIds });
```
PASS — filter applied before hydration; safeMentionActorIds used in hydration call

### isUuid guards in both DALs
```
$ grep -n "isUuid" apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js
2: import { isUuid } from "@/services/supabase/postgrestSafe";
7:   if (!viewerActorId || !isUuid(viewerActorId) || ...

$ grep -n "isUuid" apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js
8: import { isUuid } from "@/services/supabase/postgrestSafe";
15:   if (!actorId || !isUuid(actorId) || ...
```
PASS — both DALs now have isUuid validation matching blockRows/followRows pattern

### No raw actorId UUID fallback for vport kind
```
$ grep -n "profile/\|vport/" apps/VCSM/src/features/feed/model/buildMentionMaps.model.js
6:    if (vportId) return `/vport/${vportId}`;
7:    if (username) return `/vport/${username}`;
10:  if (actorId) return `/profile/${actorId}`;
```
PASS — `/profile/${actorId}` on line 10 is ONLY reachable when kind !== "vport"
vport kind exits function at lines 5-9 (all three paths return before reaching line 10)

---

## Deferred Items

### DEFERRED-D001 — vport.profiles RLS (VEN-PIPE-003 / BW-PIPE-004)

Not patched in this run. Cannot be fixed in application code.

Root cause: `vport.profiles` table has owner-only RLS policy in Supabase.
Effect: VPORT posts invisible to all non-owner viewers in central feed.
Required fix: DB SELECT policy allowing authenticated reads of feed-safe columns.

Recommended next command: DB (Carnage for migration authoring)

---

## Required Next Commands

| Command | Reason | Priority |
|---|---|---|
| VENOM-REVERIFY | Confirm VEN-PIPE-002, VEN-PIPE-004, VEN-PIPE-005, VEN-PIPE-006, VEN-PIPE-008, VEN-PIPE-009 are correctly patched | Required |
| BLACKWIDOW-REVERIFY | Confirm BW-PIPE-001, BW-PIPE-002, BW-PIPE-003, BW-PIPE-005, BW-PIPE-006, BW-PIPE-007 are no longer exploitable | Required |
| ARCHITECT-REVERIFY | Confirm no unintended structural changes; verify patch scope was surgical | Recommended |
| SPIDER-MAN | Implement P0 tests (TEST-PIPE-REALM-001/002/003, TEST-PIPE-BLOCK-001/002) | Required for THOR |
| THOR | Re-run release gate after reverify + tests pass | Required |
| DB / Carnage | vport.profiles RLS policy fix (DEFERRED-D001) | Required for full THOR PASS |
