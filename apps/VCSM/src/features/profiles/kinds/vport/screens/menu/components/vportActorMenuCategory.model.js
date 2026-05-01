export function formatMenuItemPrice(it) {
  const cents =
    typeof it?.priceCents === "number"
      ? it.priceCents
      : typeof it?.price_cents === "number"
      ? it.price_cents
      : null;

  if (cents != null && Number.isFinite(cents)) return `$${(cents / 100).toFixed(2)}`;

  const price =
    typeof it?.price === "number"
      ? it.price
      : typeof it?.price_amount === "number"
      ? it.price_amount
      : null;

  if (price != null && Number.isFinite(price)) return `$${Number(price).toFixed(2)}`;

  return null;
}
