import { formatPortfolioTagLabel, getPortfolioFilterKeyAll } from "@/features/profiles/kinds/vport/screens/portfolio/vportPortfolio.model";

export default function PortfolioTagChips({
  items = [],
  activeKey = getPortfolioFilterKeyAll(),
  onSelect = null,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const chips = [
    {
      key: getPortfolioFilterKeyAll(),
      label: "All work",
      count: null,
    },
    ...safeItems,
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {chips.map((item) => {
        const isActive = activeKey === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            className={`profiles-tag-chip ${isActive ? "is-active" : ""}`}
            aria-pressed={isActive}
          >
            <span>{formatPortfolioTagLabel(item.label)}</span>
            {Number.isFinite(Number(item.count)) ? (
              <span className="profiles-portfolio-chip-count">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
