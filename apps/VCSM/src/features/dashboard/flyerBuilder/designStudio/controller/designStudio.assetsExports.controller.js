import { uploadMediaController } from '@media'
import {
  dalListDesignExportsByDocument,
  dalListDesignRenderJobsByExportIds,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal";
import {
  dalCreateDesignAsset,
  dalCreateDesignExport,
  dalCreateDesignRenderJob,
} from "@/features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal";
import {
  mapDesignAsset,
  mapDesignExport,
  mapDesignRenderJob,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioMapper.model";
import { requireOwnerActorAccess } from "@/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller";
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
  await requireOwnerActorAccess(ownerActorId);

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
  await requireOwnerActorAccess(ownerActorId);

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
