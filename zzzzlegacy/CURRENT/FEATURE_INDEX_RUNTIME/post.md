# Runtime Feature Index: post

## Metadata
| Field | Value |
|---|---|
| Feature | post |
| CURRENT Folder | CURRENT/features/post |
| Source Folder | apps/VCSM/src/features/post |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 13 | deletePost, editPost, getPostById, getPostMentionMap, getPostReactions, sendRose, togglePostReaction, postComments, postComments.count, commentReactions, commentReactions.hydrator, deleteComment, editComment |
| DALs | 12 | post.read.dal, post.write.dal, postMentions.read.dal, postMentions.write.dal, postReactions.read.dal, postReactions.write.dal, postVisibility.dal, roseGifts.actor.dal, commentLikes.dal, comments.dal, postComments.count.dal, postComments.read.dal |
| Hooks | 15 | usePostReactions, useDeletePostAction, useEditPost, usePostCovers, useCommentCovers, usePostDetailPost, usePostDetailEditing, usePostDetailMenus, usePostDetailReplying, usePostDetailReporting, usePostReactionOps, useCommentCard, useCommentThread, useEditCommentAction, usePostCommentCount |
| Models | 8 | post.model.js, Comment.model.js, barbershopHoursPostModule.model, barbershopPortfolioPostModule.model, exchangeRatesPostModule.model, fuelPricesPostModule.model, locksmithHoursPostModule.model, menuDropPostModule.model + 2 locksmith variants |
| Screens | 5 | PostDetail.screen.jsx, PostDetail.view.jsx, PostFeed.screen.jsx, PostDetailModals.jsx, PostDetailSparksSection.jsx |
| Components | 34 | BinaryReactionButton, CommentButton, MediaCarousel, PostActionsMenu, PostBody, PostConfirmModal, PostFooter, PostHeader, ReactionBar, RoseReactionButton, ShareModal, ShareReactionButton, EditPost.jsx, PostCard.view.jsx, CommentCard.container.jsx, CommentComposeModal, CommentList, CommentReplies, CommentReplyModal, CommentActions, CommentBody, CommentHeader, CommentCard.view, CommentInput.view, EditComment, PostModuleCta, PostModuleFrame, PostModuleHeader + postModule components (8) |
| Routes | 2 | /post/:postId, /feed (PostFeed.screen embedded) |
| Tests | 0 | NONE FOUND |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /post/:postId | screens/PostDetail.screen.jsx | AUTH | Single post detail — visibility gated via checkPostVisibilityDAL (block + privacy + follow) |
| /feed (post cards embedded) | screens/PostFeed.screen.jsx | AUTH | PostFeed screen lives in post feature; consumes useFeed from feed feature |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| deletePost.controller.js | postcard/controller/ | UPDATE vc.posts (soft delete — sets deleted_at) | YES — DAL enforces .eq("actor_id", actorId) | MEDIUM |
| editPost.controller.js | postcard/controller/ | UPDATE vc.posts (text + edited_at) | YES — DAL enforces .eq("actor_id", actorId) | MEDIUM |
| togglePostReaction.controller.js | postcard/controller/ | INSERT/UPDATE/DELETE vc.post_reactions | PARTIAL — actorId required; checkPostExistsDAL; no self-reaction guard | MEDIUM |
| sendRose.controller.js | postcard/controller/ | INSERT vc.post_rose_gifts | PARTIAL — actorId required; checkPostExistsDAL; no self-rose guard | MEDIUM |
| postComments.controller.js (createRootComment) | commentcard/controller/ | INSERT vc.post_comments | PARTIAL — actorId required; checkPostExistsDAL; no anti-spam guard | MEDIUM |
| postComments.controller.js (createReplyComment) | commentcard/controller/ | INSERT vc.post_comments | PARTIAL — actorId required; checkPostExistsDAL | MEDIUM |
| deleteComment.controller.js | commentcard/controller/ | UPDATE vc.post_comments (soft delete — sets deleted_at) | YES — DAL enforces .eq("actor_id", actorId) | LOW |
| editComment.controller.js | commentcard/controller/ | UPDATE vc.post_comments (content) | YES — DAL enforces .eq("actor_id", actorId) | LOW |
| commentReactions.controller.js (toggleCommentLike) | commentcard/controller/ | INSERT/DELETE vc.comment_likes | PARTIAL — actorId + commentId required; no self-like guard | LOW |
| post.write.dal.js (replacePostMentions) | postcard/dal/ | DELETE + INSERT vc.post_mentions | PARTIAL — S-1: DAL→DAL boundary violation; orchestration belongs in controller | MEDIUM |
| createSystemPost (VPORT publish path) | features/profiles/kinds/vport/controller/ | INSERT vc.posts | NO — V-1 (HIGH): no actor_owners membership check | CRITICAL |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| vc.posts INSERT RLS gap | DB-level | CRITICAL — DB_RLS | DR-001: any authenticated user can INSERT as any actor; migration 20260522010000 endorsed, staging PENDING |
| createSystemPost (VPORT path) | profiles/kinds/vport/controller/ | HIGH — OWNERSHIP | V-1 OPEN: actorId accepted from caller; no actor_owners verification |
| postVisibility.dal.js | postcard/dal/ | MEDIUM — PRIVACY | Reads moderation.blocks + vc.actor_privacy_settings + vc.actor_follows; bidirectional block query confirmed safe per migration 20260510010000 |
| searchMentionSuggestions | upload/dal/ | MEDIUM — PRIVACY | V-2 OPEN: viewerActorId always null; blocked actors appear in mention autocomplete |
| replacePostMentions (in post.write.dal.js) | postcard/dal/ | MEDIUM — BOUNDARY | S-1 OPEN: DAL orchestrating delete+insert of another DAL; belongs in controller layer |
| togglePostReaction + sendRose | postcard/controller/ | LOW — INTEGRITY | No self-action guard; actor can react to or rose their own posts |

## Open Tickets / Findings
| ID | Severity | Description | Status |
|---|---|---|---|
| DR-001 | CRITICAL | vc.posts INSERT RLS gap — any authenticated user can write as any actor | OPEN — migration 20260522010000 pending staging |
| V-1 | HIGH | createSystemPost no actor ownership verification | OPEN |
| V-2 | MEDIUM | searchMentionSuggestions viewerActorId always null | OPEN |
| S-1 | MEDIUM | replacePostMentions DAL→DAL boundary violation | OPEN |
| RC-2 | LOW | Dual controller folders in upload (upload/controller/ and upload/controllers/) | OPEN |

## Recommended Next Command

ELEKTRA — trace V-1 source-to-sink chain for createSystemPost and propose a concrete ownership patch. CARNAGE should follow to stage migration 20260522010000 (DR-001).
