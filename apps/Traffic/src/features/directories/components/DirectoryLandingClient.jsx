"use client";

import Link from "next/link";
import TrazeSearchBar from "@/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import TrazeGeoCoverageGlobe from "@/shared/components/TrazeGeoCoverageGlobe";

function countryName(country, lang) {
  return lang === "es" ? (country.nameEs ?? country.name) : country.name;
}

export default function DirectoryLandingClient({
  countries = [],
  locationOptions = [],
  liveServiceSlugs = [],
  geoCoverage = null
}) {
  const { lang, t } = useTrafficLanguage();

  return (
    <>
      <section className="homepage-section homepage-directory-surface traze-page-hero">
        <div className="homepage-section-heading">
          <span className="pill homepage-eyebrow">
            {t("directory.eyebrow")}
          </span>
          <h1 className="section-title traze-page-hero-title">
            {t("directory.title")}
          </h1>
          <p className="homepage-hero-copy">
            {t("directory.subtitle")}
          </p>
        </div>

        <TrazeSearchBar
          screenKey="home"
          {...TRAZE_SCREEN_SEARCH.home}
          countryOptions={countries}
          locationOptions={locationOptions}
          liveServiceSlugs={liveServiceSlugs}
          showCountrySelector
          showCitySelector
          locationPlaceholder={{
            en: "City, state, or country",
            es: "Ciudad, estado o país"
          }}
        />
      </section>

      <TrazeGeoCoverageGlobe coverage={geoCoverage} />

      <section className="homepage-section homepage-directory-surface traze-page-card">
        <div className="homepage-section-heading">
          <h2 className="section-title">
            {t("directory.liveCountries")}
          </h2>
          <p>
            {t("directory.liveCountriesSubtitle")}
          </p>
        </div>

        <div className="homepage-directory-links">
          {countries.map((country) => (
            <Link
              key={country.countryCode}
              className="homepage-directory-link"
              href={withLocale(`/${country.countrySlug}`, lang)}
            >
              <span>{countryName(country, lang)}</span>
              <span>
                {country.providerCount} {t("common.providers")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
