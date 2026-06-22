# Post System Map

Last Updated: 2026-05-09

## Overview

The VCSM post/Vibe system is distributed across five primary feature directories and two engine directories. It handles creation, display, reaction, commenting, media upload, mention tagging, moderation, and notification delivery for "Vibes" (posts).

---

## Feature Directories Involved

| Feature | Path | Role |
|---|---|---|
| `upload` | `apps/VCSM/src/features/upload/` | Post creation, media upload, mention resolution |
| `feed` | `apps/VCSM/src/features/feed/` | Feed loading, pipeline, visibility filtering, pagination |
| `post` | `apps/VCSM/src/features/post/` | Post card rendering, reactions, comments, editing, deletion |
| `media` | `apps/VCSM/src/features/media/` | Media asset registration in `platform.media_assets` |
| `notifications` | `apps/VCSM/src/features/notifications/` | Event publish adapter, inbox, realtime badge |
| `explore` | `apps/VCSM/src/features/explore/` | Post search by tag and text |
| `social` | `apps/VCSM/src/features/social/` | Follow/block state used in feed visibility model |
| `moderation` | `apps/VCSM/src/features/moderation/` | Report flow, hide post, covered post overlays |

---

## Engine Dependencies

| Engine | Path | Role in Post System |
|---|---|---|
| `media` | `engines/media/` | Upload orchestration, validation, compression, R2 upload |
| `notifications` | `engines/notifications/` | Event publishing pipeline to `notification.*` schema |
| `hydration` | `engines/hydration/` | Actor summary resolution (`hydrateActorsByIds`, `hydrateAndReturnSummaries`) |

---

## Layers Within Each Feature

### Upload Feature
```
DAL:        insertPost.dal.js, insertPostMedia.dal.js, insertPostMentions.dal.js,
            findActorsByHandles.dal.js, postAuthRollback.dal.js,
            updatePostMediaAssetId.write.dal.js
Controller: createPost.controller.js, recordPostMedia.controller.js
Hook:       useUploadSubmit.js, useMediaSelection.js, useMentionAutocomplete.js
API:        uploadMedia.js  (calls engines/media uploadMediaController)
Screen:     UploadScreen.jsx → UploadScreenModern.jsx
```

### Feed Feature
```
DAL:        feed.read.posts.dal.js, feed.read.media.dal.js, feed.read.actorsBundle.dal.js,
            feed.read.blockRows.dal.js, feed.read.followRows.dal.js,
            feed.read.hiddenPosts.dal.js, feed.read.commentCounts.dal.js,
            feed.read.viewerReactions.dal.js, feed.read.reactionCounts.dal.js,
            feed.mentions.dal.js, listActorPostsByActor.dal.js,
            feed.read.viewerContext.dal.js, feedWelcomeCard.dal.js
            feed.posts.dal.js  (LEGACY — diagnostics only)
            feed.read.debugPrivacyRows.dal.js  (debug only)
Model:      normalizeFeedRows.model.js, feedRowVisibility.model.js,
            feedBlockVisibility.model.js, feedFollowVisibility.model.js,
            feedPrivateVisibility.model.js, inferMediaType.model.js,
            buildMentionMaps.model.js
Pipeline:   fetchFeedPage.pipeline.js  (9-DAL parallel batch)
Query:      fetchCentralFeedPage.js  (React Query queryFn)
Controller: listActorPosts.controller.js, getFeedViewerContext.controller.js,
            getDebugPrivacyRows.controller.js, feedWelcomeCard.controller.js
Hook:       useCentralFeed.js (React Query infinite), useFeed.js (legacy useState),
            useCentralFeedActions.js, useFeedInfiniteScroll.js, useFeedWelcomeCard.js,
            useFeedConfirmToast.js, useDebugPrivacyRows.js
Screen:     CentralFeedScreen.jsx
```

### Post Feature
```
DAL (postcard): post.read.dal.js, post.write.dal.js, postReactions.read.dal.js,
                postReactions.write.dal.js, roseGifts.actor.dal.js,
                postMentions.read.dal.js, postMentions.write.dal.js
DAL (commentcard): comments.dal.js, postComments.read.dal.js, commentLikes.dal.js,
                   postComments.count.dal.js
Controller (postcard): togglePostReaction.controller.js, sendRose.controller.js,
                       deletePost.controller.js, editPost.controller.js,
                       getPostById.controller.js, getPostMentionMap.controller.js,
                       getPostReactions.controller.js
Controller (commentcard): postComments.controller.js, commentReactions.controller.js,
                          commentReactions.hydrator.controller.js,
                          deleteComment.controller.js, editComment.controller.js,
                          postComments.count.controller.js
Model (postcard): post.model.js
Model (commentcard): Comment.model.js
Hook (postcard): usePostReactions.js, usePostReactionOps.js, useDeletePostAction.js,
                 useEditPost.js, usePostDetailPost.js, usePostDetailMenus.js,
                 usePostDetailEditing.js, usePostDetailReplying.js,
                 usePostDetailReporting.js, useCommentCovers.js, usePostCovers.js
Hook (commentcard): useCommentThread.js, useCommentCard.js, useEditCommentAction.js,
                    usePostCommentCount.js
Screen: PostDetail.screen.jsx (thin shell) → PostDetail.view.jsx (full implementation)
        PostFeed.screen.jsx (legacy, uses useFeed, uses window.scroll)
```

### Media Feature (app-level)
```
DAL:        mediaAssets.write.dal.js, resolveAppId.read.dal.js
Controller: createMediaAsset.controller.js
Model:      mediaAsset.model.js (SCOPE_MAP, mapUploadResultToMediaAsset, mapMediaAssetRow)
```

---

## Database Schemas Touched

| Schema | Tables |
|---|---|
| `vc` | `posts`, `post_media`, `post_reactions`, `post_rose_gifts`, `post_comments`, `post_mentions`, `comment_likes`, `actors`, `actor_follows`, `actor_privacy_settings`, `actor_onboarding_steps` |
| `moderation` | `blocks`, `actions` |
| `notification` | `events`, `recipients`, `rendered`, `inbox_items`, `event_types`, `templates`, `preferences`, `delivery_attempts` |
| `platform` | `media_assets`, `apps` |
| `public` | `profiles` |
| `identity` | `actor_directory` |
| `vport` (via vportClient) | `public_traze_profiles_v`, `profiles` |

---

## Two Active Feed Hooks

The system has two active feed hooks operating in parallel:

- `useFeed.js` — legacy useState-based implementation. Used by `PostFeed.screen.jsx`.
- `useCentralFeed.js` — React Query `useInfiniteQuery` replacement. Used by `CentralFeedScreen.jsx`.

Both use the same pipeline (`fetchFeedPagePipeline`) and the same `fetchCentralFeedPage` query function underneath. The legacy `PostFeed.screen.jsx` is not the primary feed surface but remains wired up.
