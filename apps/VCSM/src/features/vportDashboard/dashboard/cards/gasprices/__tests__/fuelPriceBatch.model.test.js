import { describe, it, expect } from "vitest";
import {
  groupSubmissionsIntoBatches,
  attachSubmittersToBatches,
} from "@/features/vportDashboard/dashboard/cards/gasprices/model/fuelPriceBatch.model";

const JORDAN = "actor-jordan";
const ALEX = "actor-alex";

// Jordan submits a 2-fuel batch at 4:30; Alex submits a 1-fuel batch at 5:00.
const SUBMISSIONS = [
  {
    id: "s1",
    fuelKey: "regular",
    proposedPrice: 3.06,
    currencyCode: "USD",
    unit: "gal",
    submittedByActorId: JORDAN,
    submissionBatchId: "batch-jordan",
    submittedAt: "2026-06-21T16:30:00.000Z",
  },
  {
    id: "s2",
    fuelKey: "diesel",
    proposedPrice: 4.06,
    currencyCode: "USD",
    unit: "gal",
    submittedByActorId: JORDAN,
    submissionBatchId: "batch-jordan",
    submittedAt: "2026-06-21T16:30:05.000Z",
  },
  {
    id: "s3",
    fuelKey: "regular",
    proposedPrice: 3.10,
    currencyCode: "USD",
    unit: "gal",
    submittedByActorId: ALEX,
    submissionBatchId: "batch-alex",
    submittedAt: "2026-06-21T17:00:00.000Z",
  },
];

describe("groupSubmissionsIntoBatches", () => {
  it("groups rows into one entry per submission_batch_id", () => {
    const batches = groupSubmissionsIntoBatches(SUBMISSIONS);
    expect(batches).toHaveLength(2);
    const jordan = batches.find((b) => b.submissionBatchId === "batch-jordan");
    expect(jordan.submissions).toHaveLength(2);
    expect(jordan.submittedByActorId).toBe(JORDAN);
  });

  it("orders newest batch first by latest submission time", () => {
    const batches = groupSubmissionsIntoBatches(SUBMISSIONS);
    expect(batches[0].submissionBatchId).toBe("batch-alex"); // 5:00 newest
    expect(batches[1].submissionBatchId).toBe("batch-jordan"); // 4:30
  });

  it("computes submittedAtMin / submittedAtMax for a multi-fuel batch", () => {
    const batches = groupSubmissionsIntoBatches(SUBMISSIONS);
    const jordan = batches.find((b) => b.submissionBatchId === "batch-jordan");
    expect(jordan.submittedAtMin).toBe("2026-06-21T16:30:00.000Z");
    expect(jordan.submittedAtMax).toBe("2026-06-21T16:30:05.000Z");
  });

  it("falls back to submission id when batch id is missing (no row dropped)", () => {
    const batches = groupSubmissionsIntoBatches([
      { id: "lone", fuelKey: "regular", submittedByActorId: JORDAN, submittedAt: "2026-06-21T10:00:00.000Z" },
    ]);
    expect(batches).toHaveLength(1);
    expect(batches[0].submissionBatchId).toBe("lone");
  });

  it("returns [] for empty / non-array input", () => {
    expect(groupSubmissionsIntoBatches([])).toEqual([]);
    expect(groupSubmissionsIntoBatches(null)).toEqual([]);
  });
});

describe("attachSubmittersToBatches", () => {
  it("attaches resolved submitter identity by actorId", () => {
    const batches = groupSubmissionsIntoBatches(SUBMISSIONS);
    const withSubmitters = attachSubmittersToBatches(batches, {
      [JORDAN]: { displayName: "Jordan Zaxx", avatar: "/jordan.jpg" },
    });
    const jordan = withSubmitters.find((b) => b.submissionBatchId === "batch-jordan");
    const alex = withSubmitters.find((b) => b.submissionBatchId === "batch-alex");
    expect(jordan.submitter).toEqual({ displayName: "Jordan Zaxx", avatar: "/jordan.jpg" });
    expect(alex.submitter).toBeNull(); // no summary => graceful null
  });
});
