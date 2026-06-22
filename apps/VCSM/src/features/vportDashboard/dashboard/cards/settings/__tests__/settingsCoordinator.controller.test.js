/**
 * Tests — settingsSaveCoordinator
 *
 * SETTINGS-ARCH-001: Coordinator owns all validation orchestration for the
 * settings save path. The hook (useSaveVportSettings) delegates entirely to
 * this coordinator and must not contain validation logic.
 *
 * Coverage:
 *   - Null/empty draft passes without error (no address, no phone)
 *   - Partial address (started but incomplete) → validation error, no DB write
 *   - Complete address with city format error → validation error, no DB write
 *   - Invalid phone (non-10-digit) → validation error, no DB write
 *   - Valid complete address → delegates to controller
 *   - Valid phone → normalized before delegation
 *   - 11-digit phone with US "1" prefix → strips prefix, passes
 *   - Successful delegation → returns { ok: true, result }
 *
 * Run: npx vitest run src/features/vportDashboard/dashboard/cards/settings/__tests__/settingsCoordinator.controller.test.js
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSaveController } = vi.hoisted(() => ({
  mockSaveController: vi.fn(),
}));

vi.mock(
  "@/features/vportDashboard/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller",
  () => ({ saveVportPublicDetailsByActorIdController: mockSaveController })
);

import { settingsSaveCoordinator } from "../controller/settingsCoordinator.controller";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID        = "vport-actor-001";
const CALLER_ACTOR_ID = "user-actor-002";
const MOCK_RESULT     = Object.freeze({ profile_id: "p-1", city_id: "c-1" });

const VALID_ADDRESS = Object.freeze({
  line1:   "123 Ocean Dr",
  line2:   "",
  city:    "Miami",
  state:   "FL",
  zip:     "33139",
  country: "US",
});

function makeCoordinatorArgs(overrides = {}) {
  return {
    actorId:       ACTOR_ID,
    callerActorId: CALLER_ACTOR_ID,
    draft:         {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockSaveController.mockResolvedValue(MOCK_RESULT);
});

// ---------------------------------------------------------------------------
// Delegation (no validation errors)
// ---------------------------------------------------------------------------

describe("settingsSaveCoordinator — delegation", () => {
  it("delegates to saveVportPublicDetailsByActorIdController on empty draft", async () => {
    const result = await settingsSaveCoordinator(makeCoordinatorArgs());

    expect(mockSaveController).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true, result: MOCK_RESULT });
  });

  it("passes actorId and callerActorId to the downstream controller", async () => {
    await settingsSaveCoordinator(makeCoordinatorArgs());

    const [calledActorId, , opts] = mockSaveController.mock.calls[0];
    expect(calledActorId).toBe(ACTOR_ID);
    expect(opts.requestActorId).toBe(CALLER_ACTOR_ID);
  });

  it("passes invalidateVportPublicDetails callback through to controller", async () => {
    const invalidate = vi.fn();
    await settingsSaveCoordinator(makeCoordinatorArgs({ invalidateVportPublicDetails: invalidate }));

    const [, , opts] = mockSaveController.mock.calls[0];
    expect(opts.invalidateVportPublicDetails).toBe(invalidate);
  });

  it("returns { ok: true, result } wrapping the controller return value", async () => {
    const result = await settingsSaveCoordinator(makeCoordinatorArgs());
    expect(result.ok).toBe(true);
    expect(result.result).toEqual(MOCK_RESULT);
  });

  it("delegates with valid complete address and no phone", async () => {
    const draft = { address: VALID_ADDRESS };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(mockSaveController).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
  });

  it("strips US +1 prefix from 11-digit phone and delegates", async () => {
    const draft = { phonePublic: "13051234567" };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(mockSaveController).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    const [, payload] = mockSaveController.mock.calls[0];
    expect(payload.phonePublic).toBe("3051234567");
  });

  it("passes normalized 10-digit phone in payload", async () => {
    const draft = { phonePublic: "(305) 123-4567" };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(true);
    const [, payload] = mockSaveController.mock.calls[0];
    expect(payload.phonePublic).toBe("3051234567");
  });
});

// ---------------------------------------------------------------------------
// Address validation — partial address
// ---------------------------------------------------------------------------

describe("settingsSaveCoordinator — partial address", () => {
  it("returns error when address is started but incomplete (city only)", async () => {
    const draft = { address: { city: "Miami" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result).toEqual({ ok: false, error: "Please enter full address." });
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("returns error when address has line1 + city but no state/zip/country", async () => {
    const draft = { address: { line1: "123 Main St", city: "Miami" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result).toEqual({ ok: false, error: "Please enter full address." });
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("does not treat all-empty address object as started", async () => {
    const draft = { address: { line1: "", city: "", state: "", zip: "", country: "" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(true);
    expect(mockSaveController).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Address validation — format errors on complete address
// ---------------------------------------------------------------------------

describe("settingsSaveCoordinator — address format validation", () => {
  it("returns error for city containing digits", async () => {
    const draft = { address: { ...VALID_ADDRESS, city: "M1ami" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Enter a valid city name.");
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("returns error for state that is not 2 uppercase letters", async () => {
    const draft = { address: { ...VALID_ADDRESS, state: "Florida" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/state must be a 2-letter code/i);
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("returns error for ZIP that is not 5 digits", async () => {
    const draft = { address: { ...VALID_ADDRESS, zip: "331" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/zip must be 5 digits/i);
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("returns error for country that is not 2 uppercase letters", async () => {
    const draft = { address: { ...VALID_ADDRESS, country: "USA" } };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/country must be a 2-letter code/i);
    expect(mockSaveController).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Phone validation
// ---------------------------------------------------------------------------

describe("settingsSaveCoordinator — phone validation", () => {
  it("returns error for phone shorter than 10 digits", async () => {
    const draft = { phonePublic: "305123" };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result).toEqual({ ok: false, error: "Enter a valid 10-digit phone number." });
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("returns error for phone longer than 10 digits (no US prefix to strip)", async () => {
    const draft = { phonePublic: "230512345670" };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result).toEqual({ ok: false, error: "Enter a valid 10-digit phone number." });
    expect(mockSaveController).not.toHaveBeenCalled();
  });

  it("passes empty phone without error", async () => {
    const draft = { phonePublic: "" };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(true);
    expect(mockSaveController).toHaveBeenCalledOnce();
  });

  it("passes null phone without error", async () => {
    const draft = { phonePublic: null };
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft }));

    expect(result.ok).toBe(true);
    expect(mockSaveController).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Null-safety
// ---------------------------------------------------------------------------

describe("settingsSaveCoordinator — null-safety", () => {
  it("handles null draft gracefully (no address, no phone)", async () => {
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft: null }));

    expect(result.ok).toBe(true);
    expect(mockSaveController).toHaveBeenCalledOnce();
  });

  it("handles undefined draft gracefully", async () => {
    const result = await settingsSaveCoordinator(makeCoordinatorArgs({ draft: undefined }));

    expect(result.ok).toBe(true);
    expect(mockSaveController).toHaveBeenCalledOnce();
  });
});
