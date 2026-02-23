// src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js

import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js";
import upsertVportServicesByActorDal from "@/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js";

/**
 * Controller:
 * - No direct Supabase import
 * - Ownership enforced by RLS
 *
 * Owns:
 * - Input validation
 * - Catalog key validation
 * - Deterministic payload shaping
 * - Calls DAL mutation
 */
export default async function upsertVportServicesController({
  targetActorId,
  items,
  vportType,
} = {}) {
  if (!targetActorId) {
    throw new Error("upsertVportServicesController: targetActorId is required");
  }

  if (!vportType) {
    throw new Error("upsertVportServicesController: vportType is required");
  }

  const catalogRows = await readVportServiceCatalogByType({
    vportType,
    includeInactive: false,
  });

  const catalogByKey = new Map();
  for (const r of catalogRows ?? []) {
    const key = (r?.key ?? "").toString().trim();
    if (!key) continue;

    catalogByKey.set(key, {
      label: (r?.label ?? "").toString().trim() || key,
      category: (r?.category ?? "").toString().trim() || null,
      meta: r?.meta && typeof r.meta === "object" ? r.meta : {},
    });
  }

  const list = Array.isArray(items) ? items : [];

  const payload = list
    .map((it) => {
      const key = (it?.key ?? "").toString().trim();
      if (!key) return null;

      const cat = catalogByKey.get(key);
      if (!cat) return null;

      return {
        actor_id: targetActorId,
        key,
        label: cat.label,
        category: cat.category,
        enabled: it?.enabled !== false,
        meta: it?.meta && typeof it.meta === "object" ? it.meta : cat.meta ?? {},
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  // ✅ this is the actual DB save
  const saved = await upsertVportServicesByActorDal({ rows: payload });

  return {
    ok: true,
    count: saved.length,
    rows: saved,
  };
}