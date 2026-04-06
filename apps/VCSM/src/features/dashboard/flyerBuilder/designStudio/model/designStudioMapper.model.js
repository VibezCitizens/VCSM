import {
  DEFAULT_CANVAS_BG,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  ensureSceneContent,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model";

function asIso(value) {
  return value ? String(value) : null;
}

export function mapDesignDocument(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerActorId: row.owner_actor_id,
    title: row.title,
    kind: row.kind,
    isDeleted: Boolean(row.is_deleted),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export function mapDesignPage(row) {
  if (!row) return null;
  return {
    id: row.id,
    documentId: row.document_id,
    pageOrder: Number(row.page_order || 0),
    width: Number(row.width || DEFAULT_CANVAS_WIDTH),
    height: Number(row.height || DEFAULT_CANVAS_HEIGHT),
    background: row.background || DEFAULT_CANVAS_BG,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
    currentVersionId: row.current_version_id || null,
  };
}

export function mapDesignPageVersion(row, page) {
  if (!row) return null;
  return {
    id: row.id,
    pageId: row.page_id,
    version: Number(row.version || 1),
    content: ensureSceneContent(row.content, {
      width: page?.width,
      height: page?.height,
      background: page?.background,
    }),
    createdByActorId: row.created_by_actor_id || null,
    createdAt: asIso(row.created_at),
  };
}

export function mapDesignAsset(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerActorId: row.owner_actor_id,
    url: row.url,
    mime: row.mime,
    sizeBytes: row.size_bytes ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    createdAt: asIso(row.created_at),
    isDeleted: Boolean(row.is_deleted),
  };
}

export function mapDesignExport(row) {
  if (!row) return null;
  return {
    id: row.id,
    documentId: row.document_id,
    pageId: row.page_id || null,
    format: row.format,
    status: row.status,
    url: row.url || null,
    mime: row.mime || null,
    sizeBytes: row.size_bytes ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    pageCount: row.page_count ?? null,
    error: row.error || null,
    requestedByActorId: row.requested_by_actor_id || null,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export function mapDesignRenderJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    exportId: row.export_id,
    documentId: row.document_id,
    pageId: row.page_id || null,
    versionId: row.version_id || null,
    priority: Number(row.priority || 0),
    status: row.status,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 0),
    lockedAt: asIso(row.locked_at),
    lockedBy: row.locked_by || null,
    runAfter: asIso(row.run_after),
    error: row.error || null,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}
