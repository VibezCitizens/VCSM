// src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js

import deleteVportActorMenuItemDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal";

/**
 * Controller Contract:
 * - Owns authorization + business meaning.
 * - Calls DAL only.
 * - Returns domain-level result (not raw rows).
 *
 * Expected RLS:
 * - DB should only allow deleting items the current user/actor owns.
 */
export async function deleteVportActorMenuItemController({
  itemId,
  actorId,
} = {}) {
  if (!itemId) {
    throw new Error("deleteVportActorMenuItemController: itemId required");
  }

  if (!actorId) {
    throw new Error("deleteVportActorMenuItemController: actorId required");
  }

  // DAL throws on error — no { error } destructuring
  await deleteVportActorMenuItemDAL({
    itemId,
  });

  return {
    ok: true,
    itemId,
  };
}

export default deleteVportActorMenuItemController;
