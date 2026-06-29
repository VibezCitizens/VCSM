/**
 * VPORT lifecycle owner-bind — account controller
 *
 * TICKET-VPORT-LIFECYCLE-OWNERBIND-001 (V12B-M2):
 * Soft-delete and restore previously issued their DEFINER RPC with NO app-layer
 * ownership gate. Both now resolve the vport actor from vportId and assert the
 * authenticated session owns it via the canonical VPORT-ONLY helper
 * (assertSessionOwnsActorController) before the write. Hard-delete is out of scope
 * (V12B-L2) and untouched.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/settings/account/dal/account.read.dal", () => ({
  dalReadActorIdByVportId: vi.fn(),
}));

vi.mock("@/features/settings/profile/dal/actors.read.dal", () => ({
  dalReadVportIdByActorId: vi.fn(),
}));

vi.mock("@/features/settings/account/dal/account.write.dal", () => ({
  dalDeleteCitizenAccountFull: vi.fn(),
  dalDeleteMyVport: vi.fn(),
  dalHardDeleteVport: vi.fn(),
  dalRestoreVport: vi.fn(),
}));

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
  assertActorOwnsActorController: vi.fn(),
}));

import {
  ctrlSoftDeleteVport,
  ctrlRestoreVport,
} from "@/features/settings/account/controller/account.controller";
import { dalReadActorIdByVportId } from "@/features/settings/account/dal/account.read.dal";
import {
  dalDeleteMyVport,
  dalRestoreVport,
} from "@/features/settings/account/dal/account.write.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

const VPORT_ID = "vport-profile-id-1";
const VPORT_ACTOR_ID = "vport-actor-id-1";

beforeEach(() => {
  vi.clearAllMocks();
  dalReadActorIdByVportId.mockResolvedValue(VPORT_ACTOR_ID);
  assertSessionOwnsActorController.mockResolvedValue({ ok: true });
  dalDeleteMyVport.mockResolvedValue({ ok: true });
  dalRestoreVport.mockResolvedValue({ ok: true });
});

describe("ctrlSoftDeleteVport — V12B-M2 owner bind", () => {
  it("owner passes: asserts then soft-deletes", async () => {
    await ctrlSoftDeleteVport({ vportId: VPORT_ID });
    expect(assertSessionOwnsActorController).toHaveBeenCalledOnce();
    expect(dalDeleteMyVport).toHaveBeenCalledWith(VPORT_ID);
  });

  it("helper receives the RESOLVED vportActorId (not the raw vportId)", async () => {
    await ctrlSoftDeleteVport({ vportId: VPORT_ID });
    expect(dalReadActorIdByVportId).toHaveBeenCalledWith(VPORT_ID);
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR_ID });
  });

  it("non-owner rejected: throws and never soft-deletes", async () => {
    assertSessionOwnsActorController.mockRejectedValue(new Error("Session user does not own this vport actor."));
    await expect(ctrlSoftDeleteVport({ vportId: VPORT_ID })).rejects.toThrow();
    expect(dalDeleteMyVport).not.toHaveBeenCalled();
  });

  it("DAL not called when the vport actor cannot be resolved", async () => {
    dalReadActorIdByVportId.mockResolvedValue(null);
    await expect(ctrlSoftDeleteVport({ vportId: VPORT_ID })).rejects.toThrow();
    expect(assertSessionOwnsActorController).not.toHaveBeenCalled();
    expect(dalDeleteMyVport).not.toHaveBeenCalled();
  });
});

describe("ctrlRestoreVport — V12B-M2 owner bind", () => {
  it("owner passes: asserts then restores", async () => {
    await ctrlRestoreVport({ vportId: VPORT_ID });
    expect(assertSessionOwnsActorController).toHaveBeenCalledOnce();
    expect(dalRestoreVport).toHaveBeenCalledWith(VPORT_ID);
  });

  it("helper receives the RESOLVED vportActorId (not the raw vportId)", async () => {
    await ctrlRestoreVport({ vportId: VPORT_ID });
    expect(dalReadActorIdByVportId).toHaveBeenCalledWith(VPORT_ID);
    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR_ID });
  });

  it("non-owner rejected: throws and never restores", async () => {
    assertSessionOwnsActorController.mockRejectedValue(new Error("Session user does not own this vport actor."));
    await expect(ctrlRestoreVport({ vportId: VPORT_ID })).rejects.toThrow();
    expect(dalRestoreVport).not.toHaveBeenCalled();
  });

  it("DAL not called when the vport actor cannot be resolved", async () => {
    dalReadActorIdByVportId.mockResolvedValue(null);
    await expect(ctrlRestoreVport({ vportId: VPORT_ID })).rejects.toThrow();
    expect(assertSessionOwnsActorController).not.toHaveBeenCalled();
    expect(dalRestoreVport).not.toHaveBeenCalled();
  });
});
