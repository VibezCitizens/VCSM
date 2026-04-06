// src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js

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

/**
 * DAL: Read the service catalog for a given vport_type.
 *
 * Returns raw vc.vport_service_catalog rows (explicit projection).
 *
 * @param {object} params
 * @param {string} params.vportType
 * @param {boolean} [params.includeInactive=false]
 * @returns {Promise<Array>}
 */
export async function readVportServiceCatalogByType({
  vportType,
  includeInactive = false,
} = {}) {
  const typeCandidates = buildTypeCandidates(vportType);

  if (!typeCandidates.length) {
    throw new Error("readVportServiceCatalogByType: vportType is required");
  }

  let q = supabase
    .schema("vc")
    .from("vport_service_catalog")
    .select("vport_type,key,label,category,sort_order,is_active,meta,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (typeCandidates.length === 1) {
    q = q.eq("vport_type", typeCandidates[0]);
  } else {
    q = q.in("vport_type", typeCandidates);
  }

  if (!includeInactive) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServiceCatalogByType;
