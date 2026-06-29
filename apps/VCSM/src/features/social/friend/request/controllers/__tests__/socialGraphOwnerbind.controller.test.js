/**
 * Regression tests — social-graph kind-agnostic session owner-bind
 *
 * TICKET-SOCIAL-GRAPH-OWNERBIND-001 / V06B-M1:
 * Every social-graph write controller (+ the protected inbox read) must bind the
 * authenticated session to the ACTING actor via `readCurrentAuthUser()` +
 * `readSocialActorOwnerLinkDAL({ actorId, userId })` against `vc.actor_owners`
 * (kind-agnostic — works for user AND vport actors; mirrors createPostController)
 * before any write, and perform NO write DAL on rejection. Defense-in-depth; the
 * durable boundary is the actor_follows / social_follow_requests RLS (Phase 15).
 *
 * The prior caller-equality gate was vacuous on the toggle path (assertingActorId
 * was set equal to the claimed acting actor) — these tests prove the session, not a
 * caller-supplied id, now decides.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/auth/adapters/authSession.adapter", () => ({ readCurrentAuthUser: vi.fn() }));
vi.mock("@/features/social/friend/request/dal/socialActorOwnership.read.dal", () => ({
  readSocialActorOwnerLinkDAL: vi.fn(),
}));
vi.mock("@/features/social/friend/request/dal/actorFollows.dal", () => ({
  dalInsertFollow: vi.fn(),
  dalDeactivateFollow: vi.fn(),
}));
vi.mock("@/features/social/friend/request/dal/followRequests.dal", () => ({
  dalGetRequestStatus: vi.fn(),
  dalUpsertPendingRequest: vi.fn(),
  dalUpdateRequestStatus: vi.fn(),
  dalListIncomingPendingRequests: vi.fn(),
}));
vi.mock("@/features/social/friend/subscribe/dal/subscriberCount.dal", () => ({
  invalidateFollowerCount: vi.fn(),
}));
vi.mock("@/features/CentralFeed/adapters/feedCache.adapter", () => ({
  invalidateFeedFollowCache: vi.fn(),
}));
vi.mock("@/features/notifications/adapters/notifications.adapter", () => ({
  publishVcsmNotification: vi.fn(),
}));
vi.mock("@/features/block", () => ({ ctrlGetBlockStatus: vi.fn() }));
vi.mock("@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller", () => ({
  ctrlGetFollowRelationshipState: vi.fn(),
}));

import { ctrlSubscribe } from "@/features/social/friend/subscribe/controllers/follow.controller";
import { ctrlUnsubscribe } from "@/features/social/friend/subscribe/controllers/unsubscribe.controller";
import {
  ctrlSendFollowRequest,
  ctrlAcceptFollowRequest,
  ctrlDeclineFollowRequest,
  ctrlCancelFollowRequest,
  ctrlListIncomingRequests,
} from "@/features/social/friend/request/controllers/followRequests.controller";

import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readSocialActorOwnerLinkDAL } from "@/features/social/friend/request/dal/socialActorOwnership.read.dal";
import { dalInsertFollow, dalDeactivateFollow } from "@/features/social/friend/request/dal/actorFollows.dal";
import {
  dalGetRequestStatus,
  dalUpsertPendingRequest,
  dalUpdateRequestStatus,
  dalListIncomingPendingRequests,
} from "@/features/social/friend/request/dal/followRequests.dal";
import { ctrlGetBlockStatus } from "@/features/block";
import { ctrlGetFollowRelationshipState } from "@/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller";

const USER = "u1";
const FOLLOWER = "actor-follower";
const FOLLOWED = "actor-followed";
const REQUESTER = "actor-requester";
const TARGET = "actor-target";
const OWNER_LINK = { actor_id: FOLLOWER, is_void: false };

const denyOwnership = () => readSocialActorOwnerLinkDAL.mockResolvedValue(null);
const grantOwnership = () => readSocialActorOwnerLinkDAL.mockResolvedValue(OWNER_LINK);

beforeEach(() => {
  vi.clearAllMocks();
  readCurrentAuthUser.mockResolvedValue({ id: USER });
  ctrlGetBlockStatus.mockResolvedValue({ isBlocked: false });
  ctrlGetFollowRelationshipState.mockResolvedValue({ state: "not_following", followPolicy: "open", isPrivate: false });
  dalGetRequestStatus.mockResolvedValue("pending");
});

describe("ctrlSubscribe — acting actor = followerActorId (V06B-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: FOLLOWER, userId: USER });
    expect(dalInsertFollow).not.toHaveBeenCalled();
  });

  it("proceeds for a user owner (public follow)", async () => {
    grantOwnership();
    dalInsertFollow.mockResolvedValue(true);
    const result = await ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER });
    expect(dalInsertFollow).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true, isFollowing: true });
  });

  it("proceeds for a vport owner (kind-agnostic)", async () => {
    readSocialActorOwnerLinkDAL.mockResolvedValue({ actor_id: FOLLOWER, is_void: false });
    dalInsertFollow.mockResolvedValue(true);
    const result = await ctrlSubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER });
    expect(dalInsertFollow).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true });
  });
});

describe("ctrlUnsubscribe — acting actor = followerActorId (V06B-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: FOLLOWER, userId: USER });
    expect(dalDeactivateFollow).not.toHaveBeenCalled();
  });

  it("proceeds for an owner", async () => {
    grantOwnership();
    dalDeactivateFollow.mockResolvedValue(true);
    dalUpdateRequestStatus.mockResolvedValue(true);
    const result = await ctrlUnsubscribe({ followerActorId: FOLLOWER, followedActorId: FOLLOWED, assertingActorId: FOLLOWER });
    expect(dalDeactivateFollow).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});

describe("ctrlSendFollowRequest — acting actor = requesterActorId (V06B-M1, previously ungated)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: REQUESTER, userId: USER });
    expect(dalUpsertPendingRequest).not.toHaveBeenCalled();
  });

  it("proceeds for an owner", async () => {
    grantOwnership();
    dalGetRequestStatus.mockResolvedValue(null);
    dalUpsertPendingRequest.mockResolvedValue(true);
    const result = await ctrlSendFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET });
    expect(dalUpsertPendingRequest).toHaveBeenCalledTimes(1);
    expect(result).toBe("pending");
  });
});

describe("ctrlAcceptFollowRequest — acting actor = targetActorId/inbox (V06B-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: TARGET, userId: USER });
    expect(dalInsertFollow).not.toHaveBeenCalled();
  });

  it("proceeds for the inbox owner", async () => {
    grantOwnership();
    dalGetRequestStatus.mockResolvedValue("pending");
    dalInsertFollow.mockResolvedValue(true);
    dalUpdateRequestStatus.mockResolvedValue(true);
    const result = await ctrlAcceptFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET });
    expect(dalInsertFollow).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});

describe("ctrlDeclineFollowRequest — acting actor = targetActorId/inbox (V06B-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlDeclineFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: TARGET, userId: USER });
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled();
  });

  it("proceeds for the inbox owner", async () => {
    grantOwnership();
    dalGetRequestStatus.mockResolvedValue("pending");
    dalUpdateRequestStatus.mockResolvedValue(true);
    const result = await ctrlDeclineFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: TARGET });
    expect(dalUpdateRequestStatus).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});

describe("ctrlCancelFollowRequest — acting actor = requesterActorId (V06B-M1)", () => {
  it("rejects a non-owner session and never writes", async () => {
    denyOwnership();
    await expect(
      ctrlCancelFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: REQUESTER })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: REQUESTER, userId: USER });
    expect(dalUpdateRequestStatus).not.toHaveBeenCalled();
  });

  it("proceeds for the requester owner", async () => {
    grantOwnership();
    dalGetRequestStatus.mockResolvedValue("pending");
    dalUpdateRequestStatus.mockResolvedValue(true);
    const result = await ctrlCancelFollowRequest({ requesterActorId: REQUESTER, targetActorId: TARGET, assertingActorId: REQUESTER });
    expect(dalUpdateRequestStatus).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});

describe("ctrlListIncomingRequests — acting actor = targetActorId/inbox (V06B-M1)", () => {
  it("rejects a non-owner session and never reads the inbox", async () => {
    denyOwnership();
    await expect(
      ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET })
    ).rejects.toThrow("actor not owned by session user");
    expect(readSocialActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: TARGET, userId: USER });
    expect(dalListIncomingPendingRequests).not.toHaveBeenCalled();
  });

  it("proceeds for the inbox owner", async () => {
    grantOwnership();
    dalListIncomingPendingRequests.mockResolvedValue([{ requester_actor_id: REQUESTER }]);
    const result = await ctrlListIncomingRequests({ targetActorId: TARGET, assertingActorId: TARGET });
    expect(dalListIncomingPendingRequests).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });
});
