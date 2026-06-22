---
title: Pipeline Module — Index
status: STUB
feature: feed
module: pipeline
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/feed/pipeline/ + dal/ + model/
scanner-version: 1.1.0
---

# feed / modules / pipeline

Data assembly layer for the feed feature. Owns the 9-parallel-DAL fetch pipeline, all visibility filter models, and the mention/media hydration chain. No UI surfaces — this module is consumed exclusively by the feed UI module.

## Module Summary

| Field | Value |
|---|---|
| Module | pipeline |
| Feature | feed |
| Source Path | apps/VCSM/src/features/feed/pipeline/ + dal/ + model/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | 0 (read-only module) |
| Pipeline Files | 1 |
| DAL Files | 15 |
| Model Files | 11 |
| THOR Blocker | Indirect — pipeline surfaces contribute to BW-FEED findings |

## Known Source Files (ARCHITECT-verified)

### Pipeline
| File | Role |
|---|---|
| pipeline/fetchFeedPage.pipeline.js | Orchestrates 9 parallel DAL calls; applies visibility models; hydrates actors and media |

### DAL (15 files — all reads)
| File | Read Target |
|---|---|
| dal/feed.read.posts.dal.js | vc.posts — paginated cursor read |
| dal/feed.read.actorsBundle.dal.js | Actor bundle (profiles, vport, follows) |
| dal/feed.read.blockRows.dal.js | Block relationships for viewer |
| dal/feed.read.followRows.dal.js | Follow relationships for viewer |
| dal/feed.read.commentCounts.dal.js | vc.post_comments (count only) |
| dal/feed.read.reactionCounts.dal.js | vc.post_reactions (count) |
| dal/feed.read.viewerReactions.dal.js | vc.post_reactions (viewer's own) |
| dal/feed.read.media.dal.js | vc.post_media |
| dal/feed.read.hiddenPosts.dal.js | moderation.actions (hidden post suppression) |
| dal/feed.read.viewerContext.dal.js | Viewer context (realm, actor state) |
| dal/feed.read.debugPrivacyRows.dal.js | Privacy debug rows — feeds debug controller |
| dal/feed.mentions.dal.js | vc.post_mentions |
| dal/feed.posts.dal.js | Secondary post read (alternate path) |
| dal/feedWelcomeCard.dal.js | vc.actor_onboarding_steps READ + WRITE (seen upsert) |
| dal/listActorPostsByActor.dal.js | Actor-scoped post list (profile tabs) |

### Models (11 files)
| File | Role |
|---|---|
| model/normalizeFeedRows.model.js | Normalizes raw DB rows into feed row shape |
| model/feedBlockVisibility.model.js | Applies block filter to feed rows |
| model/feedFollowVisibility.model.js | Applies follow visibility rules |
| model/feedPrivateVisibility.model.js | Applies private account visibility |
| model/feedRowVisibility.model.js | Aggregates all visibility decisions per row |
| model/inferMediaType.model.js | Infers media type from post_media data |
| model/enrichMentionRows.model.js | Attaches mention actor data to feed rows |
| model/buildMentionMaps.model.js | Builds mention lookup maps |
| *(3 additional model files — names unconfirmed)* | UNVERIFIED |

## Write Surfaces

feedWelcomeCard.dal.js contains one write (upsert to vc.actor_onboarding_steps). Owned by the feed UI module's feedWelcomeCard.controller — this DAL is invoked via that controller, not directly from the pipeline.

All other DAL files are reads only.

## Engine Dependencies

| Engine | Usage |
|---|---|
| hydration | hydrateAndReturnSummaries in fetchFeedPage.pipeline.js |
| media | readPostMediaMap in fetchFeedPage.pipeline.js |

## Security Flags (ARCHITECT + VENOM/BW derived)

- HIGH: VEN-FEED-005 — vport.profiles owner-only RLS causes null vport bundle entries; VPORT posts hidden for non-owners in feed
- MEDIUM: VEN-FEED-006 — null realmId in readFeedPostsPage skips realm filter; all realms exposed to partially-onboarded users
- MEDIUM: VEN-FEED-003 — actorId passed as userId to readOwnedActorIdsByUserIdDAL (identity field confusion in debug DAL)
- LOW: VEN-FEED-002 — unguarded console.log in fetchFeedPage.pipeline.js line 137 (debugPostId path, no DEV guard)
- LOW: BW-FEED-006 — 60s stale follow/block cache may serve incorrect visibility decisions

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm all 11 model file names under model/
- [ ] Trace 9 parallel DAL calls in fetchFeedPage.pipeline.js — confirm call list
- [ ] Confirm staleTime on follow/block cache rows (BW-FEED-006 claims 60s)
- [ ] Document pipeline entry point — is it called directly from useCentralFeed or via fetchCentralFeedPage query?
- [ ] Confirm whether @debuggers/feed import in pipeline is tree-shaken in production builds
