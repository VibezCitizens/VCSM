import vportSchema from "@/services/supabase/vportClient";

function toCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function buildTypeCandidates(vportType) {
  const key = toCategoryKey(vportType);
  if (!key) return [];
  return [key];
}

export default async function readVportServiceCatalogByTypeDAL({
  vportType,
  includeInactive = false,
} = {}) {
  const typeCandidates = buildTypeCandidates(vportType);
  if (!typeCandidates.length) {
    throw new Error("readVportServiceCatalogByTypeDAL: vportType is required");
  }

  let query = vportSchema
    .from("service_catalog")
    .select("category_key,key,label,category,sort_order,is_active,meta,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (typeCandidates.length === 1) {
    query = query.eq("category_key", typeCandidates[0]);
  } else {
    query = query.in("category_key", typeCandidates);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
