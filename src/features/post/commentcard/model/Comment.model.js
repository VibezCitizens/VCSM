// src/features/post/commentcard/model/Comment.model.js
// ============================================================
// Comment Domain Model
// - Actor-based (actorId only)
// - Supports replies (parent_id)
// - Soft delete aware
// - Presentation resolved externally
// ============================================================

export class Comment {
  constructor(raw) {
    if (!raw) throw new Error("Comment model requires raw data");

    // ---------------------------
    // Core identifiers
    // ---------------------------
    this.id = raw.id;
    this.postId = raw.post_id;
    this.actorId = raw.actor_id;
    this.parentId = raw.parent_id ?? null;

    // ---------------------------
    // Content
    // ---------------------------
    this.content = raw.content;

    // ---------------------------
    // Timestamps
    // ---------------------------
    this.createdAt = raw.created_at;
    this.deletedAt = raw.deleted_at ?? null;

    // ---------------------------
    // Aggregates
    // ---------------------------
    this.likeCount = Number(raw.like_count ?? raw.likeCount ?? 0);
    this.replyCount = Number(raw.reply_count ?? raw.replyCount ?? 0);

    // ---------------------------
    // Flags
    // ---------------------------
    this.isLiked = Boolean(raw.is_liked ?? false);
    this.isOwner = Boolean(raw.is_owner ?? false);

    // ---------------------------
    // Replies
    // ---------------------------
    this.replies = Array.isArray(raw.replies)
      ? raw.replies.map((r) => new Comment(r))
      : [];
  }

  // ============================================================
  // Helpers
  // ============================================================

  get isReply() {
    return !!this.parentId;
  }

  get isDeleted() {
    return !!this.deletedAt;
  }

  get canReply() {
    return !this.isDeleted;
  }

  get canLike() {
    return !this.isDeleted;
  }
}

export default Comment;
