// src/features/profiles/kinds/vport/controller/services/createOrUpdateVportServiceAddon.controller.js

import createVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/createVportServiceAddon.dal";
import updateVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/updateVportServiceAddon.dal";

/**
 * Controller:
 * - No Supabase import
 * - No auth DAL import
 * - Ownership enforced by RLS (DB is source of truth)
 */
export default async function createOrUpdateVportServiceAddonController({
  targetActorId,
  addon,
} = {}) {
  if (!targetActorId) {
    throw new Error(
      "createOrUpdateVportServiceAddonController: targetActorId is required"
    );
  }

  if (!addon || typeof addon !== "object") {
    throw new Error(
      "createOrUpdateVportServiceAddonController: addon is required"
    );
  }

  const id = addon.id ?? null;

  const row = {
    actor_id: targetActorId,
    parent_service_key:
      addon.parentServiceKey === null || addon.parentServiceKey === undefined
        ? null
        : addon.parentServiceKey.toString().trim(),
    key: (addon.key ?? "").toString().trim() || null,
    label: (addon.label ?? "").toString().trim(),
    category: (addon.category ?? "").toString().trim() || null,
    enabled: addon.enabled !== false,
    sort_order: Number.isFinite(addon.sortOrder) ? addon.sortOrder : 0,
    meta: addon.meta && typeof addon.meta === "object" ? addon.meta : {},
    updated_at: new Date().toISOString(),
  };

  if (!row.label) throw new Error("addon.label is required");

  if (!id) {
    // RLS must allow insert only for owners
    const inserted = await createVportServiceAddonDal({ row });
    return { ok: true, id: inserted?.id ?? null };
  }

  // RLS must allow update only for owners, and DAL must scope by actor_id too
  await updateVportServiceAddonDal({
    id,
    actorId: targetActorId,
    patch: row,
  });

  return { ok: true, id };
}