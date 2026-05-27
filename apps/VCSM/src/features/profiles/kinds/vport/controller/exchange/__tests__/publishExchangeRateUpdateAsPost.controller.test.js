import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock(
  "@/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal",
  () => ({
    resolveVportExchangeNameDAL: vi.fn(),
    hasRecentExchangeRatePostDAL: vi.fn(),
  })
);
vi.mock("@/features/upload/adapters/posts.adapter", () => ({
  createSystemPost: vi.fn(),
}));
vi.mock("@/shared/utils/resolveRealm", () => ({
  PUBLIC_REALM_ID: "test-realm-uuid-000",
}));
vi.mock("@/features/booking/adapters/booking.adapter", () => ({
  assertActorOwnsVportActorController: vi.fn(),
}));

import { publishExchangeRateUpdateAsPostController } from "../publishExchangeRateUpdateAsPost.controller.js";
import {
  resolveVportExchangeNameDAL,
  hasRecentExchangeRatePostDAL,
} from "@/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

const BASE_ARGS = {
  identityActorId: "identity-actor-1",
  actorId: "vport-actor-1",
  baseCurrency: "USD",
  quoteCurrency: "EUR",
  buyRate: 1.08,
  sellRate: 1.10,
};

beforeEach(() => {
  vi.clearAllMocks();
  assertActorOwnsVportActorController.mockResolvedValue({ ok: true, mode: "actor_owner" });
  hasRecentExchangeRatePostDAL.mockResolvedValue(false);
  resolveVportExchangeNameDAL.mockResolvedValue("Downtown FX Exchange");
  createSystemPost.mockResolvedValue({ id: "post-id-999" });
});

// ─── guard: actorId ──────────────────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — guard: actorId required", () => {
  it("throws when actorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, actorId: undefined })
    ).rejects.toThrow("actorId required");
  });

  it("does not call assertActorOwnsVportActorController when actorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, actorId: undefined })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });
});

// ─── guard: identityActorId ──────────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — guard: identityActorId required", () => {
  it("throws when identityActorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow("identityActorId required");
  });

  it("does not call assertActorOwnsVportActorController when identityActorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow();
    expect(assertActorOwnsVportActorController).not.toHaveBeenCalled();
  });

  it("does not call createSystemPost when identityActorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow();
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("does not call hasRecentExchangeRatePostDAL when identityActorId is missing", async () => {
    await expect(
      publishExchangeRateUpdateAsPostController({ ...BASE_ARGS, identityActorId: undefined })
    ).rejects.toThrow();
    expect(hasRecentExchangeRatePostDAL).not.toHaveBeenCalled();
  });
});

// ─── guard: missing currencies ───────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — guard: missing currencies", () => {
  it("returns {published:false, reason:'missing_currencies'} when baseCurrency is missing", async () => {
    const result = await publishExchangeRateUpdateAsPostController({
      ...BASE_ARGS,
      baseCurrency: undefined,
    });
    expect(result).toEqual({ published: false, reason: "missing_currencies" });
  });

  it("returns {published:false, reason:'missing_currencies'} when quoteCurrency is missing", async () => {
    const result = await publishExchangeRateUpdateAsPostController({
      ...BASE_ARGS,
      quoteCurrency: undefined,
    });
    expect(result).toEqual({ published: false, reason: "missing_currencies" });
  });
});

// ─── ownership check ─────────────────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — ownership check", () => {
  it("calls assertActorOwnsVportActorController with correct requestActorId and targetActorId", async () => {
    await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(assertActorOwnsVportActorController).toHaveBeenCalledWith({
      requestActorId: "identity-actor-1",
      targetActorId: "vport-actor-1",
    });
  });

  it("propagates ownership rejection without calling createSystemPost", async () => {
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error("Actor does not own this vport actor.")
    );
    await expect(publishExchangeRateUpdateAsPostController(BASE_ARGS)).rejects.toThrow(
      "Actor does not own this vport actor."
    );
    expect(createSystemPost).not.toHaveBeenCalled();
  });

  it("does not call hasRecentExchangeRatePostDAL when ownership fails", async () => {
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error("Actor does not own this vport actor.")
    );
    await expect(publishExchangeRateUpdateAsPostController(BASE_ARGS)).rejects.toThrow();
    expect(hasRecentExchangeRatePostDAL).not.toHaveBeenCalled();
  });

  it("does not call resolveVportExchangeNameDAL when ownership fails", async () => {
    assertActorOwnsVportActorController.mockRejectedValue(
      new Error("Actor does not own this vport actor.")
    );
    await expect(publishExchangeRateUpdateAsPostController(BASE_ARGS)).rejects.toThrow();
    expect(resolveVportExchangeNameDAL).not.toHaveBeenCalled();
  });
});

// ─── dedup throttle ──────────────────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — dedup throttle", () => {
  it("returns {published:false, reason:'dedup_throttle'} when hasRecentExchangeRatePostDAL returns true", async () => {
    hasRecentExchangeRatePostDAL.mockResolvedValue(true);
    const result = await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(result).toEqual({ published: false, reason: "dedup_throttle" });
  });

  it("does NOT call createSystemPost when dedup fires", async () => {
    hasRecentExchangeRatePostDAL.mockResolvedValue(true);
    await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(createSystemPost).not.toHaveBeenCalled();
  });
});

// ─── success path ─────────────────────────────────────────────────────────────

describe("publishExchangeRateUpdateAsPostController — success path", () => {
  it("calls resolveVportExchangeNameDAL with actorId to get exchange name", async () => {
    await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(resolveVportExchangeNameDAL).toHaveBeenCalledWith("vport-actor-1");
  });

  it("calls createSystemPost with post_type 'exchange_rate_update' and correct realm_id", async () => {
    await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({
        post_type: "exchange_rate_update",
        realm_id: "test-realm-uuid-000",
      })
    );
  });

  it("calls createSystemPost with the correct actorId", async () => {
    await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(createSystemPost).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "vport-actor-1" })
    );
  });

  it("returns {published:true, postId} on success", async () => {
    const result = await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(result).toEqual({ published: true, postId: "post-id-999" });
  });

  it("returns {published:true, postId:null} when createSystemPost returns no id", async () => {
    createSystemPost.mockResolvedValue(null);
    const result = await publishExchangeRateUpdateAsPostController(BASE_ARGS);
    expect(result).toEqual({ published: true, postId: null });
  });
});
