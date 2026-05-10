// src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js

import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.dal.js";
import upsertVportServicesByActorDal from "@/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js";
import { getFallbackServiceCatalogRows } from "@/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model";
import { dalInsertLocksmithServiceDetailDefaults } from "@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal";
import { getLocksmithServiceDefaults } from "@/features/profiles/kinds/vport/model/locksmith/locksmithServiceDefaults.model";
import { resolveVportServiceCatalogType } from "@/features/profiles/kinds/vport/config/vportTypes.config";

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

  const resolvedCatalogType = resolveVportServiceCatalogType(vportType);

  const catalogRowsRaw = await readVportServiceCatalogByType({
    vportType: resolvedCatalogType,
    includeInactive: false,
  });

  const catalogRows =
    Array.isArray(catalogRowsRaw) && catalogRowsRaw.length
      ? catalogRowsRaw
      : getFallbackServiceCatalogRows(vportType);

  const catalogByKey = new Map();
  for (const r of catalogRows ?? []) {
    const key = (r?.key ?? "").toString().trim();
    if (!key) continue;

    catalogByKey.set(key, {
      label: (r?.label ?? "").toString().trim() || key,
      service_group: (r?.service_group ?? "").toString().trim() || null,
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
        key,
        label: cat.label,
        service_group: cat.service_group ?? null,
        enabled: it?.enabled !== false,
        meta: it?.meta && typeof it.meta === "object" ? it.meta : cat.meta ?? {},
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (list.length > 0 && payload.length === 0) {
    throw new Error(
      `NO_VALID_SERVICE_KEYS_AFTER_CATALOG_FILTER: ${list.length} key(s) submitted for type "${vportType}" (resolved: "${resolvedCatalogType}") but none matched the catalog. Keys: ${list.map((i) => i?.key).join(", ")}`
    );
  }

  const saved = await upsertVportServicesByActorDal({ actorId: targetActorId, rows: payload });

  // For locksmith vports, provision default detail rows for newly-enabled services.
  // ignoreDuplicates=true means this never overwrites existing user-customized data.
  if (String(vportType).toLowerCase() === 'locksmith') {
    const enabledRows = saved.filter((r) => r.enabled && r.id);
    const results = await Promise.allSettled(
      enabledRows.map((row) =>
        dalInsertLocksmithServiceDetailDefaults({
          service_id: row.id,
          actor_id: targetActorId,
          ...getLocksmithServiceDefaults(row.key),
        })
      )
    );
    if (process.env.NODE_ENV !== 'production') {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const row = enabledRows[i];
          console.error('[locksmith] detail provision failed', {
            actorId: targetActorId,
            serviceId: row?.id,
            serviceKey: row?.key,
            error: result.reason?.message,
          });
        }
      });
    }
  }

  return {
    ok: true,
    count: saved.length,
    rows: saved,
  };
}
