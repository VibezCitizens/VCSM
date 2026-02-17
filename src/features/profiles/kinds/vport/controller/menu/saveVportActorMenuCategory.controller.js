// src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js

import createVportActorMenuCategoryDAL from "@/features/profiles/kinds/vport/dal/menu/createVportActorMenuCategory.dal";
import updateVportActorMenuCategoryDAL from "@/features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal";
import readVportActorMenuCategoriesDAL from "@/features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal";

import { VportActorMenuCategoryModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model";

/**
 * Controller: create or update a vport actor menu category
 *
 * Owns:
 * - Ownership enforcement (actor scope)
 * - Idempotent branching (create vs update)
 * - Domain return shape (via model)
 */
export async function saveVportActorMenuCategoryController({
  actorId,
  categoryId,
  key,
  name,
  description,
  sortOrder,
  isActive,
} = {}) {
  if (!actorId) {
    throw new Error("saveVportActorMenuCategoryController: actorId is required");
  }

  if (!name) {
    throw new Error("saveVportActorMenuCategoryController: name is required");
  }

  // UPDATE FLOW
  if (categoryId) {
    const existing = await readVportActorMenuCategoriesDAL({ categoryId });

    if (!existing) {
      throw new Error("Category not found");
    }

    // Controller owns meaning/authorization (RLS should also enforce)
    if (existing.actor_id !== actorId) {
      throw new Error("Not allowed to modify this category");
    }

    const updated = await updateVportActorMenuCategoryDAL({
      categoryId,
      patch: {
        key: key ?? existing.key,
        name,
        description: description ?? null,
        sort_order:
          typeof sortOrder === "number" ? sortOrder : existing.sort_order,
        is_active:
          typeof isActive === "boolean" ? isActive : existing.is_active,
      },
    });

    return VportActorMenuCategoryModel.fromRow(updated);
  }

  // CREATE FLOW
  const created = await createVportActorMenuCategoryDAL({
    actorId,
    key: key ?? null,
    name,
    description: description ?? null,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  return VportActorMenuCategoryModel.fromRow(created);
}

export default saveVportActorMenuCategoryController;
