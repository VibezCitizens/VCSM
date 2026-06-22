---
name: vcsm.post.index
description: VCSM post feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / post

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 18 | postcard/ and commentcard/ subdirectories; togglePostReaction, sendRose, deletePost, editPost, getPostById, getPostMentionMap, getPostReactions, commentReactions (x2), deleteComment, editComment, postComments, postComments.count |
| DAL files | 33 | post.read.dal.js, post.write.dal.js, postReactions.read.dal.js, postReactions.write.dal.js, postMentions.read.dal.js, postMentions.write.dal.js, postVisibility.dal.js, roseGifts.actor.dal.js, comments.dal.js, commentLikes.dal.js, postComments.read.dal.js, postComments.count.dal.js |
| Hooks | 22 | usePostReactionOps, usePostReactions, useDeletePostAction, useEditPost, usePostCovers, useCommentCovers, usePostDetailPost, usePostDetailMenus, usePostDetailEditing, usePostDetailReplying, usePostDetailReporting, useCommentThread, useCommentCard, useEditCommentAction, usePostCommentCount |
| Models | 22 | post.model.js, Comment.model.js, plus 7 postModule models (barbershopHours, barbershopPortfolio, exchangeRates, fuelPrices, locksmithHours, locksmithPortfolio, locksmithServiceArea, menuDrop) |
| Screens | 14 | PostDetail.screen.jsx, PostDetail.view.jsx, PostFeed.screen.jsx (+ screen component files: PostDetailModals.jsx, PostDetailSparksSection.jsx) |
| Components | 38 | PostHeader, PostBody, PostFooter, PostCard.view, ReactionBar, BinaryReactionButton, RoseReactionButton, ShareModal, ShareReactionButton, CommentButton, PostActionsMenu, PostConfirmModal, MediaCarousel, EditPost, CommentCard.container, CommentComposeModal, CommentList, CommentReplies, CommentReplyModal, CommentCard.view, CommentInput.view, EditComment.view, plus postModule UI components (BarbershopHoursPostModule, FuelPricesPostModule, ExchangeRatesPostModule, LocksmithHoursPostModule, LocksmithPortfolioPostModule, LocksmithServiceAreaPostModule, MenuDropPostModule, BarbershopPortfolioPostModule, shared PostModuleCta, PostModuleFrame, PostModuleHeader) |
| Adapters | 1 | post.adapter.js (exports usePostReactionOps); postCard.adapter.js (PostCard), PostDetail.view.adapter.js, CommentCard.container.adapter.js, plus postcard/commentcard component and hook adapters (13 fm count / 1 cg count) |
| Barrels | 19 | index.js files across postModule subdirectories and adapter directories |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No entries in route-map scanner output; /post/:postId handled by PostDetail.screen.jsx (route registration is upstream in app router) |
| Total source files | 116 | From feature-map scanner (fm count) |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| delete | vc | comment_likes | unlikeComment |
| insert | vc | comment_likes | likeComment |
| insert | vc | post_comments | createComment |
| update | vc | post_comments | updateCommentContentDAL |
| update | vc | post_comments | softDeleteCommentDAL |
| insert | vc | post_comments | insertPostComment |
| delete | vc | post_mentions | replacePostMentions |
| update | vc | posts | updatePostTextDAL |
| update | vc | posts | softDeletePostDAL |
| insert | vc | post_mentions | insertPostMentionsDAL |
| rpc | vc | — | fetchReactionSummaryDAL (post_reactors_summary_one) |
| delete | vc | post_reactions | deleteReactionDAL |
| insert | vc | post_reactions | insertReactionDAL |
| update | vc | post_reactions | updateReactionDAL |
| insert | vc | post_rose_gifts | insertRoseGiftDAL |

## Security-Sensitive Surfaces

- **vc.posts (update/soft-delete):** Owner-gated in DAL via `.eq("actor_id", actorId)`. Requires DB RLS as secondary enforcement. Confirmed in post.write.dal.js.
- **vc.post_reactions (insert/update/delete):** No explicit owner gate in write DAL — togglePostReaction.controller.js passes actorId but DAL does not re-check ownership on update/delete beyond the actor_id column match. Relies on RLS.
- **vc.post_rose_gifts (insert):** No self-gift prevention at controller layer — actor can send roses to their own post. VENOM review recommended.
- **vc.post_comments (insert/update/delete):** softDeleteCommentDAL — ownership enforcement needs verification; not seen in scanned files.
- **identity.actor_directory (read for mention resolution):** DAL crosses into identity schema directly without engine adapter. Acceptable but worth tracking.

## Engine Dependencies

- hydration — actor resolution in post.read.dal.js via hydrateAndReturnSummaries
- identity — useIdentity consumed via identity.adapter in PostDetailView.jsx
- notification — publishVcsmNotification consumed via notifications.adapter in multiple controllers
- profile — transitively consumed via hydration engine

## Routes

No routes in route-map for this feature. The PostDetail screen at `/post/:postId` is registered upstream in the app router — the route-map scanner did not capture this feature's route declarations. Route entry for PostDetail.screen.jsx should be verified in the app-level router.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no body content) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
