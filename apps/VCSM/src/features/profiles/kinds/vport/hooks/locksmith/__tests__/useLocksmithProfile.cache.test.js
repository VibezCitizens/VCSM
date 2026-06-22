import { describe, it, expect, vi, beforeEach } from "vitest";

// The controller is the only real dependency — mock it at the module level.
vi.mock(
  "@/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller",
  () => ({ getLocksmithProfileController: vi.fn() })
);

import {
  fetchLocksmithProfileCached,
  invalidateLocksmithProfileCache,
} from "../useLocksmithProfile";

const ACTOR_ID = "actor-locksmith-001";

const MOCK_RESULT = {
  serviceAreas: [{ id: "area-1" }],
  serviceDetails: [{ serviceId: "svc-1" }],
  gapServices: [],
};

function makeController(result = MOCK_RESULT) {
  return vi.fn().mockResolvedValue(result);
}

beforeEach(() => {
  // Always start each test with a clean cache for this actor.
  invalidateLocksmithProfileCache(ACTOR_ID);
});

describe("fetchLocksmithProfileCached — cache behavior", () => {
  it("scenario 1: first call hits the controller (3 DB reads path)", async () => {
    const ctrl = makeController();

    const result = await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });

    expect(ctrl).toHaveBeenCalledTimes(1);
    expect(ctrl).toHaveBeenCalledWith(ACTOR_ID);
    expect(result.serviceAreas).toEqual(MOCK_RESULT.serviceAreas);
    expect(result.serviceDetails).toEqual(MOCK_RESULT.serviceDetails);
  });

  it("scenario 2: remount within TTL hits cache — controller not called", async () => {
    const ctrl = makeController();

    // First call populates the cache.
    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(ctrl).toHaveBeenCalledTimes(1);

    // Second call within 2-minute window returns cached data.
    const result = await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });

    expect(ctrl).toHaveBeenCalledTimes(1); // still 1 — no new call
    expect(result.serviceAreas).toEqual(MOCK_RESULT.serviceAreas);
  });

  it("scenario 3: owner mutation invalidates cache — next call hits controller", async () => {
    const ctrl = makeController();

    // Populate cache.
    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(ctrl).toHaveBeenCalledTimes(1);

    // Owner edits a service area — useLocksmithOwner calls this.
    invalidateLocksmithProfileCache(ACTOR_ID);

    // Next profile load after mutation fetches fresh.
    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(ctrl).toHaveBeenCalledTimes(2);
  });

  it("scenario 4: TTL expiry forces re-fetch", async () => {
    const ctrl = makeController();

    // Populate cache but backdate the timestamp past TTL.
    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(ctrl).toHaveBeenCalledTimes(1);

    // Manually expire the cache entry by replacing its timestamp.
    // Access the cache indirectly — invalidate then re-seed with stale ts.
    // We test TTL by calling with a controller that checks Date.now() via fake timer.
    vi.useFakeTimers();
    vi.advanceTimersByTime(2 * 60 * 1000 + 1); // advance 2 min + 1 ms past TTL

    const result = await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });

    expect(ctrl).toHaveBeenCalledTimes(2); // re-fetched after TTL
    expect(result.serviceAreas).toEqual(MOCK_RESULT.serviceAreas);

    vi.useRealTimers();
  });

  it("returns correct shape from both cache hit and cache miss", async () => {
    const ctrl = makeController();

    const miss = await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(miss).toMatchObject({
      serviceAreas: expect.any(Array),
      serviceDetails: expect.any(Array),
      gapServices: expect.any(Array),
    });

    const hit = await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    expect(hit).toMatchObject({
      serviceAreas: expect.any(Array),
      serviceDetails: expect.any(Array),
      gapServices: expect.any(Array),
    });
    expect(ctrl).toHaveBeenCalledTimes(1); // only 1 real fetch
  });

  it("different actorIds use independent cache entries", async () => {
    const OTHER_ACTOR = "actor-locksmith-002";
    invalidateLocksmithProfileCache(OTHER_ACTOR);

    const ctrl = makeController();

    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    await fetchLocksmithProfileCached(OTHER_ACTOR, { controller: ctrl });

    // Both were cache misses — each actor has its own entry.
    expect(ctrl).toHaveBeenCalledTimes(2);

    // Second call for each should hit their own cache.
    await fetchLocksmithProfileCached(ACTOR_ID, { controller: ctrl });
    await fetchLocksmithProfileCached(OTHER_ACTOR, { controller: ctrl });
    expect(ctrl).toHaveBeenCalledTimes(2); // still 2
  });
});
