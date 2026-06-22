import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addMedia: vi.fn(),
  createMediaAssetController: vi.fn(),
  resolveVcsmAppId: vi.fn(),
  updatePortfolioMediaAssetIdDAL: vi.fn(),
}));

vi.mock("@portfolio", () => ({
  addMedia: mocks.addMedia,
}));

vi.mock("@/features/media/adapters/media.adapter", () => ({
  createMediaAssetController: mocks.createMediaAssetController,
}));

vi.mock("@/features/media/adapters/mediaAppId.adapter", () => ({
  resolveVcsmAppId: mocks.resolveVcsmAppId,
}));

vi.mock("@/features/vportDashboard/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal", () => ({
  updatePortfolioMediaAssetIdDAL: mocks.updatePortfolioMediaAssetIdDAL,
}));

const currentDir = dirname(fileURLToPath(import.meta.url));
const cardRoot = join(currentDir, "..");

const readCardSource = (relativePath) => readFileSync(join(cardRoot, relativePath), "utf8");

describe("portfolio SPIDER-MAN governance coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the public card index free of write internals", () => {
    const indexSource = readCardSource("index.js");

    expect(indexSource).not.toMatch(/from\s+["']\.\/dal\//);
    expect(indexSource).not.toMatch(/from\s+["']\.\/controller\//);
  });

  it("keeps portfolio hooks in the card-level hooks directory", () => {
    expect(existsSync(join(cardRoot, "hooks/usePortfolioItemSubmit.js"))).toBe(true);
    expect(existsSync(join(cardRoot, "hooks/usePortfolioMediaUpload.js"))).toBe(true);
    expect(existsSync(join(cardRoot, "components/portfolio/hooks/usePortfolioItemSubmit.js"))).toBe(false);
    expect(existsSync(join(cardRoot, "components/portfolio/hooks/usePortfolioMediaUpload.js"))).toBe(false);

    const formSource = readCardSource("components/portfolio/PortfolioItemForm.jsx");
    expect(formSource).toContain("@/features/vportDashboard/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit");
    expect(formSource).toContain("@/features/vportDashboard/dashboard/cards/portfolio/hooks/usePortfolioMediaUpload");
    expect(formSource).not.toContain("./hooks/usePortfolioItemSubmit");
    expect(formSource).not.toContain("./hooks/usePortfolioMediaUpload");
  });

  it("uses an adapter for portfolio trace diagnostics", () => {
    const probeHookSource = readCardSource("hooks/useVportPortfolioProbe.js");

    expect(probeHookSource).toContain("@/features/portfolio/adapters/portfolioTrace.adapter");
    expect(probeHookSource).not.toContain("@/features/portfolio/setup");
    expect(probeHookSource).not.toMatch(/portfolioTraceStore/);
  });

  it("requires the dashboard owner gate before rendering manager workflows", () => {
    const screenSource = readCardSource("VportDashboardPortfolioScreen.jsx");

    // TICKET-VD-CTX-001 (Ticket 3): ownership is now provided by the dashboard
    // context provider; the screen no longer calls useVportOwnership() directly.
    const contextHookIndex = screenSource.indexOf("useVportDashboardContext()");
    const ownerBlockIndex = screenSource.indexOf("if (!isOwner)");
    const formIndex = screenSource.indexOf("<PortfolioItemForm");
    const managerIndex = screenSource.indexOf("<PortfolioManagerCard");

    expect(contextHookIndex).toBeGreaterThan(-1);
    expect(screenSource).not.toContain("useVportOwnership");

    // owner gate must still run before any manager workflow renders.
    expect(ownerBlockIndex).toBeGreaterThan(contextHookIndex);
    expect(ownerBlockIndex).toBeLessThan(formIndex);
    expect(ownerBlockIndex).toBeLessThan(managerIndex);
  });

  it("keeps the portfolio dashboard screen free of data-layer and authorization internals", () => {
    const screenSource = readCardSource("VportDashboardPortfolioScreen.jsx");

    expect(screenSource).toContain("useVportDashboardContext");
    expect(screenSource).not.toMatch(/@supabase|supabaseClient|createClient/);
    expect(screenSource).not.toMatch(/from\s+["'][^"']*\/dal\//);
    expect(screenSource).not.toContain("features/authorization");
    // authorization stays in portfolio controllers, never in the screen.
    expect(screenSource).not.toContain("assertActorOwnsVportActorController");
  });

  it("keeps media asset backfill scoped to the caller profile", () => {
    const dalSource = readCardSource("dal/portfolioMediaRecord.write.dal.js");
    const controllerSource = readCardSource("controller/addPortfolioMediaWithRecord.controller.js");

    expect(dalSource).toContain("callerProfileId");
    expect(dalSource).toContain("callerProfileId required");
    expect(dalSource).toContain(".eq('profile_id', callerProfileId)");
    expect(dalSource).not.toMatch(/select\s*\(\s*["']\*/);
    expect(controllerSource).toContain("callerProfileId:");
    expect(controllerSource).toContain("portfolioMedia.profileId ?? portfolioMedia.profile_id");
  });

  it("passes portfolio media profile scope into the write DAL", async () => {
    mocks.addMedia.mockResolvedValue({ id: "media-1", profileId: "profile-1" });
    mocks.resolveVcsmAppId.mockResolvedValue("app-1");
    mocks.createMediaAssetController.mockResolvedValue({ id: "asset-1" });
    mocks.updatePortfolioMediaAssetIdDAL.mockResolvedValue(undefined);

    const { addPortfolioMediaWithRecord } = await import(
      "@/features/vportDashboard/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller"
    );

    const result = await addPortfolioMediaWithRecord({
      itemId: "item-1",
      actorId: "actor-1",
      url: "https://example.test/portfolio.jpg",
      mediaType: "image",
      mediaRole: "cover",
      sortOrder: 0,
      mediaUploadResult: { publicUrl: "https://example.test/portfolio.jpg" },
    });

    await vi.waitFor(() => {
      expect(mocks.updatePortfolioMediaAssetIdDAL).toHaveBeenCalledWith({
        portfolioMediaId: "media-1",
        mediaAssetId: "asset-1",
        callerProfileId: "profile-1",
      });
    });
    expect(result).toEqual({ id: "media-1", profileId: "profile-1" });
  });
});
