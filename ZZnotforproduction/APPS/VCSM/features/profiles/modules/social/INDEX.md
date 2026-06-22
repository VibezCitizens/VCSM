---
title: Social Module — Index
status: STUB
feature: profiles
module: social
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / social

Posts on profile, vibe tags, follow state reads. Read surface for the social layer of a profile.

## Source Files

| File | Layer |
|---|---|
| controller/post/getActorPosts.controller.js | controller |
| controller/tags/getActorVibeTags.controller.js | controller |
| dal/post/fetchPostsForActor.dal.js | read DAL |
| dal/readActorPosts.dal.js | read DAL |
| dal/readFollowState.dal.js | read DAL |
| dal/readPostMediaByPostIds.dal.js | read DAL |
| dal/readPostReactions.dal.js | read DAL |
| dal/readPostRoseCounts.dal.js | read DAL |
| dal/tags/readActorVibeTags.dal.js | read DAL |
| adapters/tags/tagsData.adapter.js | adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No THOR blockers. Read-only surface.
