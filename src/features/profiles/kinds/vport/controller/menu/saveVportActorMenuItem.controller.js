// src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js

import createVportActorMenuItemDAL from "@/features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal";
import updateVportActorMenuItemDAL from "@/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal";
import readVportActorMenuItemsDAL from "@/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal";
import readVportActorMenuCategoriesDAL from "@/features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal";

import { VportActorMenuItemModel } from "@/features/profiles/kinds/vport/model/menu/VportActorMenuItem.model";

/**
 * Controller: create or update a vport actor menu item
 */
export async function saveVportActorMenuItemController({
  actorId,
  itemId,
  categoryId,
  key,
  name,
  description,
  sortOrder,
  isActive,

  // ✅ NEW
  priceCents,
  currencyCode,
  imageUrl,
} = {}) {
  if (!actorId) {
    throw new Error("saveVportActorMenuItemController: actorId is required");
  }

  if (!categoryId) {
    throw new Error("saveVportActorMenuItemController: categoryId is required");
  }

  if (!name) {
    throw new Error("saveVportActorMenuItemController: name is required");
  }

  // Validate category exists + belongs to actor
  const category = await readVportActorMenuCategoriesDAL({ categoryId });
  if (!category) {
    throw new Error("Category not found");
  }
  if (category.actor_id !== actorId) {
    throw new Error("Not allowed to use this category");
  }

  // UPDATE FLOW
  if (itemId) {
    const existing = await readVportActorMenuItemsDAL({ itemId });
    if (!existing) {
      throw new Error("Menu item not found");
    }

    if (existing.actor_id !== actorId) {
      throw new Error("Not allowed to modify this menu item");
    }

    const updated = await updateVportActorMenuItemDAL({
      itemId,
      patch: {
        category_id: categoryId,
        key: key ?? existing.key,
        name,
        description: description ?? null,
        sort_order:
          typeof sortOrder === "number" ? sortOrder : existing.sort_order,
        is_active:
          typeof isActive === "boolean" ? isActive : existing.is_active,

        // ✅ NEW
        price_cents:
          typeof priceCents === "number" ? priceCents : priceCents ?? existing.price_cents ?? null,
        currency_code: (currencyCode ?? existing.currency_code ?? "USD").toString(),
        image_url: typeof imageUrl === "string" ? imageUrl : imageUrl ?? existing.image_url ?? null,
      },
    });

    return VportActorMenuItemModel.fromRow(updated);
  }

  // CREATE FLOW
  const created = await createVportActorMenuItemDAL({
    actorId,
    categoryId,
    key: key ?? null,
    name,
    description: description ?? null,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    isActive: typeof isActive === "boolean" ? isActive : true,

    // ✅ NEW
    priceCents: typeof priceCents === "number" ? priceCents : priceCents ?? null,
    currencyCode: (currencyCode ?? "USD").toString(),
    imageUrl: typeof imageUrl === "string" ? imageUrl : null,
  });

  return VportActorMenuItemModel.fromRow(created);
}

export default saveVportActorMenuItemController;
