import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/booking/adapters/booking.adapter", () => ({
  assertSessionOwnsVportActorController: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportProfile.read.dal", () => ({
  readVportProfileByActorIdDAL: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal", () => ({
  fetchTeamMembersByProfileId: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal", () => ({
  insertLinkedTeamMemberDAL: vi.fn(),
  updateTeamMemberRoleDAL: vi.fn(),
  setTeamMemberActiveDAL: vi.fn(),
  deleteTeamMemberByIdDAL: vi.fn(),
}));

vi.mock("@/features/actors/adapters/actors.adapter", () => ({
  searchActorsAdapter: vi.fn(),
}));

import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { fetchTeamMembersByProfileId } from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal";
import {
  deleteTeamMemberByIdDAL,
  setTeamMemberActiveDAL,
  updateTeamMemberRoleDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal";
import {
  removeTeamMemberController,
  setTeamMemberStatusController,
  updateTeamMemberRoleController,
} from "../controller/vportTeamAccess.controller";

const ACTOR_ID = "actor-shop-1";
const CALLER_ID = "actor-owner-1";
const PROFILE_ID = "profile-shop-1";
const RESOURCE_ID = "resource-staff-1";

function ownerRow(overrides = {}) {
  return {
    id: "owner-resource",
    is_active: true,
    member_actor_id: "actor-owner-member",
    meta: { role: "owner" },
    ...overrides,
  };
}

function staffRow(overrides = {}) {
  return {
    id: RESOURCE_ID,
    is_active: true,
    member_actor_id: "actor-staff-1",
    meta: { role: "staff" },
    ...overrides,
  };
}

describe("vportTeamAccess.controller — scoped write DAL calls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertSessionOwnsVportActorController.mockResolvedValue({ ok: true });
    readVportProfileByActorIdDAL.mockResolvedValue({ id: PROFILE_ID });
    fetchTeamMembersByProfileId.mockResolvedValue([ownerRow(), staffRow()]);
  });

  it("passes profileId to updateTeamMemberRoleDAL after ownership and target validation", async () => {
    updateTeamMemberRoleDAL.mockResolvedValue(staffRow({ meta: { role: "manager" } }));

    await updateTeamMemberRoleController(ACTOR_ID, { resourceId: RESOURCE_ID, role: "manager" }, CALLER_ID);

    expect(assertSessionOwnsVportActorController).toHaveBeenCalledWith({
      targetActorId: ACTOR_ID,
    });
    expect(updateTeamMemberRoleDAL).toHaveBeenCalledWith({
      resourceId: RESOURCE_ID,
      profileId: PROFILE_ID,
      meta: { role: "staff" },
      role: "manager",
    });
  });

  it("passes profileId to setTeamMemberActiveDAL after ownership and target validation", async () => {
    setTeamMemberActiveDAL.mockResolvedValue(staffRow({ is_active: false }));

    await setTeamMemberStatusController(ACTOR_ID, { resourceId: RESOURCE_ID, status: "inactive" }, CALLER_ID);

    expect(setTeamMemberActiveDAL).toHaveBeenCalledWith({
      resourceId: RESOURCE_ID,
      profileId: PROFILE_ID,
      isActive: false,
    });
  });

  it("passes profileId to deleteTeamMemberByIdDAL after ownership and target validation", async () => {
    deleteTeamMemberByIdDAL.mockResolvedValue(undefined);

    await removeTeamMemberController(ACTOR_ID, { resourceId: RESOURCE_ID }, CALLER_ID);

    expect(deleteTeamMemberByIdDAL).toHaveBeenCalledWith({
      resourceId: RESOURCE_ID,
      profileId: PROFILE_ID,
    });
  });

  it("does not call write DALs when ownership fails", async () => {
    assertSessionOwnsVportActorController.mockRejectedValue(new Error("not owner"));

    await expect(
      updateTeamMemberRoleController(ACTOR_ID, { resourceId: RESOURCE_ID, role: "manager" }, "attacker")
    ).rejects.toThrow("not owner");

    expect(readVportProfileByActorIdDAL).not.toHaveBeenCalled();
    expect(updateTeamMemberRoleDAL).not.toHaveBeenCalled();
  });
});
