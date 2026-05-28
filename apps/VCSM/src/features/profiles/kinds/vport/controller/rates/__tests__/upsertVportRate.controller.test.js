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

// ─── guard: identityActorId ───────────────────────────────────────────────────

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

// ─── guard: actorId ───────────────────────────────────────────────────────────

describe("upsertVportRateController — guard: actorId required", () => {
  it("throws when actorId is missing", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, actorId: undefined })
    ).rejects.toThrow("actorId required");
  });

  it("does not call assertActorOwnsVportActorController when actorId is missing", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, actorId: undefined })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });

  it("does not call upsertVportRateDal when actorId is missing", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, actorId: undefined })
    ).rejects.toThrow();
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

// ─── rateType validation ──────────────────────────────────────────────────────

describe("upsertVportRateController — rateType validation", () => {
  it("throws when rateType is an unsupported value", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, rateType: "crypto" })
    ).rejects.toThrow("rateType must be a supported rate type");
  });

  it("throws when rateType is empty string", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, rateType: "" })
    ).rejects.toThrow("rateType must be a supported rate type");
  });

  it("throws when rateType is null", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, rateType: null })
    ).rejects.toThrow("rateType must be a supported rate type");
  });

  it("normalizes uppercase rateType to lowercase", async () => {
    await upsertVportRateController({ ...BASE_ARGS, rateType: "FX" });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ rateType: "fx" })
    );
  });

  it("does not call assertActorOwnsVportActorController when rateType is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, rateType: "crypto" })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });
});

// ─── meta validation ──────────────────────────────────────────────────────────

describe("upsertVportRateController — meta validation", () => {
  it("passes null meta through as null", async () => {
    await upsertVportRateController({ ...BASE_ARGS, meta: null });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ meta: null })
    );
  });

  it("passes undefined meta as null", async () => {
    await upsertVportRateController({ ...BASE_ARGS, meta: undefined });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ meta: null })
    );
  });

  it("accepts a valid plain object", async () => {
    const meta = { note: "test note" };
    await upsertVportRateController({ ...BASE_ARGS, meta });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ meta })
    );
  });

  it("throws when meta is an array", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, meta: ["item"] })
    ).rejects.toThrow("meta must be a plain object or null");
  });

  it("throws when meta is a string", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, meta: "invalid" })
    ).rejects.toThrow("meta must be a plain object or null");
  });

  it("throws when meta exceeds 2048 bytes", async () => {
    const meta = { data: "x".repeat(2050) };
    await expect(
      upsertVportRateController({ ...BASE_ARGS, meta })
    ).rejects.toThrow("meta exceeds maximum allowed size");
  });

  it("does not call assertActorOwnsVportActorController when meta is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, meta: ["bad"] })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });
});

// ─── rate validation: buyRate ─────────────────────────────────────────────────

describe("upsertVportRateController — rate validation: buyRate", () => {
  it("throws when buyRate is 0", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: 0 })
    ).rejects.toThrow("buyRate must be a positive finite number");
  });

  it("throws when buyRate is negative", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: -1.5 })
    ).rejects.toThrow("buyRate must be a positive finite number");
  });

  it("throws when buyRate is NaN", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: NaN })
    ).rejects.toThrow("buyRate must be a positive finite number");
  });

  it("throws when buyRate is Infinity", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: Infinity })
    ).rejects.toThrow("buyRate must be a positive finite number");
  });

  it("throws when buyRate is a non-numeric string", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: "not-a-number" })
    ).rejects.toThrow("buyRate must be a positive finite number");
  });

  it("does not call assertActorOwnsVportActorController when buyRate is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: 0 })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });

  it("does not call upsertVportRateDal when buyRate is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, buyRate: -5 })
    ).rejects.toThrow();
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

// ─── rate validation: sellRate ────────────────────────────────────────────────

describe("upsertVportRateController — rate validation: sellRate", () => {
  it("throws when sellRate is 0", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: 0 })
    ).rejects.toThrow("sellRate must be a positive finite number");
  });

  it("throws when sellRate is negative", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: -0.01 })
    ).rejects.toThrow("sellRate must be a positive finite number");
  });

  it("throws when sellRate is NaN", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: NaN })
    ).rejects.toThrow("sellRate must be a positive finite number");
  });

  it("throws when sellRate is Infinity", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: Infinity })
    ).rejects.toThrow("sellRate must be a positive finite number");
  });

  it("does not call assertActorOwnsVportActorController when sellRate is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: 0 })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });

  it("does not call upsertVportRateDal when sellRate is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, sellRate: NaN })
    ).rejects.toThrow();
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

// ─── currency validation ──────────────────────────────────────────────────────

describe("upsertVportRateController — currency validation", () => {
  it("throws when baseCurrency is an unsupported code", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, baseCurrency: "XYZ" })
    ).rejects.toThrow("baseCurrency must be a supported ISO 4217 currency code");
  });

  it("throws when quoteCurrency is an unsupported code", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, quoteCurrency: "ABC" })
    ).rejects.toThrow("quoteCurrency must be a supported ISO 4217 currency code");
  });

  it("throws when baseCurrency is an empty string", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, baseCurrency: "" })
    ).rejects.toThrow("baseCurrency must be a supported ISO 4217 currency code");
  });

  it("throws when quoteCurrency is undefined", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, quoteCurrency: undefined })
    ).rejects.toThrow("quoteCurrency must be a supported ISO 4217 currency code");
  });

  it("throws when baseCurrency and quoteCurrency are the same supported code", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, baseCurrency: "USD", quoteCurrency: "USD" })
    ).rejects.toThrow("baseCurrency and quoteCurrency must differ");
  });

  it("does not call assertActorOwnsVportActorController when currency is invalid", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, baseCurrency: "FAKE" })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });

  it("does not call upsertVportRateDal when same-currency pair is supplied", async () => {
    await expect(
      upsertVportRateController({ ...BASE_ARGS, baseCurrency: "MXN", quoteCurrency: "MXN" })
    ).rejects.toThrow();
    expect(upsertVportRateDal).not.toHaveBeenCalled();
  });
});

// ─── normalization ────────────────────────────────────────────────────────────

describe("upsertVportRateController — currency normalization", () => {
  it("normalizes lowercase baseCurrency and quoteCurrency to uppercase before DAL call", async () => {
    await upsertVportRateController({ ...BASE_ARGS, baseCurrency: "usd", quoteCurrency: "mxn" });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ baseCurrency: "USD", quoteCurrency: "MXN" })
    );
  });

  it("normalizes mixed-case currency codes to uppercase", async () => {
    await upsertVportRateController({ ...BASE_ARGS, baseCurrency: "Eur", quoteCurrency: "GbP" });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ baseCurrency: "EUR", quoteCurrency: "GBP" })
    );
  });

  it("coerces numeric-string rates to numbers before DAL call", async () => {
    await upsertVportRateController({ ...BASE_ARGS, buyRate: "1.25", sellRate: "1.30" });
    expect(upsertVportRateDal).toHaveBeenCalledWith(
      expect.objectContaining({ buyRate: 1.25, sellRate: 1.30 })
    );
  });
});

// ─── ownership check ──────────────────────────────────────────────────────────

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

// ─── DAL write path ───────────────────────────────────────────────────────────

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

// ─── cache invalidation ───────────────────────────────────────────────────────

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
