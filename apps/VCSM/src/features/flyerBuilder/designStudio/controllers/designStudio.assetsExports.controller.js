import { uploadMediaController } from '@media'
import {
  dalListDesignExportsByDocument,
  dalListDesignRenderJobsByExportIds,
  dalReadDesignPageById,
  dalReadDesignPageVersionById,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalCreateDesignAsset,
  dalCreateDesignExport,
  dalCreateDesignRenderJob,
} from "@/features/flyerBuilder/designStudio/dal/designStudio.write.dal";
import {
  mapDesignAsset,
  mapDesignExport,
  mapDesignRenderJob,
} from "@/features/flyerBuilder/designStudio/models/designStudioMapper.model";
import {
  requireDesignDocumentOwnerAccess,
  requireOwnerActorAccess,
} from "@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller";
import { createMediaAssetController } from "@/features/media/adapters/media.adapter";
import { resolveVcsmAppId } from '@/features/media/adapters/mediaAppId.adapter'

export async function ctrlUploadDesignAsset({ ownerActorId, file }) {
  await requireOwnerActorAccess(ownerActorId)
  if (!file) throw new Error('File required.')

  const result = await uploadMediaController({
    file,
    scope: 'design_asset',
    ownerActorId,
    opts: { extraPath: 'flyer' },
  })

  const assetRow = await dalCreateDesignAsset({
    ownerActorId,
    url: result.publicUrl,
    mime: result.mimeType,
    sizeBytes: result.sizeBytes,
    width: result.width,
    height: result.height,
  })

  // Record in platform.media_assets — additive, never blocks the caller.
  try {
    const appId = await resolveVcsmAppId()
    await createMediaAssetController({
      mediaUploadResult:  result,
      ownerActorId,
      createdByActorId:   ownerActorId,
      scope:              'design_asset',
      scopeId:            assetRow.id,
      appId,
    })
  } catch (e) {
    if (import.meta.env?.DEV) console.warn('[ctrlUploadDesignAsset] media_assets record failed (non-fatal):', e?.message)
  }

  return mapDesignAsset(assetRow)
}

export async function ctrlQueueDesignExport({
  ownerActorId,
  documentId,
  pageId,
  versionId,
  format,
}) {
  await requireDesignDocumentOwnerAccess({ ownerActorId, documentId });

  // Bind the nested resources to the gated document before queueing — mirror
  // ctrlSaveDesignPageScene. The document gate alone does not stop a caller from
  // supplying a foreign pageId/versionId (V09-M1). Reject cross-document refs
  // before any write. (Durable boundary stays 09-DB-2: RLS + render worker.)
  const pageRow = await dalReadDesignPageById(pageId);
  if (!pageRow) throw new Error("Page not found.");
  if (String(pageRow.document_id) !== String(documentId)) {
    throw new Error("Page does not belong to this document.");
  }

  if (versionId) {
    const versionRow = await dalReadDesignPageVersionById(versionId);
    if (!versionRow) throw new Error("Page version not found.");
    if (String(versionRow.page_id) !== String(pageId)) {
      throw new Error("Page version does not belong to this page.");
    }
  }

  const safeFormat = ["png", "pdf"].includes(format) ? format : "png";
  const now = new Date().toISOString();

  const exportRow = await dalCreateDesignExport({
    documentId,
    pageId,
    format: safeFormat,
    status: "queued",
    requestedByActorId: ownerActorId,
  });

  const jobRow = await dalCreateDesignRenderJob({
    exportId: exportRow.id,
    documentId,
    pageId,
    versionId,
    priority: 10,
    status: "queued",
    attempts: 0,
    maxAttempts: 5,
    runAfter: now,
  });

  return {
    exportRecord: mapDesignExport(exportRow),
    renderJob: mapDesignRenderJob(jobRow),
  };
}

export async function ctrlRefreshDesignExports({ ownerActorId, documentId }) {
  await requireDesignDocumentOwnerAccess({ ownerActorId, documentId });

  const exportsRows = await dalListDesignExportsByDocument({ documentId, limit: 80 });
  const mappedExports = exportsRows.map(mapDesignExport);

  const jobsRows = await dalListDesignRenderJobsByExportIds(mappedExports.map((record) => record.id));
  const jobsByExportId = {};
  jobsRows.forEach((row) => {
    const mapped = mapDesignRenderJob(row);
    const prev = jobsByExportId[mapped.exportId];
    if (!prev || String(prev.createdAt) < String(mapped.createdAt)) {
      jobsByExportId[mapped.exportId] = mapped;
    }
  });

  return {
    exports: mappedExports,
    jobsByExportId,
  };
}
