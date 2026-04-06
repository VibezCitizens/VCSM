// src/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js

import deleteVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal";

/**
 * Controller:
 * - No Supabase import
 * - No auth/ownership check here
 * - Ownership enforced by RLS (DB is source of truth)
 *
 * Deletes an add-on row (hard delete).
 *
 * @param {object} params
 * @param {string} params.targetActorId
 * @param {string} params.addonId
 */
export default async function deleteVportServiceAddonController({
  targetActorId,
  addonId,
} = {}) {
  if (!targetActorId) {
    throw new Error(
      "deleteVportServiceAddonController: targetActorId is required"
    );
  }

  if (!addonId) {
    throw new Error("deleteVportServiceAddonController: addonId is required");
  }

  // RLS must allow delete only for owners of targetActorId
  await deleteVportServiceAddonDal({
    actorId: targetActorId,
    addonId,
  });

  return { ok: true, addonId };
}