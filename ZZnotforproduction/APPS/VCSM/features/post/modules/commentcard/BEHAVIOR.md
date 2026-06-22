---
title: Commentcard Module — Behavior
status: STUB
feature: post
module: commentcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / commentcard — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder.

## Expected Behaviors (UNVERIFIED)

- Actor views comment thread under a post (CommentList, CommentReplies)
- Actor creates comment via CommentComposeModal → postComments.controller
- Actor replies to comment via CommentReplyModal
- Actor likes a comment — toggleCommentLike (no self-like guard — BW-POST-006 BYPASSED)
- Actor edits own comment — editComment.controller
- Actor deletes own comment — deleteComment.controller
- No comment content length limit (VEN-POST-006)
- insertPostComment: orphaned export in read DAL (VEN-POST-001)

## Invariants (UNVERIFIED)

- Actor cannot like own comment (NOT enforced — BW-POST-006 BYPASSED)
- Comment must be non-empty and within length limit (NOT enforced)

## TODO

- [ ] Confirm createRootComment null actorId guard at controller level
- [ ] Confirm ownership gate on edit/delete
