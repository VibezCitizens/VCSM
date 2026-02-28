function toInt(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function bySortOrderThenId(a, b) {
  const aOrder = toInt(a?.sortOrder, 0);
  const bOrder = toInt(b?.sortOrder, 0);
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aId = String(a?.id ?? "");
  const bId = String(b?.id ?? "");
  return aId.localeCompare(bId);
}

function normalizeMediaRow(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    url: row.url ?? "",
    kind: row.kind ?? "image",
    sortOrder: toInt(row.sortOrder ?? row.sort_order, 0),
  };
}

function normalizeCategoryRow(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    key: row.key ?? null,
    name: row.name ?? "",
    description: row.description ?? null,
    sortOrder: toInt(row.sortOrder ?? row.sort_order, 0),
    items: [],
  };
}

function normalizeItemRow(row) {
  if (!row) return null;
  const media = Array.isArray(row.media)
    ? row.media.map(normalizeMediaRow).filter(Boolean).sort(bySortOrderThenId)
    : [];

  return {
    id: row.id ?? null,
    categoryId: row.categoryId ?? row.category_id ?? null,
    key: row.key ?? null,
    name: row.name ?? "",
    description: row.description ?? null,
    priceCents:
      typeof row.priceCents === "number"
        ? row.priceCents
        : typeof row.price_cents === "number"
        ? row.price_cents
        : null,
    currencyCode: row.currencyCode ?? row.currency_code ?? "USD",
    imageUrl: row.imageUrl ?? row.image_url ?? media[0]?.url ?? "",
    sortOrder: toInt(row.sortOrder ?? row.sort_order, 0),
    media,
  };
}

/**
 * Model: raw RPC payload -> domain-safe menu result.
 */
export function mapVportPublicMenuRpcResult(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const ok = source.ok === true;
  const actorId = source.actorId ?? source.actor_id ?? null;

  if (!ok) {
    return {
      ok: false,
      actorId,
      error: String(source.error || "unavailable"),
      categories: [],
      itemsOrphaned: [],
    };
  }

  const categories = Array.isArray(source.categories)
    ? source.categories.map(normalizeCategoryRow).filter(Boolean)
    : [];
  const items = Array.isArray(source.items)
    ? source.items.map(normalizeItemRow).filter(Boolean)
    : [];

  const byCategoryId = new Map();
  for (const item of items) {
    const key = item?.categoryId ?? null;
    if (!key) continue;
    const list = byCategoryId.get(key) ?? [];
    list.push(item);
    byCategoryId.set(key, list);
  }

  const withItems = categories
    .slice()
    .sort(bySortOrderThenId)
    .map((category) => ({
      ...category,
      items: (byCategoryId.get(category.id) ?? []).slice().sort(bySortOrderThenId),
    }));

  const categoryIds = new Set(withItems.map((c) => c.id).filter(Boolean));
  const itemsOrphaned = items
    .filter((item) => item.categoryId && !categoryIds.has(item.categoryId))
    .sort(bySortOrderThenId);

  return {
    ok: true,
    actorId,
    error: null,
    categories: withItems,
    itemsOrphaned,
  };
}

export default mapVportPublicMenuRpcResult;
