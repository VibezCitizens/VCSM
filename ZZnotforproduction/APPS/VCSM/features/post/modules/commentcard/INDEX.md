---
title: Commentcard Module — Index
status: STUB
feature: post
module: commentcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / commentcard

Comment display, create, edit, delete, reply, and comment reactions (likes). Handles full comment thread rendering under a post.

## Source Directories

| Directory | Files |
|---|---|
| commentcard/components/ | CommentCard.container, CommentComposeModal, CommentList, CommentReplies, CommentReplyModal, CommentActions, CommentBody, CommentHeader |
| commentcard/controller/ | commentReactions, commentReactions.hydrator, deleteComment, editComment, postComments, postComments.count |
| commentcard/dal/ | commentLikes, comments, postComments.count, postComments.read |
| commentcard/hooks/ | useCommentCard, useCommentThread, useEditCommentAction, usePostCommentCount |
| commentcard/model/ | Comment.model |
| commentcard/ui/ | CommentCard.view, CommentInput.view, EditComment |
| adapters/commentcard/ | CommentCard.container.adapter, useCommentThread.adapter |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

No dedicated THOR blockers scoped to commentcard. COMMENT-SEC-001 (HIGH) — orphaned INSERT needs investigation.
