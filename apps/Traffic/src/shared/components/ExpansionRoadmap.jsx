"use client";

import { useTrafficLanguage } from "@/lib/language";

// Expansion Roadmap — native TRAZE homepage card occupying the Coverage
// Explorer panel slot. Static for V1 (hardcoded defaults below) but fully
// prop-driven so live DB data can be passed later with no refactor:
//
//   <ExpansionRoadmap
//     activeCountries={[...]} plannedCountries={[...]} researchCountries={[...]} />

const DEFAULT_ACTIVE = ["United States", "Mexico", "El Salvador"];
const DEFAULT_PLANNED = ["Canada", "Costa Rica"];
const DEFAULT_RESEARCH = ["Guatemala", "Honduras"];

const NAME_TO_CODE = {
  "united states": "US",
  mexico: "MX",
  "el salvador": "SV",
  canada: "CA",
  guatemala: "GT",
  honduras: "HN",
  "costa rica": "CR"
};

function flagFromCode(code) {
  const cc = String(code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  return String.fromCodePoint(...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

// Resolve a flag emoji from either an ISO-2 code or a known country name.
function flagFor(country) {
  return flagFromCode(country) ?? flagFromCode(NAME_TO_CODE[String(country ?? "").trim().toLowerCase()]);
}

function RoadmapItem({ country, variant, status, pulse }) {
  const flag = flagFor(country);
  return (
    <li className="expansion-item">
      <span className="expansion-item__marker">
        <span
          className={`expansion-dot expansion-dot--${variant}${pulse ? " expansion-dot--pulse" : ""}`}
          aria-hidden="true"
        />
      </span>
      <span className="expansion-item__text">
        <span className="expansion-item__name">
          {flag && (
            <span className="expansion-item__flag" aria-hidden="true">
              {flag}
            </span>
          )}
          {country}
        </span>
        <span className="expansion-item__status">{status}</span>
      </span>
    </li>
  );
}

export default function ExpansionRoadmap({
  activeCountries = DEFAULT_ACTIVE,
  plannedCountries = DEFAULT_PLANNED,
  researchCountries = DEFAULT_RESEARCH,
  className = ""
} = {}) {
  const { t } = useTrafficLanguage();

  const currentItems = activeCountries.map((country) => ({
    country,
    variant: "active",
    status: t("expansionRoadmap.activeMarket"),
    pulse: false
  }));

  // NEXT TARGETS groups by stage: Planned first, then Research (prop-driven).
  const targetItems = [
    ...plannedCountries.map((country) => ({
      country,
      variant: "planned",
      status: t("expansionRoadmap.planned"),
      pulse: true
    })),
    ...researchCountries.map((country) => ({
      country,
      variant: "research",
      status: t("expansionRoadmap.researchPhase"),
      pulse: true
    }))
  ];

  return (
    <section
      className={`expansion-roadmap${className ? ` ${className}` : ""}`}
      aria-label={t("expansionRoadmap.title")}
    >
      <header className="expansion-roadmap__head">
        <h3 className="expansion-roadmap__title">{t("expansionRoadmap.title")}</h3>
        <p className="expansion-roadmap__subtitle">{t("expansionRoadmap.subtitle")}</p>
      </header>

      {currentItems.length > 0 && (
        <div className="expansion-roadmap__section">
          <span className="expansion-roadmap__eyebrow">{t("expansionRoadmap.currentCoverage")}</span>
          <ul className="expansion-list">
            {currentItems.map((item) => (
              <RoadmapItem key={`active-${item.country}`} {...item} />
            ))}
          </ul>
        </div>
      )}

      {targetItems.length > 0 && (
        <div className="expansion-roadmap__section">
          <span className="expansion-roadmap__eyebrow">{t("expansionRoadmap.nextTargets")}</span>
          <ul className="expansion-list">
            {targetItems.map((item) => (
              <RoadmapItem key={`target-${item.country}`} {...item} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
