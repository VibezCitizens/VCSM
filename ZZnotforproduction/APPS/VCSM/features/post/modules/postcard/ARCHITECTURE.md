---
title: Postcard Module — Architecture
status: STUB
feature: post
module: postcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / postcard — ARCHITECTURE

## Reaction Toggle Path

```
ReactionBar → BinaryReactionButton → usePostReactionOps
  └── togglePostReactionController(actorId from hook, postId)
        ├── NO self-reaction guard ← VEN-POST-003 / BW-POST-004 BYPASSED
        └── insertReactionDAL / deleteReactionDAL → vc.post_reactions
              └── actor_id = caller-supplied ← BW-POST-007 (RLS unverified)
```

## Rose Send Path

```
RoseReactionButton → sendRoseController(actorId, postId, qty)
  ├── NO self-gifting guard ← BW-POST-005 BYPASSED
  ├── NO qty upper bound ← VEN-POST-004
  └── roseGifts.actor.dal → INSERT vc.rose_gifts
```

## Edit Post Path

```
useEditPost → editPostController
  ├── NO deleted_at pre-check ← BW-POST-009
  ├── post.write.dal → UPDATE vc.posts
  └── replacePostMentions → DELETE then INSERT vc.post_mentions
        └── DELETE has no ownership check at delete boundary ← VEN-POST-002 / BW-POST-001
              └── race window: delete fires even if UPDATE fails
```

## Notification linkPath

```
[post notifications] → linkPath: '/post/' + postId
                                              ↑ raw UUID ← BW-POST-010 BYPASSED
```

## Hook Structural Weakness

```
useEditPost / useDeletePostAction / usePostReactionOps
  └── actorId received as caller parameter
        └── no session cross-check inside hook ← BW-POST-002 / BW-POST-003 PARTIAL
              └── DAL RLS is sole ownership guard (RLS status unverified)
```

## TODO

- [ ] Confirm vc.post_reactions INSERT RLS policy (BW-POST-007 UNRESOLVED)
- [ ] Trace postModules/ integration (barbershopHours + others — count UNVERIFIED)
