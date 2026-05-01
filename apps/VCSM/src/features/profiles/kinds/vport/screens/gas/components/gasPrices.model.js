export function toEpochMs(ts) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function formatLastUpdatedAt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function prettyFuelLabel(fuelKey) {
  const map = {
    regular: "Regular",
    midgrade: "Midgrade",
    premium: "Premium",
    diesel: "Diesel",
    e85: "E85",
  };
  return (
    map[String(fuelKey).toLowerCase()] ??
    String(fuelKey)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
  );
}
