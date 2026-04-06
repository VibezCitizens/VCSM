export const PANEL_STYLE = {
  borderRadius: 18,
  border: "1px solid var(--profiles-border)",
  background: "var(--profiles-surface)",
  padding: 16,
};

export const THUMB_WRAP_STYLE = {
  width: 54,
  height: 54,
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid var(--profiles-border)",
  background: "rgba(0,0,0,0.35)",
};

export function formatMenuItemPrice(item) {
  const cents =
    typeof item?.priceCents === "number"
      ? item.priceCents
      : typeof item?.price_cents === "number"
      ? item.price_cents
      : null;
  if (cents != null && Number.isFinite(cents)) return `$${(cents / 100).toFixed(2)}`;

  const price =
    typeof item?.price === "number"
      ? item.price
      : typeof item?.price_amount === "number"
      ? item.price_amount
      : null;
  if (price != null && Number.isFinite(price)) return `$${Number(price).toFixed(2)}`;

  return null;
}

export function filterMenuCategories(categories, query) {
  const list = Array.isArray(categories) ? categories : [];
  const safeCategories = list.filter((category) => category?.isActive !== false);
  const q = (query || "").trim().toLowerCase();
  if (!q) return safeCategories;

  const matches = (value) => {
    if (!q) return true;
    if (value == null) return false;
    return String(value).toLowerCase().includes(q);
  };

  return safeCategories
    .map((category) => {
      const items = Array.isArray(category?.items) ? category.items : [];
      const activeItems = items.filter((item) => item?.isActive !== false);
      const categoryMatches = matches(category?.name) || matches(category?.description);
      if (categoryMatches) return { ...category, __filteredItems: activeItems };

      const itemMatches = activeItems.filter(
        (item) => matches(item?.name) || matches(item?.description)
      );
      if (!itemMatches.length) return null;
      return { ...category, __filteredItems: itemMatches };
    })
    .filter(Boolean);
}

