// src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js

import vportSchema from "@/services/supabase/vportClient";

function normalizeCategoryKey(vportType) {
  return String(vportType ?? "").trim().toLowerCase();
}

function buildCandidates(vportType) {
  const normalized = normalizeCategoryKey(vportType);
  if (!normalized) return [];

  if (normalized === "exchange" || normalized === "money exchange") {
    return ["exchange", "money exchange"];
  }

  return [normalized];
}

/**
 * DAL: Read the service catalog for a given vport type / category key.
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
  const candidates = buildCandidates(vportType);

  if (!candidates.length) {
    throw new Error("readVportServiceCatalogByType: vportType is required");
  }

  let q = vportSchema
    .from("service_catalog")
    .select("category_key,key,label,sort_order,is_active,meta,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (candidates.length === 1) {
    q = q.eq("category_key", candidates[0]);
  } else {
    q = q.in("category_key", candidates);
  }

  if (!includeInactive) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServiceCatalogByType;
