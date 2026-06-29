/**
 * Owner-bind regression — getTopFriendActorIds controller
 *
 * TICKET-CITIZEN-TOPFRIENDS-OWNERBIND-001 (V05B-M2):
 * The reconcile branch RE-SAVES through vc.save_friend_ranks (a write), so it is
 * now session-bound via the canonical USER-ONLY `assertActorOwnsActorController`
 * self-form. The PUBLIC read path (reconcile === false) MUST remain ungated so
 * viewing other citizens' public Top-Friends lists keeps working.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/block", () => ({ ctrlGetBlockedActorSet: vi.fn() }));

vi.mock(
  "@/features/profiles/kinds/citizen/dal/friends/friends.read.dal",
  () => ({
    readActiveFollowRows: vi.fn(),
    readActorRows: vi.fn(),
    readFriendRankRows: vi.fn(),
  })
);

vi.mock(
  "@/features/profiles/kinds/citizen/dal/friends/friendRanks.reconcile.dal",
  () => ({ reconcileFriendRanks: vi.fn() })
);

vi.mock(
  "@/features/authorization/adapters/authorization.adapter",
  () => ({ assertActorOwnsActorController: vi.fn() })
);

import { getTopFriendActorIdsController } from "@/features/profiles/kinds/citizen/controller/friends/getTopFriendActorIds.controller";
import { ctrlGetBlockedActorSet } from "@/features/block";
import {
  readActiveFollowRows,
  readActorRows,
  readFriendRankRows,
} from "@/features/profiles/kinds/citizen/dal/friends/friends.read.dal";
import { reconcileFriendRanks } from "@/features/profiles/kinds/citizen/dal/friends/friendRanks.reconcile.dal";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

const OWNER = "citizen-actor-owner-1";

beforeEach(() => {
  vi.clearAllMocks();
  assertActorOwnsActorController.mockResolvedValue({ ok: true, mode: "self" });
  // Default rank set resolves to a single eligible, active, unblocked friend "f1".
  readFriendRankRows.mockResolvedValue([{ friend_actor_id: "f1" }]);
  reconcileFriendRanks.mockResolvedValue([{ friend_actor_id: "f1" }]);
  readActiveFollowRows.mockResolvedValue([{ followed_actor_id: "f1" }]);
  readActorRows.mockResolvedValue([{ id: "f1", is_void: false }]);
  ctrlGetBlockedActorSet.mockResolvedValue(new Set());
});

describe("getTopFriendActorIdsController — V05B-M2 reconcile bind", () => {
  it("does NOT bind and does NOT reconcile on the public read path (reconcile === false)", async () => {
    const res = await getTopFriendActorIdsController({ ownerActorId: OWNER, reconcile: false });
    expect(assertActorOwnsActorController).not.toHaveBeenCalled();
    expect(reconcileFriendRanks).not.toHaveBeenCalled();
    expect(readFriendRankRows).toHaveBeenCalledWith(OWNER, 10);
    expect(res.ok).toBe(true);
    expect(res.data.actorIds).toEqual(["f1"]);
  });

  it("binds via the USER-ONLY self-form and reconciles for a session-bound owner (reconcile === true)", async () => {
    const res = await getTopFriendActorIdsController({ ownerActorId: OWNER, reconcile: true });
    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: OWNER,
      targetActorId: OWNER,
    });
    expect(reconcileFriendRanks).toHaveBeenCalledOnce();
    expect(readFriendRankRows).not.toHaveBeenCalled(); // reconcile returned rows
    expect(res.ok).toBe(true);
    expect(res.data.actorIds).toEqual(["f1"]);
  });

  it("blocks the reconcile WRITE for a forged owner and degrades to the public read", async () => {
    assertActorOwnsActorController.mockRejectedValue(new Error("not bound to session"));
    const res = await getTopFriendActorIdsController({ ownerActorId: OWNER, reconcile: true });
    expect(reconcileFriendRanks).not.toHaveBeenCalled();
    expect(readFriendRankRows).toHaveBeenCalledWith(OWNER, 10); // fell through to public read
    expect(res.ok).toBe(true);
    expect(res.data.actorIds).toEqual(["f1"]);
  });

  it("returns Missing ownerActorId and never binds when owner is absent", async () => {
    const res = await getTopFriendActorIdsController({ ownerActorId: undefined, reconcile: true });
    expect(res.ok).toBe(false);
    expect(assertActorOwnsActorController).not.toHaveBeenCalled();
    expect(reconcileFriendRanks).not.toHaveBeenCalled();
  });
});
