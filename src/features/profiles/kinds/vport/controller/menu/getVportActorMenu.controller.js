// src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js

import listVportActorMenuCategoriesDAL from "@/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal";
import listVportActorMenuItemsDAL from "@/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal";

import { VportActorMenuCategoryModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model";
import { VportActorMenuItemModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuItem.model";
import { VportActorMenuModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenu.model";

/**
 * Controller: get full vport actor menu (categories + items)
 *
 * Owns:
 * - Orchestration
 * - Actor-level scoping
 * - Domain grouping
 */
export async function getVportActorMenuController({
  actorId,
  includeInactive = false,
} = {}) {
  if (!actorId) {
    throw new Error("getVportActorMenuController: actorId is required");
  }

  const [categoryRows, itemRows] = await Promise.all([
    listVportActorMenuCategoriesDAL({ actorId, includeInactive }),
    listVportActorMenuItemsDAL({ actorId, includeInactive }),
  ]);

  // Translate raw DAL rows -> domain-safe objects
  const categories = VportActorMenuCategoryModel.fromRows(categoryRows ?? []);
  const items = VportActorMenuItemModel.fromRows(itemRows ?? []);

  // Compose tree (categories with items) + orphan handling + sorting
  const composed = VportActorMenuModel.compose({
    categories,
    items,
  });

  return {
    actorId,
    ...composed,
  };
}

export default getVportActorMenuController;
