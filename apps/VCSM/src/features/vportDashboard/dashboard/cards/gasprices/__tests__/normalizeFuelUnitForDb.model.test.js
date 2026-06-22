import { describe, it, expect } from "vitest";
import { normalizeFuelUnitForDb } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

// TICKET-FUEL-UNIT-001 — canonical DB unit normalization.
describe("normalizeFuelUnitForDb", () => {
  it("maps 'gallon' -> 'gal'", () => {
    expect(normalizeFuelUnitForDb("gallon")).toBe("gal");
  });

  it("passes DB-supported values through unchanged", () => {
    expect(normalizeFuelUnitForDb("gal")).toBe("gal");
    expect(normalizeFuelUnitForDb("liter")).toBe("liter");
    expect(normalizeFuelUnitForDb("kwh")).toBe("kwh");
  });
});
