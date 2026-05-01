// src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js

import { createTTLCache } from '@/shared/lib/ttlCache'
import readVportTypeByActorId from "@/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js";

import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.dal.js";
import readVportServicesByActor from "@/features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js";
import readVportServiceAddonsByActor from "@/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.dal.js";
import { getFallbackServiceCatalogRows } from "@/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model";

import {
  resolveVportServicesFromCatalog,
  groupVportServiceAddonsByParent,
} from "@/features/profiles/kinds/vport/model/services/vportService.model.js";

/**
 * Controller (DB via DAL only):
 * - Accepts optional vportType
 * - If vportType is missing, resolves it from DB using actor_id -> vport_id -> vport_type
 * - "asOwner" is a caller-provided lane (UI already knows actor-first ownership)
 * - No Supabase import
 */
const cache = createTTLCache(60_000) // 60 seconds

export default async function getVportServicesController({
  targetActorId,
  vportType,
  asOwner = false,
} = {}) {
  if (!targetActorId) {
    throw new Error("getVportServicesController: targetActorId is required");
  }

  // Only cache viewer mode (owner needs fresh data for editing)
  const cacheKey = asOwner ? null : `${targetActorId}:${vportType ?? '_'}`
  if (cacheKey) {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }

  let safeVportType =
    typeof vportType === "string" && vportType.trim() ? vportType.trim() : null;

  // ✅ If caller didn't provide vportType, resolve it (authoritative)
  if (!safeVportType) {
    const resolved = await readVportTypeByActorId({ actorId: targetActorId });
    safeVportType =
      typeof resolved?.vport_type === "string" && resolved.vport_type.trim()
        ? resolved.vport_type.trim()
        : null;
  }

  // still missing => not a vport actor or data missing
  if (!safeVportType) {
    return {
      vportType: null,
      mode: "viewer",
      services: [],
      addons: { general: [], byParent: {} },
    };
  }

  const owner = !!asOwner;
  const mode = owner ? "owner" : "viewer";

  const [catalogRowsRaw, actorServiceRows, addonRows] = await Promise.all([
    readVportServiceCatalogByType({
      vportType: safeVportType,
      includeInactive: owner,
    }),
    readVportServicesByActor({
      actorId: targetActorId,
      includeDisabled: owner,
    }),
    readVportServiceAddonsByActor({
      actorId: targetActorId,
      includeDisabled: owner,
    }),
  ]);

  const catalogRows =
    Array.isArray(catalogRowsRaw) && catalogRowsRaw.length
      ? catalogRowsRaw
      : getFallbackServiceCatalogRows(safeVportType);

  const services = resolveVportServicesFromCatalog({
    catalogRows,
    actorServiceRows,
    includeInactiveCatalog: owner,
    defaultEnabled: false,
    viewerMode: !owner,
  });

  const addons = groupVportServiceAddonsByParent(addonRows);

  const result = { vportType: safeVportType, mode, services, addons }
  if (cacheKey) cache.set(cacheKey, result)
  return result
}

export function invalidateVportServices(actorId) {
  cache.invalidateAll() // services are keyed by actorId:type, simpler to clear all
}
