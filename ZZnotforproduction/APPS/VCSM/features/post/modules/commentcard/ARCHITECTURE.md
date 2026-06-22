---
title: Commentcard Module — Architecture
status: STUB
feature: post
module: commentcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / commentcard — ARCHITECTURE

## Comment Read Path

```
CommentList → useCommentThread → postComments.controller
  └── postComments.read.dal → vc.post_comments SELECT
        └── commentReactions.hydrator.controller — hydrates reaction counts
```

## Comment Create Path

```
CommentComposeModal → postComments.controller → createRootComment
  ├── actorId null-check at controller (no session verify) ← BW-POST-008
  └── comments.dal → vc.post_comments INSERT
        └── No content length limit ← VEN-POST-006
```

## Comment Like Path

```
CommentActions → toggleCommentLike(actorId, commentId)
  ├── NO self-like guard ← BW-POST-006 BYPASSED
  └── commentLikes.dal → vc.comment_likes INSERT/DELETE
        └── actor_id = caller-supplied ← BW-POST-007
```

## Orphaned INSERT

```
postComments.read.dal.js → insertPostComment (EXPORTED)
  └── No owning controller — potential comment spoofing vector ← VEN-POST-001
```

## Count Path

```
usePostCommentCount → postComments.count.controller → postComments.count.dal
  └── SELECT count(vc.post_comments)
```

## TODO

- [ ] Confirm vc.comment_likes RLS (INSERT by actor_id)
- [ ] Confirm insertPostComment has no active callers
