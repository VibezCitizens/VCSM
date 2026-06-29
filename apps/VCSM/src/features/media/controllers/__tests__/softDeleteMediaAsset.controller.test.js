/**
 * Regression tests — softDeleteMediaAssetController session-bound ownership
 *
 * TICKET-MEDIA-LIFECYCLE-OWNERBIND-001 / V06C-M2:
 * The media soft-delete must verify the authenticated session owns `actorId`
 * (kind-agnostic, via vc.actor_owners) before delegating to the DAL, and must
 * perform NO update on rejection. This is defense-in-depth; the durable boundary
 * is platform.media_assets RLS (06C-DB-3, {public} policy, Phase 15).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/auth/adapters/authSession.adapter", () => ({
  readCurrentAuthUser: vi.fn(),
}));
vi.mock("@/features/media/dal/mediaAssets.ownership.read.dal", () => ({
  readMediaOwnerLinkDAL: vi.fn(),
}));
vi.mock("@/features/media/dal/mediaAssets.softDelete.dal", () => ({
  softDeleteMediaAssetDAL: vi.fn(),
}));

import { softDeleteMediaAssetController } from "@/features/media/controllers/softDeleteMediaAsset.controller";
import { readCurrentAuthUser } from "@/features/auth/adapters/authSession.adapter";
import { readMediaOwnerLinkDAL } from "@/features/media/dal/mediaAssets.ownership.read.dal";
import { softDeleteMediaAssetDAL } from "@/features/media/dal/mediaAssets.softDelete.dal";

const ASSET_ID = "asset-1";
const ACTOR_ID = "actor-1";
const USER_ID = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("softDeleteMediaAssetController — session-bound ownership (V06C-M2)", () => {
  it("rejects when there is no authenticated session — no DAL update", async () => {
    readCurrentAuthUser.mockResolvedValue(null);

    await expect(
      softDeleteMediaAssetController({ assetId: ASSET_ID, actorId: ACTOR_ID })
    ).rejects.toThrow("Not authenticated");

    expect(readMediaOwnerLinkDAL).not.toHaveBeenCalled();
    expect(softDeleteMediaAssetDAL).not.toHaveBeenCalled();
  });

  it("rejects when the session does not own the actor — no DAL update", async () => {
    readCurrentAuthUser.mockResolvedValue({ id: USER_ID });
    readMediaOwnerLinkDAL.mockResolvedValue(null);

    await expect(
      softDeleteMediaAssetController({ assetId: ASSET_ID, actorId: ACTOR_ID })
    ).rejects.toThrow("actor not owned by session user");

    expect(readMediaOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR_ID, userId: USER_ID });
    expect(softDeleteMediaAssetDAL).not.toHaveBeenCalled();
  });

  it("proceeds to the soft-delete when the session owns the actor", async () => {
    readCurrentAuthUser.mockResolvedValue({ id: USER_ID });
    readMediaOwnerLinkDAL.mockResolvedValue({ actor_id: ACTOR_ID, is_void: false });
    softDeleteMediaAssetDAL.mockResolvedValue({ id: ASSET_ID, status: "deleted" });

    const result = await softDeleteMediaAssetController({ assetId: ASSET_ID, actorId: ACTOR_ID });

    expect(readMediaOwnerLinkDAL).toHaveBeenCalledWith({ actorId: ACTOR_ID, userId: USER_ID });
    expect(softDeleteMediaAssetDAL).toHaveBeenCalledWith(ASSET_ID, ACTOR_ID);
    expect(result).toEqual({ id: ASSET_ID, status: "deleted" });
  });
});

describe("softDeleteMediaAsset — source guards (V06C-M2)", () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));

  it("keeps the owner_actor_id defense-in-depth filter on the soft-delete UPDATE", () => {
    const dalSrc = readFileSync(
      join(currentDir, "../../dal/mediaAssets.softDelete.dal.js"),
      "utf8"
    );
    expect(dalSrc).toMatch(/\.eq\(['"]owner_actor_id['"],\s*deletedByActorId\)/);
  });

  it("keeps the controller session + ownership bind in place", () => {
    const ctrlSrc = readFileSync(
      join(currentDir, "../softDeleteMediaAsset.controller.js"),
      "utf8"
    );
    expect(ctrlSrc).toContain("readCurrentAuthUser");
    expect(ctrlSrc).toContain("readMediaOwnerLinkDAL");
  });
});
