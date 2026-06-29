/**
 * Owner-bind regression — block / unblock / toggle controllers
 *
 * TICKET-BLOCK-AUTHORITY-OWNERBIND-001 (V11-M1 + V12B-M1):
 * The block controllers previously gated on a vacuous caller-equality
 * (`assertingActorId === blockerActorId`, both caller-supplied → zero protection).
 * They now verify the authenticated session OWNS `blockerActorId` via the canonical
 * KIND-AGNOSTIC session→vc.actor_owners owner-bind (readCurrentAuthUser +
 * readBlockActorOwnerLinkDAL) before any block/unblock RPC. The blocker may be a
 * user OR a vport. assertingActorId is retained (vestigial) for API compatibility.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/block/dal/block.write.dal", () => ({
  blockActor: vi.fn(),
  unblockActor: vi.fn(),
}));
vi.mock("@/features/block/dal/block.check.dal", () => ({
  checkBlockStatus: vi.fn(),
}));
vi.mock("@/features/auth/adapters/authSession.adapter", () => ({
  readCurrentAuthUser: vi.fn(),
}));
vi.mock("@/features/block/dal/blockActorOwnership.read.dal", () => ({
  readBlockActorOwnerLinkDAL: vi.fn(),
}));

import {
  blockActorController,
  unblockActorController,
  toggleBlockActorController,
} from "@/features/block/controllers/blockActor.controller";
import { blockActor, unblockActor } from "@/features/block/dal/block.write.dal";
import { checkBlockStatus } from "@/features/block/dal/block.check.dal";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readBlockActorOwnerLinkDAL } from "@/features/block/dal/blockActorOwnership.read.dal";

const SESSION_UID = "auth-uid-1";
const USER_BLOCKER = "user-actor-1";
const VPORT_BLOCKER = "vport-actor-9";
const TARGET = "target-actor-2";

beforeEach(() => {
  vi.clearAllMocks();
  readCurrentAuthUser.mockResolvedValue({ id: SESSION_UID });
  readBlockActorOwnerLinkDAL.mockResolvedValue({ actor_id: USER_BLOCKER, is_void: false });
  checkBlockStatus.mockResolvedValue({ blockedByMe: false });
  blockActor.mockResolvedValue(undefined);
  unblockActor.mockResolvedValue(undefined);
});

describe("blockActorController — V11-M1 session owner-bind", () => {
  it("owned USER blocker → proceeds (block RPC called); helper queried with blocker + session uid", async () => {
    const res = await blockActorController(USER_BLOCKER, TARGET, USER_BLOCKER);
    expect(readBlockActorOwnerLinkDAL).toHaveBeenCalledWith({ actorId: USER_BLOCKER, userId: SESSION_UID });
    expect(blockActor).toHaveBeenCalledWith(USER_BLOCKER, TARGET);
    expect(res).toEqual({ blocked: true });
  });

  it("owned VPORT blocker → proceeds (kind-agnostic)", async () => {
    readBlockActorOwnerLinkDAL.mockResolvedValue({ actor_id: VPORT_BLOCKER, is_void: false });
    const res = await blockActorController(VPORT_BLOCKER, TARGET, VPORT_BLOCKER);
    expect(blockActor).toHaveBeenCalledWith(VPORT_BLOCKER, TARGET);
    expect(res).toEqual({ blocked: true });
  });

  it("forged/unowned blocker → throws (even when assertingActorId === blockerActorId)", async () => {
    readBlockActorOwnerLinkDAL.mockResolvedValue(null);
    await expect(blockActorController(USER_BLOCKER, TARGET, USER_BLOCKER)).rejects.toThrow(/does not own/i);
  });

  it("forged/unowned blocker → block RPC NEVER called", async () => {
    readBlockActorOwnerLinkDAL.mockResolvedValue(null);
    await expect(blockActorController(USER_BLOCKER, TARGET, USER_BLOCKER)).rejects.toThrow();
    expect(blockActor).not.toHaveBeenCalled();
  });

  it("no authenticated session → throws, block RPC NEVER called", async () => {
    readCurrentAuthUser.mockResolvedValue(null);
    await expect(blockActorController(USER_BLOCKER, TARGET, USER_BLOCKER)).rejects.toThrow();
    expect(blockActor).not.toHaveBeenCalled();
  });
});

describe("unblockActorController — V11-M1 session owner-bind", () => {
  it("owned blocker → proceeds (unblock RPC called when a block exists)", async () => {
    checkBlockStatus.mockResolvedValue({ blockedByMe: true });
    const res = await unblockActorController(USER_BLOCKER, TARGET, USER_BLOCKER);
    expect(unblockActor).toHaveBeenCalledWith(USER_BLOCKER, TARGET);
    expect(res).toEqual({ blocked: false });
  });

  it("forged/unowned blocker → throws, unblock RPC NEVER called", async () => {
    readBlockActorOwnerLinkDAL.mockResolvedValue(null);
    await expect(unblockActorController(USER_BLOCKER, TARGET, USER_BLOCKER)).rejects.toThrow(/does not own/i);
    expect(unblockActor).not.toHaveBeenCalled();
    expect(checkBlockStatus).not.toHaveBeenCalled();
  });
});

describe("toggleBlockActorController — V11-M1 session owner-bind", () => {
  it("owned blocker, not currently blocked → blocks", async () => {
    checkBlockStatus.mockResolvedValue({ blockedByMe: false });
    const res = await toggleBlockActorController(USER_BLOCKER, TARGET, USER_BLOCKER);
    expect(blockActor).toHaveBeenCalledWith(USER_BLOCKER, TARGET);
    expect(res).toEqual({ blocked: true });
  });

  it("owned blocker, currently blocked → unblocks", async () => {
    checkBlockStatus.mockResolvedValue({ blockedByMe: true });
    const res = await toggleBlockActorController(USER_BLOCKER, TARGET, USER_BLOCKER);
    expect(unblockActor).toHaveBeenCalledWith(USER_BLOCKER, TARGET);
    expect(res).toEqual({ blocked: false });
  });

  it("forged/unowned blocker → throws, neither block nor unblock RPC called", async () => {
    readBlockActorOwnerLinkDAL.mockResolvedValue(null);
    await expect(toggleBlockActorController(USER_BLOCKER, TARGET, USER_BLOCKER)).rejects.toThrow(/does not own/i);
    expect(blockActor).not.toHaveBeenCalled();
    expect(unblockActor).not.toHaveBeenCalled();
  });
});
