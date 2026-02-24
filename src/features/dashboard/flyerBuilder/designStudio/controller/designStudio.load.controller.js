import {
  dalListDesignAssetsByOwner,
  dalListDesignDocumentsByOwner,
  dalListDesignExportsByDocument,
  dalListDesignPagesByDocument,
  dalReadDesignPageVersionById,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalCreateDesignDocument,
  dalCreateDesignPage,
  dalCreateDesignPageVersion,
  dalTouchDesignDocument,
  dalUpdateDesignPageCurrentVersion,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal";
import {
  createFlyerStarterScene,
  DEFAULT_CANVAS_BG,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model";
import {
  mapDesignAsset,
  mapDesignDocument,
  mapDesignExport,
  mapDesignPage,
  mapDesignPageVersion,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioMapper.model";
import { requireOwnerActorAccess } from "@/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller";

const DEFAULT_DOCUMENT_KIND = "flyer_canvas";
const DEFAULT_DOCUMENT_TITLE = "VPORT Flyer Studio";

function mapStudioPagesWithVersions(pages, versionsById) {
  const mappedPages = pages.map((p) => mapDesignPage(p)).filter(Boolean);

  const mappedVersionsByPageId = {};
  mappedPages.forEach((page) => {
    const row = page.currentVersionId ? versionsById[page.currentVersionId] : null;
    if (!row) return;
    const mappedVersion = mapDesignPageVersion(row, page);
    if (mappedVersion) {
      mappedVersionsByPageId[page.id] = mappedVersion;
    }
  });

  return {
    pages: mappedPages,
    versionsByPageId: mappedVersionsByPageId,
  };
}

async function ensureDocument(ownerActorId, options = {}) {
  const kind = options.kind || DEFAULT_DOCUMENT_KIND;
  const title = options.title || DEFAULT_DOCUMENT_TITLE;

  const existing = await dalListDesignDocumentsByOwner({ ownerActorId, kind, limit: 1 });
  if (existing[0]) return existing[0];

  return dalCreateDesignDocument({ ownerActorId, title, kind });
}

async function ensurePageAndVersion({ documentRow, ownerActorId, starter }) {
  let pages = await dalListDesignPagesByDocument(documentRow.id);

  if (pages.length === 0) {
    const pageRow = await dalCreateDesignPage({
      documentId: documentRow.id,
      pageOrder: 0,
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      background: DEFAULT_CANVAS_BG,
    });

    const initialScene = createFlyerStarterScene({
      title: starter?.title,
      subtitle: starter?.subtitle,
      note: starter?.note,
      accentColor: starter?.accentColor,
      width: pageRow.width,
      height: pageRow.height,
      background: pageRow.background,
    });

    const versionRow = await dalCreateDesignPageVersion({
      pageId: pageRow.id,
      version: 1,
      content: initialScene,
      createdByActorId: ownerActorId,
    });

    await dalUpdateDesignPageCurrentVersion({
      pageId: pageRow.id,
      currentVersionId: versionRow.id,
      width: pageRow.width,
      height: pageRow.height,
      background: pageRow.background,
    });

    await dalTouchDesignDocument(documentRow.id);
    pages = await dalListDesignPagesByDocument(documentRow.id);
  }

  const versionsById = {};
  await Promise.all(
    pages.map(async (pageRow) => {
      if (!pageRow.current_version_id) return;
      const versionRow = await dalReadDesignPageVersionById(pageRow.current_version_id);
      if (versionRow) {
        versionsById[versionRow.id] = versionRow;
      }
    })
  );

  return mapStudioPagesWithVersions(pages, versionsById);
}

export async function ctrlLoadDesignStudio({ ownerActorId, starter }) {
  await requireOwnerActorAccess(ownerActorId);

  const documentRow = await ensureDocument(ownerActorId, {
    title: starter?.documentTitle,
  });

  const pageState = await ensurePageAndVersion({
    documentRow,
    ownerActorId,
    starter,
  });

  const assetsRows = await dalListDesignAssetsByOwner({ ownerActorId, limit: 120 });
  const exportRows = await dalListDesignExportsByDocument({ documentId: documentRow.id, limit: 80 });

  return {
    document: mapDesignDocument(documentRow),
    pages: pageState.pages,
    versionsByPageId: pageState.versionsByPageId,
    assets: assetsRows.map(mapDesignAsset),
    exports: exportRows.map(mapDesignExport),
  };
}
