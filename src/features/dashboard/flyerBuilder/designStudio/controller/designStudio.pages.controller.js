import {
  dalListDesignPagesByDocument,
  dalReadDesignPageById,
  dalReadLatestDesignPageVersion,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalClearDesignPageCurrentVersion,
  dalCreateDesignPage,
  dalCreateDesignPageVersion,
  dalDeleteDesignExportsByPageId,
  dalDeleteDesignPageById,
  dalDeleteDesignPageVersionsByPageId,
  dalDeleteDesignRenderJobsByPageId,
  dalTouchDesignDocument,
  dalUpdateDesignPageCurrentVersion,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal";
import {
  createFlyerStarterScene,
  DEFAULT_CANVAS_BG,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  ensureSceneContent,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model";
import {
  mapDesignPage,
  mapDesignPageVersion,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioMapper.model";
import { requireOwnerActorAccess } from "@/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller";

const MAX_PAGES_PER_DOCUMENT = 1;

export async function ctrlSaveDesignPageScene({ ownerActorId, documentId, pageId, scene }) {
  await requireOwnerActorAccess(ownerActorId);
  if (!documentId) throw new Error("Document id is required.");

  const pageRow = await dalReadDesignPageById(pageId);
  if (!pageRow) throw new Error("Page not found.");
  if (String(pageRow.document_id) !== String(documentId)) {
    throw new Error("Page does not belong to this document.");
  }

  const safeScene = ensureSceneContent(scene, {
    width: pageRow.width,
    height: pageRow.height,
    background: pageRow.background,
  });

  const latest = await dalReadLatestDesignPageVersion(pageId);
  const nextVersion = (latest?.version || 0) + 1;

  const createdVersion = await dalCreateDesignPageVersion({
    pageId,
    version: nextVersion,
    content: safeScene,
    createdByActorId: ownerActorId,
  });

  const updatedPage = await dalUpdateDesignPageCurrentVersion({
    pageId,
    currentVersionId: createdVersion.id,
    width: safeScene.meta.width,
    height: safeScene.meta.height,
    background: safeScene.meta.background,
  });

  await dalTouchDesignDocument(documentId);

  return {
    page: mapDesignPage(updatedPage),
    version: mapDesignPageVersion(createdVersion, updatedPage),
  };
}

export async function ctrlCreateDesignPage({ ownerActorId, documentId }) {
  await requireOwnerActorAccess(ownerActorId);

  const pages = await dalListDesignPagesByDocument(documentId);
  if (pages.length >= MAX_PAGES_PER_DOCUMENT) {
    throw new Error(`Only ${MAX_PAGES_PER_DOCUMENT} page is allowed right now.`);
  }
  const nextOrder = pages.length ? Math.max(...pages.map((p) => Number(p.page_order || 0))) + 1 : 0;

  const pageRow = await dalCreateDesignPage({
    documentId,
    pageOrder: nextOrder,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    background: DEFAULT_CANVAS_BG,
  });

  const scene = createFlyerStarterScene({
    title: "New Page",
    subtitle: "Tap elements to edit",
    note: "Drag, resize, and export when ready",
    width: pageRow.width,
    height: pageRow.height,
    background: pageRow.background,
  });

  const versionRow = await dalCreateDesignPageVersion({
    pageId: pageRow.id,
    version: 1,
    content: scene,
    createdByActorId: ownerActorId,
  });

  const updatedPage = await dalUpdateDesignPageCurrentVersion({
    pageId: pageRow.id,
    currentVersionId: versionRow.id,
    width: pageRow.width,
    height: pageRow.height,
    background: pageRow.background,
  });

  await dalTouchDesignDocument(documentId);

  return {
    page: mapDesignPage(updatedPage),
    version: mapDesignPageVersion(versionRow, updatedPage),
  };
}

export async function ctrlDeleteDesignPage({ ownerActorId, documentId, pageId }) {
  await requireOwnerActorAccess(ownerActorId);
  if (!pageId) throw new Error("Page id is required.");

  const pages = await dalListDesignPagesByDocument(documentId);
  if (pages.length <= 1) {
    throw new Error("At least one page is required.");
  }

  const targetPage = pages.find((row) => row.id === pageId);
  if (!targetPage) {
    throw new Error("Page not found.");
  }

  await dalDeleteDesignRenderJobsByPageId(pageId);
  await dalDeleteDesignExportsByPageId(pageId);
  await dalClearDesignPageCurrentVersion(pageId);
  await dalDeleteDesignPageVersionsByPageId(pageId);
  await dalDeleteDesignPageById(pageId);
  await dalTouchDesignDocument(documentId);

  return { deletedPageId: pageId };
}
