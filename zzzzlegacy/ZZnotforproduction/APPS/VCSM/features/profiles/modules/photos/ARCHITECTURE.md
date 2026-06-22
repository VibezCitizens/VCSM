---
title: Photos Module — Architecture
status: STUB
feature: profiles
module: photos
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / photos — ARCHITECTURE

## Read Path

```
[profile screen photos tab]
  └── photoReactions.controller → listPostReactions.dal + listPostRoseCount.dal + listPostCommentsCount.dal
        └── vc.post_reactions / vc.rose_gifts / vc.post_comments SELECT
              └── filter: post_ids from actor's posts
```

## TODO

- [ ] Confirm photo grid visibility filter (public posts only vs all actor posts)
