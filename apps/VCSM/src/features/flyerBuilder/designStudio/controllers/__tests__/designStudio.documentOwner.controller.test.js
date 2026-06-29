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
  dalReadDesignPageVersionById: vi.fn(),
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
  dalReadDesignPageById,
  dalReadDesignPageVersionById,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalCreateDesignExport,
  dalCreateDesignPage,
  dalCreateDesignRenderJob,
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

describe("ctrlQueueDesignExport nested-resource binding (V09-M1)", () => {
  const PAGE_ID = "page-1";
  const VERSION_ID = "version-1";

  beforeEach(() => {
    // Document ownership passes here; the nested-resource bind is under test.
    requireDesignDocumentOwnerAccess.mockResolvedValue({
      id: DOCUMENT_ID,
      owner_actor_id: OWNER_ACTOR_ID,
    });
  });

  it("rejects a pageId that belongs to a foreign document before any write", async () => {
    dalReadDesignPageById.mockResolvedValue({ id: PAGE_ID, document_id: "document-OTHER" });

    await expect(
      ctrlQueueDesignExport({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
        pageId: PAGE_ID,
        versionId: VERSION_ID,
        format: "png",
      })
    ).rejects.toThrow("Page does not belong to this document.");

    expect(dalReadDesignPageVersionById).not.toHaveBeenCalled();
    expect(dalCreateDesignExport).not.toHaveBeenCalled();
    expect(dalCreateDesignRenderJob).not.toHaveBeenCalled();
  });

  it("rejects a versionId that belongs to a foreign page before any write", async () => {
    dalReadDesignPageById.mockResolvedValue({ id: PAGE_ID, document_id: DOCUMENT_ID });
    dalReadDesignPageVersionById.mockResolvedValue({ id: VERSION_ID, page_id: "page-OTHER" });

    await expect(
      ctrlQueueDesignExport({
        ownerActorId: OWNER_ACTOR_ID,
        documentId: DOCUMENT_ID,
        pageId: PAGE_ID,
        versionId: VERSION_ID,
        format: "png",
      })
    ).rejects.toThrow("Page version does not belong to this page.");

    expect(dalCreateDesignExport).not.toHaveBeenCalled();
    expect(dalCreateDesignRenderJob).not.toHaveBeenCalled();
  });

  it("queues the export when page and version belong to the gated document", async () => {
    dalReadDesignPageById.mockResolvedValue({ id: PAGE_ID, document_id: DOCUMENT_ID });
    dalReadDesignPageVersionById.mockResolvedValue({ id: VERSION_ID, page_id: PAGE_ID });
    dalCreateDesignExport.mockResolvedValue({
      id: "export-1",
      document_id: DOCUMENT_ID,
      page_id: PAGE_ID,
      format: "png",
      status: "queued",
    });
    dalCreateDesignRenderJob.mockResolvedValue({
      id: "job-1",
      export_id: "export-1",
      document_id: DOCUMENT_ID,
      page_id: PAGE_ID,
      version_id: VERSION_ID,
      status: "queued",
    });

    const result = await ctrlQueueDesignExport({
      ownerActorId: OWNER_ACTOR_ID,
      documentId: DOCUMENT_ID,
      pageId: PAGE_ID,
      versionId: VERSION_ID,
      format: "png",
    });

    expect(dalCreateDesignExport).toHaveBeenCalledTimes(1);
    expect(dalCreateDesignRenderJob).toHaveBeenCalledTimes(1);
    expect(result.exportRecord.id).toBe("export-1");
    expect(result.renderJob.id).toBe("job-1");
  });
});
