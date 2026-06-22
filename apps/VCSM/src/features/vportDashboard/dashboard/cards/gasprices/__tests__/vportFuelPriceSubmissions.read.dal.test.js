import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Capture container — must be hoisted so the vi.mock factory can reference it
// before module imports are resolved.
// ---------------------------------------------------------------------------

const captured = vi.hoisted(() => ({ selectArgs: [] }));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/supabase/vportClient", () => {
  // Minimal thenable chain — every method returns `self` except the two
  // terminal sinks (.limit → Promise, .maybeSingle → Promise).
  const mkChain = () => {
    const self = {
      eq: () => self,
      order: () => self,
      limit: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    return self;
  };
  return {
    default: {
      from: () => ({
        select: (str) => {
          captured.selectArgs.push(str);
          return mkChain();
        },
      }),
    },
  };
});

// Bypass TTL cache so the code always reaches the Supabase query.
vi.mock("@/shared/lib/ttlCache", () => ({
  createTTLCache: () => ({
    get: () => undefined,
    set: () => {},
    invalidate: () => {},
  }),
}));

vi.mock(
  "@/shared/lib/vport/resolveVportProfileId",
  () => ({
    resolveVportProfileId: () => Promise.resolve("profile-uuid-abc"),
  })
);

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import {
  fetchPendingFuelPriceSubmissionsDAL,
  fetchFuelPriceSubmissionByIdDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  captured.selectArgs.length = 0;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("vportFuelPriceSubmissions.read.dal — evidence removal (PATCH C-006)", () => {
  it("SUBMISSION_SELECT used by fetchFuelPriceSubmissionByIdDAL does NOT contain 'evidence'", async () => {
    await fetchFuelPriceSubmissionByIdDAL({ submissionId: "sub-001" });
    expect(captured.selectArgs.length).toBeGreaterThan(0);
    expect(captured.selectArgs[0]).not.toMatch(/\bevidence\b/);
  });

  it("fetchPendingFuelPriceSubmissionsDAL inline select does NOT contain 'evidence'", async () => {
    await fetchPendingFuelPriceSubmissionsDAL({ targetActorId: "actor-xyz" });
    expect(captured.selectArgs.length).toBeGreaterThan(0);
    expect(captured.selectArgs[0]).not.toMatch(/\bevidence\b/);
  });
});
