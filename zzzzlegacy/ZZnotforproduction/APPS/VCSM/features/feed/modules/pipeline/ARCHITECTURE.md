---
title: Pipeline Module — Architecture
status: STUB
feature: feed
module: pipeline
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/feed/pipeline/ + dal/ + model/
---

# feed / modules / pipeline — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04 report. Verification required at module level.

## Layer Stack (unverified)

### Pipeline Execution
```
fetchFeedPage.pipeline.js
  ├── [parallel] feed.read.posts.dal.js → vc.posts (cursor paginated)
  ├── [parallel] feed.read.actorsBundle.dal.js → actor profiles + vport bundle
  ├── [parallel] feed.read.blockRows.dal.js → viewer block relationships
  ├── [parallel] feed.read.followRows.dal.js → viewer follow relationships
  ├── [parallel] feed.read.commentCounts.dal.js → vc.post_comments (count)
  ├── [parallel] feed.read.reactionCounts.dal.js → vc.post_reactions (count)
  ├── [parallel] feed.read.viewerReactions.dal.js → vc.post_reactions (viewer's own)
  ├── [parallel] feed.read.hiddenPosts.dal.js → moderation.actions
  └── [parallel] feed.read.media.dal.js → vc.post_media
  → normalizeFeedRows.model.js
  → feedRowVisibility.model.js (block + follow + private composite)
  → enrichMentionRows.model.js (+ feed.mentions.dal.js)
  → hydrateAndReturnSummaries (engines/hydration)
  → readPostMediaMap (engines/media)
  → return normalized, filtered, hydrated row set
```

### Actor-Scoped Post List (listActorPosts path)
```
listActorPostsByActor.dal.js
  └── vc.posts WHERE actor_id=:actorId (cursor paginated, RLS-gated)
```

## DB Read Surface Map

| DAL | Schema | Table / Target |
|---|---|---|
| feed.read.posts.dal.js | vc | posts |
| feed.read.actorsBundle.dal.js | vc / vport | profiles, vport.profiles |
| feed.read.blockRows.dal.js | moderation | block relationships |
| feed.read.followRows.dal.js | vc | actor_follows |
| feed.read.commentCounts.dal.js | vc | post_comments |
| feed.read.reactionCounts.dal.js | vc | post_reactions |
| feed.read.viewerReactions.dal.js | vc | post_reactions |
| feed.read.hiddenPosts.dal.js | moderation | actions |
| feed.read.media.dal.js | vc | post_media |
| feed.read.viewerContext.dal.js | vc | actor context |
| feed.read.debugPrivacyRows.dal.js | vc | privacy debug rows |
| feed.mentions.dal.js | vc | post_mentions |
| feed.posts.dal.js | vc | posts (alternate path) |
| feedWelcomeCard.dal.js | vc | actor_onboarding_steps (read + write) |
| listActorPostsByActor.dal.js | vc | posts |

## Engine Dependencies

| Engine | Usage | File |
|---|---|---|
| hydration | hydrateAndReturnSummaries | fetchFeedPage.pipeline.js |
| media | readPostMediaMap | fetchFeedPage.pipeline.js |

## Visibility Model Chain

```
feedBlockVisibility.model.js   ─┐
feedFollowVisibility.model.js  ─┤→ feedRowVisibility.model.js (aggregate) → filtered rows
feedPrivateVisibility.model.js ─┘
```

## Module Boundaries

- This module owns all data fetching and transformation
- No UI, no hooks, no React components
- fetchFeedPage.pipeline.js is the single entry point consumed by the feed UI module
- Debug DAL (feed.read.debugPrivacyRows.dal.js) is part of this module; the controller and UI remain in the feed module

## Debug Profiler Integration

fetchFeedPage.pipeline.js imports from `@debuggers/feed` (wrapDAL, recordStep). Import is unconditional but calls are guarded by `import.meta.env.DEV` / wrapDAL conditional assignment. Tree-shaking should eliminate in production — not confirmed.

## TODO

- [ ] Read fetchFeedPage.pipeline.js to confirm exact 9 parallel DAL call list
- [ ] Confirm whether vport.profiles RLS causes null bundle entries in DAL (VEN-FEED-005)
- [ ] Confirm cursor field in feed.read.posts.dal.js (created_at?)
- [ ] Confirm all 11 model file names
- [ ] Verify @debuggers/feed tree-shaking in production build
