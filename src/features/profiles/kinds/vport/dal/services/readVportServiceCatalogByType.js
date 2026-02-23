// src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js

import { supabase } from "@/services/supabase/supabaseClient";

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
  if (!vportType) {
    throw new Error("readVportServiceCatalogByType: vportType is required");
  }

  let q = supabase
    .schema("vc")
    .from("vport_service_catalog")
    .select("vport_type,key,label,category,sort_order,is_active,meta,created_at,updated_at")
    .eq("vport_type", vportType)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (!includeInactive) q = q.eq("is_active", true);

  const { data, error } = await q;
  if (error) throw error;

  return data ?? [];
}

export default readVportServiceCatalogByType;