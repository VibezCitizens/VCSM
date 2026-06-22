/**
 * Regression tests — designStudio document ownership binding
 *
 * ELEK-002 / VEN-DASH-003:
 * Page and export controller paths must reject cross-owner documentId values
 * before reaching DAL reads or writes.
 *
 * Run: npx vitest run src/features/flyerBuilder/designStudio/controller/__tests__/designStudio.documentOwner.controller.test.js
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@media", () => ({
  uploadMediaController: vi.fn(),
}));

vi.mock("@/features/media/adapters/media.adapter", () => ({
  createMediaAssetController: vi.fn(),
}));

vi.mock("@/features/media/adapters/mediaAppId.adapter", () => ({
  resolveVcsmAppId: vi.fn(),
}));

vi.mock("@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller", () => ({
  requireDesignDocumentOwnerAccess: vi.fn(),
  requireOwnerActorAccess: vi.fn(),
}));

vi.mock("@/features/flyerBuilder/designStudio/dal/designStudio.read.dal", () => ({
  dalListDesignExportsByDocument: vi.fn(),
  dalListDesignPagesByDocument: vi.fn(),
  dalListDesignRenderJobsByExportIds: vi.fn(),
  dalReadDesignPageById: vi.fn(),
  dalReadLatestDesignPageVersion: vi.fn(),
}));

vi.mock("@/features/flyerBuilder/designStudio/dal/designStudio.write.dal", () => ({
  dalClearDesignPageCurrentVersion: vi.fn(),
  dalCreateDesignAsset: vi.fn(),
  dalCreateDesignExport: vi.fn(),
  dalCreateDesignPage: vi.fn(),
  dalCreateDesignPageVersion: vi.fn(),
  dalCreateDesignRenderJob: vi.fn(),
  dalDeleteDesignExportsByPageId: vi.fn(),
  dalDeleteDesignPageById: vi.fn(),
  dalDeleteDesignPageVersionsByPageId: vi.fn(),
  dalDeleteDesignRenderJobsByPageId: vi.fn(),
  dalTouchDesignDocument: vi.fn(),
  dalUpdateDesignPageCurrentVersion: vi.fn(),
}));

import { requireDesignDocumentOwnerAccess } from "@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller";
import {
  dalListDesignExportsByDocument,
  dalListDesignPagesByDocument,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalCreateDesignExport,
  dalCreateDesignPage,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.write.dal";
import {
  ctrlQueueDesignExport,
  ctrlRefreshDesignExports,
} from "@/features/flyerBuilder/designStudio/controllers/designStudio.assetsExports.controller";
import { ctrlCreateDesignPage } from "@/features/flyerBuilder/designStudio/controllers/designStudio.pages.controller";

const OWNER_ACTOR_ID = "actor-vport-owner";
const DOCUMENT_ID = "document-1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("designStudio document owner controller binding", () => {
  it("rejects create-page before listing or inserting pages when document ownership fails", async () => {
    requireDesignDocumentOwnerAccess.mockRejectedValue(new Error("cross owner"));

    await expect(
      ctrlCreateDesignPage({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).rejects.toThrow("cross owner");

    expect(requireDesignDocumentOwnerAccess).toHaveBeenCalledWith({
      ownerActorId: OWNER_ACTOR_ID,
      documentId: DOCUMENT_ID,
    });
    expect(dalListDesignPagesByDocument).not.toHaveBeenCalled();
    expect(dalCreateDesignPage).not.toHaveBeenCalled();
  });

  it("rejects export queueing before inserting export rows when document ownership fails", async () => {
    requireDesignDocumentOwnerAccess.mockRejectedValue(new Error("cross owner"));

    await expect(
      ctrlQueueDesignExport({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
        pageId: "page-1",
        versionId: "version-1",
        format: "png",
      })
    ).rejects.toThrow("cross owner");

    expect(requireDesignDocumentOwnerAccess).toHaveBeenCalledWith({
      ownerActorId: OWNER_ACTOR_ID,
      documentId: DOCUMENT_ID,
    });
    expect(dalCreateDesignExport).not.toHaveBeenCalled();
  });

  it("rejects export refresh before reading export rows when document ownership fails", async () => {
    requireDesignDocumentOwnerAccess.mockRejectedValue(new Error("cross owner"));

    await expect(
      ctrlRefreshDesignExports({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
      })
    ).rejects.toThrow("cross owner");

    expect(dalListDesignExportsByDocument).not.toHaveBeenCalled();
  });
});
