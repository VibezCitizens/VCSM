/**
 * Owner-bind regression — saveTopFriendRanks controller
 *
 * TICKET-CITIZEN-TOPFRIENDS-OWNERBIND-001 (V05B-M1):
 * The Top-Friends rank WRITE previously trusted a caller/route-supplied
 * `ownerActorId` with no app-layer ownership check (only the DB RPC's
 * vc.is_actor_owner guard backstopped it). The controller now session-binds the
 * owner via the canonical USER-ONLY `assertActorOwnsActorController` self-form
 * before reaching saveFriendRanks.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock(
  "@/features/profiles/kinds/citizen/dal/friends/friendRanks.write.dal",
  () => ({ saveFriendRanks: vi.fn() })
);

vi.mock(
  "@/features/authorization/adapters/authorization.adapter",
  () => ({ assertActorOwnsActorController: vi.fn() })
);

import { saveTopFriendRanksController } from "@/features/profiles/kinds/citizen/controller/friends/saveTopFriendRanks.controller";
import { saveFriendRanks } from "@/features/profiles/kinds/citizen/dal/friends/friendRanks.write.dal";
import { assertActorOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

const OWNER = "citizen-actor-owner-1";
const FRIEND_IDS = ["f1", "f2"];

beforeEach(() => {
  vi.clearAllMocks();
  assertActorOwnsActorController.mockResolvedValue({ ok: true, mode: "self" });
  saveFriendRanks.mockResolvedValue([
    { friend_actor_id: "f1", rank: 1 },
    { friend_actor_id: "f2", rank: 2 },
  ]);
});

describe("saveTopFriendRanksController — V05B-M1 owner bind", () => {
  it("returns Missing ownerActorId and never binds/writes when owner is absent", async () => {
    const res = await saveTopFriendRanksController({ ownerActorId: undefined, friendActorIds: FRIEND_IDS });
    expect(res.ok).toBe(false);
    expect(res.error).toEqual({ message: "Missing ownerActorId" });
    expect(assertActorOwnsActorController).not.toHaveBeenCalled();
    expect(saveFriendRanks).not.toHaveBeenCalled();
  });

  it("binds the owner via the USER-ONLY self-form (requestActorId === targetActorId)", async () => {
    await saveTopFriendRanksController({ ownerActorId: OWNER, friendActorIds: FRIEND_IDS });
    expect(assertActorOwnsActorController).toHaveBeenCalledOnce();
    expect(assertActorOwnsActorController).toHaveBeenCalledWith({
      requestActorId: OWNER,
      targetActorId: OWNER,
    });
  });

  it("rejects a forged owner with { ok:false, error:{ message:'not_owner' } } and never writes", async () => {
    assertActorOwnsActorController.mockRejectedValue(new Error("not bound to session"));
    const res = await saveTopFriendRanksController({ ownerActorId: OWNER, friendActorIds: FRIEND_IDS });
    expect(res).toEqual({ ok: false, error: { message: "not_owner" }, data: { actorIds: [] } });
    expect(saveFriendRanks).not.toHaveBeenCalled();
  });

  it("writes via saveFriendRanks for a session-bound owner and returns ranked actorIds", async () => {
    const res = await saveTopFriendRanksController({ ownerActorId: OWNER, friendActorIds: FRIEND_IDS });
    expect(saveFriendRanks).toHaveBeenCalledOnce();
    expect(saveFriendRanks).toHaveBeenCalledWith(
      OWNER,
      ["f1", "f2"],
      expect.objectContaining({ autofill: false, maxCount: 10 })
    );
    expect(res.ok).toBe(true);
    expect(res.data.actorIds).toEqual(["f1", "f2"]);
  });
});
