import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js", () => ({
  default: vi.fn(),
}));
vi.mock("@/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js", () => ({
  invalidateRatesCache: vi.fn(),
}));
vi.mock("@/features/booking/adapters/booking.adapter", () => ({
  assertActorOwnsVportActorController: vi.fn(),
}));

import upsertVportRateController from "../upsertVportRate.controller.js";
import upsertVportRateDal from "@/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js";
import { invalidateRatesCache } from "@/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const BASE_ARGS = {
  identityActorId: "identity-actor-1",
  actorId: "vport-actor-1",
  rateType: "fx",
  baseCurrency: "USD",
  quoteCurrency: "EUR",
  buyRate: 1.08,
  sellRate: 1.10,
  meta: null,
};

const MOCK_RESULT = {
  id: "rate-row-id-1",
  profile_id: "profile-uuid-1",
  rate_type: "fx",
  base_currency: "USD",
  quote_currency: "EUR",
  buy_rate: 1.08,
  sell_rate: 1.10,
  meta: null,
  updated_at: "2026-05-27T03:00:00.000Z",
  created_at: "2026-05-27T03:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  assertActorOwnsVportActorController.mockResolvedValue(undefined);
  upsertVportRateDal.mockResolvedValue(MOCK_RESULT);
});

describe("upsertVportRateController — guard: identityActorId required", () => {
  it("throws when identityActorId is missing", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow("identityActorId required");
  });

  it("does not call upsertVportRateDal when identityActorId is missing", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow();
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

describe("upsertVportRateController — ownership check", () => {
  it("calls assertActorOwnsVportActorController with named object params", async () => {
    await upsertVportRateController(BASE_ARGS);
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: "identity-actor-1",
      targetActorId: "vport-actor-1",
    });
  });

  it("propagates ownership rejection without calling upsertVportRateDal", async () => {
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error("ownership check failed")
    );
    await expect(upsertVportRateController(BASE_ARGS)).rejects.toThrow(
      "ownership check failed"
    );
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

describe("upsertVportRateController — DAL write path", () => {
  it("calls upsertVportRateDal with correct args on success", async () => {
    await upsertVportRateController(BASE_ARGS);
    expect(upsertVportRateDal).toHaveBeenCalledWith({
      actorId: "vport-actor-1",
      rateType: "fx",
      baseCurrency: "USD",
      quoteCurrency: "EUR",
      buyRate: 1.08,
      sellRate: 1.10,
      meta: null,
    });
  });

  it("returns the upsert DAL result", async () => {
    const result = await upsertVportRateController(BASE_ARGS);
    expect(result).toEqual(MOCK_RESULT);
  });
});

describe("upsertVportRateController — cache invalidation", () => {
  it("calls invalidateRatesCache after a successful write", async () => {
    await upsertVportRateController(BASE_ARGS);
    expect(invalidateRatesCache).toHaveBeenCalledTimes(1);
  });

  it("does NOT call invalidateRatesCache when upsertVportRateDal throws", async () => {
    upsertVportRateDal.mockRejectedValue(new Error("DAL write failed"));
    await expect(upsertVportRateController(BASE_ARGS)).rejects.toThrow(
      "DAL write failed"
    );
    expect(invalidateRatesCache).not.toHaveBeenCalled();
  });

  it("rethrows the DAL error to the caller", async () => {
    upsertVportRateDal.mockRejectedValue(new Error("db constraint violation"));
    await expect(upsertVportRateController(BASE_ARGS)).rejects.toThrow(
      "db constraint violation"
    );
  });
});
