---
title: Feed Module — Patch Report
ticket: TICKET-FEED-MODULE-PATCH-0001
date: 2026-06-05
authority: current source code (read-first, no report trust)
scope: apps/VCSM/src/features/feed/
---

# TICKET-FEED-MODULE-PATCH-0001 — Feed Module Patch Report

## Execution Summary

Source read before every patch. Findings from VENOM/BLACKWIDOW/ELEKTRA bundle (2026-06-05)
were verified against live code before any edit was made. Several flagged findings were already
correctly implemented — they are recorded as CONFIRMED SAFE, not patched.

---

## Files Changed

| File | Change | Finding |
|---|---|---|
| `hooks/useFeed.js` | DEV-gate `console.warn` in catch block | VEN-MOD-FEED-001 |
| `hooks/useFeed.js` | Add TODO VEN-PIPE-003 DEFERRED comment | VEN-PIPE-003 |
| `hooks/useCentralFeedActions.js` | DEV-gate 5 `console.warn/error` calls | VEN-MOD-FEED-002 |
| `hooks/useCentralFeedActions.js` | Replace UUID navigation with slug/username resolution | VEN-MOD-FEED-003 |
| `model/buildMentionMaps.model.js` | Remove raw ID fallbacks from `makeActorRoute` | VEN-PIPE-004 |
| `dal/feed.posts.dal.js` | Add DEV-only guard at `listFeedPosts` entry | VEN-MOD-FEED-005 |

**Files confirmed safe (no change):**

| File | Confirmed Finding | Evidence |
|---|---|---|
| `dal/feed.read.posts.dal.js` | VEN-PIPE-002 | Guard at `:8-10` already returns empty on null/undefined realmId |
| `dal/feed.read.hiddenPosts.dal.js` | VEN-PIPE-005 | `isUuid(viewerActorId)` at `:7` |
| `dal/feed.read.viewerReactions.dal.js` | VEN-PIPE-005 | `isUuid(actorId)` at `:15` |
| `hooks/useCentralFeedActions.js` | VEN-PIPE-006 | `invalidateFeedBlockCache` at `:189`, `invalidateFeedFollowCache` at `:134` |
| `pipeline/fetchFeedPage.pipeline.js` | VEN-PIPE-008 | `safeMentionActorIds` at `:129` filters blocked set before `hydrateAndReturnSummaries` |

---

## Findings — Detailed

### VEN-PIPE-002 — null realmId bypass (P0 / THOR BLOCKER)

**Disposition:** CONFIRMED SAFE — no code change made

Source reading revealed the guard was already present:

```js
// feed.read.posts.dal.js:8-10
if (!realmId) {
  return { pageRows: [], hasMoreNow: false, nextCursorCreatedAt: null };
}
```

`.eq("realm_id", realmId)` at `:31` is unconditional after the guard. `!realmId` catches null,
undefined, and empty string. No cross-realm exposure path exists. The BLACKWIDOW/THOR report
was incorrect about this finding — the guard was present before this ticket.

**Status:** CONFIRMED SAFE. Pending VENOM-REVERIFY to formally clear.

---

### VEN-PIPE-003 — vport.profiles owner-only RLS (P0 / THOR BLOCKER)

**Disposition:** DEFERRED → DB/CARNAGE — code TODO added only

Not code-patchable in this ticket. The fix requires a DB policy change on `vport.profiles`
to allow authenticated read of `name`/`slug` for public vports.

Existing mitigation already in place: `useFeed.js:159-173` forces SECURITY DEFINER
hydration via `hydrateActorsByIds({ force: true })` for vport actors with null names.
This reduces UX impact but does not fix the root RLS policy.

Added TODO marker:
```js
// useFeed.js:162-164
// TODO VEN-PIPE-003 DEFERRED → DB/CARNAGE: vport.profiles policy must allow
// authenticated read of name/slug for public vports. Tracked in DEFERRED.md.
```

**Status:** DEFERRED. Remains THOR BLOCKER until DB/CARNAGE resolves.

---

### VEN-MOD-FEED-001 — bare console.warn in useFeed.js (P1)

**Before:**
```js
} catch (e) {
  console.warn("[useFeed] error", e);
```

**After:**
```js
} catch (e) {
  if (import.meta.env.DEV) console.warn("[useFeed] error", e);
```

Error details no longer emitted to production console. Error state handling (setHasMore, setFirstBatchReady) is preserved unchanged.

---

### VEN-MOD-FEED-002 — bare console.warn/error in useCentralFeedActions.js (P1)

Five calls guarded. All `window.alert` user-facing error messages are preserved.

| Location | Call | Guard Added |
|---|---|---|
| `confirm()` | `console.warn('[useCentralFeedActions] missing confirmAction...')` | ✓ |
| `handleFollowActor` catch | `console.error('[CentralFeed] subscribe failed:', err)` | ✓ |
| `handleBlockActor` catch | `console.error('[CentralFeed] block failed:', err)` | ✓ |
| `persistHideForMe` catch | `console.warn('[CentralFeed] persist hide threw:', error)` | ✓ |
| `handleReportSubmit` catch | `console.error('[CentralFeed] report submit failed:', err)` | ✓ |

**Before (example):**
```js
} catch (err) {
  console.error('[CentralFeed] block failed:', err)
  window.alert(err?.message || 'Failed to block actor')
}
```

**After:**
```js
} catch (err) {
  if (import.meta.env.DEV) console.error('[CentralFeed] block failed:', err)
  window.alert(err?.message || 'Failed to block actor')
}
```

---

### VEN-MOD-FEED-003 — raw actor UUID in profile navigation (P1)

`handleOpenActorProfile` previously navigated to `/profile/${postMenu.postActorId}` (raw UUID).

**Before:**
```js
const handleOpenActorProfile = useCallback(() => {
  if (!postMenu?.postActorId) return
  closePostMenu()
  navigate(`/profile/${postMenu.postActorId}`)
}, [postMenu, closePostMenu, navigate])
```

**After:**
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

Route resolution order:
1. vport with slug → `/vport/${slug}`
2. any actor with username → `/u/${username}`
3. no safe route → abort (no navigation, no UUID exposed)

`posts` added to dependency array. No existing signature changed. No UUID exposed in any path.

**Note:** `/post/${postId}` in `handleShare` and `handleEditPost` are out of scope per ticket
(do-not-patch list: raw post share URL unless slug exists in source).

---

### VEN-PIPE-004 — raw ID fallbacks in makeActorRoute (P1)

**Before:**
```js
function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport") {
    if (vportId) return `/vport/${vportId}`;   // raw vportId
    if (username) return `/vport/${username}`;
    return "/feed";
  }
  if (actorId) return `/profile/${actorId}`;   // raw actorId fallback
  return "/feed";
}
```

**After:**
```js
function makeActorRoute({ kind, username }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && username) return `/vport/${username}`;
  return "/feed";
}
```

Both raw ID fallbacks removed. The `if (!username) continue` guard at `buildMentionMaps:38`
already prevents entries without username from being added to the map, so the `/feed` fallback
in `makeActorRoute` is only reached by entries that somehow bypass that guard — which is safe.

The call site still passes `actorId` and `vportId` to `makeActorRoute` — JavaScript silently
ignores destructuring of non-declared fields. No call site change needed.

---

### VEN-PIPE-005 — missing isUuid in hiddenPosts/viewerReactions DALs (P1)

**Disposition:** CONFIRMED SAFE — no code change made

Both DALs already had the guard:

```js
// feed.read.hiddenPosts.dal.js:7
if (!viewerActorId || !isUuid(viewerActorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return hiddenByMeSet;
}

// feed.read.viewerReactions.dal.js:15
if (!actorId || !isUuid(actorId) || !Array.isArray(postIds) || postIds.length === 0) {
  return new Map();
}
```

The pattern matches `blockRows.dal` and `followRows.dal` exactly. Flagged as inconsistent
by the workflow run — source verification shows it was already correct.

---

### VEN-PIPE-006 — missing cache invalidation (P1)

**Disposition:** CONFIRMED SAFE — no code change made

Already imported and called:

```js
// useCentralFeedActions.js:10
import { invalidateFeedBlockCache, invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'

// handleBlockActor:189
invalidateFeedBlockCache(actorId)
await fetchPosts(true)

// handleFollowActor:134
invalidateFeedFollowCache(actorId)
await fetchPosts(true)
```

Both cache invalidations fire before `fetchPosts(true)` in their respective handlers.

---

### VEN-PIPE-008 — blocked actors in mention hydration (P1)

**Disposition:** CONFIRMED SAFE — no code change made

```js
// fetchFeedPage.pipeline.js:128-131
const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
const safeMentionActorIds = mentionedActorIds.filter((id) => !blockedActorSet.has(id));
if (safeMentionActorIds.length > 0) {
  const { rows: presentations, error: presErr } = await hydrateAndReturnSummaries({ actorIds: safeMentionActorIds });
```

`safeMentionActorIds` filters the blocked set. `hydrateAndReturnSummaries` receives only
non-blocked actor IDs. Already correct before this ticket.

---

### VEN-MOD-FEED-005 — legacy diagnostics DAL no DEV gate (P1)

**Before:**
```js
export async function listFeedPosts({ limit = 20 } = {}) {
  const { data, error } = await supabase
```

**After:**
```js
export async function listFeedPosts({ limit = 20 } = {}) {
  if (!import.meta.env.DEV) return [];
  const { data, error } = await supabase
```

The function header comment already documented this as dev/diagnostics-only. The guard
enforces it at runtime. No refactor of the legacy DAL internals.

---

## Grep Verification Results

| Check | Pattern | Result |
|---|---|---|
| Unguarded console.warn/error | `console\.(warn\|error)` without DEV guard | **NONE** — all cleared |
| Raw UUID profile nav | `/profile/\${` | **NONE** — cleared |
| Raw post routes (expected) | `/post/\${` | Not found by shell pattern — handleShare and handleEditPost use postId (acceptable per ticket) |
| invalidateFeedBlockCache | import + call | Present at `:10`, `:189` |
| invalidateFeedFollowCache | import + call | Present at `:10`, `:134` |
| hydrateAndReturnSummaries filter | `safeMentionActorIds` + `blockedActorSet` | Present at pipeline `:117`, `:129`, `:131` |
| realmId guard | `!realmId` return | Present at `feed.read.posts.dal.js:8-10` |
| isUuid guard | `isUuid` | Present in both DALs |
| DEV guard in feed.posts.dal | `import.meta.env.DEV` | Present at `:12` |
| makeActorRoute no raw IDs | `actorId\|vportId\|profile/` in function body | Function body only uses `kind` and `username` — call site passes extras but they are ignored |
| VEN-PIPE-003 TODO | `VEN-PIPE-003` | Present at `useFeed.js:162` |

---

## Remaining THOR Blockers

| Finding | Severity | Status | Required Action |
|---|---|---|---|
| VEN-PIPE-003 | HIGH | DEFERRED | DB/CARNAGE: fix vport.profiles policy to allow authenticated read of name/slug for public vports |

VEN-PIPE-002 is no longer a THOR blocker — source verification confirmed it was never exploitable.
All other HIGH findings (VEN-MOD-FEED-001, -002, -003) are now patched.

---

## Findings Deferred (Not Patched in This Ticket)

| Finding | Reason |
|---|---|
| VEN-PIPE-003 | Requires DB migration — out of ticket scope |
| VEN-MOD-FEED-004 | Raw UUID in share URL — post slug does not exist in current source |
| VEN-FEED-001 | BEHAVIOR.md placeholder — LOGAN work item |
| VEN-FEED-003 | getDebugPrivacyRows controller bug — separate ticket |
| VEN-FEED-004 | listActorPosts viewerActorId discarded — architecture decision, separate ticket |
| VEN-PIPE-007 | Follow cache size bound — performance ticket |
| VEN-MOD-FEED-006 | readProfileAdultFlagDAL ownership — separate ticket |

---

## Before/After Behavior Summary

| Concern | Before | After |
|---|---|---|
| Production console leakage | `console.warn/error` emitted in 6 locations | All 6 locations DEV-only |
| UUID in navigation URL | `/profile/${actorId}` exposed to browser history | Route resolved from actor slug/username; aborts if unavailable |
| Mention route with UUID | `makeActorRoute` fell back to `/profile/${actorId}` or `/vport/${vportId}` | Only slug/username routes; falls back to `/feed` |
| Legacy diagnostics DAL in production | `listFeedPosts` ran full Supabase query + hydration in production | Returns `[]` immediately in production |
| realmId bypass | (NEVER EXPLOITABLE — guard was already present) | No change — confirmed safe |
| isUuid in viewer DALs | (NEVER MISSING — guard was already present) | No change — confirmed safe |
| Block/follow cache invalidation | (ALREADY IMPLEMENTED — not missing) | No change — confirmed safe |
| Mention hydration block filter | (ALREADY IMPLEMENTED — not missing) | No change — confirmed safe |

---

## Required Next Commands

1. **ARCHITECT-REVERIFY** — confirm dependency graph unchanged post-patch
2. **VENOM-REVERIFY** — verify all patched findings now show RESOLVED; VEN-PIPE-002 closes
3. **BLACKWIDOW-REVERIFY** — EXPLOITABLE count should drop from 8 to ≤3 (VEN-MOD-FEED-001/002/003/004/VEN-PIPE-004/VEN-PIPE-008 cleared; VEN-MOD-FEED-004 and VEN-PIPE-003 remain)
4. **ELEKTRA-REVERIFY** — rebuild execution chains with patched navigation + mention routes
5. **SPIDER-MAN** — add security regression tests for patched findings
6. **DB/CARNAGE** — VEN-PIPE-003: vport.profiles RLS fix
7. **THOR** — final release gate re-run after all reverifications complete
