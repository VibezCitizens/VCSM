# Post Dead Code Report

Last Updated: 2026-05-10

## 1. ~~Duplicate Post Creation DAL~~ — RESOLVED (2026-05-10)

**File:** `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`

`createPostDAL({ actorId, text })` has been removed. Confirmed zero external imports before deletion (only `editPost.controller.js` and `deletePost.controller.js` import from `post.write.dal.js`, and neither referenced `createPostDAL`).

Remaining exports from `post.write.dal.js`: `updatePostTextDAL`, `softDeletePostDAL`. Helper functions (`normalizeHandle`, `extractMentionHandles`, `resolveMentionActorIds`, `replacePostMentions`) are retained as they are used by `updatePostTextDAL`.

---

## 2. Legacy Feed Hook — useFeed.js (Duplicate Feed System)

**File:** `apps/VCSM/src/features/feed/hooks/useFeed.js`

This is a full, functional useState-based feed hook. It uses the same `fetchFeedPagePipeline` under the hood as `useCentralFeed.js`, but manages state with `useState` + manual pagination loop + `useRef` cursor tracking.

Currently used by: `PostFeed.screen.jsx`

`useCentralFeed.js` is the React Query replacement with identical public API. Both hooks exist and are maintained. `PostFeed.screen.jsx` is likely a leftover screen that is not the primary feed surface.

**Duplicate state systems:**
- `useFeed.js` — React `useState`, manual cursor ref, manual loading state
- `useCentralFeed.js` — React Query `useInfiniteQuery`, automatic pagination, staleTime, gcTime

Having two active feed systems creates maintenance overhead and risk of divergence. The legacy `PostFeed.screen.jsx` uses `window.addEventListener('scroll')` without debounce/throttle, unlike the `CentralFeedScreen.jsx` which uses `IntersectionObserver`.

---

## 3. Legacy Feed Posts DAL — feed.posts.dal.js

**File:** `apps/VCSM/src/features/feed/dal/feed.posts.dal.js`

The file header declares:
```
// Feed Posts DAL (legacy — used by dev diagnostics only)
// The main feed pipeline uses feed.read.posts.dal + actorsBundle.
// This file exists for backward compat with diagnostics groups.
```

Function: `listFeedPosts({ limit = 20 })` — loads posts + hydrates actors inline using `hydrateAndReturnSummaries`. Does not use the pipeline batch approach.

Status: **explicitly marked legacy in its own header**, retained for dev diagnostics only.

---

## 4. Legacy Post Model — PostModel

**File:** `apps/VCSM/src/features/post/postcard/model/post.model.js`

Function: `PostModel(row)`

Maps only: `id`, `actor`, `text`, `createdAt`, and a single `media_url` to a `media` array. Does not handle multi-media, reactions, counts, mentions, or any of the fields in the current normalized feed shape.

The actual normalization used by the feed is `normalizeFeedRows.model.js`. It is unclear if `PostModel` is imported anywhere in the active rendering path — it appears to be a legacy model that was not removed during the pipeline refactor.

---

## 5. Explore Discovery Blocks — Permanently Disabled

**File:** `apps/VCSM/src/features/explore/ui/ExploreFeed.jsx`

```js
const SHOW_EXPLORE_DISCOVERY_BLOCKS = false

export default function ExploreFeed({ filter = 'all' }) {
  if (!SHOW_EXPLORE_DISCOVERY_BLOCKS) return null
  ...
}
```

`CitizensRow` and `VportsRow` discovery blocks are hard-coded off with a constant. The component always returns `null`. This is dead UI code.

---

## 6. Explore Search — Videos and Groups Return Empty

**File:** `apps/VCSM/src/features/explore/dal/search.dal.js`

```js
case 'videos':
  return [Promise.resolve([])]
case 'groups':
  return [Promise.resolve([])]
```

Video and groups filter tabs in Explore always return empty arrays. The UI tabs may still be rendered but will always show zero results. These are stub tabs not yet implemented.

---

## 7. Duplicate Mention Insertion Paths

Three different mention insertion flows exist:

| Path | File | Trigger |
|---|---|---|
| Primary | `upload/dal/insertPostMentions.dal.js` | Called from `createPostController` |
| Secondary (DAL-level) | `upload/dal/findPostMentionsByPostIds.dal.js` | Appears in `/upload/dal/` — not traced to any active controller |
| Tertiary (in write DAL) | `post/postcard/dal/post.write.dal.js` → `insertPostMentionsDAL` | Called from dead `createPostDAL` and from `updatePostTextDAL` on edit |

The edit path (`updatePostTextDAL`) in `post.write.dal.js` re-resolves mentions from the updated text using the `identity.actor_directory` approach. This differs from the creation path which uses `findActorsByHandles` (checking `public.profiles` + `vport.profiles`).

`findPostMentionsByPostIds.dal.js` in the upload feature should be audited — it may be imported nowhere and is dead.

---

## 8. useFeed.adapter.js — Trivial Pass-Through

**File:** `apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js`

Content:
```js
export * from "@/features/feed/hooks/useFeed";
```

This is a re-export adapter that adds no logic. It is the only file in `adapters/hooks/`. Some screens import from the adapter, others import directly from the hook. Consistency is not enforced.

---

## 9. NotiViewPostScreen Duplication

**Files:**
- `apps/VCSM/src/features/notifications/screen/NotiViewPostScreen.jsx`
- `apps/VCSM/src/features/notifications/screen/views/NotiViewPostScreen.jsx`

Two files with the same name at different directory levels. One is in `screen/` and one in `screen/views/`. These are likely a copy/paste artifact or a partially completed restructure.

---

## 10. feedWelcomeCard.controller.js — Singular Form Vs controllers Plural

**Files:**
- `apps/VCSM/src/features/feed/controller/feedWelcomeCard.controller.js` (singular `controller/`)
- `apps/VCSM/src/features/feed/controllers/` (plural — contains 3 controller files)

The feed feature has two controller directories (`controller/` singular and `controllers/` plural). This is a naming inconsistency — all other feature controllers use the plural form.
