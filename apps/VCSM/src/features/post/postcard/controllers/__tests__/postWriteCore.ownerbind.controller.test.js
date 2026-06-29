/**
 * Regression tests — post write-core authorship session-bind
 *
 * TICKET-POST-WRITECORE-AUTHORSHIP-BIND-001 / V06A-M1:
 * Every post-interaction write controller must verify the authenticated session
 * owns `actorId` (kind-agnostic, via vc.actor_owners — mirrors createPostController)
 * before its write, and perform NO write DAL on rejection. Defense-in-depth; the
 * durable boundary is the post-interaction RLS WITH CHECK (06A-DB-1, Phase 15).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/auth/adapters/authSession.adapter", () => ({ readCurrentAuthUser: vi.fn() }));
vi.mock("@/features/post/postcard/dal/postActorOwnership.read.dal", () => ({ readPostActorOwnerLinkDAL: vi.fn() }));
vi.mock("@/features/post/postcard/dal/postReactions.read.dal", () => ({
  fetchActorReactionDAL: vi.fn(),
  fetchReactionSummaryDAL: vi.fn(),
}));
vi.mock("@/features/post/postcard/dal/postReactions.write.dal", () => ({
  insertReactionDAL: vi.fn(),
  updateReactionDAL: vi.fn(),
  deleteReactionDAL: vi.fn(),
}));
vi.mock("@/features/post/postcard/dal/post.read.dal", () => ({
  fetchPostByIdDAL: vi.fn(),
  checkPostExistsDAL: vi.fn(),
}));
vi.mock("@/features/post/postcard/dal/roseGifts.actor.dal", () => ({ insertRoseGiftDAL: vi.fn() }));
vi.mock("@/features/post/commentcard/dal/postComments.read.dal", () => ({
  listPostComments: vi.fn(),
  readPostCommentActorIdDAL: vi.fn(),
}));
vi.mock("@/features/post/commentcard/dal/comments.dal", () => ({
  createComment: vi.fn(),
  readCommentActorAndPostIdDAL: vi.fn(),
}));
vi.mock("@/features/post/commentcard/dal/commentLikes.dal", () => ({
  likeComment: vi.fn(),
  unlikeComment: vi.fn(),
  isCommentLiked: vi.fn(),
  getCommentLikeCount: vi.fn(),
}));
vi.mock("@/features/post/postcard/adapters/postcard.adapter", () => ({
  checkPostExistsController: vi.fn(),
  fetchPostActorIdController: vi.fn(),
}));
vi.mock("@/features/notifications/adapters/notifications.adapter", () => ({ publishVcsmNotification: vi.fn() }));

import { togglePostReactionController } from "@/features/post/postcard/controllers/togglePostReaction.controller";
import { sendRoseController } from "@/features/post/postcard/controllers/sendRose.controller";
import { createRootComment, createReplyComment } from "@/features/post/commentcard/controllers/postComments.controller";
import { toggleCommentLike } from "@/features/post/commentcard/controllers/commentReactions.controller";

import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readPostActorOwnerLinkDAL } from "@/features/post/postcard/dal/postActorOwnership.read.dal";
import { fetchActorReactionDAL, fetchReactionSummaryDAL } from "@/features/post/postcard/dal/postReactions.read.dal";
import { insertReactionDAL, updateReactionDAL, deleteReactionDAL } from "@/features/post/postcard/dal/postReactions.write.dal";
import { checkPostExistsDAL, fetchPostByIdDAL } from "@/features/post/postcard/dal/post.read.dal";
import { insertRoseGiftDAL } from "@/features/post/postcard/dal/roseGifts.actor.dal";
import { createComment } from "@/features/post/commentcard/dal/comments.dal";
import { likeComment, isCommentLiked, getCommentLikeCount } from "@/features/post/commentcard/dal/commentLikes.dal";
import { readCommentActorAndPostIdDAL } from "@/features/post/commentcard/dal/comments.dal";
import { checkPostExistsController, fetchPostActorIdController } from "@/features/post/postcard/adapters/postcard.adapter";

const USER = "u1";
const ACTOR = "a1";
const OWNER_LINK = { actor_id: ACTOR, is_void: false };

beforeEach(() => {
  vi.clearAllMocks();
  readCurrentAuthUser.mockResolvedValue({ id: USER });
  checkPostExistsDAL.mockResolvedValue(true);
  checkPostExistsController.mockResolvedValue(true);
  fetchPostByIdDAL.mockResolvedValue({ data: { actor_id: "owner" } });
  fetchReactionSummaryDAL.mockResolvedValue({ data: [], error: null });
  fetchPostActorIdController.mockResolvedValue("owner");
});

describe("togglePostReactionController — authorship bind (V06A-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      togglePostReactionController({ postId: "p1", actorId: ACTOR, reaction: "like", currentCounts: { like: 0, dislike: 0, rose: 0 } })
    ).rejects.toThrow("actor not owned by session user");

    expect(readPostActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR, userId: USER });
    expect(insertReactionDAL).not.toHaveBeenCalled();
    expect(updateReactionDAL).not.toHaveBeenCalled();
    expect(deleteReactionDAL).not.toHaveBeenCalled();
    expect(checkPostExistsDAL).not.toHaveBeenCalled();
  });

  it("proceeds for an owner session", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);
    fetchActorReactionDAL.mockResolvedValue({ data: null, error: null });
    insertReactionDAL.mockResolvedValue({});

    const result = await togglePostReactionController({ postId: "p1", actorId: ACTOR, reaction: "like", currentCounts: { like: 0, dislike: 0, rose: 0 } });

    expect(insertReactionDAL).toHaveBeenCalledTimes(1);
    expect(result.reaction).toBe("like");
  });
});

describe("sendRoseController — authorship bind (V06A-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      sendRoseController({ postId: "p1", actorId: ACTOR, qty: 1 })
    ).rejects.toThrow("actor not owned by session user");

    expect(readPostActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR, userId: USER });
    expect(insertRoseGiftDAL).not.toHaveBeenCalled();
  });

  it("proceeds for an owner session", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);
    insertRoseGiftDAL.mockResolvedValue({ error: null });
    // fetchReactionSummaryDAL resolves via the read mock default (undefined) → guard handles []

    const result = await sendRoseController({ postId: "p1", actorId: ACTOR, qty: 1 });

    expect(insertRoseGiftDAL).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty("counts");
  });
});

describe("createRootComment — authorship bind (V06A-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      createRootComment({ postId: "p1", actorId: ACTOR, content: "hi" })
    ).rejects.toThrow("actor not owned by session user");

    expect(readPostActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR, userId: USER });
    expect(createComment).not.toHaveBeenCalled();
    expect(checkPostExistsController).not.toHaveBeenCalled();
  });

  it("proceeds for an owner session", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);
    createComment.mockResolvedValue({ id: "c1" });

    const result = await createRootComment({ postId: "p1", actorId: ACTOR, content: "hi" });

    expect(createComment).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: "c1", replies: [] });
  });
});

describe("createReplyComment — authorship bind (V06A-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      createReplyComment({ postId: "p1", actorId: ACTOR, parentCommentId: "c0", content: "hi" })
    ).rejects.toThrow("actor not owned by session user");

    expect(createComment).not.toHaveBeenCalled();
  });

  it("proceeds for an owner session", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);
    createComment.mockResolvedValue({ id: "r1" });

    const result = await createReplyComment({ postId: "p1", actorId: ACTOR, parentCommentId: "c0", content: "hi" });

    expect(createComment).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: "r1", replies: [] });
  });
});

describe("toggleCommentLike — authorship bind (V06A-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      toggleCommentLike({ commentId: "c1", actorId: ACTOR })
    ).rejects.toThrow("actor not owned by session user");

    expect(readPostActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR, userId: USER });
    expect(likeComment).not.toHaveBeenCalled();
    expect(isCommentLiked).not.toHaveBeenCalled();
  });

  it("proceeds for an owner session", async () => {
    readPostActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);
    isCommentLiked.mockResolvedValue(false);
    likeComment.mockResolvedValue({});
    readCommentActorAndPostIdDAL.mockResolvedValue({ actor_id: "owner", post_id: "p1" });
    getCommentLikeCount.mockResolvedValue(1);

    const result = await toggleCommentLike({ commentId: "c1", actorId: ACTOR });

    expect(likeComment).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ isLiked: true, likeCount: 1 });
  });
});
