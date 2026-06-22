---
title: Social Module — Architecture
status: STUB
feature: profiles
module: social
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / social — ARCHITECTURE

## Posts Read Path

```
getActorPosts.controller → fetchPostsForActor.dal + readActorPosts.dal
  └── vc.posts SELECT WHERE actor_id = targetActorId
        └── RLS + visibility filter (UNVERIFIED)
```

## Tags Read Path

```
getActorVibeTags.controller → readActorVibeTags.dal
  └── vc.vibe_actor_tags SELECT WHERE actor_id = targetActorId
```

## Follow State Read

```
readFollowState.dal → vc.actor_followers SELECT
```

## TODO

- [ ] Confirm vc.posts RLS for public profile reads
