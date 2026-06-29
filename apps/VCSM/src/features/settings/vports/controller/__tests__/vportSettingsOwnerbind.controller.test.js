/**
 * Regression tests — VPORT settings canonical session-derived owner bind
 *
 * TICKET-SETTINGS-VPORT-CANONICAL-OWNERBIND-001 / V12A-M2:
 * Every VPORT settings read/mutation controller must authorize through the canonical
 * session-derived gate `assertSessionOwnsActorController({ targetActorId: vportActorId })`
 * — never the navigation-grade hybrid `checkVportOwnershipController` (whose self-grant
 * path, V03A-H2 lineage, accepted a caller-supplied actorId equality as proof of
 * ownership). On a non-owning session the gate rejects and NO write DAL runs.
 * Defense-in-depth; durable boundaries remain RLS (12A-DB-2/3/5, Phase 15).
 *
 * Per ticket: ownership behavior is driven solely by the authorization.adapter mock.
 * DAL modules are mocked to (a) assert the write DAL is not reached on denial and
 * (b) keep the success paths off the network.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));
vi.mock("@/features/settings/vports/dal/vports.read.dal", () => ({
  readVportDirectoryStateDAL: vi.fn(),
  readVportBusinessCardSettingsDAL: vi.fn(),
}));
vi.mock("@/features/settings/vports/dal/vports.write.dal", () => ({
  setVportDirectoryVisibleDAL: vi.fn(),
  syncDirectoryVisibleToPublicDetailsDAL: vi.fn(),
  setVportBusinessCardSettingsDAL: vi.fn(),
}));
vi.mock("@/features/social/adapters/social.adapter", () => ({
  dalGetActorSocialSettings: vi.fn(),
  dalUpdateActorSocialSettings: vi.fn(),
  invalidateActorSocialSettingsCache: vi.fn(),
  invalidateActorSocialPublicPolicyCache: vi.fn(),
}));

import {
  ctrlGetVportDirectoryState,
  ctrlSetVportDirectoryVisible,
} from "@/features/settings/vports/controller/vportDirectoryVisibility.controller";
import {
  ctrlGetVportBusinessCardSettings,
  ctrlSetVportBusinessCardSettings,
} from "@/features/settings/vports/controller/vportBusinessCardSettings.controller";
import {
  ctrlGetVportSocialSettings,
  ctrlUpdateVportSocialSettings,
} from "@/features/settings/vports/controller/vportSocialSettings.controller";

import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import {
  readVportDirectoryStateDAL,
  readVportBusinessCardSettingsDAL,
} from "@/features/settings/vports/dal/vports.read.dal";
import {
  setVportDirectoryVisibleDAL,
  syncDirectoryVisibleToPublicDetailsDAL,
  setVportBusinessCardSettingsDAL,
} from "@/features/settings/vports/dal/vports.write.dal";
import {
  dalGetActorSocialSettings,
  dalUpdateActorSocialSettings,
} from "@/features/social/adapters/social.adapter";

const DENIED = "Only owners or managers can manage this VPORT.";

const VPORT_ID = "vp-profile-1";
const VPORT_ACTOR = "vport-actor-1";
const USER_OWNER_ACTOR = "user-actor-1";

// "active vport self" = caller is operating AS the vport (callerActorId === vportActorId).
// The canonical gate ignores callerActorId and re-derives session ownership of the target.
const denySession = () => assertSessionOwnsActorController.mockRejectedValue(new Error("Session user does not own this vport actor."));
const grantSession = () => assertSessionOwnsActorController.mockResolvedValue({ ok: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vportDirectoryVisibility — canonical session owner bind (V12A-M2)", () => {
  it("ctrlSetVportDirectoryVisible: non-owner session rejects and never writes", async () => {
    denySession();

    await expect(
      ctrlSetVportDirectoryVisible({ vportId: VPORT_ID, visible: true, callerActorId: "attacker", vportActorId: VPORT_ACTOR })
    ).rejects.toThrow(DENIED);

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(setVportDirectoryVisibleDAL).not.toHaveBeenCalled();
    expect(syncDirectoryVisibleToPublicDetailsDAL).not.toHaveBeenCalled();
  });

  it("ctrlSetVportDirectoryVisible: user owner succeeds", async () => {
    grantSession();
    setVportDirectoryVisibleDAL.mockResolvedValue({ id: VPORT_ID, directory_visible: true });
    syncDirectoryVisibleToPublicDetailsDAL.mockResolvedValue(undefined);

    const result = await ctrlSetVportDirectoryVisible({ vportId: VPORT_ID, visible: true, callerActorId: USER_OWNER_ACTOR, vportActorId: VPORT_ACTOR });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(setVportDirectoryVisibleDAL).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: VPORT_ID, directory_visible: true });
  });

  it("ctrlSetVportDirectoryVisible: active vport self succeeds", async () => {
    grantSession();
    setVportDirectoryVisibleDAL.mockResolvedValue({ id: VPORT_ID, directory_visible: false });
    syncDirectoryVisibleToPublicDetailsDAL.mockResolvedValue(undefined);

    const result = await ctrlSetVportDirectoryVisible({ vportId: VPORT_ID, visible: false, callerActorId: VPORT_ACTOR, vportActorId: VPORT_ACTOR });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(setVportDirectoryVisibleDAL).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ directory_visible: false });
  });

  it("ctrlGetVportDirectoryState: non-owner session rejects and never reads", async () => {
    denySession();

    await expect(
      ctrlGetVportDirectoryState({ vportId: VPORT_ID, callerActorId: "attacker", vportActorId: VPORT_ACTOR })
    ).rejects.toThrow(DENIED);

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(readVportDirectoryStateDAL).not.toHaveBeenCalled();
  });
});

describe("vportBusinessCardSettings — canonical session owner bind (V12A-M2)", () => {
  it("ctrlSetVportBusinessCardSettings: non-owner session rejects and never writes", async () => {
    denySession();

    await expect(
      ctrlSetVportBusinessCardSettings({ vportId: VPORT_ID, settings: { theme: "x" }, callerActorId: "attacker", vportActorId: VPORT_ACTOR })
    ).rejects.toThrow(DENIED);

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(setVportBusinessCardSettingsDAL).not.toHaveBeenCalled();
  });

  it("ctrlSetVportBusinessCardSettings: user owner succeeds", async () => {
    grantSession();
    setVportBusinessCardSettingsDAL.mockResolvedValue({ id: VPORT_ID, business_card_settings: { theme: "x" } });

    const result = await ctrlSetVportBusinessCardSettings({ vportId: VPORT_ID, settings: { theme: "x" }, callerActorId: USER_OWNER_ACTOR, vportActorId: VPORT_ACTOR });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(setVportBusinessCardSettingsDAL).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: VPORT_ID });
  });

  it("ctrlSetVportBusinessCardSettings: active vport self succeeds", async () => {
    grantSession();
    setVportBusinessCardSettingsDAL.mockResolvedValue({ id: VPORT_ID, business_card_settings: { theme: "y" } });

    const result = await ctrlSetVportBusinessCardSettings({ vportId: VPORT_ID, settings: { theme: "y" }, callerActorId: VPORT_ACTOR, vportActorId: VPORT_ACTOR });

    expect(setVportBusinessCardSettingsDAL).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ business_card_settings: { theme: "y" } });
  });

  it("ctrlGetVportBusinessCardSettings: non-owner session rejects and never reads", async () => {
    denySession();

    await expect(
      ctrlGetVportBusinessCardSettings({ vportId: VPORT_ID, callerActorId: "attacker", vportActorId: VPORT_ACTOR })
    ).rejects.toThrow(DENIED);

    expect(readVportBusinessCardSettingsDAL).not.toHaveBeenCalled();
  });
});

describe("vportSocialSettings — canonical session owner bind (V12A-M2)", () => {
  const PATCH = { account_visibility: "public" };

  it("ctrlUpdateVportSocialSettings: non-owner session rejects and never writes", async () => {
    denySession();

    await expect(
      ctrlUpdateVportSocialSettings({ vportActorId: VPORT_ACTOR, patch: PATCH, callerActorId: "attacker" })
    ).rejects.toThrow(DENIED);

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(dalUpdateActorSocialSettings).not.toHaveBeenCalled();
  });

  it("ctrlUpdateVportSocialSettings: user owner succeeds", async () => {
    grantSession();
    dalUpdateActorSocialSettings.mockResolvedValue({ account_visibility: "public" });

    const result = await ctrlUpdateVportSocialSettings({ vportActorId: VPORT_ACTOR, patch: PATCH, callerActorId: USER_OWNER_ACTOR });

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: VPORT_ACTOR });
    expect(dalUpdateActorSocialSettings).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ account_visibility: "public" });
  });

  it("ctrlUpdateVportSocialSettings: active vport self succeeds", async () => {
    grantSession();
    dalUpdateActorSocialSettings.mockResolvedValue({ account_visibility: "public" });

    const result = await ctrlUpdateVportSocialSettings({ vportActorId: VPORT_ACTOR, patch: PATCH, callerActorId: VPORT_ACTOR });

    expect(dalUpdateActorSocialSettings).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ account_visibility: "public" });
  });

  it("ctrlGetVportSocialSettings: non-owner session rejects and never reads", async () => {
    denySession();

    await expect(
      ctrlGetVportSocialSettings({ vportActorId: VPORT_ACTOR, callerActorId: "attacker" })
    ).rejects.toThrow(DENIED);

    expect(dalGetActorSocialSettings).not.toHaveBeenCalled();
  });
});
