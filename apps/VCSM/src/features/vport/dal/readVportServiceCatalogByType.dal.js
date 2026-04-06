import { supabase } from "@/services/supabase/supabaseClient";

function normalizeVportType(vportType) {
  return String(vportType ?? "").trim().toLowerCase();
}

function buildTypeCandidates(vportType) {
  const normalized = normalizeVportType(vportType);
  if (!normalized) return [];

  if (normalized === "exchange" || normalized === "money exchange") {
    return ["exchange", "money exchange"];
  }

  return [normalized];
}

export default async function readVportServiceCatalogByTypeDAL({
  vportType,
  includeInactive = false,
} = {}) {
  const typeCandidates = buildTypeCandidates(vportType);
  if (!typeCandidates.length) {
    throw new Error("readVportServiceCatalogByTypeDAL: vportType is required");
  }

  let query = supabase
    .schema("vc")
    .from("vport_service_catalog")
    .select("vport_type,key,label,category,sort_order,is_active,meta,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (typeCandidates.length === 1) {
    query = query.eq("vport_type", typeCandidates[0]);
  } else {
    query = query.in("vport_type", typeCandidates);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
