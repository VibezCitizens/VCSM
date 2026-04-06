// src/features/profiles/kinds/vport/model/menu/VportActorMenuItem.model.js

const toNumber = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const VportActorMenuItemModel = {
  fromRow(row) {
    if (!row) return null;

    return {
      id: row.id ?? null,
      actorId: row.actor_id ?? null,
      categoryId: row.category_id ?? null,

      key: row.key ?? null,
      name: row.name ?? "",
      description: row.description ?? null,

      sortOrder: toNumber(row.sort_order, 0),
      isActive: row.is_active ?? true,

      // ✅ NEW
      priceCents: typeof row.price_cents === "number" ? row.price_cents : row.price_cents ?? null,
      currencyCode: row.currency_code ?? "USD",
      imageUrl: row.image_url ?? null,

      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    };
  },

  fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => VportActorMenuItemModel.fromRow(r)).filter(Boolean);
  },
};

export default VportActorMenuItemModel;
