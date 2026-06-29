/**
 * Regression tests — updateStationFuelUnitController session-bound ownership
 *
 * TICKET-VPORTOWNERSHIP-AUTHZ-001 / V03A-H2:
 * The write sink must gate on the session-derived assertSessionOwnsActorController
 * (target vport actor only) instead of the self-grantable checkVportOwnership, and
 * must reject before any write DAL when the session does not own the vport.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/authorization/adapters/authorization.adapter", () => ({
  assertSessionOwnsActorController: vi.fn(),
}));

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal",
  () => ({ updateFuelPriceUnitForActorDAL: vi.fn() })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service",
  () => ({ FuelPriceCacheService: { invalidateOfficialPrices: vi.fn() } })
);

import { updateStationFuelUnitController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/updateStationFuelUnit.controller";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { updateFuelPriceUnitForActorDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";

const TARGET_ACTOR_ID = "vport-actor-1";
const ARGS = { actorId: TARGET_ACTOR_ID, targetActorId: TARGET_ACTOR_ID, unit: "gallon" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateStationFuelUnitController — session-bound ownership (V03A-H2)", () => {
  it("gates on the target vport actor via assertSessionOwnsActorController (no caller-supplied actor)", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true });
    updateFuelPriceUnitForActorDAL.mockResolvedValue({ error: null });

    await updateStationFuelUnitController(ARGS);

    expect(assertSessionOwnsActorController).toHaveBeenCalledWith({ targetActorId: TARGET_ACTOR_ID });
  });

  it("rejects with not_owner — before any write — when the session does not own the vport", async () => {
    assertSessionOwnsActorController.mockRejectedValue(new Error("denied"));

    const result = await updateStationFuelUnitController(ARGS);

    expect(result).toEqual({ ok: false, reason: "not_owner" });
    expect(updateFuelPriceUnitForActorDAL).not.toHaveBeenCalled();
  });

  it("proceeds with the unit write when the session owns the vport", async () => {
    assertSessionOwnsActorController.mockResolvedValue({ ok: true });
    updateFuelPriceUnitForActorDAL.mockResolvedValue({ error: null });

    const result = await updateStationFuelUnitController(ARGS);

    expect(result).toEqual({ ok: true, unit: "gallon" });
    expect(updateFuelPriceUnitForActorDAL).toHaveBeenCalledWith({ actorId: TARGET_ACTOR_ID, unit: "gallon" });
  });
});
