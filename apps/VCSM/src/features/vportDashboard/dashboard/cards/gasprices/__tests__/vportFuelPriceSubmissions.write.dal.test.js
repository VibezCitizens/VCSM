import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — must exist before vi.mock factories run
// ---------------------------------------------------------------------------

const { insertFn, fromFn } = vi.hoisted(() => {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "sub-001" }, error: null });
  const select = vi.fn(() => ({ maybeSingle }));
  const insertFn = vi.fn(() => ({ select }));
  const fromFn = vi.fn(() => ({ insert: insertFn }));
  return { insertFn, fromFn };
});

vi.mock("@/services/supabase/vportClient", () => ({
  default: { from: fromFn },
}));

vi.mock(
  "@/shared/lib/vport/resolveVportProfileId",
  () => ({
    resolveVportProfileId: vi.fn().mockResolvedValue("profile-uuid-abc"),
  })
);

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { createFuelPriceSubmissionDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_ARGS = {
  targetActorId: "vport-actor-abc",
  fuelKey: "regular",
  proposedPrice: 1.89,
  currencyCode: "USD",
  unit: "liter",
  submittedByActorId: "citizen-actor-xyz",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  fromFn.mockReturnValue({ insert: insertFn });

  const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "sub-001" }, error: null });
  const select = vi.fn(() => ({ maybeSingle }));
  insertFn.mockReturnValue({ select });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createFuelPriceSubmissionDAL — evidence removal", () => {
  it("does NOT include evidence in the INSERT payload", async () => {
    await createFuelPriceSubmissionDAL(BASE_ARGS);

    expect(insertFn).toHaveBeenCalledOnce();
    const [[insertedRows]] = insertFn.mock.calls;
    const payload = insertedRows[0];
    expect(payload).not.toHaveProperty("evidence");
  });

  it("inserts the expected fields", async () => {
    await createFuelPriceSubmissionDAL(BASE_ARGS);

    const [[insertedRows]] = insertFn.mock.calls;
    const payload = insertedRows[0];
    expect(payload).toMatchObject({
      fuel_key: "regular",
      proposed_price: 1.89,
      currency_code: "USD",
      unit: "liter",
      submitted_by_actor_id: "citizen-actor-xyz",
      status: "pending",
    });
  });

  it("normalizes unit 'gallon' to 'gal' (submissions CHECK only accepts gal)", async () => {
    await createFuelPriceSubmissionDAL({ ...BASE_ARGS, unit: "gallon" });

    const [[insertedRows]] = insertFn.mock.calls;
    const payload = insertedRows[0];
    expect(payload.unit).toBe("gal");
  });

  it("passes through allowed units unchanged", async () => {
    await createFuelPriceSubmissionDAL({ ...BASE_ARGS, unit: "kwh" });

    const [[insertedRows]] = insertFn.mock.calls;
    const payload = insertedRows[0];
    expect(payload.unit).toBe("kwh");
  });

  it("throws when targetActorId is missing", async () => {
    await expect(
      createFuelPriceSubmissionDAL({ ...BASE_ARGS, targetActorId: undefined })
    ).rejects.toThrow("targetActorId required");
  });

  it("throws when fuelKey is missing", async () => {
    await expect(
      createFuelPriceSubmissionDAL({ ...BASE_ARGS, fuelKey: undefined })
    ).rejects.toThrow("fuelKey required");
  });
});
