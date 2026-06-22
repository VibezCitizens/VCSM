import { supabase } from "@/services/supabase/supabaseClient";

const VC = () => supabase.schema("vc");

export async function dalReadActorOwnerRow({ actorId, userId }) {
  const { data, error } = await VC()
    .from("actor_owners")
    .select("actor_id,user_id")
    .eq("actor_id", actorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalListDesignDocumentsByOwner({ ownerActorId, kind, limit = 20 }) {
  let query = VC()
    .from("design_documents")
    .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
    .eq("owner_actor_id", ownerActorId)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function dalReadDesignDocumentById(documentId) {
  const { data, error } = await VC()
    .from("design_documents")
    .select("id,owner_actor_id,title,kind,is_deleted,created_at,updated_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalListDesignPagesByDocument(documentId) {
  const { data, error } = await VC()
    .from("design_pages")
    .select("id,document_id,page_order,width,height,background,created_at,updated_at,current_version_id")
    .eq("document_id", documentId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function dalReadDesignPageById(pageId) {
  const { data, error } = await VC()
    .from("design_pages")
    .select("id,document_id,page_order,width,height,background,created_at,updated_at,current_version_id")
    .eq("id", pageId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalReadDesignPageVersionById(versionId) {
  if (!versionId) return null;

  const { data, error } = await VC()
    .from("design_page_versions")
    .select("id,page_id,version,content,created_by_actor_id,created_at")
    .eq("id", versionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalReadLatestDesignPageVersion(pageId) {
  const { data, error } = await VC()
    .from("design_page_versions")
    .select("id,page_id,version,content,created_by_actor_id,created_at")
    .eq("page_id", pageId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function dalListDesignAssetsByOwner({ ownerActorId, limit = 100 }) {
  const { data, error } = await VC()
    .from("design_assets")
    .select("id,owner_actor_id,url,mime,size_bytes,width,height,created_at,is_deleted")
    .eq("owner_actor_id", ownerActorId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function dalListDesignExportsByDocument({ documentId, limit = 60 }) {
  const { data, error } = await VC()
    .from("design_exports")
    .select("id,document_id,page_id,format,status,url,mime,size_bytes,width,height,page_count,error,requested_by_actor_id,created_at,updated_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function dalListDesignRenderJobsByExportIds(exportIds) {
  const ids = Array.isArray(exportIds) ? exportIds.filter(Boolean) : [];
  if (!ids.length) return [];

  const { data, error } = await VC()
    .from("design_render_jobs")
    .select("id,export_id,document_id,page_id,version_id,priority,status,attempts,max_attempts,locked_at,locked_by,run_after,error,created_at,updated_at")
    .in("export_id", ids)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
