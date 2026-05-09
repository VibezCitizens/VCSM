"use client";

import { useState } from "react";
import { useTrafficLanguage } from "@/lib/language";
import HomepageProviderFilterTabs from "@/features/home/components/HomepageProviderFilterTabs";
import HomepageCountryGroup from "@/features/home/components/HomepageCountryGroup";

function buildStatsLine(stats, lang) {
  if (!stats || !stats.length) return null;
  return stats
    .map((entry) => {
      const label = lang === "es" && entry.labelEs ? entry.labelEs : entry.label;
      return `${entry.value} ${label}`;
    })
    .join(" · ");
}

export default function HomepageTopProvidersSection({
  countryGroups = [],
  stats = [],
  claimHref = "/claim-profile",
  directoryHref = "/top-providers"
}) {
  const { lang, t } = useTrafficLanguage();
  const [activeCode, setActiveCode] = useState("ALL");

  const liveGroups = countryGroups.filter((g) => g.providers.length > 0);
  const visibleGroups = activeCode === "ALL"
    ? liveGroups
    : liveGroups.filter((g) => g.countryCode === activeCode);

  const statsLine = buildStatsLine(stats, lang);
  const hasProviders = liveGroups.some((g) => g.providers.length > 0);

  return (
    <section
      className="homepage-section homepage-section--divider homepage-directory-surface traze-page-card"
      id="top-providers"
    >
      <div className="hp-providers-header">
        <div>
          <h2 className="hp-providers-title">
            {t("homepage.globalTopProviders")}
          </h2>
          {statsLine && <p className="hp-providers-subtitle">{statsLine}</p>}
        </div>
      </div>

      {!hasProviders ? (
        <div className="homepage-empty-state">
          <h3 className="homepage-card-title">
            {t("homepage.noProviders")}
          </h3>
          <p className="homepage-meta-note">{t("homepage.noProvidersBody")}</p>
          <div className="homepage-chip-row">
            <a className="pill pill--primary" href={claimHref} target="_blank" rel="noreferrer">
              {t("homepage.claimYourProfile")}
            </a>
          </div>
        </div>
      ) : (
        <>
          <HomepageProviderFilterTabs
            groups={liveGroups}
            activeCode={activeCode}
            onSelect={setActiveCode}
            lang={lang}
          />

          {visibleGroups.map((group) => (
            <HomepageCountryGroup key={group.countryCode} group={group} lang={lang} />
          ))}
        </>
      )}
    </section>
  );
}
