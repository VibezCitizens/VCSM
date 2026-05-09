import { translate } from "@/i18n";

export default function HomepageProviderFilterTabs({ groups, activeCode, onSelect, lang }) {
  if (!groups || groups.length <= 1) return null;

  return (
    <div className="hp-filter-tabs" role="tablist" aria-label={translate("homepage.filterByCountry", lang)}>
      <button
        type="button"
        role="tab"
        aria-selected={activeCode === "ALL"}
        className={`hp-filter-tab${activeCode === "ALL" ? " hp-filter-tab--active" : ""}`}
        onClick={() => onSelect("ALL")}
      >
        {translate("common.all", lang)}
      </button>

      {groups.map((group) => (
        <button
          key={group.countryCode}
          type="button"
          role="tab"
          aria-selected={activeCode === group.countryCode}
          className={`hp-filter-tab${activeCode === group.countryCode ? " hp-filter-tab--active" : ""}`}
          onClick={() => onSelect(group.countryCode)}
        >
          {group.countryCode}
        </button>
      ))}
    </div>
  );
}
