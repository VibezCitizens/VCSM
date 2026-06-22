import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVportGasPricesController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/getVportGasPrices.controller.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal",
  () => ({
    fetchVportFuelPricesDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal",
  () => ({
    fetchPendingFuelPriceSubmissionsDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal",
  () => ({
    fetchVportStationPriceSettingsDAL: vi.fn(),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPrice.model",
  () => ({
    mapVportFuelPriceRows: vi.fn((rows) => rows ?? []),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPriceSubmission.model",
  () => ({
    mapFuelPriceSubmissionRows: vi.fn((rows) => rows ?? []),
  })
);

vi.mock(
  "@/features/vportDashboard/dashboard/cards/gasprices/model/vportStationPriceSettings.model",
  () => ({
    mapVportStationPriceSettingsRow: vi.fn((row) => row ?? {}),
  })
);

// ---------------------------------------------------------------------------
// Imported mocks (for assertions)
// ---------------------------------------------------------------------------

import { fetchVportFuelPricesDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { fetchPendingFuelPriceSubmissionsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { fetchVportStationPriceSettingsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "vport-actor-abc123";

const PENDING_ROWS = [
  { fuelKey: "regular", proposedPrice: 1.85, submittedAt: "2026-05-01T10:00:00Z" },
  { fuelKey: "regular", proposedPrice: 1.87, submittedAt: "2026-05-01T12:00:00Z" },
  { fuelKey: "diesel", proposedPrice: 2.10, submittedAt: "2026-05-01T09:00:00Z" },
];

const OFFICIAL_ROWS = [
  { fuelKey: "regular", price: 1.90 },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  fetchVportFuelPricesDAL.mockResolvedValue({ data: OFFICIAL_ROWS, error: null });
  fetchPendingFuelPriceSubmissionsDAL.mockResolvedValue({ data: PENDING_ROWS, error: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getVportGasPricesController", () => {
  it("throws when actorId is missing", async () => {
    await expect(getVportGasPricesController({})).rejects.toThrow("actorId required");
  });

  describe("pendingSubmissions — always loaded", () => {
    it("returns pendingSubmissions even when showCommunitySuggestion is false", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      expect(fetchPendingFuelPriceSubmissionsDAL).toHaveBeenCalledOnce();
      expect(res.pendingSubmissions).toEqual(PENDING_ROWS);
    });

    it("returns pendingSubmissions when showCommunitySuggestion is true", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: true },
        error: null,
      });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      expect(fetchPendingFuelPriceSubmissionsDAL).toHaveBeenCalledOnce();
      expect(res.pendingSubmissions).toEqual(PENDING_ROWS);
    });

    it("returns empty pendingSubmissions when DAL returns no rows", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });
      fetchPendingFuelPriceSubmissionsDAL.mockResolvedValue({ data: [], error: null });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      expect(res.pendingSubmissions).toEqual([]);
    });
  });

  describe("communitySuggestionByFuelKey — gated on showCommunitySuggestion", () => {
    it("is empty object when showCommunitySuggestion is false", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      expect(res.communitySuggestionByFuelKey).toEqual({});
    });

    it("contains latest submission per fuelKey when showCommunitySuggestion is true", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: true },
        error: null,
      });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      // "regular" has two rows — latest by submittedAt should win
      expect(res.communitySuggestionByFuelKey["regular"]).toMatchObject({
        fuelKey: "regular",
        proposedPrice: 1.87,
      });
      // "diesel" has one row
      expect(res.communitySuggestionByFuelKey["diesel"]).toMatchObject({
        fuelKey: "diesel",
        proposedPrice: 2.10,
      });
    });
  });

  describe("return shape", () => {
    it("always includes actorId, settings, official, communitySuggestionByFuelKey, pendingSubmissions", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });

      const res = await getVportGasPricesController({ actorId: ACTOR_ID });

      expect(res).toHaveProperty("actorId", ACTOR_ID);
      expect(res).toHaveProperty("settings");
      expect(res).toHaveProperty("official");
      expect(res).toHaveProperty("communitySuggestionByFuelKey");
      expect(res).toHaveProperty("pendingSubmissions");
    });
  });

  describe("error propagation", () => {
    it("throws when settings DAL errors", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: null,
        error: new Error("settings_db_error"),
      });

      await expect(getVportGasPricesController({ actorId: ACTOR_ID })).rejects.toThrow(
        "settings_db_error"
      );
    });

    it("throws when official prices DAL errors", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });
      fetchVportFuelPricesDAL.mockResolvedValue({
        data: null,
        error: new Error("prices_db_error"),
      });

      await expect(getVportGasPricesController({ actorId: ACTOR_ID })).rejects.toThrow(
        "prices_db_error"
      );
    });

    it("throws when pending submissions DAL errors", async () => {
      fetchVportStationPriceSettingsDAL.mockResolvedValue({
        data: { showCommunitySuggestion: false },
        error: null,
      });
      fetchPendingFuelPriceSubmissionsDAL.mockResolvedValue({
        data: null,
        error: new Error("pending_db_error"),
      });

      await expect(getVportGasPricesController({ actorId: ACTOR_ID })).rejects.toThrow(
        "pending_db_error"
      );
    });
  });
});
