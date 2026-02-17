// src/features/profiles/kinds/vport/model/menu/VportActorMenu.model.js

/**
 * Pure model: compose a Vport Actor Menu "tree" from already-shaped domain objects.
 *
 * Contract:
 * - No Supabase
 * - No I/O
 * - No permissions/ownership logic
 * - Deterministic
 *
 * Inputs expected (domain-safe, already normalized by item/category models):
 * - categories: [{ id, actorId, key, name, description, sortOrder, isActive, createdAt, updatedAt }]
 * - items:      [{ id, actorId, categoryId, key, name, description, sortOrder, isActive, createdAt, updatedAt }]
 *
 * Output:
 * {
 *   categories: [
 *     {
 *       ...category,
 *       items: [...itemsForCategory]
 *     }
 *   ],
 *   itemsOrphaned: [...itemsWithNoMatchingCategory]
 * }
 */

const toNumber = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const bySortOrderThenName = (a, b) => {
  const aOrder = toNumber(a?.sortOrder, 0);
  const bOrder = toNumber(b?.sortOrder, 0);
  if (aOrder !== bOrder) return aOrder - bOrder;

  const aName = (a?.name ?? "").toString().toLowerCase();
  const bName = (b?.name ?? "").toString().toLowerCase();
  if (aName < bName) return -1;
  if (aName > bName) return 1;

  // stable-ish tie-breaker
  const aId = (a?.id ?? "").toString();
  const bId = (b?.id ?? "").toString();
  if (aId < bId) return -1;
  if (aId > bId) return 1;
  return 0;
};

export const VportActorMenuModel = {
  /**
   * @param {Object} input
   * @param {Array<Object>} input.categories
   * @param {Array<Object>} input.items
   */
  compose({ categories = [], items = [] } = {}) {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeItems = Array.isArray(items) ? items : [];

    // Index items by categoryId (domain field)
    const itemsByCategoryId = new Map();
    for (const item of safeItems) {
      const categoryId = item?.categoryId ?? null;
      if (!categoryId) continue;

      const list = itemsByCategoryId.get(categoryId) ?? [];
      list.push(item);
      itemsByCategoryId.set(categoryId, list);
    }

    // Build composed categories
    const composedCategories = safeCategories
      .slice()
      .sort(bySortOrderThenName)
      .map((cat) => {
        const catId = cat?.id ?? null;
        const catItems = (catId ? itemsByCategoryId.get(catId) : null) ?? [];
        const sortedItems = catItems.slice().sort(bySortOrderThenName);

        return {
          ...cat,
          items: sortedItems,
        };
      });

    // Items that reference a missing category
    const categoryIdSet = new Set(safeCategories.map((c) => c?.id).filter(Boolean));
    const itemsOrphaned = safeItems
      .filter((it) => {
        const cid = it?.categoryId ?? null;
        return cid && !categoryIdSet.has(cid);
      })
      .slice()
      .sort(bySortOrderThenName);

    return {
      categories: composedCategories,
      itemsOrphaned,
    };
  },
};

export default VportActorMenuModel;
