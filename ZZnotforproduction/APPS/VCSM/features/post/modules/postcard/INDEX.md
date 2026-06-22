---
title: Postcard Module — Index
status: STUB
feature: post
module: postcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / postcard

Post display, reactions (binary/rose), editing, deletion, share, mentions, and post detail screen. Core social content interaction surface.

## Source Directories

| Directory | Files |
|---|---|
| postcard/components/ | BinaryReactionButton, CommentButton, MediaCarousel, PostActionsMenu, PostBody, PostConfirmModal, PostFooter, PostHeader, ReactionBar, RoseReactionButton, ShareModal, ShareReactionButton |
| postcard/controller/ | deletePost, editPost, getPostById, getPostMentionMap, getPostReactions, sendRose, togglePostReaction |
| postcard/dal/ | post.read, post.write, postMentions.read, postMentions.write, postReactions.read, postReactions.write, postVisibility, roseGifts.actor |
| postcard/hooks/ | useCommentCovers, useDeletePostAction, useEditPost, usePostCovers, usePostDetailEditing, usePostDetailMenus, usePostDetailPost, usePostDetailReplying, usePostDetailReporting, usePostReactionOps, usePostReactions |
| postcard/model/ | post.model |
| postcard/postModules/ | BarbershopHoursPostModule, + others |
| postcard/ui/ | PostDetail screen views |
| postcard/adapters/ | PostCard.jsx |
| adapters/postcard/ | BinaryReactionButton.adapter, CommentButton.adapter, PostActionsMenu.adapter, RoseReactionButton.adapter, ShareModal.adapter, ShareReactionButton.adapter, useDeletePostAction.adapter |
| adapters/screens/ | PostDetail.view.adapter |
| screens/ | PostDetailScreen + utils |
| adapters/post.adapter.js, postCard.adapter.js | top-level adapters |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — POSTCARD-SEC-001 (HIGH), POSTCARD-SEC-002 (HIGH), POSTCARD-SEC-003 (HIGH), POSTCARD-SEC-004 (HIGH)
