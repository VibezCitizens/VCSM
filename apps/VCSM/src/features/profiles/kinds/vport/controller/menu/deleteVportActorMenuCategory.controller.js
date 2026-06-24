// src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js

import deleteVportActorMenuCategoryDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";

export async function deleteVportActorMenuCategoryController({
  callerActorId,
  categoryId,
  actorId,
} = {}) {
  if (!callerActorId) {
    throw new Error("deleteVportActorMenuCategoryController: callerActorId required");
  }

  if (!categoryId) {
    throw new Error("deleteVportActorMenuCategoryController: categoryId required");
  }

  if (!actorId) {
    throw new Error("deleteVportActorMenuCategoryController: actorId required");
  }

  await assertSessionOwnsActorController({ targetActorId: actorId });

  // DAL throws on error — no destructuring of { error }
  await deleteVportActorMenuCategoryDAL({ categoryId });

  return {
    ok: true,
    categoryId,
  };
}

export default deleteVportActorMenuCategoryController;
