# Reaction System Map

Last Updated: 2026-05-10

## Reaction Types

The post system supports three distinct reaction surfaces:
1. **Binary reactions** (like / dislike) — `vc.post_reactions`
2. **Rose gifts** (qty-based) — `vc.post_rose_gifts`
3. **Comment likes** — `vc.comment_likes`

---

## Binary Reactions (Like / Dislike)

### Tables

**`vc.post_reactions`**

| Column | Notes |
|---|---|
| `post_id` | FK to `vc.posts.id` |
| `actor_id` | FK to `vc.actors.id` |
| `reaction` | `'like'` \| `'dislike'` |
| `updated_at` | Set on reaction switch (update path) |

Composite key appears to be `(post_id, actor_id)` — DAL upserts/deletes use both.

### DAL Files

```
apps/VCSM/src/features/post/postcard/dal/postReactions.read.dal.js
apps/VCSM/src/features/post/postcard/dal/postReactions.write.dal.js
```

Read:
- `fetchActorReactionDAL({ postId, actorId })` — single actor's reaction (`.select("reaction")`)
- `fetchReactionSummaryDAL(postId)` — calls RPC `vc.post_reactors_summary_one`

Write:
- `insertReactionDAL({ postId, actorId, reaction })` — new reaction
- `updateReactionDAL({ postId, actorId, reaction })` — switch reaction
- `deleteReactionDAL({ postId, actorId })` — toggle off

### Controller

```
apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js
```

Function: `togglePostReactionController({ postId, actorId, reaction, currentCounts? })`

Business rules:
- `checkPostExistsDAL(postId)` guard runs first — throws if post is soft-deleted
- Same reaction → toggle OFF (delete)
- Different reaction → switch (update)
- No prior reaction → new reaction (insert, `created = true`)
- Notification published only on new reaction creation (not on switch or toggle-off)
- Count resolution (2026-05-10):
  - If `currentCounts` is provided → compute delta locally via `applyReactionDelta` — **no extra RPC**
  - If `currentCounts` is absent → falls back to `fetchReactionSummaryDAL(postId)` RPC

**`applyReactionDelta` logic:**
```
prevReaction → decrement that kind by 1 (min 0)
nextReaction → increment that kind by 1
rose count → unchanged (roses are not toggled)
```

**Serial query count (common feed path):** Read existing → mutate → (optional notification fetch) → delta computed locally = **2 serial DB round-trips** when `currentCounts` is available (i.e., from the feed pipeline batch).

**Serial query count (fallback path):** Read existing → mutate → `fetchReactionSummaryDAL` RPC = **3 serial DB round-trips** when `currentCounts` is not provided (post detail screen on first load).

### Hook

```
apps/VCSM/src/features/post/postcard/hooks/usePostReactions.js
```

Function: `usePostReactions(postId, { preloadedReaction, preloadedCounts })`

- If `preloadedCounts` is provided (from feed pipeline batch), skips initial load
- On `toggleReaction(reaction)`: passes `currentCounts: counts` (current hook state) to `togglePostReactionController` — enables optimistic delta path and skips the post-mutation RPC
- Exposes `toggleReaction(reaction)`, `sendRose(qty)`, `myReaction`, `counts`, `loading`

### Feed Batch DALs

The feed pipeline pre-loads reactions for all posts on a page:

```
apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js
```

`readViewerReactionsBatch({ postIds, actorId })` → `vc.post_reactions` → returns `Map<postId, reaction>`

```
apps/VCSM/src/features/feed/dal/feed.read.reactionCounts.dal.js
```

`readReactionCountsBatch(postIds)` → two parallel queries:
- `vc.post_reactions` (all rows for postIds, counts like/dislike in JS)
- `vc.post_rose_gifts` (all rows for postIds, sums qty in JS)

Returns `Map<postId, { like, dislike, rose }>`

---

## Rose Gifts

### Table

**`vc.post_rose_gifts`**

| Column | Notes |
|---|---|
| `post_id` | FK to `vc.posts.id` |
| `actor_id` | FK to `vc.actors.id` |
| `qty` | Integer quantity |

No uniqueness constraint observed — an actor can insert multiple rose rows for the same post. Each insert creates a new row. The count is derived by summing `qty` across all rows for a post.

### DAL

```
apps/VCSM/src/features/post/postcard/dal/roseGifts.actor.dal.js
```

- `listRoseGiftsByPostDAL(postId)` — reads `qty` for all roses on a post (not used in main feed pipeline)
- `insertRoseGiftDAL({ postId, actorId, qty })` — unbounded insert

### Controller

```
apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js
```

Function: `sendRoseController({ postId, actorId, qty })`

Steps:
1. Validate inputs
2. `insertRoseGiftDAL` — always a new row (no toggle/update)
3. `fetchPostByIdDAL(postId)` — load post owner for notification
4. `publishVcsmNotification(...)` — always fires (rose is not toggleable)
5. `fetchReactionSummaryDAL(postId)` — RPC for updated counts
6. Return `{ counts }`

**Serial query risk:** insert → read post → RPC counts = 3 serial queries.

---

## Comment Likes

### Table

**`vc.comment_likes`**

| Column | Notes |
|---|---|
| `comment_id` | Composite PK part 1 |
| `actor_id` | Composite PK part 2 |

No `qty` — each row = one like. Composite PK enforces one like per actor per comment.

### DAL

```
apps/VCSM/src/features/post/commentcard/dal/commentLikes.dal.js
```

Functions: `isCommentLiked`, `likeComment`, `unlikeComment`, `getCommentLikeCount`, `listCommentLikeRowsByCommentIds`, `listActorCommentLikeRows`

### Controller

```
apps/VCSM/src/features/post/commentcard/controller/commentReactions.controller.js
```

Function: `toggleCommentLike({ commentId, actorId })`

Steps:
1. `isCommentLiked` — check existing state
2. If liked: `unlikeComment` — no notification
3. If not liked: `likeComment` + `readCommentActorAndPostIdDAL` + `publishVcsmNotification` (kind: `'social.post.comment_like'`)
4. `getCommentLikeCount(commentId)` — individual count query
5. Return `{ isLiked, likeCount }`

**Serial query risk:** read → mutate → read count = 3 serial queries.

---

## Profile Photo Reactions (2026-05-10)

Photos tab on a profile page uses a separate enrichment path, not the feed pipeline.

### Controller

```
apps/VCSM/src/features/profiles/controller/photos/photoReactions.controller.js
```

Function: `enrichPhotoPostsController({ posts, viewerActorId, actorId })`

Three DAL calls run in parallel via `Promise.all` (2026-05-10 fix — previously sequential):
- `listPostReactions(postIds)` → `vc.post_reactions`
- `listPostCommentsCount(postIds)` → `vc.post_comments`
- `listPostRoseCount(postIds)` → `vc.post_rose_gifts`

### Model

```
apps/VCSM/src/features/profiles/model/photos/enrichPhotoPosts.model.js
```

Function: `enrichPhotoPostsModel({ posts, reactions, commentCounts, roseCounts, viewerActorId })`

**2026-05-10 fix:** Replaced O(N×M) `.filter()` inside `.map()` with a single O(N) pre-pass over `reactions` building a `Map<postId, {like, dislike, viewer}>`. Per-post lookup is now O(1).

### Hook

```
apps/VCSM/src/features/profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js
```

- Calls `enrichPhotoPostsController` on mount and after each toggle/rose to refresh server truth
- Maintains optimistic local state (`reactionByPost`, `roseByPost`) on top of server base
- On toggle error: rolls back optimistic state

---

## Reaction Counters: Stored vs Derived

All reaction counts are **derived, not stored**:
- `like/dislike` counts: derived by aggregating `vc.post_reactions` rows
- `rose` count: derived by summing `vc.post_rose_gifts.qty`
- Comment like count: derived by counting `vc.comment_likes` rows

The RPC `vc.post_reactors_summary_one` aggregates like/dislike/rose in a single DB call for the post detail screen after a mutation. The feed pipeline derives counts in JS from bulk row fetches.

There are no stored/materialized aggregate counters (no `like_count`, `comment_count`, or `rose_count` columns on `vc.posts`). This means every count read requires a fresh aggregate or a full bulk row scan.

---

## Notification Events Published

| Event | Kind | Trigger |
|---|---|---|
| Post like | `social.post.like` | New like created (not switch/toggle-off) |
| Post dislike | `social.post.dislike` | New dislike created |
| Post rose | `social.post.rose` | Every rose gift insert |
| Comment like | `social.post.comment_like` | New comment like (not toggle-off) |

All notifications are fire-and-forget (no await at the call site in the controller — the adapter function returns a Promise but the controller does not await notification failure).
