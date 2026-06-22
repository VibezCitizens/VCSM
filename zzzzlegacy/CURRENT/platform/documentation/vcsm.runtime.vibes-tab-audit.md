# VCSM — Vibes Tab Slow Load Audit

Date: 2026-05-03
Scope: `ActorProfilePostsView` + `useActorPosts` + `fetchPostsForActorDAL` + both profile view screens
Type: Performance Audit
Status: Audit complete — all priorities implemented (2026-05-03)

---

## 1. Summary

Every time the Vibes tab is opened, `fetchPostsForActorDAL` executes up to **8 sequential network round trips** before a single post renders. This is the dominant bottleneck. It is compounded by zero caching at any layer — the component is destroyed when switching tabs, so returning to Vibes restarts the full waterfall from zero.

**Root causes ranked (✅ = fixed, ⚠️ = deferred):**

1. ✅ **`fetchPostsForActorDAL` serial waterfall — up to 8 sequential RTTs** before render
2. ✅ **No React Query / no cache in `useActorPosts`** — plain `useState`, every mount fetches from zero
3. ✅ **Tab unmount on switch** — conditional render destroys component and state on every tab change
4. ✅ **Author actor hydration ignores the store** — fetches `vc.actors` + profiles even if data is already in the actor store from the profile load (fixed as part of #1)
5. ✅ **Duplicate post data** — `useProfileView` fetched posts for Photos tab; Vibes fired a separate, heavier fetch (fixed: posts removed from `getProfileView`, Photos tab self-contained via `useActorPosts`)
6. ✅ **`VportProfileViewScreen` has no seed profile** — vport screen waits for full RPC before rendering anything, unlike user profile screen which seeds from store

---

## 2. Click-to-Render Chain

```
User navigates to a profile (already rendered, profile loaded)

User taps "Vibes" tab
  → setTab("posts") / setTab("vibes")  [synchronous state update]
  → tab conditional renders ActorProfilePostsView

ActorProfilePostsView mounts
  → useActorPosts() initializes (no data, loading=false)
  → useEffect fires: reset(profileActorId) → loadInitial()
  → getActorPostsController({ actorId, page: 0, pageSize: 20 })
  → fetchPostsForActorDAL({ actorId, limit: 20, offset: 0 })

INSIDE fetchPostsForActorDAL — sequential awaits:
  RTT 1: vc.posts (posts list, 20 rows)                  ← first blocking wait
  RTT 2: vc.actors (author's actor row)                  ← serial after RTT 1
  RTT 3: public.profiles OR vport.profiles               ← serial after RTT 2
          (user: public.profiles → display_name/photo_url)
          (vport: vport.profiles → name/avatar_url)
  RTT 4: vc.post_media (.in postIds)                     ← serial after RTT 3
  RTT 5: vc.post_mentions (.in postIds)                  ← serial after RTT 4
  RTT 6: vc.actors (.in mentionedActorIds)               ← serial after RTT 5, conditional
  RTT 7: public.profiles (.in userProfileIds)            ← serial after RTT 6, conditional
  RTT 8: vport.profiles (.in mentionActorIds)            ← serial after RTT 7, conditional

Back in getActorPostsController:
  → hydrateActorsFromRows(data)                          ← extra RPC if actors are stale
  → PostModel(row) for each post
  → setLoading(false), setPosts(result.posts)

ActorProfilePostsView renders posts
```

**Minimum RTTs (no mentions):** 5 sequential round trips
**Maximum RTTs (posts with both user and vport mentions):** 8 sequential round trips

The user sees a skeleton the entire time.

---

## 3. The `fetchPostsForActorDAL` Waterfall (File-Level)

**File:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`

The DAL makes all queries as sequential `await` calls — none are parallelized with `Promise.all`.

| # | Table | Schema | Depends on | Can parallelize? |
|---|---|---|---|---|
| 1 | `posts` | `vc` | — (entry point) | — |
| 2 | `actors` | `vc` | RTT 1 (needs actorId from posts) | **YES** — actorId is the input, known before RTT 1 |
| 3a | `profiles` | `public` | RTT 2 (needs profile_id from actors) | No (needs actor kind + profile_id) |
| 3b | `profiles` | `vport` | RTT 2 (needs actor kind from actors) | No (needs actor kind) |
| 4 | `post_media` | `vc` | RTT 1 (needs postIds) | **YES** — postIds known after RTT 1; RTT 2+3 can run in parallel |
| 5 | `post_mentions` | `vc` | RTT 1 (needs postIds) | **YES** — same as RTT 4; run in parallel with RTT 4 |
| 6 | `actors` | `vc` | RTT 5 (needs mentioned_actor_ids) | No (conditional on RTT 5 result) |
| 7 | `profiles` | `public` | RTT 6 (needs user profile_ids) | **YES** — parallel with RTT 8 |
| 8 | `profiles` | `vport` | RTT 6 (needs vport actor_ids) | **YES** — parallel with RTT 7 |

**Parallelizable groups:**
- Group A: RTT 2+3 (author hydration) can run in parallel with RTT 4+5 (media + mentions), since all only need `actorId` or `postIds` — both known after RTT 1
- Group B: RTT 7 + RTT 8 can run in parallel (both only need actor data from RTT 6)

**Optimal minimum RTTs after fix:** RTT 1 → `Promise.all([author, media, mentions])` → `Promise.all([mentionProfiles, mentionVports])` = **3 sequential RTTs** (down from 5-8)

---

## 4. Author Hydration Redundancy

**File:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js` (lines 55–114)

The DAL fetches the post author's identity data fresh on every call:
```
vc.actors → public.profiles/vport.profiles
```

This data was already loaded and upserted into the actor store by `getProfileView.controller.js` when the profile screen mounted. The actor store has `displayName`, `username`, `photoUrl`, `bannerUrl`, `bio`, `kind` for this actor already.

The DAL doesn't check the store — it always hits the DB.

After the DAL returns, `getActorPostsController` also calls `hydrateActorsFromRows(data)` (hydration engine call). If the actor is already in the store and fresh (5-min TTL), this is a no-op. But the DAL's own queries still fired regardless.

**Fix:** Read author data from `useActorStore.getState().actors[actorId]` before falling back to DB. This eliminates RTT 2+3 entirely when the actor is cached.

---

## 5. No Cache on `useActorPosts`

**File:** `apps/VCSM/src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`

The hook uses plain `useState` + `useCallback` + `useRef`. There is no cache layer at any level:

- No React Query
- No TTL cache
- No Zustand store
- No module-level cache

Every time `ActorProfilePostsView` mounts, `reset()` clears posts to `[]` and `loadInitial()` fires the full DAL call from scratch.

`ActorProfilePostsView` mounts when:
1. The Vibes tab is opened for the first time
2. The user switches away from Vibes and back (component unmounts/remounts)
3. `version` prop changes (e.g. after post delete)
4. `profileActorId` changes

So a user who opens Vibes, switches to Photos, then switches back to Vibes triggers the full 5-8 RTT waterfall twice.

---

## 6. Tab Unmount on Switch

**File (user profile):** `apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx`
**File (vport profile):** `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx`

Both screens render tab content conditionally:
```jsx
{tab === "posts" && <ActorProfilePostsView ... />}    // user profile
{tab === "vibes" && <ActorProfilePostsView ... />}    // vport profile
```

React unmounts the component when `tab` changes. Every tab switch to Vibes is a cold mount. Scroll position is lost. All state is cleared. The full fetch fires again.

---

## 7. Duplicate Post Data Between `useProfileView` and `useActorPosts`

`useProfileView` (React Query, staleTime 60s) already fetches posts for the profile via:
```
getProfileView.controller.js → readActorPostsDAL → readPostMediaByPostIdsDAL
```

These posts are stored in the React Query cache keyed as:
```
['profile', 'view', viewerActorId, profileActorId, canViewContent]
```

The Vibes tab's `useActorPosts` ignores this cached data entirely. It fires a separate, heavier fetch via `fetchPostsForActorDAL` that re-fetches the same base posts rows PLUS adds media + mentions on top.

The two DALs are not the same:
- `readActorPostsDAL` — base posts + media (2 RTTs), no pagination, no mentions
- `fetchPostsForActorDAL` — base posts + author + media + mentions (5-8 RTTs), paginated

But for the first page (page 0), the base post rows are the same data fetched twice.

---

## 8. `VportProfileViewScreen` Has No Seed Profile

**File:** `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` (lines 127–133)

```js
if (loading || blockLoading || gate.loading) {
  return (
    <div className="profiles-modern h-full w-full overflow-y-auto touch-pan-y">
      <VportProfileHeader loading />
    </div>
  );
}
```

The vport screen waits for ALL of `loading`, `blockLoading`, and `gate.loading` to resolve before rendering anything — including the header. There is no seed profile from the actor store.

The user profile screen (`ActorProfileViewScreen`) was fixed in the previous session to render the header immediately from the actor store while the RPC resolves. The vport screen has not received this fix.

Also: `VportProfileViewScreen` still uses `postsVersion` state (`setPostsVersion((v) => v + 1)`) for post-delete invalidation, which increments a prop passed to `ActorProfilePostsView` — triggering the `useEffect` and a full re-fetch on every post delete. The user profile screen was updated to use `qc.invalidateQueries` instead.

---

## 9. Fetch Count Table (Vibes Tab, Cold Cache)

| # | Call | Table/Source | Serial/Parallel | Blocking? | Caching |
|---|---|---|---|---|---|
| 1 | `vc.posts` | `vc.posts` | Entry point | **HARD** | None |
| 2 | Author actor | `vc.actors` | **Serial** after #1 | **HARD** | None (ignores store) |
| 3 | Author profile | `public.profiles` OR `vport.profiles` | **Serial** after #2 | **HARD** | None |
| 4 | Post media | `vc.post_media` | **Serial** after #3 | **HARD** | None |
| 5 | Post mentions | `vc.post_mentions` | **Serial** after #4 | **HARD** | None |
| 6 | Mentioned actors | `vc.actors` | **Serial** after #5 | **HARD** (conditional) | None |
| 7 | Mentioned user profiles | `public.profiles` | **Serial** after #6 | **HARD** (conditional) | None |
| 8 | Mentioned vport profiles | `vport.profiles` | **Serial** after #7 | **HARD** (conditional) | None |
| 9 | Hydration RPC | `identity.search_actor_directory` | Serial after DAL | Background | 5-min store TTL (may skip) |

---

## 10. Root Causes Summary

### Root Cause 1 — Serial waterfall in `fetchPostsForActorDAL`

**File:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`

All 8 queries execute as sequential `await` calls with no `Promise.all`. The minimum observable latency for a post with no mentions is: `posts + actor + profile + media + mentions` = 5 full RTTs. With mentions: up to 8.

Fix: Restructure into 3 parallel groups:
```js
// Group A — after RTT 1
const [authorData, [mediaRows, mentionRows]] = await Promise.all([
  fetchAuthorFromStoreOrDB(actorId),              // RTT 2+3 (or 0 if store hit)
  Promise.all([
    fetchPostMedia(postIds),                       // RTT 4
    fetchPostMentions(postIds),                    // RTT 5
  ]),
])

// Group B — after RTT 6 (mentions actors, conditional)
const [mentionUserProfiles, mentionVportProfiles] = await Promise.all([
  fetchUserProfilesForMentions(userProfileIds),   // RTT 7
  fetchVportProfilesForMentions(mentionActorIds), // RTT 8
])
```

Reduces minimum from 5 RTTs to 3 RTTs. With a store hit for author: 2 RTTs.

---

### Root Cause 2 — No caching in `useActorPosts`

**File:** `apps/VCSM/src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`

Migrate to React Query. The query key should include `actorId` and `page`:

```js
queryKey: ['actor-posts', actorId, page],
staleTime: 60_000,
gcTime: 300_000,
```

With `keepPreviousData`, switching away from Vibes and back renders cached posts immediately. Background refresh reconciles any new posts silently.

---

### Root Cause 3 — Component unmounts on tab switch

**Files:** `ActorProfileViewScreen.jsx`, `VportProfileTabContent.jsx`

Replace conditional rendering with CSS visibility to preserve mount state:

```jsx
<div style={{ display: tab === 'posts' ? 'block' : 'none' }}>
  <ActorProfilePostsView ... />
</div>
```

Or use a `visibility: hidden` + `aria-hidden` approach. This preserves scroll position and prevents re-fetch on tab return.

---

### Root Cause 4 — Author hydration ignores actor store

**File:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js` (lines 55–114)

Before hitting DB, check the actor store:

```js
const stored = useActorStore.getState().actors[actorId]
if (stored && stored._hydratedAt && (Date.now() - stored._hydratedAt < 5 * 60 * 1000)) {
  authorActorEntry = buildAuthorEntryFromStore(stored)
} else {
  // fall back to DB (RTT 2+3)
}
```

On any warm navigation (profile was viewed within 5 min), this eliminates 2 RTTs entirely.

---

### Root Cause 5 — `VportProfileViewScreen` missing seed profile

**File:** `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Apply the same `seedProfile` pattern from `ActorProfileViewScreen`:
- Read actor store for `profileActorId`
- Render `VportProfileHeader` immediately from seed data
- Wait only for `contentReady = !blockLoading && !gate.loading` before showing tabs/content

---

## 11. Fix Plan

### Priority 1 — Parallelize `fetchPostsForActorDAL` (highest impact)

**Effort:** Medium | **Impact:** Reduces minimum RTTs from 5 to 2-3

Restructure the DAL to use `Promise.all` for independent groups. Code skeleton:

```js
// After RTT 1 (posts list):
const [authorEntry, mediaRows, mentionRows] = await Promise.all([
  resolveAuthorEntry(actorId),       // store hit = 0 RTTs; miss = 2 RTTs
  fetchPostMedia(postIds),           // 1 RTT
  fetchPostMentions(postIds),        // 1 RTT
])

// After mentions actors (RTT 6, conditional):
if (allMentionedActorIds.size) {
  const mentionedActors = await fetchMentionedActors(allMentionedActorIds)
  const [userProfiles, vportProfiles] = await Promise.all([
    fetchUserProfiles(userProfileIds),
    fetchVportProfiles(vportActorIds),
  ])
  // ...build mentionEntryByActorId
}
```

---

### Priority 2 — Migrate `useActorPosts` to React Query

**Effort:** Medium | **Impact:** Tab revisits become instant (60s staleTime)

Rewrite from `useState/useCallback` to `useInfiniteQuery`:

```js
const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['actor-posts', actorId],
  queryFn: ({ pageParam = 0 }) =>
    getActorPostsController({ actorId, page: pageParam, pageSize: PAGE_SIZE }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.done ? undefined : pages.length,
  enabled: !!actorId,
  staleTime: 60_000,
  gcTime: 300_000,
})
const posts = data?.pages.flatMap((p) => p.posts) ?? []
```

---

### Priority 3 — Keep Vibes tab mounted on switch

**Effort:** Low | **Impact:** Eliminates re-fetch on tab return, preserves scroll

```jsx
// In ActorProfileViewScreen:
<div style={{ display: tab === 'posts' ? undefined : 'none' }} aria-hidden={tab !== 'posts'}>
  <ActorProfilePostsView profileActorId={resolvedProfile.actorId} ... />
</div>
```

Same pattern for vport's `tab === 'vibes'`.

Note: All tabs that are "mounted but hidden" will still fetch their data on first mount. Only the Vibes tab should be kept mounted — other heavy tabs (portfolio, menu, rates) should remain conditionally rendered.

---

### Priority 4 — Use actor store for author hydration

**Effort:** Low | **Impact:** Eliminates 2 RTTs on warm cache

Check `useActorStore.getState().actors[actorId]` with freshness check before querying `vc.actors`. Build `authorActorEntry` directly from store if present.

---

### Priority 5 — Seed profile in `VportProfileViewScreen`

**Effort:** Low | **Impact:** Instant header on vport profiles (same as user profile fix)

Apply the identical `seedProfile` pattern from `ActorProfileViewScreen`. The vport screen receives `identity` as a prop — use it plus `useActorStore` for seed data.

Also replace `postsVersion` + `setPostsVersion` with `qc.invalidateQueries` to match the user profile screen.

---

## 12. DEV Timing Marks

Behind `import.meta.env.DEV`:

```js
// fetchPostsForActorDAL — start of waterfall
performance.mark('vibes:dal:start')

// After RTT 1 (posts rows received)
performance.mark('vibes:posts:fetched')

// After author hydration completes
performance.mark('vibes:author:resolved')

// After media + mentions both resolve (parallel group)
performance.mark('vibes:media-and-mentions:resolved')

// After full DAL returns
performance.mark('vibes:dal:end')

// After controller returns (post-model + actor store hydration)
performance.mark('vibes:controller:end')

// First render of PostCard
performance.mark('vibes:first-render')
```

Measure `vibes:dal:start → vibes:first-render` to get the true user-perceived latency.

---

## 13. Test Checklist (post-fix validation)

- [ ] Cold Vibes open — posts appear in ≤ 3 RTTs (verify in Network tab)
- [ ] Return to Vibes after tab switch — zero loading state, instant render from cache
- [ ] Return to Vibes after 60s — stale data renders, background refresh runs silently
- [ ] Vport profile Vibes — same behavior as user profile
- [ ] No duplicate `vc.posts` calls in Network tab (verify one fetch per open)
- [ ] Author actor data not re-fetched when actor is in store
- [ ] `vc.post_media` and `vc.post_mentions` fire in parallel (not sequential) — verify in Network tab waterfall
- [ ] Scroll position preserved after tab switch (Priority 3)
- [ ] Post delete triggers correct cache invalidation, not full re-fetch
- [ ] `VportProfileViewScreen` header renders immediately from store on revisit (Priority 5)

---

## 14. Files Involved

| File | Issue |
|---|---|
| `features/profiles/dal/post/fetchPostsForActor.dal.js` | 8-RTT serial waterfall — root of the problem |
| `features/profiles/screens/views/tabs/post/hooks/useActorPosts.js` | No React Query, no cache |
| `features/profiles/controller/post/getActorPosts.controller.js` | Redundant `hydrateActorsFromRows` call after DAL (DAL already embeds author) |
| `features/profiles/screens/views/ActorProfilePostsView.jsx` | Mounts unconditionally, useEffect fires on every mount |
| `features/profiles/screens/views/ActorProfileViewScreen.jsx` | Unmounts Vibes on tab switch (conditional render) |
| `features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | Unmounts Vibes on tab switch (conditional render) |
| `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | No seed profile from store; uses `postsVersion` instead of `qc.invalidateQueries` |

---

## 15. Implementation Log (2026-05-03)

### Fix 1 — Parallelize `fetchPostsForActorDAL` (Priority 1)
**File:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`

Full rewrite from a sequential `await` chain into a parallel-group structure. The exported function signature and output shape (`{ data: hydratedRows[], error }`) are unchanged — no callers needed updating.

**RTT profile before:**
```
posts → actor → profile/vport → media → mentions → mentioned actors → user profiles → vport profiles
(5 RTTs minimum, 8 maximum — all sequential)
```

**RTT profile after:**
```
RTT 1: posts
  ├── resolveAuthorEntry(actorId)   — 0 RTTs if actor store warm; 2 RTTs cold
  ├── fetchPostMedia(postIds)        — 1 RTT   } all three start
  └── fetchPostMentions(postIds)     — 1 RTT   } simultaneously

RTT 2 (conditional, only if mentions exist):
  vc.actors (.in mentionedActorIds)
    ├── public.profiles (.in userProfileIds)   — 1 RTT } parallel
    └── vport.profiles (.in vportActorIds)     — 1 RTT }
```

**Minimum RTTs after fix:** 2 (posts + parallel group). With warm actor store: still 2 (author costs 0 RTTs). With mentions: 3.

---

**Changes made:**

**`resolveAuthorEntry(actorId)`** — new private function. Checks `useActorStore.getState().actors[actorId]` with a 5-min freshness check before hitting DB. After any profile view, the actor is in the store — author resolution costs 0 RTTs. Falls back to the original 2-RTT DB path (vc.actors → public.profiles or vport.profiles) on cold cache.

```js
function authorFromStore(actorId) {
  const stored = useActorStore.getState().actors?.[actorId];
  if (!stored?._hydratedAt || Date.now() - stored._hydratedAt > STORE_TTL_MS) return null;
  // ... build authorActorEntry from camelCase store fields
}

async function resolveAuthorEntry(actorId) {
  const cached = authorFromStore(actorId);
  if (cached) return cached;
  // fall back to vc.actors → public.profiles/vport.profiles (original 2-RTT path)
}
```

**`fetchPostMedia(postIds)`** — extracted from inline code. Same query, same output Map. Now runs in parallel with author and mentions.

**`fetchPostMentions(postIds)`** — extracted from inline code. Returns `{ byPostId: Map, allIds: Set }`. Now runs in parallel with author and media.

**`resolveMentionEntries(allIds)`** — new function replacing the sequential `vc.actors` → `public.profiles` → `vport.profiles` chain. After fetching mentioned actors (1 RTT), user profiles and vport profiles now fire together in `Promise.all` instead of sequentially.

**`fetchPostsForActorDAL` main body** — three sequential await groups become:
```js
// After RTT 1 (posts):
const [authorActorEntry, mediaByPostId, { byPostId, allIds }] = await Promise.all([
  resolveAuthorEntry(actorId),
  fetchPostMedia(postIds),
  fetchPostMentions(postIds),
]);

// Mention resolution (conditional, 1-2 RTTs):
const mentionEntryByActorId = await resolveMentionEntries(allIds);
```

---

---

## 16. Implementation Log — Session 2 (2026-05-03)

### Fix 2 — Migrate `useActorPosts` to React Query (Priority 2)
**File:** `apps/VCSM/src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`

Full rewrite from manual `useState`/`useRef`/`useCallback` pagination to `useInfiniteQuery`.

- Hook now accepts `actorId` as a direct parameter — no more `reset(actorId)` + `loadInitial()` calls in the consumer
- `staleTime: 60_000`, `gcTime: 300_000` — tab revisits within 60s render instantly from cache; cache survives route switches for 5 minutes
- `getNextPageParam` returns `pages.length` (next page index) or `undefined` when `done: true`
- `enabled: !!actorId` prevents queries on null actorId
- Returns `{ posts, loading, hasMore, loadMore, loadingMore }` — same surface API as before minus `reset`/`loadInitial`

Query key: `queryKeys.actorPosts(actorId)` → `['profile', 'posts', actorId]` — new entry added to `queryKeys.js`.

---

### Fix 3 — Keep Vibes tab mounted on switch (Priority 3)
**Files:** `ActorProfileViewScreen.jsx`, `VportProfileTabContent.jsx`

Replaced conditional renders with `display:none` wrappers:

```jsx
// User profile (ActorProfileViewScreen.jsx)
<div style={{ display: tab === "posts" ? undefined : "none" }} aria-hidden={tab !== "posts"}>
  <ActorProfilePostsView profileActorId={resolvedProfile.actorId} ... />
</div>

// Vport profile (VportProfileTabContent.jsx)
<div style={{ display: tab === "vibes" ? undefined : "none" }} aria-hidden={tab !== "vibes"}>
  <ActorProfilePostsView profileActorId={profile.actorId} ... />
</div>
```

The component stays mounted for the lifetime of the profile screen. `useInfiniteQuery` cache is preserved across tab switches — returning to Vibes shows cached posts immediately with a silent background refresh if stale.

Only the Vibes tab is kept mounted. Other tabs (photos, portfolio, reviews, etc.) remain conditionally rendered.

---

### Fix 3b — Remove `version` prop from `ActorProfilePostsView`
**Files:** `ActorProfilePostsView.jsx`, `ActorProfileViewScreen.jsx`, `VportProfileTabContent.jsx`, `VportProfileViewScreen.jsx`

The `version` prop was previously used to trigger re-fetch via `useEffect` deps. With React Query, invalidation is explicit:

- `ActorProfileViewScreen.handlePostDeleted` now calls `qc.invalidateQueries({ queryKey: queryKeys.actorPosts(profileActorId) })` alongside the existing `profileView` invalidation
- `VportProfileViewScreen.onPostDeleted` calls `qc.invalidateQueries({ queryKey: queryKeys.actorPosts(profile?.actorId ?? profileActorId) })` — replacing the old `setPostsVersion((v) => v + 1)` increment
- `postsVersion` state removed from `VportProfileViewScreen`
- `postsVersion` prop removed from `VportProfileTabContent`

---

### Fix 4 — Seed profile in `VportProfileViewScreen` (Priority 5)
**File:** `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Applied the same instant-header pattern that user profiles received in Session 1:

```js
const storeActor = useActorStore((s) => s.actors[profileActorId] ?? null);
const seedProfile = useMemo(() => {
  if (!storeActor) return null;
  return {
    actorId: profileActorId,
    kind: "vport",
    displayName: storeActor.vportName ?? storeActor.vport_name ?? storeActor.displayName ?? null,
    username: storeActor.vportSlug ?? storeActor.vport_slug ?? storeActor.username ?? null,
    avatarUrl: storeActor.vportAvatarUrl ?? storeActor.vport_avatar_url ?? storeActor.photoUrl ?? "/avatar.jpg",
    bannerUrl: storeActor.bannerUrl ?? storeActor.banner_url ?? "/default-banner.jpg",
    bio: storeActor.bio ?? null,
    _isSeed: true,
  };
}, [storeActor, profileActorId]);
const displayProfile = profile ?? seedProfile;
```

Loading gate changed from `if (loading || blockLoading || gate.loading)` to `if (!displayProfile && (loading || blockLoading || gate.loading))` — full skeleton only shown when no store data is available at all.

Error gate changed from `if (error || !profile)` to `if (error && !displayProfile)` — allows rendering from seed even if the RPC fails.

`VportProfileHeader` receives `profile={displayProfile}` instead of `profile={profile}` — renders immediately from seed.

Tab content (VportProfileTabContent) remains gated on `!!profile` — tabs only render once the full RPC resolves, since they depend on `vportType`, `effectiveTabs`, and other RPC-derived fields.

---

## Section 17 — Priority 5: Duplicate Post Fetch Eliminated (2026-05-03)

**Root cause confirmed**: `usePhotoReactions` calls `enrichPhotoPostsController` independently, which fires its own 3 DALs (`listPostReactions`, `listPostCommentsCount`, `listPostRoseCount`). The `reactions` and `roseCount` data attached to posts by `getProfileView` via `readPostReactionsDAL`/`readPostRoseCountsDAL` was fetched but **completely ignored** — `usePhotoReactions` always re-fetches. `VportPortfolioView` accepted `posts`/`loadingPosts` props but also never used them (calls `useVportPortfolio` for its own data). Both downstream consumers were already self-sufficient.

**Solution**: Removed posts entirely from the `getProfileView` pipeline.

**Files changed:**

| File | Change |
|---|---|
| `getProfileView.controller.js` | Removed `readActorPostsDAL`, `readPostReactionsDAL`, `readPostRoseCountsDAL`, `PostModel`. Dropped Phase 2 (post enrichment). Return now `{ profile }` only. Parallel `Promise.all` simplified to `[actorRow, followRow]`. |
| `useProfileView.js` | Removed `loadingPosts` and `posts` from return. Return now `{ loading, isFetching, error, profile }`. |
| `ActorProfilePhotosView.jsx` | Self-contained: removed `posts`/`loadingPosts` props, imports `useActorPosts`, calls `useActorPosts(actorId)` directly. Shares the same React Query cache as Vibes tab — if Vibes already loaded, Photos renders instantly from cache. |
| `ActorProfileViewScreen.jsx` | Removed `posts`/`loadingPosts` from `useProfileView` destructure. Removed `visibleProfilePosts` useMemo. Removed both props from `ActorProfilePhotosView` JSX. |
| `VportProfileViewScreen.jsx` | Same: removed `posts`/`loadingPosts` destructure, removed `visibleProfilePosts` useMemo, removed both from `VportProfileTabContent` JSX. |
| `VportProfileTabContent.jsx` | Removed `visibleProfilePosts`/`loadingPosts` from props. Removed from `ActorProfilePhotosView` and `VportPortfolioView` JSX. |

**Net effect**: One fewer DB round trip on every profile load (previously always fetched posts even on private profiles or when Photos tab was never opened). Photos tab now renders from the Vibes React Query cache when warm, with its own `useActorPosts` fetch when cold. All 6 root causes from the original audit resolved.
