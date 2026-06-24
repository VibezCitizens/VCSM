import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetProfileId,
  mockListByProfile,
  mockListByOwner,
  mockListValidMemberActorIds,
  mockListRules,
  mockListBookings,
  mockListServices,
  mockAssertOwns,
  mockCapture,
} = vi.hoisted(() => ({
  mockGetProfileId: vi.fn(),
  mockListByProfile: vi.fn(),
  mockListByOwner: vi.fn(),
  mockListValidMemberActorIds: vi.fn(),
  mockListRules: vi.fn(),
  mockListBookings: vi.fn(),
  mockListServices: vi.fn(),
  mockAssertOwns: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("@/features/vportDashboard/dal/read/vportProfile.read.dal", () => ({
  getVportProfileIdByActorDAL: mockGetProfileId,
}));
vi.mock("@/features/vportDashboard/dal/read/vportResource.read.dal", () => ({
  listVportResourcesByProfileIdDAL: mockListByProfile,
  listVportResourcesByOwnerActorIdDAL: mockListByOwner,
}));
vi.mock("@/features/vportDashboard/dal/read/actorValidity.read.dal", () => ({
  listValidMemberActorIdsDAL: mockListValidMemberActorIds,
}));
vi.mock("@/features/vportDashboard/dal/read/vportAvailabilityRules.read.dal", () => ({
  listVportAvailabilityRulesByResourceIdsDAL: mockListRules,
}));
vi.mock("@/features/vportDashboard/dal/read/listVportBookingsForProfileDay.read.dal", () => ({
  listVportBookingsForProfileDayDAL: mockListBookings,
}));
vi.mock("@/features/vportDashboard/dal/read/vportServices.read.dal", () => ({
  listVportServicesByProfileIdDAL: mockListServices,
}));
vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: mockAssertOwns,
}));
vi.mock("@/services/monitoring/vcsmMonitoring", () => ({
  captureVcsmError: mockCapture,
}));

import { loadDayScheduleController } from "../controller/loadDaySchedule.controller";

const VPORT_ACTOR_ID = "vport-actor-1";
const PROFILE_ID = "profile-1";
const DATE_KEY = "2026-06-22";
const CALLER_ACTOR_ID = "caller-1";

// Resources returned by the DALs:
//  - primary lane:      no member_actor_id (the VPORT itself)
//  - active barber:     member_actor_id -> still-valid actor
//  - deleted barber:    is_active=true but member_actor_id -> deleted/void actor
const PRIMARY_RESOURCE = { id: "res-primary", member_actor_id: null, name: "Shop", resource_type: "primary" };
const ACTIVE_BARBER = { id: "res-active", member_actor_id: "actor-active", name: "Active Barber", resource_type: "staff" };
const DELETED_BARBER = { id: "res-deleted", member_actor_id: "actor-deleted", name: "Old Barber", resource_type: "staff" };

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertOwns.mockResolvedValue(true);
  mockGetProfileId.mockResolvedValue(PROFILE_ID);
  mockListByProfile.mockResolvedValue([PRIMARY_RESOURCE, ACTIVE_BARBER, DELETED_BARBER]);
  mockListByOwner.mockResolvedValue([]);
  mockListRules.mockResolvedValue([]);
  mockListBookings.mockResolvedValue([]);
  mockListServices.mockResolvedValue([]);
  // Only the active barber's actor is still valid; the deleted barber's actor
  // is voided/deleted/missing, so it is absent from the valid set.
  mockListValidMemberActorIds.mockResolvedValue(new Set(["actor-active"]));
});

describe("loadDayScheduleController — deleted team member filtering", () => {
  it("excludes a deleted/inactive team member resource from the lanes", async () => {
    const result = await loadDayScheduleController({
      actorId: VPORT_ACTOR_ID,
      dateKey: DATE_KEY,
      callerActorId: CALLER_ACTOR_ID,
    });

    const laneResourceIds = result.lanes.map((l) => l.resource.id);
    expect(laneResourceIds).not.toContain(DELETED_BARBER.id);
  });

  it("still renders the active barber lane", async () => {
    const result = await loadDayScheduleController({
      actorId: VPORT_ACTOR_ID,
      dateKey: DATE_KEY,
      callerActorId: CALLER_ACTOR_ID,
    });

    const laneResourceIds = result.lanes.map((l) => l.resource.id);
    expect(laneResourceIds).toContain(ACTIVE_BARBER.id);
  });

  it("hides the primary 'Default calendar' lane when staff/barber lanes exist", async () => {
    const result = await loadDayScheduleController({
      actorId: VPORT_ACTOR_ID,
      dateKey: DATE_KEY,
      callerActorId: CALLER_ACTOR_ID,
    });

    const laneResourceIds = result.lanes.map((l) => l.resource.id);
    expect(laneResourceIds).not.toContain(PRIMARY_RESOURCE.id);
  });

  it("keeps the primary lane for a solo vport with no staff resources", async () => {
    mockListByProfile.mockResolvedValueOnce([PRIMARY_RESOURCE]);
    mockListByOwner.mockResolvedValueOnce([]);

    const result = await loadDayScheduleController({
      actorId: VPORT_ACTOR_ID,
      dateKey: DATE_KEY,
      callerActorId: CALLER_ACTOR_ID,
    });

    const laneResourceIds = result.lanes.map((l) => l.resource.id);
    expect(laneResourceIds).toEqual([PRIMARY_RESOURCE.id]);
  });

  it("only validates the member actor ids that are present", async () => {
    await loadDayScheduleController({
      actorId: VPORT_ACTOR_ID,
      dateKey: DATE_KEY,
      callerActorId: CALLER_ACTOR_ID,
    });

    expect(mockListValidMemberActorIds).toHaveBeenCalledWith({
      actorIds: ["actor-active", "actor-deleted"],
    });
  });
});
