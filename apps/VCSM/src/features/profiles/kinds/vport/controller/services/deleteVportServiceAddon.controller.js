// src/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js

import deleteVportServiceAddonDal from "@/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

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

  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId });

  await deleteVportServiceAddonDal({
    actorId: targetActorId,
    addonId,
  });

  return { ok: true, addonId };
}