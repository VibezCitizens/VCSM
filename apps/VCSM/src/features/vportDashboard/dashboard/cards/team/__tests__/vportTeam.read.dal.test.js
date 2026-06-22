import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockListValidMemberActorIds, queryResult } = vi.hoisted(() => ({
  mockListValidMemberActorIds: vi.fn(),
  queryResult: { current: { data: [], error: null } },
}));

// Chainable Supabase query-builder stub. Every method returns the builder, and
// the builder is awaitable (thenable) resolving to the configured result.
function makeBuilder() {
  const builder = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    then: (resolve) => resolve(queryResult.current),
  };
  return builder;
}

vi.mock("@/services/supabase/vportClient", () => ({
  default: makeBuilder(),
}));
vi.mock("@/services/supabase/vcClient", () => ({
  vc: makeBuilder(),
}));
vi.mock("@/features/vportDashboard/dal/read/actorValidity.read.dal", () => ({
  listValidMemberActorIdsDAL: mockListValidMemberActorIds,
}));

import { fetchTeamMembersByProfileId } from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal";

const ACTIVE_BARBER = { id: "res-active", name: "Active Barber", resource_type: "staff", is_active: true, member_actor_id: "actor-active", meta: { status: "linked" } };
const DELETED_BARBER = { id: "res-deleted", name: "Voided Barber", resource_type: "staff", is_active: true, member_actor_id: "actor-deleted", meta: { status: "linked" } };
const MISSING_BARBER = { id: "res-missing", name: "Ghost Barber", resource_type: "staff", is_active: true, member_actor_id: "actor-missing", meta: { status: "linked" } };
const MANUAL_STAFF = { id: "res-manual", name: "Manual Chair", resource_type: "staff", is_active: true, member_actor_id: null, meta: {} };

beforeEach(() => {
  vi.clearAllMocks();
  // Only the active barber's actor passes validity. Voided + missing actors are
  // absent from the returned set (mirrors actorValidity.read.dal behavior).
  mockListValidMemberActorIds.mockResolvedValue(new Set(["actor-active"]));
});

describe("fetchTeamMembersByProfileId — orphan member filtering", () => {
  it("returns [] without querying when profileId is missing", async () => {
    const result = await fetchTeamMembersByProfileId(null);
    expect(result).toEqual([]);
    expect(mockListValidMemberActorIds).not.toHaveBeenCalled();
  });

  it("counts an active barber whose actor is still valid", async () => {
    queryResult.current = { data: [ACTIVE_BARBER], error: null };
    const result = await fetchTeamMembersByProfileId("profile-1");
    expect(result.map((r) => r.id)).toContain(ACTIVE_BARBER.id);
  });

  it("does not count a deleted/voided barber", async () => {
    queryResult.current = { data: [ACTIVE_BARBER, DELETED_BARBER], error: null };
    const result = await fetchTeamMembersByProfileId("profile-1");
    expect(result.map((r) => r.id)).not.toContain(DELETED_BARBER.id);
  });

  it("does not count a member whose actor record is missing", async () => {
    queryResult.current = { data: [ACTIVE_BARBER, MISSING_BARBER], error: null };
    const result = await fetchTeamMembersByProfileId("profile-1");
    expect(result.map((r) => r.id)).not.toContain(MISSING_BARBER.id);
  });

  it("keeps a staff resource with a null member_actor_id (manual, non-linked)", async () => {
    queryResult.current = { data: [MANUAL_STAFF], error: null };
    const result = await fetchTeamMembersByProfileId("profile-1");
    expect(result.map((r) => r.id)).toContain(MANUAL_STAFF.id);
  });

  it("aligns totals with loadDaySchedule filtering: only valid + null-member rows remain", async () => {
    queryResult.current = {
      data: [ACTIVE_BARBER, DELETED_BARBER, MISSING_BARBER, MANUAL_STAFF],
      error: null,
    };
    const result = await fetchTeamMembersByProfileId("profile-1");

    // Identical predicate to loadDaySchedule.controller: keep when no member_actor_id
    // or the member actor is valid.
    const validSet = new Set(["actor-active"]);
    const expected = queryResult.current.data
      .filter((r) => !r.member_actor_id || validSet.has(r.member_actor_id))
      .map((r) => r.id);

    expect(result.map((r) => r.id)).toEqual(expected);
    expect(result).toHaveLength(2); // active barber + manual chair
    expect(mockListValidMemberActorIds).toHaveBeenCalledWith({
      actorIds: ["actor-active", "actor-deleted", "actor-missing"],
    });
  });
});
