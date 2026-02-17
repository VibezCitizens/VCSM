// src/features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model.js

/**
 * Pure model: translate raw vc.vport_actor_menu_categories row -> domain-safe category object.
 *
 * Contract:
 * - No Supabase
 * - No I/O
 * - No permissions/ownership logic
 * - Deterministic
 *
 * Raw (DAL) row shape (snake_case):
 * {
 *   id,
 *   actor_id,
 *   key,
 *   name,
 *   description,
 *   sort_order,
 *   is_active,
 *   created_at,
 *   updated_at
 * }
 */

const toNumber = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const VportActorMenuCategoryModel = {
  /**
   * @param {Object|null|undefined} row Raw DAL row from vc.vport_actor_menu_categories
   */
  fromRow(row) {
    if (!row) return null;

    return {
      id: row.id ?? null,
      actorId: row.actor_id ?? null,

      key: row.key ?? null,
      name: row.name ?? "",
      description: row.description ?? null,

      sortOrder: toNumber(row.sort_order, 0),
      isActive: row.is_active ?? true,

      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    };
  },

  /**
   * @param {Array<Object>} rows Raw DAL rows
   */
  fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => VportActorMenuCategoryModel.fromRow(r)).filter(Boolean);
  },
};

export default VportActorMenuCategoryModel;
