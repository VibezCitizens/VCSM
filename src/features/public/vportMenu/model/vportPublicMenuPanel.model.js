export const PANEL_STYLE = {
  borderRadius: 18,
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(15,23,42,0.62)",
  padding: 16,
  backdropFilter: "blur(8px)",
};

export const THUMB_WRAP_STYLE = {
  width: 54,
  height: 54,
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(0,0,0,0.35)",
};

export function formatMenuItemPrice(item) {
  const cents =
    typeof item?.priceCents === "number"
      ? item.priceCents
      : typeof item?.price_cents === "number"
      ? item.price_cents
      : null;

  if (cents != null && Number.isFinite(cents)) {
    const code = String(item?.currencyCode || item?.currency_code || "USD").toUpperCase();
    const value = cents / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  }

  return null;
}

export function filterMenuCategories(categories, query) {
  const list = Array.isArray(categories) ? categories : [];
  const q = String(query || "").trim().toLowerCase();
  if (!q) return list;

  const matches = (value) => String(value || "").toLowerCase().includes(q);

  return list
    .map((category) => {
      const items = Array.isArray(category?.items) ? category.items : [];
      if (matches(category?.name) || matches(category?.description)) {
        return { ...category, __filteredItems: items };
      }

      const filteredItems = items.filter(
        (item) => matches(item?.name) || matches(item?.description)
      );

      if (!filteredItems.length) return null;
      return { ...category, __filteredItems: filteredItems };
    })
    .filter(Boolean);
}
