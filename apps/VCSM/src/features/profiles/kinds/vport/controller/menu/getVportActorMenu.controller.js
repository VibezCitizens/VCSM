import listVportActorMenuCategoriesDAL from "@/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal";
import listVportActorMenuItemsDAL from "@/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal";

import { VportActorMenuCategoryModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model";
import { VportActorMenuItemModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuItem.model";
import { VportActorMenuModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenu.model";
import { menuCache } from "@/features/profiles/kinds/vport/lib/menuCache";

export async function getVportActorMenuController({
  actorId,
  includeInactive = false,
} = {}) {
  if (!actorId) {
    throw new Error("getVportActorMenuController: actorId is required");
  }

  // Only cache viewer mode (owner needs fresh data for editing)
  const cacheKey = includeInactive ? null : actorId;
  if (cacheKey) {
    const cached = menuCache.get(cacheKey);
    if (cached) return cached;
  }

  const [categoryRows, itemRows] = await Promise.all([
    listVportActorMenuCategoriesDAL({ actorId, includeInactive }),
    listVportActorMenuItemsDAL({ actorId, includeInactive }),
  ]);

  const categories = VportActorMenuCategoryModel.fromRows(categoryRows ?? []);
  const items = VportActorMenuItemModel.fromRows(itemRows ?? []);

  const composed = VportActorMenuModel.compose({
    categories,
    items,
  });

  const result = { actorId, ...composed };
  if (cacheKey) menuCache.set(cacheKey, result);
  return result;
}

export function invalidateMenuCache(actorId) {
  menuCache.invalidate(actorId);
}

export default getVportActorMenuController;
