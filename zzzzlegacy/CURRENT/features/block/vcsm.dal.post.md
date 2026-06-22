# VCSM DAL — `post`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/post/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 12 |
| Exported functions | 29 |
| Tables accessed | 10 |
| RPCs called | 2 |
| Risk findings | 0 |

## DAL Files

### `commentLikes.dal.js`

**Path:** `features/post/commentcard/dal/commentLikes.dal.js`  
**Operations:** `read` · `insert` · `delete`  

**Exported functions:**

| `getCommentLikeCount` | `read` · `insert` · `delete` | `comment_likes` |
| `isCommentLiked` | `read` · `insert` · `delete` | `comment_likes` |
| `likeComment` | `read` · `insert` · `delete` | `comment_likes` |
| `listActorCommentLikeRows` | `read` · `insert` · `delete` | `comment_likes` |
| `listCommentLikeRowsByCommentIds` | `read` · `insert` · `delete` | `comment_likes` |
| `unlikeComment` | `read` · `insert` · `delete` | `comment_likes` |

### `comments.dal.js`

**Path:** `features/post/commentcard/dal/comments.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createComment` | `read` · `insert` · `update` | `post_comments` |
| `readCommentActorAndPostIdDAL` | `read` · `insert` · `update` | `post_comments` |
| `softDeleteCommentDAL` | `read` · `insert` · `update` | `post_comments` |
| `updateCommentContentDAL` | `read` · `insert` · `update` | `post_comments` |

### `post.read.dal.js`

**Path:** `features/post/postcard/dal/post.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `checkPostExistsDAL` | `read` | `posts` |
| `fetchPostByIdDAL` | `read` | `posts` |

### `post.write.dal.js`

**Path:** `features/post/postcard/dal/post.write.dal.js`  
**Operations:** `read` · `update` · `delete`  

**Exported functions:**

| `softDeletePostDAL` | `read` · `update` · `delete` | `posts`, `post_mentions`, `actor_directory` |
| `updatePostTextDAL` | `read` · `update` · `delete` | `posts`, `post_mentions`, `actor_directory` |

### `postComments.count.dal.js`

**Path:** `features/post/commentcard/dal/postComments.count.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `countPostComments` | `read` | `post_comments` |

### `postComments.read.dal.js`

**Path:** `features/post/commentcard/dal/postComments.read.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertPostComment` | `read` · `insert` | `post_comments` |
| `listPostComments` | `read` · `insert` | `post_comments` |
| `readPostCommentActorIdDAL` | `read` · `insert` | `post_comments` |

### `postMentions.read.dal.js`

**Path:** `features/post/postcard/dal/postMentions.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readMentionActorPresentationDAL` | `read` | `post_mentions` |
| `readPostMentionedActorIdsDAL` | `read` | `post_mentions` |

### `postMentions.write.dal.js`

**Path:** `features/post/postcard/dal/postMentions.write.dal.js`  
**Operations:** `insert`  

**Exported functions:**

| `insertPostMentionsDAL` | `insert` | `post_mentions` |

### `postReactions.read.dal.js`

**Path:** `features/post/postcard/dal/postReactions.read.dal.js`  
**Operations:** `read` · `rpc`  

**Exported functions:**

| `fetchActorReactionDAL` | `read` · `rpc` | —`post_reactions`, `post_reactors_summary_one` |
| `fetchReactionSummaryDAL` | `read` · `rpc` | —`post_reactions`, `post_reactors_summary_one` |

### `postReactions.write.dal.js`

**Path:** `features/post/postcard/dal/postReactions.write.dal.js`  
**Operations:** `insert` · `update` · `delete`  

**Exported functions:**

| `deleteReactionDAL` | `insert` · `update` · `delete` | `post_reactions` |
| `insertReactionDAL` | `insert` · `update` · `delete` | `post_reactions` |
| `updateReactionDAL` | `insert` · `update` · `delete` | `post_reactions` |

### `postVisibility.dal.js`

**Path:** `features/post/postcard/dal/postVisibility.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `checkPostVisibilityDAL` | `read` | `actor_privacy_settings`, `blocks`, `actor_follows` |

### `roseGifts.actor.dal.js`

**Path:** `features/post/postcard/dal/roseGifts.actor.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertRoseGiftDAL` | `read` · `insert` | `post_rose_gifts` |
| `listRoseGiftsByPostDAL` | `read` · `insert` | `post_rose_gifts` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_directory` | DELETE | `softDeletePostDAL`, `updatePostTextDAL` |
| `actor_follows` | READ | `checkPostVisibilityDAL` |
| `actor_privacy_settings` | READ | `checkPostVisibilityDAL` |
| `blocks` | READ | `checkPostVisibilityDAL` |
| `comment_likes` | DELETE | `getCommentLikeCount`, `isCommentLiked`, `likeComment`, `listActorCommentLikeRows`, `listCommentLikeRowsByCommentIds`, `unlikeComment` |
| `post_comments` | INSERT, READ, UPDATE | `countPostComments`, `createComment`, `insertPostComment`, `listPostComments`, `readCommentActorAndPostIdDAL`, `readPostCommentActorIdDAL`, `softDeleteCommentDAL`, `updateCommentContentDAL` |
| `post_mentions` | DELETE, INSERT, READ | `insertPostMentionsDAL`, `readMentionActorPresentationDAL`, `readPostMentionedActorIdsDAL`, `softDeletePostDAL`, `updatePostTextDAL` |
| `post_reactions` | DELETE | `deleteReactionDAL`, `insertReactionDAL`, `updateReactionDAL` |
| `post_rose_gifts` | INSERT | `insertRoseGiftDAL`, `listRoseGiftsByPostDAL` |
| `posts` | DELETE, READ | `checkPostExistsDAL`, `fetchPostByIdDAL`, `softDeletePostDAL`, `updatePostTextDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `post_reactions` | `fetchActorReactionDAL`, `fetchReactionSummaryDAL` |
| `post_reactors_summary_one` | `fetchActorReactionDAL`, `fetchReactionSummaryDAL` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `commentLikes.dal.js`

**Direct callers:**

- `commentReactions.controller.js` _Controller_
- `commentReactions.hydrator.controller.js` _Controller_

**Full call chain to screen:**

```
`commentLikes.dal.js` → `commentReactions.hydrator.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx`
```
```
`commentLikes.dal.js` → `commentReactions.hydrator.controller.js` → `useCommentThread.js` → `useCommentThread.adapter.js` → `CommentModal.jsx`
```
```
`commentLikes.dal.js` → `commentReactions.hydrator.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`commentLikes.dal.js` → `commentReactions.hydrator.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `comments.dal.js`

**Direct callers:**

- `commentReactions.controller.js` _Controller_
- `deleteComment.controller.js` _Controller_
- `editComment.controller.js` _Controller_
- `postComments.controller.js` _Controller_

**Full call chain to screen:**

```
`comments.dal.js` → `deleteComment.controller.js` → `usePostDetailEditing.js` → `PostDetail.view.jsx`
```
```
`comments.dal.js` → `deleteComment.controller.js` → `usePostDetailEditing.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`comments.dal.js` → `deleteComment.controller.js` → `usePostDetailEditing.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```
```
`comments.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `useCommentThread.adapter.js` → `CommentModal.jsx`
```

### `postComments.count.dal.js`

**Direct callers:**

- `postComments.count.controller.js` _Controller_

**Full call chain to screen:**

```
`postComments.count.dal.js` → `postComments.count.controller.js` → `usePostCommentCount.js` → `PostDetail.view.jsx`
```
```
`postComments.count.dal.js` → `postComments.count.controller.js` → `usePostCommentCount.js` → `PostCard.view.jsx` → `PostFeed.screen.jsx`
```
```
`postComments.count.dal.js` → `postComments.count.controller.js` → `usePostCommentCount.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`postComments.count.dal.js` → `postComments.count.controller.js` → `usePostCommentCount.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `postComments.read.dal.js`

**Direct callers:**

- `postComments.controller.js` _Controller_

**Full call chain to screen:**

```
`postComments.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx`
```
```
`postComments.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `useCommentThread.adapter.js` → `CommentModal.jsx`
```
```
`postComments.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`postComments.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `post.read.dal.js`

**Direct callers:**

- `postComments.controller.js` _Controller_
- `getPostById.controller.js` _Controller_
- `sendRose.controller.js` _Controller_
- `togglePostReaction.controller.js` _Controller_

**Full call chain to screen:**

```
`post.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx`
```
```
`post.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `useCommentThread.adapter.js` → `CommentModal.jsx`
```
```
`post.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`post.read.dal.js` → `postComments.controller.js` → `useCommentThread.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `post.write.dal.js`

**Direct callers:**

- `deletePost.controller.js` _Controller_
- `editPost.controller.js` _Controller_

**Full call chain to screen:**

```
`post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `PostDetail.view.jsx`
```
```
`post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `PostFeed.screen.jsx`
```
```
`post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `useDeletePostAction.adapter.js` → `actorProfileScreenDependencies.adapter.js`
```
```
`post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```

### `postMentions.read.dal.js`

**Direct callers:**

- `getPostMentionMap.controller.js` _Controller_

**Full call chain to screen:**

```
`postMentions.read.dal.js` → `getPostMentionMap.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx`
```
```
`postMentions.read.dal.js` → `getPostMentionMap.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`postMentions.read.dal.js` → `getPostMentionMap.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `postMentions.write.dal.js`

**Direct callers:**

- `post.write.dal.js` _DAL_

**Full call chain to screen:**

```
`postMentions.write.dal.js` → `post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `PostDetail.view.jsx`
```
```
`postMentions.write.dal.js` → `post.write.dal.js` → `deletePost.controller.js` → `useDeletePostAction.js` → `PostFeed.screen.jsx`
```

### `postReactions.read.dal.js`

**Direct callers:**

- `getPostReactions.controller.js` _Controller_
- `sendRose.controller.js` _Controller_
- `togglePostReaction.controller.js` _Controller_

**Full call chain to screen:**

```
`postReactions.read.dal.js` → `getPostReactions.controller.js` → `usePostReactions.js` → `ReactionBar.jsx` → `PostDetail.view.jsx`
```
```
`postReactions.read.dal.js` → `sendRose.controller.js` → `usePostReactionOps.js` → `post.adapter.js` → `usePhotoReactions.js`
```

### `postReactions.write.dal.js`

**Direct callers:**

- `togglePostReaction.controller.js` _Controller_

**Full call chain to screen:**

```
`postReactions.write.dal.js` → `togglePostReaction.controller.js` → `usePostReactionOps.js` → `post.adapter.js` → `usePhotoReactions.js`
```
```
`postReactions.write.dal.js` → `togglePostReaction.controller.js` → `usePostReactions.js` → `ReactionBar.jsx` → `PostDetail.view.jsx`
```

### `postVisibility.dal.js`

**Direct callers:**

- `getPostById.controller.js` _Controller_

**Full call chain to screen:**

```
`postVisibility.dal.js` → `getPostById.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx`
```
```
`postVisibility.dal.js` → `getPostById.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx` → `PostDetail.view.adapter.js`
```
```
`postVisibility.dal.js` → `getPostById.controller.js` → `usePostDetailPost.js` → `PostDetail.view.jsx` → `PostDetail.screen.jsx`
```

### `roseGifts.actor.dal.js`

**Direct callers:**

- `sendRose.controller.js` _Controller_

**Full call chain to screen:**

```
`roseGifts.actor.dal.js` → `sendRose.controller.js` → `usePostReactionOps.js` → `post.adapter.js` → `usePhotoReactions.js`
```
```
`roseGifts.actor.dal.js` → `sendRose.controller.js` → `usePostReactions.js` → `ReactionBar.jsx` → `PostDetail.view.jsx`
```

### `fetchPostsForActor.dal.js`

**Direct callers:**

- `getActorPosts.controller.js` _Controller_
- `fetchPostsForActor.dal.js` _DAL_

**Full call chain to screen:**

```
`fetchPostsForActor.dal.js` → `fetchPostsForActor.dal.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `getActorPosts.controller.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `useActorPosts.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `useActorPosts.js` → `ActorProfilePhotosView.jsx`
```

### `fetchPostsForActor.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `Comment.model.js`, `post.model.js` |
| **Controller** | ✓ PRESENT | `commentReactions.controller.js`, `commentReactions.hydrator.controller.js`, `deleteComment.controller.js`, `editComment.controller.js`, `postComments.controller.js`, `postComments.count.controller.js` +7 more |
| **Adapter** | ✓ PRESENT | `CommentCard.container.adapter.js`, `useCommentThread.adapter.js`, `post.adapter.js`, `postCard.adapter.js`, `BinaryReactionButton.adapter.js`, `CommentButton.adapter.js` +6 more |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useCommentCard.js`, `useCommentThread.js`, `useEditCommentAction.js`, `usePostCommentCount.js`, `useCommentCovers.js`, `useDeletePostAction.js` +9 more |
| **Component** | ✓ PRESENT | `CommentCard.container.jsx`, `CommentComposeModal.jsx`, `CommentList.jsx`, `CommentReplies.jsx`, `CommentReplyModal.jsx`, `CommentActions.jsx` +14 more |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Model

_Pure transforms — no side effects, no DB access_

- `features/post/commentcard/model/Comment.model.js`
- `features/post/postcard/model/post.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/post/commentcard/controller/commentReactions.controller.js`
- `features/post/commentcard/controller/commentReactions.hydrator.controller.js`
- `features/post/commentcard/controller/deleteComment.controller.js`
- `features/post/commentcard/controller/editComment.controller.js`
- `features/post/commentcard/controller/postComments.controller.js`
- `features/post/commentcard/controller/postComments.count.controller.js`
- `features/post/postcard/controller/deletePost.controller.js`
- `features/post/postcard/controller/editPost.controller.js`
- `features/post/postcard/controller/getPostById.controller.js`
- `features/post/postcard/controller/getPostMentionMap.controller.js`
- `features/post/postcard/controller/getPostReactions.controller.js`
- `features/post/postcard/controller/sendRose.controller.js`
- `features/post/postcard/controller/togglePostReaction.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/post/adapters/commentcard/components/CommentCard.container.adapter.js`
- `features/post/adapters/commentcard/hooks/useCommentThread.adapter.js`
- `features/post/adapters/post.adapter.js`
- `features/post/adapters/postCard.adapter.js`
- `features/post/adapters/postcard/components/BinaryReactionButton.adapter.js`
- `features/post/adapters/postcard/components/CommentButton.adapter.js`
- `features/post/adapters/postcard/components/PostActionsMenu.adapter.js`
- `features/post/adapters/postcard/components/RoseReactionButton.adapter.js`
- `features/post/adapters/postcard/components/ShareModal.adapter.js`
- `features/post/adapters/postcard/components/ShareReactionButton.adapter.js`
- `features/post/adapters/postcard/hooks/useDeletePostAction.adapter.js`
- `features/post/adapters/screens/PostDetail.view.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/post/commentcard/hooks/useCommentCard.js`
- `features/post/commentcard/hooks/useCommentThread.js`
- `features/post/commentcard/hooks/useEditCommentAction.js`
- `features/post/commentcard/hooks/usePostCommentCount.js`
- `features/post/postcard/hooks/useCommentCovers.js`
- `features/post/postcard/hooks/useDeletePostAction.js`
- `features/post/postcard/hooks/useEditPost.js`
- `features/post/postcard/hooks/usePostCovers.js`
- `features/post/postcard/hooks/usePostDetailEditing.js`
- `features/post/postcard/hooks/usePostDetailMenus.js`
- `features/post/postcard/hooks/usePostDetailPost.js`
- `features/post/postcard/hooks/usePostDetailReplying.js`
- `features/post/postcard/hooks/usePostDetailReporting.js`
- `features/post/postcard/hooks/usePostReactionOps.js`
- `features/post/postcard/hooks/usePostReactions.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/post/commentcard/components/CommentCard.container.jsx`
- `features/post/commentcard/components/CommentComposeModal.jsx`
- `features/post/commentcard/components/CommentList.jsx`
- `features/post/commentcard/components/CommentReplies.jsx`
- `features/post/commentcard/components/CommentReplyModal.jsx`
- `features/post/commentcard/components/cc/CommentActions.jsx`
- `features/post/commentcard/components/cc/CommentBody.jsx`
- `features/post/commentcard/components/cc/CommentHeader.jsx`
- `features/post/postcard/components/BinaryReactionButton.jsx`
- `features/post/postcard/components/CommentButton.jsx`
- `features/post/postcard/components/MediaCarousel.jsx`
- `features/post/postcard/components/PostActionsMenu.jsx`
- `features/post/postcard/components/PostBody.jsx`
- `features/post/postcard/components/PostConfirmModal.jsx`
- `features/post/postcard/components/PostFooter.jsx`
- `features/post/postcard/components/PostHeader.jsx`
- `features/post/postcard/components/ReactionBar.jsx`
- `features/post/postcard/components/RoseReactionButton.jsx`
- `features/post/postcard/components/ShareModal.jsx`
- `features/post/postcard/components/ShareReactionButton.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## ARCHITECT Scan — 2026-05-11

_Scope: VCSM — live grep dead code audit_
_Method: Import trace + file read_
_Confidence: LIVE\_VERIFIED_

### Function Status (All 29 — Live Verified)

| Function | File | Status | Notes |
|---|---|---|---|
| `getCommentLikeCount` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.controller.js` |
| `isCommentLiked` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.controller.js` |
| `likeComment` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.controller.js` |
| `listActorCommentLikeRows` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.hydrator.controller.js` |
| `listCommentLikeRowsByCommentIds` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.hydrator.controller.js` |
| `unlikeComment` | `commentLikes.dal.js` | **ACTIVE** | `commentReactions.controller.js` |
| `createComment` | `comments.dal.js` | **ACTIVE** | `postComments.controller.js` (x2 call sites) |
| `readCommentActorAndPostIdDAL` | `comments.dal.js` | **ACTIVE** | `commentReactions.controller.js` |
| `softDeleteCommentDAL` | `comments.dal.js` | **ACTIVE** | `deleteComment.controller.js` |
| `updateCommentContentDAL` | `comments.dal.js` | **ACTIVE** | `editComment.controller.js` |
| `checkPostExistsDAL` | `post.read.dal.js` | **ACTIVE** | `togglePostReaction`, `sendRose`, `postComments` controllers |
| `fetchPostByIdDAL` | `post.read.dal.js` | **ACTIVE** | `getPostById`, `togglePostReaction`, `sendRose`, `postComments` controllers |
| `softDeletePostDAL` | `post.write.dal.js` | **ACTIVE** | `deletePost.controller.js` |
| `updatePostTextDAL` | `post.write.dal.js` | **ACTIVE** | `editPost.controller.js` |
| `countPostComments` | `postComments.count.dal.js` | **ACTIVE** | `postComments.count.controller.js` |
| `insertPostComment` | `postComments.read.dal.js` | **DEAD** | Zero callers. `createComment` in `comments.dal.js` is used instead. Duplicate insert function. |
| `listPostComments` | `postComments.read.dal.js` | **ACTIVE** | `postComments.controller.js` |
| `readPostCommentActorIdDAL` | `postComments.read.dal.js` | **ACTIVE** | `postComments.controller.js` |
| `readMentionActorPresentationDAL` | `postMentions.read.dal.js` | **ACTIVE** | `getPostMentionMap.controller.js` |
| `readPostMentionedActorIdsDAL` | `postMentions.read.dal.js` | **ACTIVE** | `getPostMentionMap.controller.js` |
| `insertPostMentionsDAL` | `postMentions.write.dal.js` | **ACTIVE** | Called by `post.write.dal.js` (DAL→DAL — see RISK-3) |
| `fetchActorReactionDAL` | `postReactions.read.dal.js` | **ACTIVE** | `getPostReactions`, `togglePostReaction` controllers |
| `fetchReactionSummaryDAL` | `postReactions.read.dal.js` | **ACTIVE** | `getPostReactions`, `sendRose`, `togglePostReaction` controllers |
| `deleteReactionDAL` | `postReactions.write.dal.js` | **ACTIVE** | `togglePostReaction.controller.js` |
| `insertReactionDAL` | `postReactions.write.dal.js` | **ACTIVE** | `togglePostReaction.controller.js` |
| `updateReactionDAL` | `postReactions.write.dal.js` | **ACTIVE** | `togglePostReaction.controller.js` |
| `checkPostVisibilityDAL` | `postVisibility.dal.js` | **ACTIVE** | `getPostById.controller.js` |
| `insertRoseGiftDAL` | `roseGifts.actor.dal.js` | **ACTIVE** | `sendRose.controller.js` |
| `listRoseGiftsByPostDAL` | `roseGifts.actor.dal.js` | **DEAD** | Zero callers anywhere in codebase. |

### `fetchPostsForActor.dal.js` — Misattribution Finding

The static scan double-listed `fetchPostsForActor.dal.js` in this doc with conflicting data. Live investigation confirms:

- **The canonical file lives at:** `features/profiles/dal/post/fetchPostsForActor.dal.js` — belongs to the **`profiles` feature**, not `post`
- **A re-export shim exists at:** `features/profiles/screens/views/tabs/post/dal/fetchPostsForActor.dal.js` — single line: `export { fetchPostsForActorDAL } from "@/features/profiles/dal/post/fetchPostsForActor.dal"`
- **The caller is:** `features/profiles/controller/post/getActorPosts.controller.js` — a profiles controller
- **Why the double-entry appeared:** ARCHITECT static scan found the shim (zero direct callers → "No callers detected") and the canonical path via import tracing (callers found → showed call chain). Both entries refer to the same logical function but from different path perspectives.
- **Conclusion:** This file must be removed from the `post` DAL doc entirely. It belongs in `vcsm.dal.profiles.md`.

### Schema Corrections

Original doc listed all tables without schema prefix. Live code reads confirmed:

| Original doc | Corrected |
|---|---|
| `posts` | `vc.posts` |
| `post_comments` | `vc.post_comments` |
| `post_mentions` | `vc.post_mentions` |
| `post_reactions` | `vc.post_reactions` |
| `post_rose_gifts` | `vc.post_rose_gifts` |
| `comment_likes` | `vc.comment_likes` |
| `actor_follows` | `vc.actor_follows` |
| `actor_privacy_settings` | `vc.actor_privacy_settings` |
| `actor_directory` | `vc.actor_directory` (inferred — same schema pattern) |
| `blocks` | `moderation.blocks` |

### Risk Findings

**RISK-1 — `insertPostComment` is dead code (LOW)**

`postComments.read.dal.js` exports `insertPostComment`, but zero callers exist anywhere in `apps/VCSM/src`. Comment creation uses `createComment` from `comments.dal.js` instead. The two functions likely duplicate the same DB insert. `insertPostComment` is also architecturally misplaced — an insert operation in a file named `postComments.read.dal.js`.

Recommended action: DELETE CANDIDATE — verify no dynamic imports, then remove. Also consider renaming `postComments.read.dal.js` to remove the misleading `read` label if it retains other functions.
**Handoff:** IRONMAN

---

**RISK-2 — `listRoseGiftsByPostDAL` is dead code (LOW)**

`roseGifts.actor.dal.js` exports `listRoseGiftsByPostDAL`, but zero callers exist anywhere. `insertRoseGiftDAL` is used (active), but the read-side of rose gifts is never consumed. Likely written in anticipation of a "view gifters" feature that was never implemented.

Recommended action: DELETE CANDIDATE — no callers found.
**Handoff:** IRONMAN

---

**RISK-3 — DAL→DAL call: `post.write.dal.js` calls `insertPostMentionsDAL` (MEDIUM)**

`postMentions.write.dal.js` is invoked directly from `post.write.dal.js` rather than from a controller. This DAL→DAL dependency means `post.write.dal.js` coordinates two separate table writes (`vc.posts`/`vc.post_mentions` + `vc.actor_directory`) in a single DAL file, bypassing the controller layer for orchestration. This is an architecture boundary violation — controllers should coordinate multi-DAL writes, not DALs calling other DALs.

Recommended action: Evaluate whether write coordination should move to a controller. Low urgency if writes are always co-dependent and the pattern is stable.
**Handoff:** SENTRY

---

**RISK-4 — `fetchPostsForActor.dal.js` misattributed in this doc (MEDIUM)**

The static scan incorrectly placed this file under the `post` feature DAL. The canonical source is `features/profiles/dal/post/fetchPostsForActor.dal.js`. This entry — including both call chain entries in the doc above — should be removed from `vcsm.dal.post.md` and added to `vcsm.dal.profiles.md` instead.

Recommended action: Remove both `fetchPostsForActor.dal.js` call chain entries from this doc. Update `vcsm.dal.profiles.md` to include it.
**Handoff:** LOGAN (doc correction on profiles)

---

**RISK-5 — All table schemas undocumented (LOW — corrected)**

All 10 tables listed without schema prefix. Corrected in schema table above. Post tables are `vc.*`, blocks is `moderation.*`.

---

### Architecture Note

`postComments.read.dal.js` contains `insertPostComment` — an insert function in a read-labeled DAL file. Even if the function were active, the naming violates the DAL file responsibility convention. The file should either be renamed or the insert function moved to a dedicated write DAL.

---

## LOGAN Findings Append — 2026-05-11

**Task:** ARCHITECT live scan — dead code audit of post DAL (29 functions). Logan findings appended.
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Final Logan Status:** MAJOR DRIFT — 0 risks reported, 5 found (2 dead exports, 1 DAL→DAL violation, 1 misattribution, 1 schema correction).

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-01**
Finding ID: DF-01 | Severity: LOW | Status: CORRECTED (appended)
Doc: `vcsm.dal.post.md` → `postComments.read.dal.js` — `insertPostComment`
Original: Listed as active, 0 risks.
Reality: Zero callers. Dead export. Duplicate of `createComment`. Misplaced in read-labeled file.

**LOGAN DRIFT FINDING — DF-02**
Finding ID: DF-02 | Severity: LOW | Status: CORRECTED (appended)
Doc: `vcsm.dal.post.md` → `roseGifts.actor.dal.js` — `listRoseGiftsByPostDAL`
Original: Listed as active, 0 risks.
Reality: Zero callers. Dead export. Read-side of rose gifts never consumed.

**LOGAN DRIFT FINDING — DF-03**
Finding ID: DF-03 | Severity: MEDIUM | Status: CORRECTED (appended)
Doc: `vcsm.dal.post.md` → `postMentions.write.dal.js` call chain
Original: Call chain shown as DAL→DAL without risk flag.
Reality: DAL→DAL orchestration bypasses the controller layer — architecture boundary violation.

**LOGAN DRIFT FINDING — DF-04**
Finding ID: DF-04 | Severity: MEDIUM | Status: CORRECTED (appended)
Doc: `vcsm.dal.post.md` → `fetchPostsForActor.dal.js` double-entry
Original: Static scan attributed this file to `post` feature. Showed conflicting call chain data.
Reality: File belongs to `profiles` feature. Double-entry was a static scan artifact (shim vs canonical path). Must be removed from this doc and added to `vcsm.dal.profiles.md`.

**LOGAN DRIFT FINDING — DF-05**
Finding ID: DF-05 | Severity: LOW | Status: CORRECTED (appended)
Doc: `vcsm.dal.post.md` → all table entries
Original: No schema prefixes.
Reality: `vc.*` for post tables, `moderation.blocks` for the block read in `postVisibility.dal.js`.

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | (inline this session) | 29-function live trace, schema audit, misattribution detection | PRESENT |
| IRONMAN | — | RISK-1 + RISK-2 dead export ownership decisions | MISSING |
| SENTRY | — | RISK-3 DAL→DAL boundary violation review | MISSING |
| LOGAN | — | RISK-4 profiles doc update needed (`fetchPostsForActor` entry) | PENDING |
| VENOM | — | Optional — post write paths are user-facing mutation paths | MISSING |

### RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| IRONMAN | RISK-1 (`insertPostComment`) + RISK-2 (`listRoseGiftsByPostDAL`) — ownership + deletion decisions |
| SENTRY | RISK-3 — DAL→DAL coordination in `post.write.dal.js` + `postMentions.write.dal.js` |
| LOGAN | RISK-4 — remove `fetchPostsForActor` entries from this doc; add to `vcsm.dal.profiles.md` |

### Change Log Entry

Task: ARCHITECT dead code audit (29 functions) + Logan findings appended to post DAL doc.
Application Scope: VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`
Code Status Before: 0 risk findings. All 29 functions listed as clean. `fetchPostsForActor.dal.js` double-listed without explanation.
Code Status After: 5 risk findings documented. 2 confirmed dead exports. 1 DAL→DAL violation. 1 misattribution corrected. All table schemas corrected to include schema prefix.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md` — findings appended
Documentation Truth Status: PARTIAL — findings appended to original ARCHITECT format. `fetchPostsForActor` doc correction in `vcsm.dal.profiles.md` pending.

---

## Consumer Map — Complete Stack Trace

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · import trace across `apps/VCSM/src/`  
_Method:_ DAL → Controller → Model → Hook → Component → Screen  
_Confidence:_ STATICALLY_TRACED  
_Scope:_ All 4 DAL groups — `post/postcard/dal/`, `post/commentcard/dal/`, `feed/dal/`, `upload/dal/`

---

## DAL Group 1 — `post/postcard/dal/`

---

### `post.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/post.read.dal.js` | `fetchPostByIdDAL` (full row + actor hydration), `checkPostExistsDAL` (existence gate) |
| Controller | `post/postcard/controller/getPostById.controller.js` | main read path — calls `fetchPostByIdDAL` + `checkPostVisibilityDAL` |
| Controller | `post/postcard/controller/togglePostReaction.controller.js` | calls `checkPostExistsDAL` + `fetchPostByIdDAL` before reacting |
| Controller | `post/postcard/controller/sendRose.controller.js` | calls `checkPostExistsDAL` + `fetchPostByIdDAL` before gifting |
| Controller | `post/commentcard/controller/postComments.controller.js` | calls `checkPostExistsDAL` + `fetchPostByIdDAL` to verify post before threading |
| Model | `post/postcard/model/post.model.js` | `PostModel()` — normalizes enriched row (preserves actor object SSOT) — called inside `getPostById.controller` |
| Hook | `post/postcard/hooks/usePostDetailPost.js` | loads post via `getPostById.controller` |
| Hook | `post/postcard/hooks/usePostReactions.js` | calls `togglePostReaction.controller` which checks existence first |
| Hook | `post/commentcard/hooks/useCommentThread.js` | calls `postComments.controller` which checks post first |
| Adapter | `post/adapters/screens/PostDetail.view.adapter.js` | re-exports `PostDetail.view` for cross-feature use |
| Screen | `post/screens/PostDetail.view.jsx` | primary consumer via `usePostDetailPost` |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen — composes `PostDetail.view` |
| Screen | `notifications/screen/NotiViewPostScreen.jsx` | via `PostDetail.view.adapter.js` |

```
post.read.dal.js
 → getPostById.controller (fetchPostByIdDAL + checkPostVisibilityDAL)
   → post.model.js (PostModel)
   → usePostDetailPost.js
     → PostDetail.view.jsx
       → PostDetail.screen.jsx [final screen]
       → PostDetail.view.adapter.js
         → NotiViewPostScreen.jsx
 → togglePostReaction.controller (checkPostExistsDAL + fetchPostByIdDAL)
   → usePostReactions.js
     → ReactionBar.jsx → PostDetail.view.jsx
 → sendRose.controller (checkPostExistsDAL + fetchPostByIdDAL)
   → usePostReactionOps.js → post.adapter.js
 → postComments.controller (checkPostExistsDAL + fetchPostByIdDAL)
   → useCommentThread.js
     → PostDetail.view.jsx
     → useCommentThread.adapter.js → CommentModal.jsx
```

---

### `post.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/post.write.dal.js` | `softDeletePostDAL` (soft delete with owner gate), `updatePostTextDAL` (edit text + re-sync mentions) |
| Controller | `post/postcard/controller/deletePost.controller.js` | calls `softDeletePostDAL` |
| Controller | `post/postcard/controller/editPost.controller.js` | calls `updatePostTextDAL` |
| Model | — | no transform on write path |
| Hook | `post/postcard/hooks/useDeletePostAction.js` | wraps `deletePost.controller` |
| Hook | `post/postcard/hooks/useEditPost.js` | wraps `editPost.controller` |
| Adapter | `post/adapters/postcard/hooks/useDeletePostAction.adapter.js` | re-exports for cross-feature delete |
| Screen | `post/screens/PostDetail.view.jsx` | consumes both hooks |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |
| Screen | `post/screens/PostFeed.screen.jsx` | delete action in feed |

```
post.write.dal.js
 → deletePost.controller (softDeletePostDAL)
   → useDeletePostAction.js
     → PostDetail.view.jsx → PostDetail.screen.jsx
     → PostFeed.screen.jsx
     → useDeletePostAction.adapter.js (cross-feature)
 → editPost.controller (updatePostTextDAL — also calls insertPostMentionsDAL via DAL→DAL)
   → useEditPost.js
     → PostDetail.view.jsx → PostDetail.screen.jsx
```

> **Note:** `updatePostTextDAL` calls `insertPostMentionsDAL` directly (DAL→DAL — RISK-3). Mention re-sync bypasses the controller layer.

---

### `postMentions.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/postMentions.read.dal.js` | `readPostMentionedActorIdsDAL` (raw IDs), `readMentionActorPresentationDAL` (hydrates actor summaries via engine) |
| Controller | `post/postcard/controller/getPostMentionMap.controller.js` | orchestrates both DAL calls → builds `{ actorId → presentation }` map |
| Model | — | actor presentations returned directly as engine shape (no local model) |
| Hook | `post/postcard/hooks/usePostDetailPost.js` | calls `getPostMentionMap.controller` alongside post load |
| Screen | `post/screens/PostDetail.view.jsx` | renders inline @mention pills via mention map |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |

```
postMentions.read.dal.js
 → getPostMentionMap.controller (readPostMentionedActorIdsDAL + readMentionActorPresentationDAL)
   → usePostDetailPost.js
     → PostDetail.view.jsx
       → PostDetail.screen.jsx [final screen]
```

---

### `postMentions.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/postMentions.write.dal.js` | `insertPostMentionsDAL` — inserts `vc.post_mentions` rows |
| DAL (caller) | `post/postcard/dal/post.write.dal.js` | called directly — DAL→DAL violation (RISK-3) |
| Controller | _none directly_ | inherited via `post.write.dal.js` chain |
| Hook | `post/postcard/hooks/useDeletePostAction.js`, `useEditPost.js` | via `post.write.dal.js` chain |
| Screen | `post/screens/PostDetail.view.jsx`, `post/screens/PostFeed.screen.jsx` | via `post.write.dal.js` chain |

```
postMentions.write.dal.js
 → post.write.dal.js [DAL→DAL, RISK-3]
   → deletePost.controller / editPost.controller
     → useDeletePostAction.js / useEditPost.js
       → PostDetail.view.jsx → PostDetail.screen.jsx
       → PostFeed.screen.jsx
```

> **RISK-3:** `post.write.dal.js` calls `insertPostMentionsDAL` directly from inside its own write logic. Controller layer is bypassed for mention orchestration.

---

### `postReactions.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/postReactions.read.dal.js` | `fetchActorReactionDAL` (viewer's reaction row), `fetchReactionSummaryDAL` (RPC aggregated counts) |
| Controller | `post/postcard/controller/getPostReactions.controller.js` | read path — viewer reaction + summary |
| Controller | `post/postcard/controller/togglePostReaction.controller.js` | reads before write to determine insert/update/delete |
| Controller | `post/postcard/controller/sendRose.controller.js` | reads reaction summary after gifting |
| Model | — | no transform (raw reaction rows used directly) |
| Hook | `post/postcard/hooks/usePostReactions.js` | fetches + manages reaction state for UI |
| Hook | `post/postcard/hooks/usePostReactionOps.js` | exposes reaction operations as an object |
| Component | `post/postcard/components/ReactionBar.jsx` | primary UI consumer |
| Screen | `post/screens/PostDetail.view.jsx` | renders `ReactionBar` |
| Screen | `post/screens/PostFeed.screen.jsx` | feed pipeline pre-loads reaction counts batch for all posts |

```
postReactions.read.dal.js
 → getPostReactions.controller (fetchActorReactionDAL + fetchReactionSummaryDAL)
   → usePostReactions.js
     → ReactionBar.jsx → PostDetail.view.jsx → PostDetail.screen.jsx
 → togglePostReaction.controller (fetchActorReactionDAL to decide op)
   → usePostReactions.js + usePostReactionOps.js → same chain
 → sendRose.controller (fetchReactionSummaryDAL after gift)
   → usePostReactionOps.js → post.adapter.js (cross-feature)
```

---

### `postReactions.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/postReactions.write.dal.js` | `insertReactionDAL`, `updateReactionDAL`, `deleteReactionDAL` |
| Controller | `post/postcard/controller/togglePostReaction.controller.js` | selects correct write op based on prior reaction read |
| Model | — | no transform |
| Hook | `post/postcard/hooks/usePostReactions.js` | mutation path |
| Hook | `post/postcard/hooks/usePostReactionOps.js` | operation wrapper |
| Adapter | `post/adapters/post.adapter.js` | cross-feature reaction ops (profile photos) |
| Screen | `post/screens/PostDetail.view.jsx` | via `ReactionBar.jsx` |
| Screen (cross-feature) | `profiles/screens/views/tabs/photos/` | via `post.adapter.js` → `usePhotoReactions.js` |

```
postReactions.write.dal.js
 → togglePostReaction.controller (insertReactionDAL / updateReactionDAL / deleteReactionDAL)
   → usePostReactions.js
     → ReactionBar.jsx → PostDetail.view.jsx → PostDetail.screen.jsx
   → usePostReactionOps.js
     → post.adapter.js
       → usePhotoReactions.js [profiles photos tab — cross-feature]
```

---

### `postVisibility.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/postVisibility.dal.js` | `checkPostVisibilityDAL` — parallel block/privacy/follow checks; returns `{ canView, reason }` |
| Controller | `post/postcard/controller/getPostById.controller.js` | gates `fetchPostByIdDAL` — returns `null` if viewer cannot see post |
| Model | — | primitive return; no model transform |
| Hook | `post/postcard/hooks/usePostDetailPost.js` | post load fails gracefully when `canView: false` |
| Screen | `post/screens/PostDetail.view.jsx` | handles null post state |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |

```
postVisibility.dal.js
 → getPostById.controller (checkPostVisibilityDAL — visibility gate)
   → usePostDetailPost.js
     → PostDetail.view.jsx → PostDetail.screen.jsx [final screen]
```

---

### `roseGifts.actor.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/postcard/dal/roseGifts.actor.dal.js` | `insertRoseGiftDAL` (ACTIVE), `listRoseGiftsByPostDAL` (DEAD — zero callers) |
| Controller | `post/postcard/controller/sendRose.controller.js` | calls `insertRoseGiftDAL` + fetches reaction summary after |
| Model | — | no transform |
| Hook | `post/postcard/hooks/usePostReactions.js` | rose send action |
| Hook | `post/postcard/hooks/usePostReactionOps.js` | operation wrapper |
| Adapter | `post/adapters/post.adapter.js` | cross-feature rose ops |
| Screen | `post/screens/PostDetail.view.jsx` | via `RoseReactionButton.jsx` |
| Screen (cross-feature) | `profiles/screens/views/tabs/photos/` | via `post.adapter.js` |

```
roseGifts.actor.dal.js
 → sendRose.controller (insertRoseGiftDAL + fetchReactionSummaryDAL + fetchPostByIdDAL)
   → usePostReactions.js + usePostReactionOps.js
     → RoseReactionButton.jsx → PostDetail.view.jsx → PostDetail.screen.jsx
   → post.adapter.js [cross-feature — profiles photos tab]
```

> **DEAD:** `listRoseGiftsByPostDAL` — zero production callers. See RISK-2.

---

## DAL Group 2 — `post/commentcard/dal/`

---

### `commentLikes.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/commentcard/dal/commentLikes.dal.js` | `likeComment`, `unlikeComment`, `isCommentLiked`, `getCommentLikeCount` (single-comment ops); `listActorCommentLikeRows`, `listCommentLikeRowsByCommentIds` (batch hydration ops) |
| Controller | `post/commentcard/controller/commentReactions.controller.js` | per-comment like/unlike/isLiked/getCount + notification routing |
| Controller | `post/commentcard/controller/commentReactions.hydrator.controller.js` | batch-loads like rows for all comments in a thread |
| Model | `post/commentcard/model/Comment.model.js` | `Comment` class — hydrator enriches instances with `likeCount` and viewer like state |
| Hook | `post/commentcard/hooks/useCommentThread.js` | calls hydrator after loading thread |
| Adapter | `post/adapters/commentcard/hooks/useCommentThread.adapter.js` | re-exports for cross-feature use |
| Screen | `post/screens/PostDetail.view.jsx` | comment thread with likes |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |
| Screen (cross-feature) | `profiles/screens/views/tabs/photos/components/CommentModal.jsx` | via `useCommentThread.adapter.js` |

```
commentLikes.dal.js
 → commentReactions.controller (like/unlike/isLiked/count + notification)
   → Comment.model.js (likeCount + liked state hydration)
   → useCommentThread.js
     → PostDetail.view.jsx → PostDetail.screen.jsx
     → useCommentThread.adapter.js → CommentModal.jsx [photos tab]
 → commentReactions.hydrator.controller (batch rows)
   → Comment.model.js
   → useCommentThread.js [same chain]
```

---

### `comments.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/commentcard/dal/comments.dal.js` | `createComment` (insert), `updateCommentContentDAL` (edit), `softDeleteCommentDAL` (soft delete), `readCommentActorAndPostIdDAL` (owner lookup for notification routing) |
| Controller | `post/commentcard/controller/postComments.controller.js` | `createComment` — root + reply creation |
| Controller | `post/commentcard/controller/editComment.controller.js` | `updateCommentContentDAL` |
| Controller | `post/commentcard/controller/deleteComment.controller.js` | `softDeleteCommentDAL` |
| Controller | `post/commentcard/controller/commentReactions.controller.js` | `readCommentActorAndPostIdDAL` — resolves post context for notification dispatch |
| Model | `post/commentcard/model/Comment.model.js` | `Comment` class — shapes raw `post_comments` rows from `postComments.controller` |
| Hook | `post/commentcard/hooks/useCommentThread.js` | thread load + comment create |
| Hook | `post/postcard/hooks/usePostDetailEditing.js` | edit/delete comment actions |
| Adapter | `post/adapters/commentcard/hooks/useCommentThread.adapter.js` | cross-feature thread access |
| Screen | `post/screens/PostDetail.view.jsx` | full comment thread |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |
| Screen (cross-feature) | `profiles/screens/views/tabs/photos/components/CommentModal.jsx` | via adapter |

```
comments.dal.js
 → postComments.controller (createComment → Comment.model.js)
   → useCommentThread.js
     → PostDetail.view.jsx → PostDetail.screen.jsx
     → useCommentThread.adapter.js → CommentModal.jsx
 → editComment.controller (updateCommentContentDAL)
   → usePostDetailEditing.js → PostDetail.view.jsx
 → deleteComment.controller (softDeleteCommentDAL)
   → usePostDetailEditing.js → PostDetail.view.jsx
 → commentReactions.controller (readCommentActorAndPostIdDAL — notification routing only)
   → useCommentThread.js [same chain]
```

---

### `postComments.count.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/commentcard/dal/postComments.count.dal.js` | `countPostComments` — count query on `vc.post_comments` filtered by `deleted_at IS NULL` |
| Controller | `post/commentcard/controller/postComments.count.controller.js` | thin wrapper |
| Model | — | returns `number` directly |
| Hook | `post/commentcard/hooks/usePostCommentCount.js` | reactive count state |
| Component | `post/postcard/ui/PostCard.view.jsx` | comment count badge in feed cards |
| Screen | `post/screens/PostDetail.view.jsx` | comment count in detail header |
| Screen | `post/screens/PostFeed.screen.jsx` | via `PostCard.view` in feed |

```
postComments.count.dal.js
 → postComments.count.controller (countPostComments)
   → usePostCommentCount.js
     → PostDetail.view.jsx → PostDetail.screen.jsx
     → PostCard.view.jsx → PostFeed.screen.jsx
```

---

### `postComments.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `post/commentcard/dal/postComments.read.dal.js` | `listPostComments` (thread load), `readPostCommentActorIdDAL` (actor lookup for notification/auth) — ACTIVE; `insertPostComment` — DEAD (RISK-1) |
| Controller | `post/commentcard/controller/postComments.controller.js` | `listPostComments` for thread, `readPostCommentActorIdDAL` for ownership checks |
| Model | `post/commentcard/model/Comment.model.js` | `Comment` class instantiated from raw `listPostComments` rows |
| Hook | `post/commentcard/hooks/useCommentThread.js` | loads + hydrates thread |
| Adapter | `post/adapters/commentcard/hooks/useCommentThread.adapter.js` | cross-feature |
| Screen | `post/screens/PostDetail.view.jsx` | full thread |
| Screen | `post/screens/PostDetail.screen.jsx` | final route screen |
| Screen (cross-feature) | `profiles/screens/views/tabs/photos/components/CommentModal.jsx` | via adapter |

```
postComments.read.dal.js
 → postComments.controller (listPostComments + readPostCommentActorIdDAL)
   → Comment.model.js (shapes raw rows)
   → useCommentThread.js
     → PostDetail.view.jsx → PostDetail.screen.jsx [final screen]
     → useCommentThread.adapter.js → CommentModal.jsx [photos tab]
```

> **DEAD:** `insertPostComment` — zero callers. Comment creation uses `createComment` from `comments.dal.js`. See RISK-1.

---

## DAL Group 3 — `feed/dal/`

---

### `feed.read.posts.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `feed/dal/feed.read.posts.dal.js` | `readFeedPostsPage` — cursor-paginated `vc.posts` read by `realm_id` |
| Pipeline | `feed/pipeline/fetchFeedPage.pipeline.js` | called directly — orchestrates full feed page assembly (no controller intermediary) |
| Model | feed pipeline models (`normalizeFeedRows`, `buildActorBundle`, etc.) | shapes raw rows into enriched feed items |
| Hook | `feed/hooks/useFeed.js` | pagination loop + state management |
| Adapter | `feed/adapters/hooks/useFeed.adapter.js` | re-exports `useFeed` for cross-feature use |
| Screen | `post/screens/PostFeed.screen.jsx` | central feed — imports via `useFeed.adapter.js` |

```
feed.read.posts.dal.js
 → fetchFeedPage.pipeline.js (cursor pagination + batch assembly)
   → normalizeFeedRows model + hydration models
   → useFeed.js
     → useFeed.adapter.js
       → PostFeed.screen.jsx [final screen]
```

> **Architecture note:** This DAL is called by the pipeline layer directly — no controller intermediary. Pipeline replaces the controller for the feed assembly use case.

---

### `feed.read.hiddenPosts.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `feed/dal/feed.read.hiddenPosts.dal.js` | `readHiddenPostsForViewer` — reads `moderation.actions` to build hidden post set |
| Pipeline | `feed/pipeline/fetchFeedPage.pipeline.js` | called in parallel alongside `readFeedPostsPage` |
| Model | inline `Set` construction in pipeline | no model file |
| Hook | `feed/hooks/useFeed.js` | consumed via pipeline |
| Screen | `post/screens/PostFeed.screen.jsx` | hidden posts filtered before render |

```
feed.read.hiddenPosts.dal.js
 → fetchFeedPage.pipeline.js (parallel with readFeedPostsPage)
   → useFeed.js
     → PostFeed.screen.jsx [final screen]
```

---

### `feed.posts.dal.js` — DIAGNOSTICS ONLY

| Layer | File | Role |
|---|---|---|
| DAL | `feed/dal/feed.posts.dal.js` | `listFeedPosts` — legacy hydrating read |
| Controller | — | **no production controller** |
| Hook | — | **no production hook** |
| Screen | — | `DevDiagnosticsScreen.jsx` only |

> **Status:** DIAGNOSTICS ONLY. File comment confirms this is a legacy diagnostic path. Production feed uses `feed.read.posts.dal.js` + pipeline.

---

### `listActorPostsByActor.dal.js` — DIAGNOSTICS ONLY (production path unconfirmed)

| Layer | File | Role |
|---|---|---|
| DAL | `feed/dal/listActorPostsByActor.dal.js` | `listActorPostsByActorDAL` — actor-scoped post list |
| Controller | `feed/controllers/listActorPosts.controller.js` | `listActorPosts` — thin wrapper |
| Model | — | raw rows returned |
| Hook | — | **no production hook found** — `useActorPosts` in profiles feature uses `getActorPostsController` from `profiles/controller/`, not this controller |
| Screen | `DevDiagnosticsScreen.jsx` (confirmed) — production screen unclear |

```
listActorPostsByActor.dal.js
 → listActorPosts.controller.js (listActorPosts)
   → diagnostics only (confirmed)
   → no production hook found
```

> **Note:** The `profiles` feature has its own `getActorPosts.controller.js` + `useActorPosts.js` using `fetchPostsForActor.dal.js` (profiles DAL). This feed DAL and `listActorPosts.controller.js` appear to be either a parallel/legacy path or a not-yet-wired production controller.

---

## DAL Group 4 — `upload/dal/`

---

### `insertPost.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/insertPost.dal.js` | `insertPost` — raw `vc.posts` insert |
| Controller | `upload/controllers/createPost.controller.js` | user post creation — orchestrates insert + media + mentions + notifications |
| Controller (system) | `upload/adapters/posts.adapter.js` → `createSystemPost` | vport system post creation — called by vport kind controllers |
| Model | `upload/model/uploadTypes.model.js` | shapes the post insert payload |
| Hook | `upload/hooks/useUploadSubmit.js` | user post creation lifecycle |
| Screen | `upload/screens/UploadScreen.jsx` | user post compose screen |
| Screen (system posts, cross-feature) | vport kind screens (gas, menu, barbershop, locksmith, exchange) | via `createSystemPost` → `posts.adapter.js` |

```
insertPost.dal.js
 → createPost.controller.js (user posts)
   → uploadTypes.model.js (shapes payload)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
 → posts.adapter.js → createSystemPost (vport system posts)
   → publishFuelPriceUpdateAsPost.controller (gas)
   → publishMenuUpdateAsPost.controller (menu)
   → publishBarbershopPortfolioUpdateAsPost.controller (barbershop)
   → publishLocksmithHoursUpdateAsPost.controller (locksmith)
   → publishExchangeRateUpdateAsPost.controller (exchange)
   [each reaches its respective vport kind screen via its own hook chain]
```

---

### `insertPostMedia.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/insertPostMedia.dal.js` | `insertPostMedia` — inserts `vc.post_media` rows |
| Controller | `upload/controllers/createPost.controller.js` | called after `insertPost` succeeds |
| Model | — | no transform |
| Hook | `upload/hooks/useUploadSubmit.js` | media attach step during post creation |
| Screen | `upload/screens/UploadScreen.jsx` | final screen |

```
insertPostMedia.dal.js
 → createPost.controller.js (media rows after post insert)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
```

---

### `insertPostMentions.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/insertPostMentions.dal.js` | `insertPostMentions` — inserts `vc.post_mentions` rows for creation path |
| Controller | `upload/controllers/createPost.controller.js` | called after post + media inserts |
| Model | — | no transform |
| Hook | `upload/hooks/useUploadSubmit.js` | mention attachment step |
| Screen | `upload/screens/UploadScreen.jsx` | final screen |

> **Note:** This is a separate function from `insertPostMentionsDAL` in `post/postcard/dal/postMentions.write.dal.js` — same table write, different naming convention. Both target `vc.post_mentions`. Potential consolidation candidate.

```
insertPostMentions.dal.js
 → createPost.controller.js (mentions after post + media)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
```

---

### `postAuthRollback.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/postAuthRollback.dal.js` | `getCurrentAuthUserDAL` (auth check at start), `deletePostByIdDAL` (hard rollback if media insert fails) |
| Controller | `upload/controllers/createPost.controller.js` | auth verification + post rollback on failure |
| Model | — | no transform |
| Hook | `upload/hooks/useUploadSubmit.js` | error handling path |
| Screen | `upload/screens/UploadScreen.jsx` | final screen |

```
postAuthRollback.dal.js
 → createPost.controller.js (auth check at entry + rollback on media failure)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
```

---

### `updatePostMediaAssetId.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/updatePostMediaAssetId.write.dal.js` | `updatePostMediaAssetIdDAL` — writes `media_asset_id` back to `vc.post_media` after asset tracking record is created |
| Controller | `upload/controller/recordPostMedia.controller.js` | non-blocking — fires after upload completes (IIFE + catch) |
| Model | — | no transform |
| Hook | `upload/hooks/useUploadSubmit.js` | calls `recordPostMediaController` non-blocking after media upload |
| Screen | `upload/screens/UploadScreen.jsx` | final screen |

```
updatePostMediaAssetId.write.dal.js
 → recordPostMedia.controller.js (non-blocking write-back)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
```

---

### `findPostMentionsByPostIds.dal.js` — DIAGNOSTICS ONLY

| Layer | File | Role |
|---|---|---|
| DAL | `upload/dal/findPostMentionsByPostIds.dal.js` | `findPostMentionsByPostIds` — joins mentions + actors + profiles/vports to resolve usernames |
| Controller | — | **no production controller** |
| Hook | — | **no production hook** |
| Screen | — | `DevDiagnosticsScreen.jsx` only (`uploadFeature.group.js`) |

> **Status:** DIAGNOSTICS ONLY.

---

## Consumer Map Summary

| DAL | Controllers | Models (production) | Hooks | Screens |
|---|---|---|---|---|
| `post.read.dal.js` | `getPostById`, `togglePostReaction`, `sendRose`, `postComments` | `post.model.js` (PostModel) | `usePostDetailPost`, `usePostReactions`, `useCommentThread` | `PostDetail.screen`, `NotiViewPostScreen` |
| `post.write.dal.js` | `deletePost`, `editPost` | — | `useDeletePostAction`, `useEditPost` | `PostDetail.screen`, `PostFeed.screen` |
| `postMentions.read.dal.js` | `getPostMentionMap` | — | `usePostDetailPost` | `PostDetail.screen` |
| `postMentions.write.dal.js` | via `post.write.dal.js` (DAL→DAL) | — | `useDeletePostAction`, `useEditPost` | `PostDetail.screen`, `PostFeed.screen` |
| `postReactions.read.dal.js` | `getPostReactions`, `togglePostReaction`, `sendRose` | — | `usePostReactions`, `usePostReactionOps` | `PostDetail.screen`, `PostFeed.screen` |
| `postReactions.write.dal.js` | `togglePostReaction` | — | `usePostReactions`, `usePostReactionOps` | `PostDetail.screen`, cross-feature photos tab |
| `postVisibility.dal.js` | `getPostById` | — | `usePostDetailPost` | `PostDetail.screen` |
| `roseGifts.actor.dal.js` | `sendRose` | — | `usePostReactions`, `usePostReactionOps` | `PostDetail.screen`, cross-feature photos tab |
| `commentLikes.dal.js` | `commentReactions`, `commentReactions.hydrator` | `Comment.model.js` | `useCommentThread` | `PostDetail.screen`, `CommentModal` |
| `comments.dal.js` | `postComments`, `editComment`, `deleteComment`, `commentReactions` | `Comment.model.js` | `useCommentThread`, `usePostDetailEditing` | `PostDetail.screen`, `CommentModal` |
| `postComments.count.dal.js` | `postComments.count` | — | `usePostCommentCount` | `PostDetail.screen`, `PostFeed.screen` |
| `postComments.read.dal.js` | `postComments` | `Comment.model.js` | `useCommentThread` | `PostDetail.screen`, `CommentModal` |
| `feed.read.posts.dal.js` | — (pipeline direct) | feed pipeline models | `useFeed` | `PostFeed.screen` |
| `feed.read.hiddenPosts.dal.js` | — (pipeline direct) | inline Set | `useFeed` | `PostFeed.screen` |
| `feed.posts.dal.js` | **diagnostics only** | — | — | `DevDiagnosticsScreen` |
| `listActorPostsByActor.dal.js` | `listActorPosts` (diagnostics only) | — | — | `DevDiagnosticsScreen` |
| `insertPost.dal.js` | `createPost`, `createSystemPost` (system posts) | `uploadTypes.model.js` | `useUploadSubmit` | `UploadScreen`, vport kind screens |
| `insertPostMedia.dal.js` | `createPost` | — | `useUploadSubmit` | `UploadScreen` |
| `insertPostMentions.dal.js` | `createPost` | — | `useUploadSubmit` | `UploadScreen` |
| `postAuthRollback.dal.js` | `createPost` | — | `useUploadSubmit` | `UploadScreen` |
| `updatePostMediaAssetId.write.dal.js` | `recordPostMedia` | — | `useUploadSubmit` | `UploadScreen` |
| `findPostMentionsByPostIds.dal.js` | **diagnostics only** | — | — | `DevDiagnosticsScreen` |

### Cross-Feature Screen Consumers

Three DAL chains reach screens **outside** `features/post/`:

| Screen | Feature | DAL Chain |
|---|---|---|
| `NotiViewPostScreen.jsx` | `features/notifications/` | `post.read.dal` → `getPostById` → `usePostDetailPost` → `PostDetail.view.adapter.js` |
| `CommentModal.jsx` (profile photos) | `features/profiles/` | `comments.dal`, `commentLikes.dal`, `postComments.read.dal` → thread hooks → `useCommentThread.adapter.js` |
| `ActorProfilePhotosView.jsx` / photos tab | `features/profiles/` | `postReactions.read/write.dal`, `roseGifts.actor.dal` → `usePostReactionOps` → `post.adapter.js` → `usePhotoReactions.js` |
| Vport kind screens | `features/profiles/kinds/vport/` | `insertPost.dal` → `posts.adapter.js` → `createSystemPost` → vport publish controllers |

### Models Used in Production

| Model | DALs It Transforms | Caller Layer |
|---|---|---|
| `post.model.js` (`PostModel`) | `post.read.dal.js` (`fetchPostByIdDAL`) | `getPostById.controller.js` |
| `Comment.model.js` | `comments.dal.js`, `postComments.read.dal.js`, `commentLikes.dal.js` | `postComments.controller.js`, `commentReactions.hydrator.controller.js` |
| `uploadTypes.model.js` | `insertPost.dal.js`, `insertPostMedia.dal.js`, `insertPostMentions.dal.js` | `createPost.controller.js` |

### DALs With No Production Controller (Diagnostics Only)

| DAL | Classification |
|---|---|
| `feed.posts.dal.js` → `listFeedPosts` | DIAGNOSTICS ONLY — legacy feed read |
| `listActorPostsByActor.dal.js` → `listActorPostsByActorDAL` | DIAGNOSTICS ONLY — production hook not found |
| `findPostMentionsByPostIds.dal.js` → `findPostMentionsByPostIds` | DIAGNOSTICS ONLY |

---

# Avengers Assembly Report — 2026-05-11

## Run Summary

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | `/AvengersAssemble` — scoped DAL doc series |
| Application Scope | `apps/VCSM/` |
| Target Document | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md` |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Primary Commit Reviewed | `8baf6d5` — "add VPORT booking feed share and security flow updates" (2026-05-10) |

---

## ARCHITECT

**Status: DRIFT FOUND**

### New undocumented DAL files in `upload/dal/`

Two production DAL files exist in `apps/VCSM/src/features/upload/dal/` with no dedicated section in this document:

| File | Exports | Tables / RPC |
|---|---|---|
| `findActorsByHandles.dal.js` | `findActorsByHandles`, `filterValidActorIdsDAL` (added `8baf6d5`) | `public.profiles`, `vc.actors`, `vc.vports.profiles` (vportClient) |
| `searchMentionSuggestions.dal.js` | `searchMentionSuggestions` | `identity.search_actor_directory` (RPC) |

`findActorsByHandles` is referenced in the existing `insertPostMentions.dal.js` note but has no dedicated flow table or consumer map entry. `searchMentionSuggestions.dal.js` is entirely absent.

### New export on existing DAL file

`filterValidActorIdsDAL` was appended to `findActorsByHandles.dal.js` in commit `8baf6d5`. It queries `vc.actors.id` to server-side-validate actor IDs provided by the UI before mention insertion. Not in any section of this doc.

### Dual controller folder — naming inconsistency

`upload/` has two separate physical controller folders:
- `upload/controllers/` (plural) — contains `createPost.controller.js`
- `upload/controller/` (singular) — contains `searchMentionSuggestions.controller.js` and `recordPostMedia.controller.js`

The doc uses both folder names inconsistently. `updatePostMediaAssetId.write.dal.js`'s flow table at line 1267 correctly references `upload/controller/recordPostMedia.controller.js` (singular), but all other upload controller paths use plural. The physical split is real; two separate folders exist on disk.

### Undocumented second upload screen

`apps/VCSM/src/features/upload/screens/UploadScreenModern.jsx` exists and references the mention pipeline but is not listed anywhere in this document.

### New adapter cross-feature surface

`apps/VCSM/src/features/upload/adapters/posts.adapter.js` was added in `8baf6d5`. It exports `createSystemPost`, consumed by 8 controllers in `features/profiles/kinds/vport/controller/` (exchange, gas, locksmith ×3, barbershop ×2, menu). This is the correct adapter pattern for cross-feature access, but the adapter has no dedicated section in this doc — line 1330 shows it in the consumer map summary but attributes consumption to `insertPost.dal.js` rather than the adapter.

### New hooks not documented

`upload/hooks/useMentionAutocomplete.js` and `upload/hooks/useResolvedActor.js` are production hooks added as part of the mention pipeline. Neither appears in any hook section or flow diagram in this document.

---

## VENOM

**Status: DRIFT FOUND**

### Security improvement — client actor ID validation (undocumented)

`filterValidActorIdsDAL` was added to `createPost.controller.js` (line 121-124 post-patch). Previously, UI-provided `mentionedActorIdsFromUI` were inserted directly into `vc.post_mentions` without server-side validation. The new path calls `filterValidActorIdsDAL` to confirm each actor ID exists in `vc.actors` before insert. This closes a mention-injection surface where a client could fabricate arbitrary actor IDs. **This security improvement is undocumented.**

### Security improvement — block relationship filter on mention notifications (undocumented)

`createPost.controller.js` now imports `ctrlGetBlockedActorSet` from `@/features/block` (commit `8baf6d5`). Before sending mention notifications, it filters `resolvedMentionIds` against the author's block set, preventing mention-notification spam to blocked actors. **This security improvement is undocumented.**

### `posts.adapter.js` — identity check missing

`createSystemPost` in `posts.adapter.js` calls `supabase.auth.getUser()` to resolve `user.id` before delegating to `insertPost`, but performs no ownership assertion confirming that the calling actor ID belongs to the authenticated user. The `actorId` parameter is trusted directly from the caller. Eight vport controllers pass their own `actorId` — but the adapter itself performs no `actor_owners` verification. This is a trust-the-controller pattern; the risk level depends on whether each calling controller asserts ownership before calling the adapter. **Undocumented trust assumption.**

### `searchMentionSuggestions.dal.js` — unauthenticated RPC risk

`searchMentionSuggestions` passes `viewerActorId` (defaults to `null`) to `identity.search_actor_directory`. The RPC may execute with no viewer context when called from a context that does not supply `viewerActorId`. The hook `useMentionAutocomplete.js` should always supply the current actor, but this default creates a silent degraded-auth surface. **Undocumented.**

---

## LOGAN

**Status: DRIFT FOUND**

| Finding | Drift Type | Severity |
|---|---|---|
| `findActorsByHandles.dal.js` — no dedicated DAL section or consumer map row | DOC MISSING | MODERATE |
| `searchMentionSuggestions.dal.js` — entirely undocumented | DOC MISSING | MODERATE |
| `filterValidActorIdsDAL` export not in any section | DOC MISSING | MODERATE |
| `posts.adapter.js` — no dedicated adapter section; consumer map partially inaccurate | DOC MISSING | LOW |
| `UploadScreenModern.jsx` — not listed anywhere in this doc | DOC MISSING | LOW |
| `useMentionAutocomplete.js` and `useResolvedActor.js` — not in any hook section | DOC MISSING | LOW |
| `ctrlGetBlockedActorSet` import in `createPost.controller.js` — not in controller notes | DOC MISSING | LOW |
| Security changes from `8baf6d5` — no Change Log entry | NO CHANGELOG ENTRY | MODERATE |
| Consumer map row for `insertPost.dal.js` lists only `UploadScreen.jsx` — `UploadScreenModern.jsx` omitted | CONSUMER MAP INCOMPLETE | LOW |
| Controller folder name inconsistency (`controller/` vs `controllers/`) — partially documented | MINOR DRIFT | LOW |

### Pre-existing RISKs — verification status

| Risk | Status |
|---|---|
| RISK-1: `insertPostComment` dead in `postComments.read.dal.js` | **CONFIRMED STILL DEAD** — zero callers outside the DAL file |
| RISK-2: `listRoseGiftsByPostDAL` dead in `roseGifts.actor.dal.js` | **CONFIRMED STILL DEAD** — zero callers |
| RISK-3: DAL→DAL — `post.write.dal.js` calls `insertPostMentionsDAL` directly | **CONFIRMED STILL PRESENT** — not fixed; separate path from creation pipeline |
| RISK-4: `fetchPostsForActor.dal.js` misattributed to upload doc | **CONFIRMED** — file lives in `features/profiles/dal/post/`; consumed only by `getActorPosts.controller.js` in profiles |
| RISK-5: Schema corrections needed | PENDING — no update since original report |

---

## review-contract

**Status: VIOLATIONS FOUND**

### console calls without DEV gate — 3 instances in upload feature

| File | Line | Call | Gated? |
|---|---|---|---|
| `upload/hooks/useMentionAutocomplete.js` | 90 | `console.warn("[useMentionAutocomplete] search failed:", e)` | NO |
| `upload/lib/compressIfNeeded.js` | 11 | `console.warn("Compression failed, using original:", err)` | NO |
| `upload/controllers/createPost.controller.js` | 138 | `console.warn("[createPostController] mention insert failed:", e)` | NO |

`useUploadSubmit.js:74` is correctly DEV-gated (`import.meta.env?.DEV`). The other three fire in production.

### Dual controller folder — structural irregularity

`upload/controller/` (singular) and `upload/controllers/` (plural) both exist. VCSM convention uses plural folders for all controller groups. `recordPostMedia.controller.js` and `searchMentionSuggestions.controller.js` should live in `upload/controllers/` alongside `createPost.controller.js`. **Not a DAL violation, but an organizational inconsistency that makes imports ambiguous.**

### Cross-feature import review

`createPost.controller.js` imports `ctrlGetBlockedActorSet` from `@/features/block` — this goes through the block feature's `index.js` public surface, which is the correct adapter boundary pattern. **No violation.**

`posts.adapter.js` imports `insertPost` from `@/features/upload/dal/insertPost.dal` — adapter within the same feature calling its own DAL is correct. **No violation.**

---

## Session-Summary Structure

**Status: OK (with minor inventory drift)**

| Check | Result |
|---|---|
| `2026-03` month folder exists | ✓ — `2026-03_month_summary.md` present |
| `2026-04` month folder exists | ✓ — `2026-04_month_summary.md` present |
| `2026-05` month folder | Not yet created (month in progress) — expected |
| Session files at root of `session-summaries/` | None found — OK |
| Command count: `.claude/commands/` files | 23 files on disk (including `listofcomand.v2.md`) = **22 command files** |
| Command count: CLAUDE.md table | 17 commands listed |
| Commands on disk not in CLAUDE.md | `AvengersAssemble.md`, `WinterSoldier.md`, `Sentry.md`, `SHIELD.md`, `Cerebro.md` |

**CLAUDE.md command table is 5 commands out of date.** `AvengersAssemble`, `WinterSoldier`, `Sentry`, `SHIELD`, and `Cerebro` are active command files with no entry in the CLAUDE.md command inventory.

---

## Proposed Updates

No `.v2.md` files created this pass. All findings are additive drift (missing sections) — the existing content is accurate, it is simply incomplete. Updates should be made to the source doc directly once approved.

**Recommended additions to this doc:**

1. Add dedicated DAL section for `findActorsByHandles.dal.js` covering `findActorsByHandles` + `filterValidActorIdsDAL`
2. Add dedicated DAL section for `searchMentionSuggestions.dal.js` covering RPC surface + `viewerActorId` default behavior
3. Add adapter section for `upload/adapters/posts.adapter.js` — document `createSystemPost`, 8 vport controller consumers, trust model
4. Add `UploadScreenModern.jsx` to screen inventory
5. Add `useMentionAutocomplete.js` and `useResolvedActor.js` to hook sections
6. Add Change Log entry for `8baf6d5` covering: `filterValidActorIdsDAL`, block-filter on mention notifications, `posts.adapter.js` creation
7. Add security note to `createPost.controller.js` flow: mention validation + block-notification filter
8. Resolve controller folder naming: consolidate `upload/controller/` into `upload/controllers/`
9. Add DEV gate to 3 ungated `console.warn` calls in upload feature
10. Update CLAUDE.md command table to include `AvengersAssemble`, `WinterSoldier`, `Sentry`, `SHIELD`, `Cerebro`

---

## Overall Status

**DRIFT FOUND**

Pre-existing RISKs (1–5) remain open. New structural and security drift was introduced by commit `8baf6d5` — the mention validation pipeline and block-filter security improvements are real and correct, but entirely undocumented. No release blockers. All findings are documentation gaps or low-severity structural inconsistencies.

## Recommended Next Command

`/Logan` — update this doc with the 10 proposed additions above, then run `/review-contract` to verify the ungated console calls are resolved before next release.

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/upload/hooks/useMentionAutocomplete.js` | DEV-gated the mention autocomplete search failure warning. |
| `apps/VCSM/src/features/upload/lib/compressIfNeeded.js` | DEV-gated the image compression fallback warning. |
| `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` | DEV-gated the best-effort mention persistence warning in post edit. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| review-contract: ungated `console.warn` in `upload/hooks/useMentionAutocomplete.js` | DONE | Warning remains available in DEV only. |
| review-contract: ungated `console.warn` in `upload/lib/compressIfNeeded.js` | DONE | Compression fallback behavior unchanged; production warning suppressed. |
| review-contract: ungated `console.warn` in `upload/controllers/createPost.controller.js` | ALREADY FIXED | Current repo state already has this warning behind `import.meta.env.DEV`; no edit needed. |
| Additional post-scope warning in `post/postcard/dal/post.write.dal.js` | DONE | Best-effort mention persistence remains unchanged; warning is DEV-only. |
| RISK-1: `insertPostComment` dead export | DEFERRED | Verified zero production callers, but no deletion was performed because this pass is append-only/no-delete. |
| RISK-2: `listRoseGiftsByPostDAL` dead export | DEFERRED | Verified zero production callers, but no deletion was performed because this pass is append-only/no-delete. |
| RISK-3: DAL→DAL mention write from `post.write.dal.js` to `postMentions.write.dal.js` | DEFERRED | Verified still present. Moving orchestration would require controller contract review; not forced in this safe pass. |
| RISK-4: `fetchPostsForActor.dal.js` misattributed to post/upload scope | DEFERRED | Verified file belongs to `features/profiles/dal/post/` and is consumed by `features/profiles/controller/post/getActorPosts.controller.js`; profile doc should carry the correction. |
| Upload drift: `findActorsByHandles.dal.js`, `searchMentionSuggestions.dal.js`, `filterValidActorIdsDAL`, upload mention hooks, `UploadScreenModern.jsx`, and `posts.adapter.js` missing/incomplete in doc | DOCUMENTED CURRENT STATE | Verified current production and diagnostic callers. No source-code routing change was needed for this doc pass. |
| `searchMentionSuggestions.dal.js` default `viewerActorId = null` | DEFERRED | Verified default remains. Changing it could alter mention search behavior and needs product/security ownership. |
| `posts.adapter.js` trust-the-controller ownership model | DEFERRED | Verified `createSystemPost` adapter is used by vport publish controllers. Ownership assertion changes require controller-by-controller review. |
| Dual `upload/controller/` and `upload/controllers/` folders | DEFERRED | Folder consolidation would churn imports and was not needed for behavior-safe DAL remediation. |
| CLAUDE.md command table drift | OUT OF SCOPE | Not a DAL/app source fix for `vcsm.dal.post.md`. |

### Verification
- Commands/searches run:
  - `sed -n '1,280p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
  - `sed -n '281,700p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
  - `sed -n '701,1160p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
  - `sed -n '1161,1560p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
  - `rg -n "insertPostComment|listRoseGiftsByPostDAL|insertPostMentionsDAL|updatePostTextDAL|fetchPostsForActorDAL|fetchPostsForActor\\.dal|console\\." apps/VCSM/src/features/post apps/VCSM/src/features/profiles apps/VCSM/src/features/feed apps/VCSM/src/features/upload --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,180p' apps/VCSM/src/features/upload/controllers/createPost.controller.js`
  - `sed -n '1,130p' apps/VCSM/src/features/upload/hooks/useMentionAutocomplete.js`
  - `sed -n '1,80p' apps/VCSM/src/features/upload/lib/compressIfNeeded.js`
  - `sed -n '1,130p' apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`
  - `rg -n "console\\.warn\\(\\\"\\[useMentionAutocomplete\\]|console\\.warn\\(\\\"Compression failed|console\\.warn\\(\\\"\\[createPostController\\]|console\\.warn\\(\\\"\\[updatePostTextDAL\\]" apps/VCSM/src/features/upload apps/VCSM/src/features/post --glob '*.js' --glob '*.jsx'`
  - `rg -n "insertPostComment|listRoseGiftsByPostDAL|insertPostMentionsDAL|fetchPostsForActorDAL|findActorsByHandles|searchMentionSuggestions|filterValidActorIdsDAL|UploadScreenModern|useMentionAutocomplete|useResolvedActor|createSystemPost" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `npm run build`
- Production callers checked:
  - `insertPostComment`: no production callers found outside its DAL export.
  - `listRoseGiftsByPostDAL`: no production callers found outside its DAL export.
  - `insertPostMentionsDAL`: called by `post.write.dal.js`; DAL→DAL remains.
  - `fetchPostsForActorDAL`: consumed by profiles controller and compatibility re-export under profiles screen tab DAL.
  - `findActorsByHandles` / `filterValidActorIdsDAL`: consumed by upload create post controller; diagnostics group also imports `findActorsByHandles`.
  - `searchMentionSuggestions`: consumed by upload mention suggestion controller and diagnostics group.
  - `createSystemPost`: consumed by vport publish controllers through `features/upload/adapters/posts.adapter.js`.
- Remaining risks:
  - Dead exports were not removed under the no-delete instruction.
  - DAL→DAL mention orchestration remains pending architecture review.
  - Mention suggestion viewer context and system post ownership model remain deferred for security/product ownership.
  - Upload documentation inventory remains incomplete except for this appended current-state fix record.
  - Build passed; existing Vite chunk-size warnings and the pre-existing `VerifyEmailRequiredScreen.jsx` mixed static/dynamic import warning remain.

### Status
PARTIAL

---

# CEREBRO Analysis — 2026-05-19

_Triggered by:_ `/Cerebro` on `vcsm.dal.post.md`
_Date:_ 2026-05-19
_Analyst:_ CEREBRO canonical registry v2026-05-14 (22 commands)
_Prior state:_ Codex Fix Pass 2026-05-11 — Status: PARTIAL

---

## Risk Classification

All risks identified in this document were re-read, live-verified against source code, and classified below.

| Risk ID | Description | Category | Severity | Confirmed? | Status |
|---|---|---|---|---|---|
| RISK-1 | `insertPostComment` — dead export in `postComments.read.dal.js` | Dead Code | LOW | YES | OPEN |
| RISK-2 | `listRoseGiftsByPostDAL` — dead export in `roseGifts.actor.dal.js` | Dead Code | LOW | YES | OPEN |
| RISK-3 | DAL→DAL: `post.write.dal.js` calls `insertPostMentionsDAL` directly | Architecture Boundary | MEDIUM | YES | OPEN |
| RISK-4 | `fetchPostsForActor.dal.js` misattributed to post DAL — belongs to profiles | Documentation | MEDIUM | YES | OPEN |
| RISK-5 | All table entries missing schema prefixes | Documentation | LOW | CORRECTED | CLOSED |
| V-1 | `createSystemPost` adapter — no server-side `actor_owners` ownership verification | Security | MEDIUM | YES | OPEN |
| V-2 | `searchMentionSuggestions` — `viewerActorId` always null — RPC runs without viewer context | Security | MEDIUM | YES | OPEN |
| RC-1 | Ungated `console.warn` in 3 upload files | Contract | LOW | RESOLVED | CLOSED |
| RC-2 | Dual controller folders `upload/controller/` vs `upload/controllers/` | Structural | LOW | YES | OPEN |
| DF-01–DF-05 | Logan drift findings (2026-05-11) | Documentation | VARIOUS | CORRECTED (appended) | CLOSED |
| AA-10-ITEMS | 10 proposed doc additions from AvengersAssemble 2026-05-11 | Documentation | MODERATE | NOT APPLIED | OPEN |

---

## Command Order Decision

Based on CEREBRO canonical run order and risk classification above:

| Phase | Command | Reason |
|---|---|---|
| 1 | ARCHITECT | Verify current file inventory — dead code status, new DAL files, controller folder structure |
| 2 | VENOM | Open security findings: V-1 (`createSystemPost` trust model), V-2 (`viewerActorId` null) |
| 3 | SENTRY | Architecture boundary: RISK-3 DAL→DAL violation |
| 4 | IRONMAN | Dead export ownership decisions: RISK-1, RISK-2 |
| 5 | review-contract | Structural violations: RC-2 dual controller folder |
| 6 | LOGAN | Doc corrections: RISK-4 misattribution, 10 proposed additions |

Commands skipped (out of scope): Loki, Kraven, Carnage, Falcon, WinterSoldier, BlackWidow, SHIELD, AvengersAssemble, Thor — no runtime, performance, migration, native parity, or IP concerns raised.

---

## ARCHITECT Verification — 2026-05-19

_Method:_ Live grep + file read across `apps/VCSM/src/`
_Scope:_ All 22 DAL files in this document + upload feature additions

### Dead Code Confirmation

| Export | File | Live Status | Evidence |
|---|---|---|---|
| `insertPostComment` | `postComments.read.dal.js` | **CONFIRMED DEAD** | Zero import sites; only export declaration at line 40 |
| `listRoseGiftsByPostDAL` | `roseGifts.actor.dal.js` | **CONFIRMED DEAD** | Zero import sites; only export declaration at line 15 |

### DAL→DAL Confirmation

`post.write.dal.js` line 3:
```js
import { insertPostMentionsDAL } from "@/features/post/postcard/dal/postMentions.write.dal";
```
Called at line 65 via private helper `replacePostMentions`. **CONFIRMED STILL PRESENT.**

### Console.warn Gate Verification

All three previously flagged calls are now properly DEV-gated:
- `createPost.controller.js:138` — `if (import.meta.env.DEV)` ✅
- `compressIfNeeded.js:12` — `if (import.meta.env?.DEV)` ✅
- `useMentionAutocomplete.js:91` — `if (import.meta.env?.DEV)` ✅

Codex Fix Pass 2026-05-11 claim verified accurate.

### Controller Folder Structure (Confirmed)

| Folder | Files |
|---|---|
| `upload/controllers/` (plural) | `createPost.controller.js` |
| `upload/controller/` (singular) | `recordPostMedia.controller.js`, `searchMentionSuggestions.controller.js` |

Two folders exist with inconsistent naming. Convention requires plural.

### `searchMentionSuggestions.dal.js` — viewerActorId Confirmed Null

`ctrlSearchMentionSuggestions` in `upload/controller/searchMentionSuggestions.controller.js` does not pass `viewerActorId`:
```js
export async function ctrlSearchMentionSuggestions({ query, limit = 8 }) {
  if (!query) return [];
  return searchMentionSuggestions(query, { limit });  // viewerActorId omitted
}
```
RPC executes with `p_viewer_actor_id: null` on every mention autocomplete call.

### `createSystemPost` Ownership Chain (Confirmed)

- `posts.adapter.js` verifies `supabase.auth.getUser()` — authentication confirmed
- No `actor_owners` verification in the adapter
- All 8 vport publish controllers accept `actorId` as caller-supplied parameter, no ownership check
- Ownership check exists ONLY at hook layer (client-side string comparison: `me.actorId === targetActorId`)
- DB-level RLS on `vc.posts` INSERT policy not confirmed from source

**ARCHITECT Status: VERIFIED — all prior findings confirmed current**

---

## VENOM Summary — 2026-05-19

_Standalone file:_ `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md`

| Finding | Severity | Blocking? | Status |
|---|---|---|---|
| V-1: `createSystemPost` — no server-side actor ownership verification in adapter or vport controllers | MEDIUM | NO (pending RLS confirmation) | OPEN |
| V-2: `searchMentionSuggestions` — `viewerActorId` always null — RPC may skip block/privacy filtering for mention autocomplete | MEDIUM | NO | OPEN |

**V-1 action:** Confirm RLS INSERT policy on `vc.posts`; if insufficient, add ownership assertion in `createSystemPost` adapter. Eight vport publish controllers are in scope.

**V-2 action:** `ctrlSearchMentionSuggestions` should accept and forward `viewerActorId`; `useMentionAutocomplete.js` should supply it from `useIdentity()`.

---

## SENTRY Summary — 2026-05-19

_Standalone file:_ `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_post-dal-dal-boundary-2026-05-19.md`

| Finding | Severity | Blocking? | Status |
|---|---|---|---|
| S-1 (RISK-3): `post.write.dal.js` imports and calls `insertPostMentionsDAL` directly — DAL→DAL violation — coordination logic belongs in `editPost.controller.js` | MEDIUM | NO | OPEN |

**Note:** Owner gates (`.eq("actor_id", actorId)`) are correctly applied in both write paths. The violation is architectural, not a data safety issue. Correct fix: move `replacePostMentions` private helper into `editPost.controller.js`.

---

## IRONMAN Summary — 2026-05-19

_Standalone file:_ `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/ironman_post-dal-dead-exports-2026-05-19.md`

| Finding | Severity | Recommended Action | Status |
|---|---|---|---|
| I-1 (RISK-1): `insertPostComment` in `postComments.read.dal.js` — zero callers, duplicate of `createComment` | LOW | DELETE | PENDING WOLVERINE SCHEDULING |
| I-2 (RISK-2): `listRoseGiftsByPostDAL` in `roseGifts.actor.dal.js` — zero callers, read-side of unimplemented feature | LOW | DELETE | PENDING WOLVERINE SCHEDULING |

Both deletions are safe — no dynamic invocation patterns found. Both require no behavior change.

---

## review-contract Summary — 2026-05-19

_Standalone file:_ `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/review-contract_post-dal-2026-05-19.md`

| Finding | Status | Blocking? |
|---|---|---|
| RC-1: Ungated `console.warn` (3 instances) | RESOLVED — all DEV-gated | — |
| RC-2: Dual controller folders `upload/controller/` vs `upload/controllers/` | OPEN — structural only | NO |
| RC-3: CLAUDE.md command table drift (5 missing commands) | DEFERRED — out of scope | NO |

---

## LOGAN — Doc Corrections Required — 2026-05-19

The 10 proposed additions from AvengersAssemble 2026-05-11 remain unapplied. This document is **incomplete** for the following active production surfaces:

| Missing Section | What Needs Documenting |
|---|---|
| `findActorsByHandles.dal.js` | `findActorsByHandles` + `filterValidActorIdsDAL` — active, used by `createPost.controller.js` |
| `searchMentionSuggestions.dal.js` | RPC surface, `viewerActorId` default, full consumer chain |
| `filterValidActorIdsDAL` export | Security improvement from `8baf6d5` — not in any section |
| `posts.adapter.js` | `createSystemPost`, 8 vport controller consumers, trust model |
| `UploadScreenModern.jsx` | Second upload screen — not listed anywhere |
| `useMentionAutocomplete.js` + `useResolvedActor.js` | Production hooks added in `8baf6d5` — not in hook section |
| Security improvements (`8baf6d5`) | `filterValidActorIdsDAL` validation + block-filter on mention notifications — undocumented |
| Change Log entry for `8baf6d5` | No entry exists |

**LOGAN action required:** Dedicated doc update pass applying all 8 missing sections above.

---

## Final Command Status Table

| Command | Status | Findings | Standalone File |
|---|---|---|---|
| ARCHITECT | COMPLETE | Dead code confirmed, DAL→DAL confirmed, console gates verified, controller folder confirmed, viewerActorId null confirmed | (inline) |
| VENOM | COMPLETE | V-1 (trust model MEDIUM), V-2 (null viewer MEDIUM) | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` |
| SENTRY | COMPLETE | S-1 = RISK-3 DAL→DAL MEDIUM OPEN | `CURRENT/features/dashboard/evidence/sentry_post-dal-dal-boundary-2026-05-19.md` |
| IRONMAN | COMPLETE | I-1 = RISK-1 DELETE, I-2 = RISK-2 DELETE, both pending scheduling | `_CANONICAL/logan/marvel/ironman/ironman_post-dal-dead-exports-2026-05-19.md` |
| review-contract | COMPLETE | RC-1 RESOLVED, RC-2 OPEN structural | `CURRENT/features/dashboard/evidence/review-contract_post-dal-2026-05-19.md` |
| LOGAN | COMPLETE | DF-06 through DF-13 applied — all 8 sections verified | (inline — Logan Doc Update 2026-05-19) |

---

## Open Risks

| Risk | Severity | Owner |
|---|---|---|
| RISK-1: `insertPostComment` dead export | LOW | IRONMAN → WOLVERINE |
| RISK-2: `listRoseGiftsByPostDAL` dead export | LOW | IRONMAN → WOLVERINE |
| RISK-3 / S-1: DAL→DAL in `post.write.dal.js` | MEDIUM | SENTRY → WOLVERINE |
| RISK-4: `fetchPostsForActor.dal.js` in profiles doc | MEDIUM | LOGAN (separate profiles DAL pass) |
| V-1: `createSystemPost` no ownership assertion | **HIGH** (reclassified — DB INSERT has no actor ownership check) | CARNAGE (migration) → WOLVERINE |
| V-2: `searchMentionSuggestions` null viewerActorId | MEDIUM | WOLVERINE |
| RC-2: Dual controller folders | LOW | WOLVERINE |
| AA-10-ITEMS doc additions | CLOSED | LOGAN 2026-05-19 — all 8 sections applied |

---

## Fixed Risks

| Risk | Fixed | How |
|---|---|---|
| RISK-5: Schema prefixes missing | 2026-05-11 ARCHITECT | Corrected in schema table (appended) |
| DF-01–DF-05: Logan drift findings | 2026-05-11 LOGAN | Documented in LOGAN findings section |
| RC-1: Ungated console.warn (3 instances) | 2026-05-11 Codex Fix Pass | DEV gate applied; verified 2026-05-19 |

---

## Required Next Command

**`/Logan`** — Apply the 8 missing documentation sections identified by AvengersAssemble 2026-05-11 and confirmed still-missing in CEREBRO 2026-05-19. This is the only governance gap that makes this document structurally incomplete.

After LOGAN completes: **`/DB`** — Confirm RLS INSERT policy on `vc.posts` to resolve V-1 risk level (MEDIUM vs LOW).

After DB confirms: **`/Wolverine`** — Schedule RISK-1, RISK-2 dead export deletions and RC-2 controller folder consolidation.

---

## Document Status

**REVIEW_PENDING**

Pre-existing open risks (RISK-1, RISK-2, RISK-3, RISK-4) remain unresolved. Two new security findings (V-1, V-2) confirmed and documented. One structural violation (RC-2) open. Eight documentation sections missing. Document is a complete governance record of all findings but is not VERIFIED until LOGAN doc update and DB RLS confirmation are complete.

---

# LOGAN Doc Update — 2026-05-19

**Task:** Apply 8 missing documentation sections identified by AvengersAssemble 2026-05-11, confirmed by CEREBRO 2026-05-19.
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Code inspected:** Live source reads — all sections below are LIVE VERIFIED

---

## LOGAN REVIEW REPORT

**Task:** Apply 8 undocumented production surfaces from commit `8baf6d5` to `vcsm.dal.post.md`
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** Enforced — no cross-root changes
**Architecture Contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`

### DOCUMENTATION SCOPE GATE

| Documentation Area | In Scope | Update Allowed | Reason |
|---|---|---|---|
| `vcsm.dal.post.md` | YES | YES | Target doc — upload/post DAL surfaces |
| `vcsm.dal.profiles.md` | YES (RISK-4 only) | DEFERRED | Requires separate LOGAN pass on profiles DAL |
| `apps/VCSM/` source code | READ ONLY | NO | LOGAN never modifies source |

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-06**
Finding ID: DF-06 | Severity: MODERATE | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `findActorsByHandles.dal.js`
Original: No dedicated DAL section. `filterValidActorIdsDAL` export not mentioned anywhere.
Reality: File is active in production — called by `createPost.controller.js:9`. Both exports (`findActorsByHandles`, `filterValidActorIdsDAL`) are part of the mention security pipeline added in commit `8baf6d5`.

**LOGAN DRIFT FINDING — DF-07**
Finding ID: DF-07 | Severity: MODERATE | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `searchMentionSuggestions.dal.js`
Original: Entirely absent from documentation.
Reality: Active production DAL — RPC call to `identity.search_actor_directory`. V-2 security finding (null `viewerActorId`) documented via VENOM 2026-05-19 but no DAL section existed.

**LOGAN DRIFT FINDING — DF-08**
Finding ID: DF-08 | Severity: LOW | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `posts.adapter.js`
Original: Mentioned only in consumer map summary (line 1330) — no dedicated section. Incorrectly attributed to `insertPost.dal.js` rather than the adapter pattern.
Reality: `createSystemPost` is a cross-feature adapter consumed by 8 vport publish controllers. Correct adapter pattern per architecture contract.

**LOGAN DRIFT FINDING — DF-09**
Finding ID: DF-09 | Severity: LOW | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `UploadScreenModern.jsx`
Original: Entirely absent from screen inventory.
Reality: Production screen at `upload/screens/UploadScreenModern.jsx` — implements modern upload UI with resolved mention pipeline (`mentionsResolved` shape).

**LOGAN DRIFT FINDING — DF-10**
Finding ID: DF-10 | Severity: LOW | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `useMentionAutocomplete.js` + `useResolvedActor.js`
Original: Neither hook appears in any hook section.
Reality: Both are production hooks added in `8baf6d5`. `useMentionAutocomplete` drives the typeahead UI; `useResolvedActor` provides the identity surface for the upload flow.

**LOGAN DRIFT FINDING — DF-11**
Finding ID: DF-11 | Severity: MODERATE | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → `createPost.controller.js` security improvements
Original: No note about mention validation or block-filter in any section.
Reality: Two security improvements added in `8baf6d5` — `filterValidActorIdsDAL` server-validates client actor IDs, `ctrlGetBlockedActorSet` filters mention notification recipients.

**LOGAN DRIFT FINDING — DF-12**
Finding ID: DF-12 | Severity: MODERATE | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → No Change Log entry for `8baf6d5`
Original: Change log ends at 2026-05-11 Codex Fix Pass.
Reality: Commit `8baf6d5` ("add VPORT booking feed share and security flow updates") introduced 5+ DAL/adapter/hook changes to the upload pipeline, none of which have a change log entry in this doc.

**LOGAN DRIFT FINDING — DF-13**
Finding ID: DF-13 | Severity: LOW | Status: CORRECTED (appended below)
Doc: `vcsm.dal.post.md` → dual controller folder not noted in doc
Original: Doc uses `upload/controllers/` for all paths without noting the singular folder split.
Reality: `upload/controller/` (singular) holds `recordPostMedia.controller.js` and `searchMentionSuggestions.controller.js`; `upload/controllers/` (plural) holds `createPost.controller.js`. RC-2 open finding from review-contract 2026-05-19.

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | (inline CEREBRO 2026-05-19 section) | Dead code, DAL inventory, schema corrections | PRESENT |
| VENOM | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` | V-1 ownership, V-2 null viewer | PRESENT |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_post-dal-dal-boundary-2026-05-19.md` | RISK-3 DAL→DAL | PRESENT |
| IRONMAN | `_CANONICAL/logan/marvel/ironman/ironman_post-dal-dead-exports-2026-05-19.md` | RISK-1, RISK-2 deletion decisions | PRESENT |
| review-contract | `CURRENT/features/dashboard/evidence/review-contract_post-dal-2026-05-19.md` | Console gate status, dual folder | PRESENT |
| FALCON | — | Not required — no native parity concern specific to upload DAL changes | N/A |
| CARNAGE | — | No migrations in scope | N/A |
| THOR | — | No release gate pending on this doc update | N/A |

---

## Missing Section 1 — `findActorsByHandles.dal.js`

_Added by Logan 2026-05-19 — was absent from initial ARCHITECT scan_

**Path:** `features/upload/dal/findActorsByHandles.dal.js`
**Operations:** `read`
**Commit added:** `8baf6d5`

**Exported functions:**

| Function | Tables Accessed | Role |
|---|---|---|
| `findActorsByHandles(handles)` | `public.profiles`, `vc.actors`, `vc.vports.profiles` (vportClient) | Resolves @handle strings → `[{ actor_id, handle, kind }]` for both users and vports |
| `filterValidActorIdsDAL(actorIds)` | `vc.actors` | Server-validates client-provided actor UUIDs — returns only IDs that exist in `vc.actors` |

**Multi-table resolution strategy (findActorsByHandles):**

```
1. public.profiles.select(id, username).in("username", handles)
   → resolves user handles to profile IDs
2. vc.actors.select(id, profile_id, kind).in("profile_id", profileIds)
   → resolves profile IDs to actor IDs (user kind)
3. vc.vports.profiles.select(actor_id, slug).in("slug", handles) [vportClient schema]
   → resolves vport slugs directly to actor IDs (vport kind)
4. Stitches results → [{ actor_id, handle, kind }]
```

**Direct caller:**

- `upload/controllers/createPost.controller.js` (line 9) — mention resolution fallback path

**Security role of `filterValidActorIdsDAL`:**

Introduced in `8baf6d5` to close the mention-injection surface. Before this function, `mentionedActorIdsFromUI` (actor IDs provided by the UI/`UploadScreenModern`) were inserted directly into `vc.post_mentions` without server-side validation. `filterValidActorIdsDAL` confirms each ID exists in `vc.actors` before insertion — a fabricated UUID that does not correspond to a real actor will be dropped.

**Full call chain:**

```
findActorsByHandles.dal.js
 → createPost.controller.js (fallback path — handles from caption "@" parsing)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
     → UploadScreenModern.jsx [final screen]

filterValidActorIdsDAL
 → createPost.controller.js (primary path — validates UI-resolved actor IDs)
   → useUploadSubmit.js
     → UploadScreen.jsx [final screen]
     → UploadScreenModern.jsx [final screen]
```

---

## Missing Section 2 — `searchMentionSuggestions.dal.js`

_Added by Logan 2026-05-19 — was entirely absent from documentation_

**Path:** `features/upload/dal/searchMentionSuggestions.dal.js`
**Operations:** `rpc`
**Commit added:** `8baf6d5`

**Exported functions:**

| Function | RPC | Role |
|---|---|---|
| `searchMentionSuggestions(prefix, { limit, viewerActorId })` | `identity.search_actor_directory` | Prefix-based actor search — returns `[{ actor_id, kind, handle, display_name, photo_url }]` |

**RPC call:**

```
supabase.schema('identity').rpc('search_actor_directory', {
  p_viewer_domain: 'vc',
  p_viewer_actor_id: viewerActorId,   ← ALWAYS NULL in current production (V-2)
  p_query: needle,
  p_filter: 'all',
  p_limit: limit,
  p_offset: 0,
})
```

**Security note — V-2:**

`viewerActorId` defaults to `null`. The controller wrapper `ctrlSearchMentionSuggestions` (in `upload/controller/searchMentionSuggestions.controller.js`) does not supply this parameter. As a result the RPC always receives `p_viewer_actor_id: null` — viewer context (including block/privacy filtering) may be skipped. See VENOM report: `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md`.

**Full call chain:**

```
searchMentionSuggestions.dal.js
 → ctrlSearchMentionSuggestions (upload/controller/searchMentionSuggestions.controller.js)
   → useMentionAutocomplete.js
     → UploadScreenModern.jsx [primary screen consumer]
     → UploadScreen.jsx [if wired — verify]
```

---

## Missing Section 3 — `posts.adapter.js`

_Added by Logan 2026-05-19 — was partially listed in consumer map but had no dedicated section_

**Path:** `features/upload/adapters/posts.adapter.js`
**Type:** Cross-feature adapter (correct pattern — same feature's DAL access)
**Commit added:** `8baf6d5`

**Exported functions:**

| Function | Tables (indirect) | Role |
|---|---|---|
| `createSystemPost({ actorId, text, post_type, realm_id, location_text, media_url })` | `vc.posts` (via `insertPost`) | Creates a system-authored post on behalf of a vport actor |

**Trust model:**

```js
createSystemPost:
  1. supabase.auth.getUser() → confirms authentication (user.id present)
  2. actorId accepted from caller — NOT verified against actor_owners
  3. delegates to insertPost({ actor_id: actorId, user_id: user.id, ... })
```

The adapter trusts its callers (vport publish controllers) to supply the correct `actorId`. Client-side ownership checks exist in the hook layer only (string comparison: `me.actorId === targetActorId`). No `actor_owners` DB assertion. See V-1 in VENOM report.

**Consumers — 8 vport publish controllers:**

| Controller | File | VPORT Kind |
|---|---|---|
| `publishFuelPriceUpdateAsPostController` | `vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` | Gas |
| `publishMenuUpdateAsPost` | `vport/controller/menu/publishMenuUpdateAsPost.controller.js` | Menu |
| `publishBarbershopPortfolioUpdateAsPost` | `vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js` | Barbershop |
| `publishBarbershopHoursUpdateAsPost` | `vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js` | Barbershop |
| `publishLocksmithHoursUpdateAsPost` | `vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js` | Locksmith |
| `publishLocksmithPortfolioUpdateAsPost` | `vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js` | Locksmith |
| `publishLocksmithServiceAreaUpdateAsPost` | `vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js` | Locksmith |
| `publishExchangeRateUpdateAsPost` | `vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` | Exchange |

**Full call chain:**

```
posts.adapter.js (createSystemPost)
 → insertPost.dal.js (vc.posts insert)
   ← publishFuelPriceUpdateAsPostController
   ← publishMenuUpdateAsPost
   ← publishBarbershopPortfolioUpdateAsPost
   ← publishBarbershopHoursUpdateAsPost
   ← publishLocksmithHoursUpdateAsPost
   ← publishLocksmithPortfolioUpdateAsPost
   ← publishLocksmithServiceAreaUpdateAsPost
   ← publishExchangeRateUpdateAsPost
     [each reaches its vport kind screen via its own hook → view → screen chain]
```

---

## Missing Section 4 — `UploadScreenModern.jsx`

_Added by Logan 2026-05-19 — was entirely absent from screen inventory_

**Path:** `features/upload/screens/UploadScreenModern.jsx`
**Type:** Final Screen — alternate upload compose UI
**Commit added:** `8baf6d5`

**Role:**

Second upload screen alongside `UploadScreen.jsx`. Implements the modern compose UI with:
- New resolved mentions pipeline — `mentionsResolved` shape (`[{ handle, actorId, kind, displayName, avatarUrl }]`) — bypasses handle-parsing fallback
- `useMentionAutocomplete` hook integration (caret-based typeahead)
- `extractMentions` (caption parsing — UI-only)
- `useMediaSelection` for multi-photo (VIBES, max 10)
- `removeMention(handle)` — removes `@handle` token from caption and keeps `mentionsResolved` in sync

**Submit payload:**

```js
onSubmit({
  caption,
  visibility,
  mode,
  files, mediaTypes,
  locationText,
  mentions,           // string[] of @handles (from caption parse)
  mentionsResolved,   // [{ handle, actorId, kind, ... }] (from typeahead picks)
})
```

`mentionsResolved` is consumed by `createPostController` as the primary mention source — `filterValidActorIdsDAL` validates these IDs server-side before insert.

**Consumer chain:**

```
UploadScreenModern.jsx
 → useMediaSelection (media state)
 → useMentionAutocomplete (typeahead)
   → ctrlSearchMentionSuggestions
     → searchMentionSuggestions.dal.js
 → onSubmit → createPostController
   → filterValidActorIdsDAL (validation)
   → insertPost.dal.js
   → insertPostMedia.dal.js
   → insertPostMentions.dal.js
```

---

## Missing Section 5 — Upload Hooks: `useMentionAutocomplete.js` + `useResolvedActor.js`

_Added by Logan 2026-05-19 — both hooks were absent from all hook sections_

### `useMentionAutocomplete.js`

**Path:** `features/upload/hooks/useMentionAutocomplete.js`
**Role:** Caret-tracking mention typeahead hook — drives the autocomplete dropdown in the caption composer.

**Input:**

```js
useMentionAutocomplete({ value: string, inputRef: React.Ref })
```

**Output:**

```js
{
  open: boolean,           // whether autocomplete is visible
  query: string,           // current @prefix being typed
  items: ActorResult[],    // suggestion list from RPC
  loading: boolean,
  onCaretEvent: fn,        // call on keyup/click to refresh caret detection
  apply: fn(picked),       // replaces @typed with @handle in text; returns next string
  close: fn,               // closes dropdown
}
```

**Behavior:**
- Detects active mention token by scanning text left of caret for `@prefix` pattern
- Requires `@` at start or after whitespace; stops at whitespace or invalid handle chars
- Fires `ctrlSearchMentionSuggestions` with 120ms debounce
- `apply(picked)` injects `@handle ` at caret position and moves focus after insertion
- Request ID ref prevents stale responses from racing network calls

**Call chain:**

```
useMentionAutocomplete.js
 → ctrlSearchMentionSuggestions (upload/controller/searchMentionSuggestions.controller.js)
   → searchMentionSuggestions.dal.js (identity.search_actor_directory RPC)
     ← UploadScreenModern.jsx
```

---

### `useResolvedActor.js`

**Path:** `features/upload/hooks/useResolvedActor.js`
**Role:** Thin identity adapter for the upload flow — extracts actor surface from `useIdentity()`.

**Output:**

```js
{
  ready: boolean,    // false if no identity loaded
  actorId: string,   // current actor's ID
  isVoid: boolean,   // whether actor is in void realm
}
```

**Note:** Does not expose `profileId` or `vportId` — actor-only surface compliant with identity contract.

**Call chain:**

```
useResolvedActor.js
 → useIdentity() (identity context)
   ← upload screen hooks / UploadScreenModern
```

---

## Missing Section 6 — `createPost.controller.js` Security Improvements (commit `8baf6d5`)

_Added by Logan 2026-05-19 — security improvements were undocumented_

`createPost.controller.js` received two security improvements in commit `8baf6d5`. Neither was documented in any section of this file.

### Improvement A — Server-Side Actor ID Validation

**Lines:** 121–134

Before `8baf6d5`, UI-provided `mentionedActorIdsFromUI` were inserted directly into `vc.post_mentions` without server-side validation. A client could supply fabricated or borrowed actor UUIDs and create mention edges for actors that don't exist or that the post author has no relationship with.

After `8baf6d5`:

```js
if (mentionedActorIdsFromUI.length > 0) {
  const validatedIds = await filterValidActorIdsDAL(mentionedActorIdsFromUI);
  await insertPostMentions(postId, validatedIds);
  resolvedMentionIds = validatedIds;
}
```

`filterValidActorIdsDAL` queries `vc.actors` and returns only IDs that exist. Any fabricated or invalid UUID is silently dropped before insert. This closes the mention-injection surface.

### Improvement B — Block-Filtered Mention Notifications

**Lines:** 143–155

Before `8baf6d5`, mention notifications were dispatched to all resolved mention IDs, including actors who had blocked or been blocked by the post author.

After `8baf6d5`:

```js
const blockedSet = await ctrlGetBlockedActorSet({
  actorId: identity.actorId,
  candidateActorIds: resolvedMentionIds,
});
const notifiableIds = resolvedMentionIds.filter((id) => !blockedSet.has(id));
```

`ctrlGetBlockedActorSet` (from `@/features/block` public index) returns the full block graph intersection between the author and the candidate list. Only `notifiableIds` receive the `social.post.mention` notification. This prevents notification spam to blocked actors.

**Import used:** `import { ctrlGetBlockedActorSet } from "@/features/block"` — correct public-index adapter access pattern. No violation.

---

## Missing Section 7 — Controller Folder Naming Note

_Added by Logan 2026-05-19 — structural inconsistency not documented_

The `upload` feature has two separate physical controller folders:

| Folder | Files | Note |
|---|---|---|
| `features/upload/controllers/` (plural) | `createPost.controller.js` | Convention-correct location |
| `features/upload/controller/` (singular) | `recordPostMedia.controller.js`, `searchMentionSuggestions.controller.js` | Non-standard — singular should not exist |

VCSM convention uses plural for all controller groups. The singular `upload/controller/` folder violates this convention. All three controllers should live in `upload/controllers/`. RC-2 is the open finding tracking this.

When adding imports for `recordPostMedia.controller` or `searchMentionSuggestions.controller`, use their current (singular) paths until RC-2 is resolved. Do not add new controllers to the singular folder.

---

## Change Log Entry — `8baf6d5` (2026-05-10)

_Added by Logan 2026-05-19 — this commit had no Change Log entry in this document_

### 2026-05-10 (commit `8baf6d5`)

**Task:** VPORT booking feed share and security flow updates — mention pipeline and security hardening
**Application Scope:** VCSM
**Prompt Registry Entry:** `zNOTFORPRODUCTION/_ACTIVE/planning/may/10/` (session)
**Code Status Before:** `createPost.controller.js` inserted UI-provided actor IDs without server validation; mention notifications dispatched without block filtering; no mention autocomplete; `UploadScreen.jsx` only.
**Code Status After:**
- `findActorsByHandles.dal.js` — added `filterValidActorIdsDAL` export; server-validates client actor IDs before mention insert
- `searchMentionSuggestions.dal.js` — new; RPC-based actor prefix search
- `posts.adapter.js` — new; `createSystemPost` cross-feature adapter for vport system posts
- `upload/adapters/posts.adapter.js` — wired to 8 vport publish controllers (gas, menu, barbershop×2, locksmith×3, exchange)
- `useMentionAutocomplete.js` — new; caret-tracking typeahead hook
- `useResolvedActor.js` — new; thin identity adapter for upload flow
- `UploadScreenModern.jsx` — new; alternate upload UI with resolved mention pipeline
- `createPost.controller.js` — security hardening: `filterValidActorIdsDAL` + `ctrlGetBlockedActorSet` block filter on mention notifications
- `upload/controller/searchMentionSuggestions.controller.js` — new (singular folder — RC-2)
**Files Changed (documentation impact):**
- This document: 8 missing sections now applied (DF-06 through DF-13)
**Security / Runtime / DB Notes:** V-1 (createSystemPost ownership), V-2 (null viewerActorId) remain open — see VENOM report 2026-05-19
**Validation:** All 8 sections verified against live source code reads
**Documentation Truth Status:** PARTIAL → VERIFIED (for upload surfaces; profiles doc correction for RISK-4 still pending)

---

## LOGAN Final Status — 2026-05-19

### FINAL LOGAN STATUS: MAJOR DRIFT → ADDRESSED

All 8 missing sections (DF-06 through DF-13) have been applied to this document.

### Updated Documentation Truth Status

| Surface | Before | After |
|---|---|---|
| `findActorsByHandles.dal.js` / `filterValidActorIdsDAL` | MISSING | VERIFIED |
| `searchMentionSuggestions.dal.js` | MISSING | VERIFIED |
| `posts.adapter.js` | PARTIAL | VERIFIED |
| `UploadScreenModern.jsx` | MISSING | VERIFIED |
| `useMentionAutocomplete.js` | MISSING | VERIFIED |
| `useResolvedActor.js` | MISSING | VERIFIED |
| Security improvements (`8baf6d5`) | MISSING | VERIFIED |
| Change Log for `8baf6d5` | MISSING | VERIFIED |
| Controller folder naming | UNDOCUMENTED | DOCUMENTED |

### Remaining Open Items (not LOGAN scope)

| Item | Reason Deferred |
|---|---|
| RISK-4: `fetchPostsForActor` entry still in this doc | Requires edit on profiles doc — separate LOGAN pass |
| V-1: `createSystemPost` ownership assertion | Requires code change — WOLVERINE + DB |
| V-2: `searchMentionSuggestions` null viewerActorId | Requires code change — WOLVERINE |
| RC-2: Dual controller folder consolidation | Requires code/folder change — WOLVERINE |
| RISK-1, RISK-2: Dead export deletion | Requires code change — WOLVERINE |
| RISK-3: DAL→DAL refactor | Requires code change — WOLVERINE |

### Native Parity Notes

**Native Relevance:** YES — post creation, mention pipeline, and feed share flows are user-facing features that a native app must support.
**Falcon Review:** OPTIONAL — upload/mention pipeline is currently web-only; `UploadScreenModern.jsx` is a PWA screen. If native implements post creation, Falcon review of the `createPostController` + mention pipeline is required.
**Native Transfer Status:** NOT STARTED for upload/mention pipeline
**Known Native Gaps:** `useMentionAutocomplete` (caret-based DOM interaction — needs native equivalent), `UploadScreenModern` (DOM-specific media selection)

### Updated Document Status

**VERIFIED** (for all upload/post DAL surfaces documented here)
**PENDING** on: RISK-4 profiles doc correction, open security findings (V-1, V-2), open code risks (RISK-1, RISK-2, RISK-3, RC-2)

**DB complete (2026-05-19):** V-1 reclassified to HIGH. `vc.posts` INSERT policy does NOT enforce actor ownership — any authenticated user can post as any actor_id. See DB snapshot: `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md`

**Required next command:** `/Carnage` — migrate `posts_insert_actor_owner` policy to enforce `actor_id ∈ actor_owners` WITH CHECK. This is the highest-priority open item.
After Carnage: `/Wolverine` — schedule dead export deletions (RISK-1, RISK-2), DAL→DAL refactor (RISK-3), controller folder consolidation (RC-2), viewerActorId fix (V-2).
