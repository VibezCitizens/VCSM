import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceBatchReview.write.dal",
  () => ({
    approveFuelPriceSubmissionBatchDAL: vi.fn(),
    rejectFuelPriceSubmissionBatchDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service",
  () => ({
    FuelPriceCacheService: {
      invalidateOfficialPrices: vi.fn(),
      invalidatePendingSubmissions: vi.fn(),
      invalidateSettings: vi.fn(),
      invalidateAll: vi.fn(),
    },
  })
);

vi.mock("@/services/monitoring/vcsmMonitoring", () => ({
  captureVcsmError: vi.fn(),
}));

import {
  approveFuelPriceBatchController,
  rejectFuelPriceBatchController,
} from "@/features/vportDashboard/dashboard/cards/gasprices/controller/reviewFuelPriceBatch.controller";
import {
  approveFuelPriceSubmissionBatchDAL,
  rejectFuelPriceSubmissionBatchDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceBatchReview.write.dal";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";

const TARGET = "vport-actor-gas";
const BATCH = "batch-uuid-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("approveFuelPriceBatchController", () => {
  it("maps RPC counts and invalidates official + pending caches on success", async () => {
    approveFuelPriceSubmissionBatchDAL.mockResolvedValue({
      data: { approved_count: 2, applied_count: 2, stale_skipped_count: 0 },
      error: null,
    });

    const res = await approveFuelPriceBatchController({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
      reason: "looks right",
    });

    expect(res).toEqual({
      ok: true,
      result: { approvedCount: 2, appliedCount: 2, staleSkippedCount: 0 },
    });
    expect(approveFuelPriceSubmissionBatchDAL).toHaveBeenCalledWith({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
      reason: "looks right",
    });
    expect(FuelPriceCacheService.invalidateOfficialPrices).toHaveBeenCalledWith(TARGET);
    expect(FuelPriceCacheService.invalidatePendingSubmissions).toHaveBeenCalledWith(TARGET);
  });

  it("surfaces stale_skipped_count from the RPC (Scenario B)", async () => {
    approveFuelPriceSubmissionBatchDAL.mockResolvedValue({
      data: { approved_count: 2, applied_count: 0, stale_skipped_count: 2 },
      error: null,
    });
    const res = await approveFuelPriceBatchController({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
    });
    expect(res.ok).toBe(true);
    expect(res.result.staleSkippedCount).toBe(2);
    expect(res.result.appliedCount).toBe(0);
  });

  it("returns not_owner when the RPC raises 42501 (Scenario C)", async () => {
    approveFuelPriceSubmissionBatchDAL.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("cannot manage profile"), { code: "42501" }),
    });
    const res = await approveFuelPriceBatchController({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
    });
    expect(res).toEqual({ ok: false, reason: "not_owner" });
    expect(FuelPriceCacheService.invalidateOfficialPrices).not.toHaveBeenCalled();
  });

  it("returns missing_batch and never calls the DAL when batch id is absent", async () => {
    const res = await approveFuelPriceBatchController({ targetActorId: TARGET });
    expect(res).toEqual({ ok: false, reason: "missing_batch" });
    expect(approveFuelPriceSubmissionBatchDAL).not.toHaveBeenCalled();
  });
});

describe("rejectFuelPriceBatchController", () => {
  it("maps rejected_count and invalidates only the pending cache", async () => {
    rejectFuelPriceSubmissionBatchDAL.mockResolvedValue({
      data: { rejected_count: 3 },
      error: null,
    });
    const res = await rejectFuelPriceBatchController({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
    });
    expect(res).toEqual({ ok: true, result: { rejectedCount: 3 } });
    expect(FuelPriceCacheService.invalidatePendingSubmissions).toHaveBeenCalledWith(TARGET);
    expect(FuelPriceCacheService.invalidateOfficialPrices).not.toHaveBeenCalled();
  });

  it("returns not_owner on 42501", async () => {
    rejectFuelPriceSubmissionBatchDAL.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("denied"), { code: "42501" }),
    });
    const res = await rejectFuelPriceBatchController({
      targetActorId: TARGET,
      submissionBatchId: BATCH,
    });
    expect(res).toEqual({ ok: false, reason: "not_owner" });
  });
});
