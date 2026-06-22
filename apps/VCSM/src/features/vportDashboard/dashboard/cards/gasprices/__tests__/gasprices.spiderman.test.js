import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const cardRoot = join(currentDir, "..");

const readCardSource = (relativePath) => readFileSync(join(cardRoot, relativePath), "utf8");

describe("gasprices SPIDER-MAN architecture coverage", () => {
  it("keeps the final screen limited to context ownership, identity, owner gate, and view composition", () => {
    const finalSource = readCardSource("screens/VportDashboardGasScreen.jsx");

    // TICKET-VD-CTX-001 (Ticket 3): the dashboard gas screen now derives
    // ownership from the dashboard context provider instead of calling
    // useVportOwnership()/useParams() directly.
    expect(finalSource).toContain("useVportDashboardContext");
    expect(finalSource).not.toContain("useVportOwnership");

    // identity is still read for the identity prop passed into the view.
    expect(finalSource).toContain("useIdentity");

    // context-derived ownership fields drive the loading + owner gates.
    expect(finalSource).toContain("ownershipLoading");
    expect(finalSource).toContain("vportActorId");
    expect(finalSource).toContain("canManage");

    // owner state is still passed down into the view composition.
    expect(finalSource).toContain("VportDashboardGasView");
    expect(finalSource).toContain("isOwner={isOwner}");

    // dashboard data hooks stay in the view screen, not the final screen.
    expect(finalSource).not.toContain("useVportGasPrices");
    expect(finalSource).not.toContain("useSubmitFuelPriceSuggestion");
    expect(finalSource).not.toContain("useOwnerPendingSuggestions");
    expect(finalSource).not.toContain("useGasUnitToggle");
    expect(finalSource).not.toContain("useAfterSubmitSuggestion");
  });

  it("keeps the dashboard gas screen free of data-layer and authorization internals", () => {
    const finalSource = readCardSource("screens/VportDashboardGasScreen.jsx");

    expect(finalSource).not.toMatch(/@supabase|supabaseClient|createClient/);
    expect(finalSource).not.toMatch(/\/dal\//);
    expect(finalSource).not.toContain("features/authorization");
    expect(finalSource).not.toContain("assertActorOwnsVportActorController");
  });

  it("keeps the FROZEN public gas screen on its own ownership path (no dashboard context)", () => {
    // VportGasPricesScreen (/actor/:actorId/gas) was unwired from the router on
    // 2026-06-08 and is parked as a future feature. It was a PUBLIC route with
    // no VportDashboardProvider in its tree, so useVportDashboardContext() would
    // throw there. This lock prevents an accidental context migration if/when it
    // is re-wired. See the freeze notice at the top of the screen file.
    const publicSource = readCardSource("screens/VportGasPricesScreen.jsx");

    expect(publicSource).toContain("FROZEN");
    expect(publicSource).toContain("useVportOwnership");
    // Guard against an actual context migration (an import line) — not prose
    // mentions of the hook in the freeze notice at the top of the screen.
    expect(publicSource).not.toMatch(/^\s*import[^\n]*useVportDashboardContext/m);
  });

  it("keeps gas dashboard hook wiring in the view screen", () => {
    const viewSource = readCardSource("screens/VportDashboardGasView.jsx");

    expect(viewSource).toContain("useVportGasPrices");
    expect(viewSource).toContain("useSubmitFuelPriceSuggestion");
    expect(viewSource).toContain("useGasUnitToggle");

    // TICKET-FUEL-LEGACY-REVIEW-PATH-001: the legacy single-review cascade was
    // removed from the view. The stale-unaware single-review path must not return.
    expect(viewSource).not.toContain("useOwnerPendingSuggestions");
    expect(viewSource).not.toContain("useAfterSubmitSuggestion");
  });

  it("routes controller cache invalidation through FuelPriceCacheService", () => {
    const ownerSubmitSource = readCardSource("controller/submitOwnerFuelPriceUpdate.controller.js");
    const unitSource = readCardSource("controller/updateStationFuelUnit.controller.js");

    // reviewFuelPriceSuggestion.controller.js removed under
    // TICKET-FUEL-LEGACY-REVIEW-PATH-001 (legacy single-review path retired).
    for (const source of [ownerSubmitSource, unitSource]) {
      expect(source).toContain("FuelPriceCacheService");
      expect(source).not.toMatch(/import\s+\{[^}]*invalidateFuelPriceCache/);
      expect(source).not.toMatch(/import\s+\{[^}]*invalidatePendingSubmissionsCache/);
    }
  });

  it("centralizes official, pending, and settings cache invalidation in one service", () => {
    const serviceSource = readCardSource("services/fuelPriceCache.service.js");

    expect(serviceSource).toContain("invalidateOfficialPrices");
    expect(serviceSource).toContain("invalidatePendingSubmissions");
    expect(serviceSource).toContain("invalidateSettings");
    expect(serviceSource).toContain("invalidateAll");
    expect(serviceSource).toContain("invalidateFuelPriceCache");
    expect(serviceSource).toContain("invalidatePendingSubmissionsCache");
    expect(serviceSource).toContain("invalidateSettingsCache");
  });
});
