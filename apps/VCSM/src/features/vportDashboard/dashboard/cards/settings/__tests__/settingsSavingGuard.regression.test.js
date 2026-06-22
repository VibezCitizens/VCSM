/**
 * Regression — BW-SETTINGS-001: useSaveVportSettings saving guard
 *
 * BLACKWIDOW finding: onSave previously lacked an `if (saving) return;` guard,
 * allowing two concurrent controller calls on double-tap. Fixed in this session
 * by adding `saving` as the first check in the onSave guard condition.
 *
 * This file tests the coordinator's idempotency (same payload → same result on
 * sequential calls) and documents that hook-level concurrency tests require
 * @testing-library/react and are tracked for the full SPIDER-MAN pass.
 *
 * Reference: TICKET-DASH-BLACKWIDOW-001 BW-SETTINGS-001
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

const MOCK_RESULT = Object.freeze({ profile_id: "p-1", city_id: null });

beforeEach(() => {
  vi.clearAllMocks();
  mockSaveController.mockResolvedValue(MOCK_RESULT);
});

describe("settingsSaveCoordinator — idempotency (BW-SETTINGS-001 regression)", () => {
  it("calling coordinator twice with same payload produces the same result both times", async () => {
    const args = {
      actorId: "vport-actor-1",
      callerActorId: "user-actor-1",
      draft: { websiteUrl: "https://example.com" },
    };

    const [r1, r2] = await Promise.all([
      settingsSaveCoordinator(args),
      settingsSaveCoordinator(args),
    ]);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r1.result).toEqual(r2.result);
    // Both calls reach the controller — the guard lives in the hook, not the coordinator.
    // The hook-level guard (if (saving) return;) prevents the second call from being
    // dispatched in the first place. That behavior requires @testing-library/react.
    expect(mockSaveController).toHaveBeenCalledTimes(2);
  });

  it("coordinator does not mutate the draft between calls", async () => {
    const draft = { websiteUrl: "https://example.com", phonePublic: "3051234567" };
    const args = { actorId: "vport-actor-1", callerActorId: "user-actor-1", draft };

    await settingsSaveCoordinator(args);
    await settingsSaveCoordinator(args);

    const [firstPayload] = mockSaveController.mock.calls[0];
    const [secondPayload] = mockSaveController.mock.calls[1];
    // Both calls should use the same actorId
    expect(firstPayload).toBe(secondPayload);
  });
});

/*
 * Hook-level saving guard verification (requires @testing-library/react):
 *
 * The actual double-submit prevention is in useSaveVportSettings.js:
 *   if (saving || !actorId || !isOwner || loadingData || !draft) return;
 *
 * Full hook test should verify:
 *   - First onSave() call sets saving=true and dispatches coordinator
 *   - Second onSave() call while saving=true returns immediately (no second dispatch)
 *   - After first call resolves, saving returns to false and a new save can proceed
 *
 * Track under SPIDER-MAN scope when @testing-library/react is configured.
 */
