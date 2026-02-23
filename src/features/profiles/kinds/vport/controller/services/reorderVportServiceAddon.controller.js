// src/features/profiles/kinds/vport/controller/services/reorderVportServiceAddon.controller.js

import reorderVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/reorderVportServiceAddon.dal";

/**
 * Controller:
 * - No Supabase import
 * - No auth/ownership check here
 * - Ownership enforced by RLS (DB is source of truth)
 *
 * Reorders add-ons by updating sort_order in bulk.
 *
 * @param {object} params
 * @param {string} params.targetActorId
 * @param {Array<string>} params.orderedIds
 */
export default async function reorderVportServiceAddonController({
  targetActorId,
  orderedIds,
} = {}) {
  if (!targetActorId) {
    throw new Error(
      "reorderVportServiceAddonController: targetActorId is required"
    );
  }

  const ids = Array.isArray(orderedIds) ? orderedIds.filter(Boolean) : [];
  if (ids.length === 0) return { ok: true, count: 0 };

  await reorderVportServiceAddonDal({
    actorId: targetActorId,
    orderedIds: ids,
  });

  return { ok: true, count: ids.length };
}