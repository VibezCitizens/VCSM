import { describe, it, expect } from "vitest";

import {
  buildBatchApproveMessage,
  buildBatchRejectMessage,
} from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";

// TICKET-SEC-GASFUEL-REVIEW-001 (BW-1 / BW-4)
// Pure toast-copy builders for owner batch-review feedback. They only format the
// counts already returned by the review controllers — no DB, no side effects.

describe("buildBatchApproveMessage", () => {
  it("Case A — all approved applied, nothing stale", () => {
    expect(
      buildBatchApproveMessage({
        approvedCount: 4,
        appliedCount: 4,
        staleSkippedCount: 0,
      })
    ).toBe("Approved 4 prices. Applied 4 official updates.");
  });

  it("Case B — some stale-skipped, explains the gap", () => {
    expect(
      buildBatchApproveMessage({
        approvedCount: 4,
        appliedCount: 2,
        staleSkippedCount: 2,
      })
    ).toBe(
      "Approved 4 prices. Applied 2 official updates. 2 skipped because newer prices were already set."
    );
  });

  it("omits the skip clause when staleSkippedCount is 0", () => {
    expect(buildBatchApproveMessage({ approvedCount: 1, appliedCount: 1, staleSkippedCount: 0 })).not.toContain(
      "skipped"
    );
  });

  it("uses singular nouns for a count of 1", () => {
    expect(
      buildBatchApproveMessage({ approvedCount: 1, appliedCount: 1, staleSkippedCount: 0 })
    ).toBe("Approved 1 price. Applied 1 official update.");
  });

  it("coerces missing / null / undefined counts to 0 without throwing", () => {
    expect(buildBatchApproveMessage()).toBe("Approved 0 prices. Applied 0 official updates.");
    expect(
      buildBatchApproveMessage({ approvedCount: null, appliedCount: undefined, staleSkippedCount: null })
    ).toBe("Approved 0 prices. Applied 0 official updates.");
  });

  it("coerces numeric strings (defensive — RPC counts are numbers)", () => {
    expect(
      buildBatchApproveMessage({ approvedCount: "3", appliedCount: "1", staleSkippedCount: "2" })
    ).toBe("Approved 3 prices. Applied 1 official update. 2 skipped because newer prices were already set.");
  });
});

describe("buildBatchRejectMessage", () => {
  it("formats the rejected count (plural)", () => {
    expect(buildBatchRejectMessage({ rejectedCount: 3 })).toBe("Rejected 3 pending prices.");
  });

  it("uses singular for a count of 1", () => {
    expect(buildBatchRejectMessage({ rejectedCount: 1 })).toBe("Rejected 1 pending price.");
  });

  it("defaults to 0 when no count is provided", () => {
    expect(buildBatchRejectMessage()).toBe("Rejected 0 pending prices.");
  });
});
