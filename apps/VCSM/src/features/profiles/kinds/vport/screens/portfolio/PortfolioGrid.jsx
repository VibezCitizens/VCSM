export default function PortfolioGrid({
  items = [],
  variant = "work",
  renderItem,
}) {
  if (!Array.isArray(items) || !items.length || typeof renderItem !== "function") {
    return null;
  }

  const layoutClass =
    variant === "transformations"
      ? "grid gap-4 xl:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={layoutClass}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}
