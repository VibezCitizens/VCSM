// src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js

import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.dal.js";
import upsertVportServicesByActorDal from "@/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js";
import { getFallbackServiceCatalogRows } from "@/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model";
import { dalInsertLocksmithServiceDetailDefaults } from "@/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal";
import { getLocksmithServiceDefaults } from "@/features/profiles/kinds/vport/model/locksmith/locksmithServiceDefaults.model";
import { resolveVportServiceCatalogType } from "@/features/profiles/kinds/vport/config/vportTypes.config";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

/**
 * Controller:
 * - No direct Supabase import
 * - Ownership enforced at controller layer via assertActorOwnsVportActorController
 *   (defense-in-depth: RLS also enforces at DB layer)
 *
 * Owns:
 * - Actor ownership verification
 * - Input validation
 * - Catalog key validation
 * - Deterministic payload shaping
 * - Calls DAL mutation
 */
export default async function upsertVportServicesController({
  identityActorId,
  targetActorId,
  items,
  vportType,
} = {}) {
  if (!identityActorId) {
    throw new Error("upsertVportServicesController: identityActorId is required");
  }

  if (!targetActorId) {
    throw new Error("upsertVportServicesController: targetActorId is required");
  }

  if (!vportType) {
    throw new Error("upsertVportServicesController: vportType is required");
  }

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the saving actor is the
  // VPORT itself when switched in, so ownership is resolved from the auth session via
  // actor_owners rather than trusting the UI-passed identity actor id.
  await assertSessionOwnsVportActorController({ targetActorId });

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
  // Promise.allSettled is intentional: provisioning failures must not roll back the
  // service save. However failures must NOT be silently swallowed — the controller
  // returns structured provisioningWarnings so the caller can surface them.
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

    const provisioningWarnings = results
      .map((result, i) => {
        if (result.status !== 'rejected') return null;
        const row = enabledRows[i];
        if (import.meta.env.DEV) {
          console.error('[locksmith] detail provision failed', {
            actorId: targetActorId,
            serviceId: row?.id,
            serviceKey: row?.key,
            error: result.reason?.message,
          });
        }
        return {
          serviceId: row?.id ?? null,
          serviceKey: row?.key ?? null,
          error: result.reason?.message ?? 'Unknown provision error',
        };
      })
      .filter(Boolean);

    return {
      ok: true,
      count: saved.length,
      rows: saved,
      // Caller should surface these to the user or observability channel.
      // undefined when all provisions succeeded.
      provisioningWarnings: provisioningWarnings.length ? provisioningWarnings : undefined,
    };
  }

  return {
    ok: true,
    count: saved.length,
    rows: saved,
  };
}
