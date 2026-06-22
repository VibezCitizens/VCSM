import { describe, it, expect, vi, beforeEach } from "vitest";

// TICKET-FUEL-UNIT-001 — fuel_prices.unit CHECK accepts only gal|liter|kwh.
// These DALs are the persistence boundary; they must normalize 'gallon' -> 'gal'.

const { fromFn, upsertFn, updateFn, eqFn, maybeSingle } = vi.hoisted(() => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: {}, error: null });
  const select = vi.fn(() => ({ maybeSingle }));
  const upsertFn = vi.fn(() => ({ select }));
  const eqFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateFn = vi.fn(() => ({ eq: eqFn }));
  const fromFn = vi.fn(() => ({ upsert: upsertFn, update: updateFn }));
  return { fromFn, upsertFn, updateFn, eqFn, maybeSingle };
});

vi.mock("@/services/supabase/vportClient", () => ({ default: { from: fromFn } }));
vi.mock("@/shared/lib/vport/resolveVportProfileId", () => ({
  resolveVportProfileId: vi.fn().mockResolvedValue("profile-uuid-abc"),
}));

import {
  upsertVportFuelPriceDAL,
  updateFuelPriceUnitForActorDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";

beforeEach(() => {
  vi.clearAllMocks();
  const select = vi.fn(() => ({ maybeSingle }));
  upsertFn.mockReturnValue({ select });
  updateFn.mockReturnValue({ eq: eqFn });
  fromFn.mockReturnValue({ upsert: upsertFn, update: updateFn });
});

describe("upsertVportFuelPriceDAL — unit normalization (owner price update path)", () => {
  it("persists 'gal' when the UI sends 'gallon'", async () => {
    await upsertVportFuelPriceDAL({
      targetActorId: "vport-actor",
      fuelKey: "regular",
      price: 3.05,
      unit: "gallon",
    });
    const [[rows]] = upsertFn.mock.calls;
    expect(rows[0].unit).toBe("gal");
  });

  it("passes through 'liter' and 'kwh' unchanged", async () => {
    await upsertVportFuelPriceDAL({ targetActorId: "a", fuelKey: "regular", price: 1, unit: "liter" });
    expect(upsertFn.mock.calls[0][0][0].unit).toBe("liter");
    await upsertVportFuelPriceDAL({ targetActorId: "a", fuelKey: "regular", price: 1, unit: "kwh" });
    expect(upsertFn.mock.calls[1][0][0].unit).toBe("kwh");
  });
});

describe("updateFuelPriceUnitForActorDAL — unit toggle path (the reported crash)", () => {
  it("persists 'gal' when the toggle sends 'gallon'", async () => {
    await updateFuelPriceUnitForActorDAL({ actorId: "vport-actor", unit: "gallon" });
    const [[patch]] = updateFn.mock.calls;
    expect(patch.unit).toBe("gal");
  });

  it("persists 'liter' unchanged", async () => {
    await updateFuelPriceUnitForActorDAL({ actorId: "vport-actor", unit: "liter" });
    expect(updateFn.mock.calls[0][0].unit).toBe("liter");
  });
});
