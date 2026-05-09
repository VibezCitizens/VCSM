"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Globe } from "lucide-react";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import {
  readStoredTrazeLocation,
  writeStoredTrazeLocation
} from "@/lib/trazeLocationStorage";

const TrazeGlobe = dynamic(
  () => import("@/shared/components/TrazeGlobe"),
  { ssr: false }
);

const COUNTRY_ATLAS_POINTS = {
  US: { x: 37, y: 37, zone: "north" },
  MX: { x: 42, y: 58, zone: "central" },
  GT: { x: 47, y: 67, zone: "central" },
  BZ: { x: 51, y: 65, zone: "central" },
  HN: { x: 54, y: 69, zone: "central" },
  SV: { x: 51, y: 72, zone: "central" },
  NI: { x: 56, y: 74, zone: "central" },
  CR: { x: 59, y: 79, zone: "south" },
  PA: { x: 64, y: 80, zone: "south" }
};

const PAGE_COPY_KEYS = {
  categories: {
    eyebrow: "countrySelector.categoriesEyebrow",
    title: "countrySelector.categoriesTitle",
    sub: "countrySelector.categoriesSubtitle"
  },
  "top-providers": {
    eyebrow: "countrySelector.topProvidersEyebrow",
    title: "countrySelector.topProvidersTitle",
    sub: "countrySelector.topProvidersSubtitle"
  }
};

export default function CountrySelectorClient({ countries, destinationPath }) {
  const router = useRouter();
  const { lang, t } = useTrafficLanguage();
  const [ready, setReady] = useState(false);
  const [activeCountryCode, setActiveCountryCode] = useState(
    countries?.[0]?.countryCode ?? ""
  );

  useEffect(() => {
    const stored = readStoredTrazeLocation();
    if (stored?.countryCode) {
      const match = countries.find((c) => c.countryCode === stored.countryCode);
      if (match) {
        router.replace(withLocale(`/${match.countrySlug}/${destinationPath}`, lang));
        return;
      }
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  const copy = PAGE_COPY_KEYS[destinationPath] ?? PAGE_COPY_KEYS.categories;
  const activeCountry =
    countries.find((country) => country.countryCode === activeCountryCode) ??
    countries[0] ??
    null;
  const totalProviders = countries.reduce(
    (sum, country) => sum + Number(country.providerCount ?? 0),
    0
  );
  const totalCities = countries.reduce(
    (sum, country) => sum + Number(country.cityCount ?? 0),
    0
  );

  function getCountryName(country) {
    return lang === "es" ? country.nameEs : country.name;
  }

  function handleSelectCountry(country) {
    writeStoredTrazeLocation({
      countryCode: country.countryCode,
      countrySlug: country.countrySlug
    });
    router.push(withLocale(`/${country.countrySlug}/${destinationPath}`, lang));
  }

  return (
    <section className="country-selector">
      <div className="country-selector__header">
        <span className="pill homepage-eyebrow">
          <Globe size={11} style={{ marginRight: 4 }} aria-hidden="true" />
          {t(copy.eyebrow)}
        </span>
        <h1 className="country-selector__title">{t(copy.title)}</h1>
        <p className="country-selector__subtitle">{t(copy.sub)}</p>
      </div>

      <div className="country-selector__atlas-shell">
        <div className="country-selector__atlas" aria-label={t("countrySelector.atlasAria")}>
          {/* Rings stay visible as globe-load fallback */}
          <div className="country-selector__atlas-ring country-selector__atlas-ring--outer" aria-hidden="true" />
          <div className="country-selector__atlas-ring country-selector__atlas-ring--middle" aria-hidden="true" />
          <div className="country-selector__atlas-ring country-selector__atlas-ring--inner" aria-hidden="true" />

          <TrazeGlobe
            countries={countries}
            activeCountryCode={activeCountryCode}
            onHover={(code) => { if (code) setActiveCountryCode(code); }}
            onCountryClick={handleSelectCountry}
          />

          <div className="country-selector__atlas-panel">
            <span className="country-selector__atlas-panel-eyebrow">
              {t("countrySelector.activeMarket")}
            </span>
            <strong>{activeCountry ? getCountryName(activeCountry) : "TRAZE"}</strong>
            <span>
              {activeCountry
                ? `${activeCountry.providerCount} ${t("common.providers")} · ${activeCountry.cityCount} ${t("common.cities").toLowerCase()}`
                : `${totalProviders} ${t("common.providers")}`}
            </span>
          </div>
        </div>

        <aside className="country-selector__market-panel" aria-label={t("countrySelector.availableMarkets")}>
          <div className="country-selector__market-summary">
            <span>{t("countrySelector.trazeCoverage")}</span>
            <strong>{totalProviders}</strong>
            <small>{t("countrySelector.activeCitiesLine", { count: totalCities })}</small>
          </div>

          <div className="country-selector__market-list" role="list">
            {countries.map((country) => {
              const isActive = activeCountry?.countryCode === country.countryCode;
              return (
                <button
                  key={country.countryCode}
                  type="button"
                  className={`country-selector__card${isActive ? " is-active" : ""}`}
                  role="listitem"
                  onClick={() => handleSelectCountry(country)}
                  onMouseEnter={() => setActiveCountryCode(country.countryCode)}
                  onFocus={() => setActiveCountryCode(country.countryCode)}
                >
                  <span className="country-selector__card-code">{country.countryCode}</span>
                  <span>
                    <span className="country-selector__card-name">{getCountryName(country)}</span>
                    <span className="country-selector__card-meta">
                      {country.providerCount}{" "}
                      {t("common.providers")}
                      {" · "}
                      {country.cityCount}{" "}
                      {t("common.cities").toLowerCase()}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
