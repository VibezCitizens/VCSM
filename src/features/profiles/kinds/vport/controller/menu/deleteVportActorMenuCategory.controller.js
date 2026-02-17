// src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js

import deleteVportActorMenuCategoryDAL from "@/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal";

/**
 * Controller Contract:
 * - Owns authorization + business meaning.
 * - Calls DAL only.
 * - Returns domain-level result (not raw rows).
 *
 * Expected RLS:
 * - DB should only allow deleting categories the current user/actor owns.
 */
export async function deleteVportActorMenuCategoryController({
  categoryId,
  actorId,
} = {}) {
  if (!categoryId) {
    throw new Error("deleteVportActorMenuCategoryController: categoryId required");
  }

  if (!actorId) {
    throw new Error("deleteVportActorMenuCategoryController: actorId required");
  }

  // DAL throws on error — no destructuring of { error }
  await deleteVportActorMenuCategoryDAL({
    categoryId,
  });

  return {
    ok: true,
    categoryId,
  };
}

export default deleteVportActorMenuCategoryController;
