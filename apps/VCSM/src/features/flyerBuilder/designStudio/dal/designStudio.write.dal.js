import { supabase } from "@/services/supabase/supabaseClient";

const VC = () => supabase.schema("vc");

export async function dalCreateDesignDocument({ ownerActorId, title, kind }) {
  const { data, error } = await VC()
    .from("design_documents")
    .insert({
      owner_actor_id: ownerActorId,
      title,
      kind,
      is_deleted: false,
    })
    .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function dalTouchDesignDocument(documentId) {
  const { data, error } = await VC()
    .from("design_documents")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function dalCreateDesignPage({ documentId, pageOrder, width, height, background }) {
  const { data, error } = await VC()
    .from("design_pages")
    .insert({
      document_id: documentId,
      page_order: pageOrder,
      width,
      height,
      background,
    })
    .select("id,document_id,page_order,width,height,background,created_at,updated_at,current_version_id")
    .single();

  if (error) throw error;
  return data;
}

export async function dalUpdateDesignPageCurrentVersion({ pageId, currentVersionId, width, height, background }) {
  const patch = {
    current_version_id: currentVersionId,
    updated_at: new Date().toISOString(),
  };

  if (typeof width === "number") patch.width = width;
  if (typeof height === "number") patch.height = height;
  if (typeof background === "string") patch.background = background;

  const { data, error } = await VC()
    .from("design_pages")
    .update(patch)
    .eq("id", pageId)
    .select("id,document_id,page_order,width,height,background,created_at,updated_at,current_version_id")
    .single();

  if (error) throw error;
  return data;
}

export async function dalCreateDesignPageVersion({ pageId, version, content, createdByActorId }) {
  const { data, error } = await VC()
    .from("design_page_versions")
    .insert({
      page_id: pageId,
      version,
      content,
      created_by_actor_id: createdByActorId,
    })
    .select("id,page_id,version,content,created_by_actor_id,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function dalCreateDesignAsset({ ownerActorId, url, mime, sizeBytes, width, height }) {
  const { data, error } = await VC()
    .from("design_assets")
    .insert({
      owner_actor_id: ownerActorId,
      url,
      mime,
      size_bytes: sizeBytes ?? null,
      width: width ?? null,
      height: height ?? null,
      is_deleted: false,
    })
    .select("id,owner_actor_id,url,mime,size_bytes,width,height,created_at,is_deleted")
    .single();

  if (error) throw error;
  return data;
}

export async function dalCreateDesignExport({ documentId, pageId, format, status, requestedByActorId }) {
  const { data, error } = await VC()
    .from("design_exports")
    .insert({
      document_id: documentId,
      page_id: pageId ?? null,
      format,
      status,
      requested_by_actor_id: requestedByActorId ?? null,
    })
    .select("id,document_id,page_id,format,status,url,mime,size_bytes,width,height,page_count,error,requested_by_actor_id,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function dalCreateDesignRenderJob({
  exportId,
  documentId,
  pageId,
  versionId,
  priority,
  status,
  attempts,
  maxAttempts,
  runAfter,
}) {
  const { data, error } = await VC()
    .from("design_render_jobs")
    .insert({
      export_id: exportId,
      document_id: documentId,
      page_id: pageId ?? null,
      version_id: versionId ?? null,
      priority,
      status,
      attempts,
      max_attempts: maxAttempts,
      run_after: runAfter,
    })
    .select("id,export_id,document_id,page_id,version_id,priority,status,attempts,max_attempts,locked_at,locked_by,run_after,error,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function dalDeleteDesignRenderJobsByPageId(pageId) {
  if (!pageId) return 0;

  const { error, count } = await VC()
    .from("design_render_jobs")
    .delete({ count: "exact" })
    .eq("page_id", pageId);

  if (error) throw error;
  return count || 0;
}

export async function dalDeleteDesignExportsByPageId(pageId) {
  if (!pageId) return 0;

  const { error, count } = await VC()
    .from("design_exports")
    .delete({ count: "exact" })
    .eq("page_id", pageId);

  if (error) throw error;
  return count || 0;
}

export async function dalClearDesignPageCurrentVersion(pageId) {
  if (!pageId) return null;

  const { data, error } = await VC()
    .from("design_pages")
    .update({ current_version_id: null, updated_at: new Date().toISOString() })
    .eq("id", pageId)
    .select("id,document_id,page_order,width,height,background,created_at,updated_at,current_version_id")
    .single();

  if (error) throw error;
  return data;
}

export async function dalDeleteDesignPageVersionsByPageId(pageId) {
  if (!pageId) return 0;

  const { error, count } = await VC()
    .from("design_page_versions")
    .delete({ count: "exact" })
    .eq("page_id", pageId);

  if (error) throw error;
  return count || 0;
}

export async function dalDeleteDesignPageById(pageId) {
  if (!pageId) return 0;

  const { error, count } = await VC()
    .from("design_pages")
    .delete({ count: "exact" })
    .eq("id", pageId);

  if (error) throw error;
  return count || 0;
}
