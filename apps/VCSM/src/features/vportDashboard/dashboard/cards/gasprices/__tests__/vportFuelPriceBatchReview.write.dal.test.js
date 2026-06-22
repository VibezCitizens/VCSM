import { describe, it, expect, vi, beforeEach } from "vitest";

const { rpcFn } = vi.hoisted(() => ({ rpcFn: vi.fn() }));

vi.mock("@/services/supabase/vportClient", () => ({
  default: { rpc: rpcFn },
}));

vi.mock("@/shared/lib/vport/resolveVportProfileId", () => ({
  resolveVportProfileId: vi.fn().mockResolvedValue("profile-uuid-abc"),
}));

import {
  approveFuelPriceSubmissionBatchDAL,
  rejectFuelPriceSubmissionBatchDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceBatchReview.write.dal";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

beforeEach(() => {
  vi.clearAllMocks();
  resolveVportProfileId.mockResolvedValue("profile-uuid-abc");
});

describe("approveFuelPriceSubmissionBatchDAL", () => {
  it("resolves profileId internally and calls the RPC with profile + batch + reason", async () => {
    rpcFn.mockResolvedValue({
      data: [{ approved_count: 1, applied_count: 1, stale_skipped_count: 0 }],
      error: null,
    });

    const { data, error } = await approveFuelPriceSubmissionBatchDAL({
      targetActorId: "vport-actor-gas",
      submissionBatchId: "batch-1",
      reason: "ok",
    });

    expect(resolveVportProfileId).toHaveBeenCalledWith("vport-actor-gas");
    expect(rpcFn).toHaveBeenCalledWith("approve_fuel_price_submission_batch", {
      p_profile_id: "profile-uuid-abc",
      p_submission_batch_id: "batch-1",
      p_reason: "ok",
    });
    // RETURNS TABLE → array; DAL unwraps to the single row.
    expect(data).toEqual({ approved_count: 1, applied_count: 1, stale_skipped_count: 0 });
    expect(error).toBeNull();
  });

  it("never forwards a caller-supplied profileId (actor-first)", async () => {
    rpcFn.mockResolvedValue({ data: [{}], error: null });
    await approveFuelPriceSubmissionBatchDAL({
      targetActorId: "vport-actor-gas",
      submissionBatchId: "batch-1",
    });
    const [, args] = rpcFn.mock.calls[0];
    expect(args.p_profile_id).toBe("profile-uuid-abc");
    expect(args.p_reason).toBeNull();
  });

  it("returns an error when the profile cannot be resolved", async () => {
    resolveVportProfileId.mockResolvedValue(null);
    const { data, error } = await approveFuelPriceSubmissionBatchDAL({
      targetActorId: "vport-actor-gas",
      submissionBatchId: "batch-1",
    });
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(rpcFn).not.toHaveBeenCalled();
  });

  it("throws when submissionBatchId is missing", async () => {
    await expect(
      approveFuelPriceSubmissionBatchDAL({ targetActorId: "vport-actor-gas" })
    ).rejects.toThrow("submissionBatchId required");
  });
});

describe("rejectFuelPriceSubmissionBatchDAL", () => {
  it("calls the reject RPC and unwraps rejected_count", async () => {
    rpcFn.mockResolvedValue({ data: [{ rejected_count: 2 }], error: null });
    const { data } = await rejectFuelPriceSubmissionBatchDAL({
      targetActorId: "vport-actor-gas",
      submissionBatchId: "batch-1",
      reason: "spam",
    });
    expect(rpcFn).toHaveBeenCalledWith("reject_fuel_price_submission_batch", {
      p_profile_id: "profile-uuid-abc",
      p_submission_batch_id: "batch-1",
      p_reason: "spam",
    });
    expect(data).toEqual({ rejected_count: 2 });
  });
});
