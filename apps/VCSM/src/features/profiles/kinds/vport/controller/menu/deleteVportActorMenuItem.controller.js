// src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js

import deleteVportActorMenuItemDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function deleteVportActorMenuItemController({
  callerActorId,
  itemId,
  actorId,
} = {}) {
  if (!callerActorId) {
    throw new Error("deleteVportActorMenuItemController: callerActorId required");
  }

  if (!itemId) {
    throw new Error("deleteVportActorMenuItemController: itemId required");
  }

  if (!actorId) {
    throw new Error("deleteVportActorMenuItemController: actorId required");
  }

  await assertSessionOwnsVportActorController({ targetActorId: actorId });

  // DAL throws on error — no { error } destructuring
  await deleteVportActorMenuItemDAL({ itemId });

  return {
    ok: true,
    itemId,
  };
}

export default deleteVportActorMenuItemController;
