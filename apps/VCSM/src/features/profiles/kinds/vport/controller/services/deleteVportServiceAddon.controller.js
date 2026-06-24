// src/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js

import deleteVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export default async function deleteVportServiceAddonController({
  callerActorId,
  targetActorId,
  addonId,
} = {}) {
  if (!callerActorId) {
    throw new Error("deleteVportServiceAddonController: callerActorId is required");
  }

  if (!targetActorId) {
    throw new Error("deleteVportServiceAddonController: targetActorId is required");
  }

  if (!addonId) {
    throw new Error("deleteVportServiceAddonController: addonId is required");
  }

  // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): resolved from the auth
  // session via actor_owners, so it holds whether acting as a user or as the VPORT.
  await assertSessionOwnsActorController({ targetActorId });

  await deleteVportServiceAddonDal({
    actorId: targetActorId,
    addonId,
  });

  return { ok: true, addonId };
}