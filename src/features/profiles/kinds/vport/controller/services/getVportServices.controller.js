// src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js

import readVportTypeByActorId from "@/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.js";

import readVportServiceCatalogByType from "@/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js";
import readVportServicesByActor from "@/features/profiles/kinds/vport/dal/services/readVportServicesByActor.js";
import readVportServiceAddonsByActor from "@/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.js";

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
export default async function getVportServicesController({
  targetActorId,
  vportType,
  asOwner = false,
} = {}) {
  if (!targetActorId) {
    throw new Error("getVportServicesController: targetActorId is required");
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

  const [catalogRows, actorServiceRows, addonRows] = await Promise.all([
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

  const services = resolveVportServicesFromCatalog({
    catalogRows,
    actorServiceRows,
    includeInactiveCatalog: owner,
    defaultEnabled: false,
    viewerMode: !owner,
  });

  const addons = groupVportServiceAddonsByParent(addonRows);

  return {
    vportType: safeVportType,
    mode,
    services,
    addons,
  };
}