import { buildR2Key } from "@/services/cloudflare/buildR2Key";
import { uploadToCloudflare } from "@/services/cloudflare/uploadToCloudflare";
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

async function readImageDimensions(url) {
  if (!url) return { width: null, height: null };

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = url;
  });
}

export async function ctrlUploadDesignAsset({ ownerActorId, file }) {
  await requireOwnerActorAccess(ownerActorId);
  if (!file) throw new Error("File required.");

  const key = buildR2Key("design-assets", ownerActorId, file, { extraPath: "flyer" });
  const { url, error } = await uploadToCloudflare(file, key);

  if (error) throw new Error(error);
  if (!url) throw new Error("Upload failed.");

  const dimensions = file.type?.startsWith("image/")
    ? await readImageDimensions(url)
    : { width: null, height: null };

  const assetRow = await dalCreateDesignAsset({
    ownerActorId,
    url,
    mime: file.type || "application/octet-stream",
    sizeBytes: file.size || null,
    width: dimensions.width,
    height: dimensions.height,
  });

  return mapDesignAsset(assetRow);
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
