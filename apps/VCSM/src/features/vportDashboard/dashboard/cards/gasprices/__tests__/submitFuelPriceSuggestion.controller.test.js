import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitFuelPriceSuggestionController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock(
  "@/shared/lib/vport/resolveVportProfileId",
  () => ({
    resolveVportProfileId: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal",
  () => ({
    fetchVportFuelPricesDAL: vi.fn(),
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

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal",
  () => ({
    fetchVportStationPriceSettingsDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal",
  () => ({
    createFuelPriceSubmissionDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal",
  () => ({
    fetchPendingFuelPriceSubmissionsDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal",
  () => ({
    upsertVportFuelPriceDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal",
  () => ({
    createVportFuelPriceHistoryDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPrice.model",
  () => ({
    mapVportFuelPriceRow: vi.fn((row) => row),
    mapVportFuelPriceRows: vi.fn((rows) => rows ?? []),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model",
  () => ({
    mapFuelPriceSubmissionRow: vi.fn((row) => row),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportStationPriceSettings.model",
  () => ({
    mapVportStationPriceSettingsRow: vi.fn(() => ({
      requireSanityForSuggestion: false,
      minPrice: 0,
      maxPrice: 9999,
      maxDeltaAbs: 9999,
      maxDeltaPct: 1,
    })),
  })
);

vi.mock(
  "@/features/vportDashboard/controller/checkVportOwnership.controller",
  () => ({
    checkVportOwnershipController: vi.fn(),
  })
);

// ---------------------------------------------------------------------------
// Imported mocks (for assertions)
// ---------------------------------------------------------------------------

import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";
import { fetchVportStationPriceSettingsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";
import { createFuelPriceSubmissionDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { upsertVportFuelPriceDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";
import { createVportFuelPriceHistoryDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal";
import { checkVportOwnershipController } from "@/features/vportDashboard/controller/checkVportOwnership.controller";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TARGET_ACTOR_ID = "vport-actor-abc123";
const CITIZEN_ACTOR_ID = "citizen-actor-xyz789";
const FUEL_KEY = "regular";
const PROPOSED_PRICE = 1.89;
const RESOLVED_PROFILE_ID = "profile-uuid-for-vport-abc123";

const baseArgs = {
  targetActorId: TARGET_ACTOR_ID,
  actorId: CITIZEN_ACTOR_ID,
  fuelKey: FUEL_KEY,
  proposedPrice: PROPOSED_PRICE,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default: profile resolves successfully
  resolveVportProfileId.mockResolvedValue(RESOLVED_PROFILE_ID);

  // Default: settings fetch succeeds, no sanity gate
  fetchVportStationPriceSettingsDAL.mockResolvedValue({
    data: {},
    error: null,
  });
  fetchPendingFuelPriceSubmissionsDAL.mockResolvedValue({
    data: [],
    error: null,
  });

  // Default: DAL writes succeed
  upsertVportFuelPriceDAL.mockResolvedValue({
    data: { fuelKey: FUEL_KEY, price: PROPOSED_PRICE },
    error: null,
  });
  createVportFuelPriceHistoryDAL.mockResolvedValue({ data: {}, error: null });
  createFuelPriceSubmissionDAL.mockResolvedValue({
    data: { id: "sub-001", fuelKey: FUEL_KEY, proposedPrice: PROPOSED_PRICE },
    error: null,
  });

  // Default: ownership check returns true (for owner path tests that don't override)
  checkVportOwnershipController.mockResolvedValue(true);
});

// ---------------------------------------------------------------------------
// Guard tests
// ---------------------------------------------------------------------------

describe("submitFuelPriceSuggestionController — input guards", () => {
  it("throws when actorId is missing", async () => {
    await expect(
      submitFuelPriceSuggestionController({
        ...baseArgs,
        actorId: undefined,
      })
    ).rejects.toThrow("actorId required");
  });

  it("throws when targetActorId is missing", async () => {
    await expect(
      submitFuelPriceSuggestionController({
        ...baseArgs,
        targetActorId: undefined,
      })
    ).rejects.toThrow("targetActorId required");
  });

  it("throws when fuelKey is missing", async () => {
    await expect(
      submitFuelPriceSuggestionController({
        ...baseArgs,
        fuelKey: undefined,
      })
    ).rejects.toThrow("fuelKey required");
  });

  it("throws when proposedPrice is null", async () => {
    await expect(
      submitFuelPriceSuggestionController({
        ...baseArgs,
        proposedPrice: null,
      })
    ).rejects.toThrow("proposedPrice required");
  });

  it("returns invalid_number when proposedPrice is not a finite number", async () => {
    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      proposedPrice: "banana",
    });
    expect(result).toEqual({ ok: false, reason: "invalid_number" });
  });

  it("returns invalid_fuel_key when fuelKey is not in ALLOWED_FUEL_KEYS", async () => {
    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      fuelKey: "jet_fuel",
    });
    expect(result).toEqual({ ok: false, reason: "invalid_fuel_key" });
    expect(resolveVportProfileId).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Owner path — VENOM-GAS-001 regression coverage
// ---------------------------------------------------------------------------

describe("submitFuelPriceSuggestionController — owner path (ownerUpdate: true)", () => {
  it("calls checkVportOwnershipController with correct args", async () => {
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(checkVportOwnershipController).toHaveBeenCalledOnce();
    expect(checkVportOwnershipController).toHaveBeenCalledWith({
      callerActorId: CITIZEN_ACTOR_ID,
      targetActorId: TARGET_ACTOR_ID,
    });
  });

  it("returns { ok: false, reason: 'not_owner' } when ownership check fails", async () => {
    checkVportOwnershipController.mockResolvedValue(false);

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(result).toEqual({ ok: false, reason: "not_owner" });
  });

  it("does NOT call upsertVportFuelPriceDAL when ownership check fails", async () => {
    checkVportOwnershipController.mockResolvedValue(false);

    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalled();
  });

  it("does NOT call cache service when ownership check fails", async () => {
    checkVportOwnershipController.mockResolvedValue(false);

    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(FuelPriceCacheService.invalidateOfficialPrices).not.toHaveBeenCalled();
  });

  it("calls upsertVportFuelPriceDAL with targetActorId (actor-first) when ownership is confirmed", async () => {
    checkVportOwnershipController.mockResolvedValue(true);

    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(upsertVportFuelPriceDAL).toHaveBeenCalledOnce();
    expect(upsertVportFuelPriceDAL).toHaveBeenCalledWith(
      expect.objectContaining({
        targetActorId: TARGET_ACTOR_ID,
        fuelKey: FUEL_KEY,
        price: PROPOSED_PRICE,
        updatedByActorId: CITIZEN_ACTOR_ID,
      })
    );
    // Confirm that profileId is NOT forwarded — DALs resolve it internally
    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalledWith(
      expect.objectContaining({ profileId: expect.anything() })
    );
  });

  it("calls FuelPriceCacheService.invalidateOfficialPrices(targetActorId) after successful owner write", async () => {
    checkVportOwnershipController.mockResolvedValue(true);

    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(FuelPriceCacheService.invalidateOfficialPrices).toHaveBeenCalledOnce();
    expect(FuelPriceCacheService.invalidateOfficialPrices).toHaveBeenCalledWith(TARGET_ACTOR_ID);
  });

  it("returns { ok: true, official: <mapped_row> } on success", async () => {
    const mappedRow = { fuelKey: FUEL_KEY, price: PROPOSED_PRICE };
    checkVportOwnershipController.mockResolvedValue(true);
    upsertVportFuelPriceDAL.mockResolvedValue({ data: mappedRow, error: null });

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(result.ok).toBe(true);
    expect(result.official).toBeDefined();
  });

  it("does NOT call createFuelPriceSubmissionDAL on the owner path", async () => {
    checkVportOwnershipController.mockResolvedValue(true);

    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(createFuelPriceSubmissionDAL).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Citizen path
// ---------------------------------------------------------------------------

describe("submitFuelPriceSuggestionController — citizen path (ownerUpdate: false)", () => {
  it("does NOT call checkVportOwnershipController on the citizen path", async () => {
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(checkVportOwnershipController).not.toHaveBeenCalled();
  });

  it("calls createFuelPriceSubmissionDAL with targetActorId (actor-first) and correct args", async () => {
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(createFuelPriceSubmissionDAL).toHaveBeenCalledOnce();
    expect(createFuelPriceSubmissionDAL).toHaveBeenCalledWith(
      expect.objectContaining({
        targetActorId: TARGET_ACTOR_ID,
        fuelKey: FUEL_KEY,
        proposedPrice: PROPOSED_PRICE,
        submittedByActorId: CITIZEN_ACTOR_ID,
      })
    );
    // Confirm profileId is NOT forwarded — DAL resolves it internally
    expect(createFuelPriceSubmissionDAL).not.toHaveBeenCalledWith(
      expect.objectContaining({ profileId: expect.anything() })
    );
  });

  it("returns { ok: true, submission: <mapped_row> } on success", async () => {
    const subRow = { id: "sub-001", fuelKey: FUEL_KEY };
    createFuelPriceSubmissionDAL.mockResolvedValue({ data: subRow, error: null });

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(result.ok).toBe(true);
    expect(result.submission).toBeDefined();
    expect(FuelPriceCacheService.invalidatePendingSubmissions).toHaveBeenCalledOnce();
    expect(FuelPriceCacheService.invalidatePendingSubmissions).toHaveBeenCalledWith(TARGET_ACTOR_ID);
  });

  it("does NOT call upsertVportFuelPriceDAL on the citizen path", async () => {
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalled();
  });

  it("does NOT call official cache invalidation on the citizen path", async () => {
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(FuelPriceCacheService.invalidateOfficialPrices).not.toHaveBeenCalled();
  });

  it("returns already_pending when createFuelPriceSubmissionDAL returns error.code 23505", async () => {
    const dupErr = Object.assign(new Error("duplicate key value"), { code: "23505" });
    createFuelPriceSubmissionDAL.mockResolvedValue({ data: null, error: dupErr });

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(result).toEqual({ ok: false, reason: "already_pending" });
    expect(FuelPriceCacheService.invalidatePendingSubmissions).not.toHaveBeenCalled();
  });

  it("does NOT forward evidence to createFuelPriceSubmissionDAL", async () => {
    await submitFuelPriceSuggestionController({ ...baseArgs, ownerUpdate: false });

    expect(createFuelPriceSubmissionDAL).toHaveBeenCalledWith(
      expect.not.objectContaining({ evidence: expect.anything() })
    );
  });
});

// ---------------------------------------------------------------------------
// Regression — slug route / profile resolution contract
// VENOM-GAS-002: gas owner can save prices when accessed via /profile/:slug
// ---------------------------------------------------------------------------

describe("submitFuelPriceSuggestionController — VENOM-GAS-002 slug route regression", () => {
  it("resolves profileId from targetActorId for the profile_not_found guard before any write DAL", async () => {
    // Simulates the slug route: resolvedActorId (UUID from slug resolution)
    // is passed as targetActorId. Controller resolves profileId for the guard;
    // write DALs receive targetActorId and resolve internally (cache hit).
    await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(resolveVportProfileId).toHaveBeenCalledWith(TARGET_ACTOR_ID);
    // Write DAL must receive targetActorId — actor-first contract
    expect(upsertVportFuelPriceDAL).toHaveBeenCalledWith(
      expect.objectContaining({ targetActorId: TARGET_ACTOR_ID })
    );
    // profileId must NOT be forwarded to write DALs
    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalledWith(
      expect.objectContaining({ profileId: expect.anything() })
    );
  });

  it("owner can save gas price when accessed via slug route (happy path)", async () => {
    // Full owner write success — mirrors the slug route where resolvedActorId
    // flows through VportProfileTabContent → VportGasPricesView → hook → controller.
    resolveVportProfileId.mockResolvedValue(RESOLVED_PROFILE_ID);
    checkVportOwnershipController.mockResolvedValue(true);
    upsertVportFuelPriceDAL.mockResolvedValue({
      data: { fuelKey: FUEL_KEY, price: PROPOSED_PRICE },
      error: null,
    });
    createVportFuelPriceHistoryDAL.mockResolvedValue({ data: {}, error: null });

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(result.ok).toBe(true);
    expect(result.official).toBeDefined();
    expect(upsertVportFuelPriceDAL).toHaveBeenCalledOnce();
    expect(createVportFuelPriceHistoryDAL).toHaveBeenCalledWith(
      expect.objectContaining({ targetActorId: TARGET_ACTOR_ID })
    );
    expect(FuelPriceCacheService.invalidateOfficialPrices).toHaveBeenCalledWith(TARGET_ACTOR_ID);
  });

  it("returns { ok: false, reason: 'profile_not_found' } when profileId cannot be resolved", async () => {
    // Simulates the stale-null-cache race: resolveVportProfileId returns null
    // (e.g., cached null from a pre-auth call). Controller must surface a typed
    // error instead of throwing so the UI shows a meaningful message.
    resolveVportProfileId.mockResolvedValue(null);

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(result).toEqual({ ok: false, reason: "profile_not_found" });
    // Neither ownership check nor any write should fire
    expect(checkVportOwnershipController).not.toHaveBeenCalled();
    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalled();
    expect(createFuelPriceSubmissionDAL).not.toHaveBeenCalled();
    expect(createVportFuelPriceHistoryDAL).not.toHaveBeenCalled();
  });

  it("returns { ok: false, reason: 'profile_not_found' } on citizen path when profile cannot be resolved", async () => {
    resolveVportProfileId.mockResolvedValue(null);

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: false,
    });

    expect(result).toEqual({ ok: false, reason: "profile_not_found" });
    expect(createFuelPriceSubmissionDAL).not.toHaveBeenCalled();
  });

  it("non-owner is still blocked even when profile resolves correctly", async () => {
    // Security gate must hold: profile found, but caller is not an owner.
    resolveVportProfileId.mockResolvedValue(RESOLVED_PROFILE_ID);
    checkVportOwnershipController.mockResolvedValue(false);

    const result = await submitFuelPriceSuggestionController({
      ...baseArgs,
      ownerUpdate: true,
    });

    expect(result).toEqual({ ok: false, reason: "not_owner" });
    expect(upsertVportFuelPriceDAL).not.toHaveBeenCalled();
    expect(createVportFuelPriceHistoryDAL).not.toHaveBeenCalled();
    expect(FuelPriceCacheService.invalidateOfficialPrices).not.toHaveBeenCalled();
  });
});
