"use client";

import Link from "next/link";
import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import TrazeHeroMap from "@/shared/components/TrazeHeroMap";
import TrazeProviderCard from "@/shared/components/TrazeProviderCard";
import DirectorySpotlight from "@/features/directories/components/DirectorySpotlight";
import { TrazeSection } from "@/shared/components/TrazeSection";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { getCountryBadge } from "@/lib/countryDisplay";

function countryName(country, lang) {
  return lang === "es" ? (country.nameEs ?? country.name) : country.name;
}

export default function DirectoryLandingClient({
  countries = [],
  locationOptions = [],
  liveServiceSlugs = [],
  featuredProviders = []
}) {
  const { lang, t } = useTrafficLanguage();

  return (
    <>
      {/* ── Hero (shared homepage-hero two-column template) ──────────── */}
      <section className="homepage-hero">
        <div className="homepage-hero-layout">
          <div className="homepage-hero-content">
            <h1 className="homepage-hero-title">{t("directory.title")}</h1>
            <p className="homepage-hero-copy">{t("directory.subtitle")}</p>

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
          </div>

          <div className="homepage-hero-visual" aria-hidden="true">
            <TrazeHeroMap />
          </div>
        </div>
      </section>

      {/* ── Browse by country (row of country chips) ─────────────────── */}
      {countries.length > 0 && (
        <TrazeSection title={t("directory.browseByCountry")}>
          <div className="directory-country-row">
            {countries.map((country) => {
              const badge = getCountryBadge(country.countryCode, lang);
              return (
                <Link
                  key={country.countryCode}
                  className="directory-country-chip"
                  href={withLocale(`/${country.countrySlug}`, lang)}
                >
                  {badge?.flag && (
                    <span className="directory-country-flag" aria-hidden="true">{badge.flag}</span>
                  )}
                  <span className="directory-country-name">{countryName(country, lang)}</span>
                </Link>
              );
            })}
          </div>
        </TrazeSection>
      )}

      {/* ── Featured business / TRAZE spotlight (TRAZE-DIRECTORY-FEATURED-
           SPOTLIGHT-CARD-001) — premium rotating card above the grid. Reuses
           the same featuredProviders data; renders its own empty state. ──── */}
      <TrazeSection title={t("spotlight.region")}>
        <DirectorySpotlight providers={featuredProviders} />
      </TrazeSection>

      {/* ── Featured providers (now visible on the directory landing) ──── */}
      {featuredProviders.length > 0 && (
        <TrazeSection title={t("directory.featuredProviders")}>
          <div className="ch-featured-grid">
            {featuredProviders.map((provider) => (
              <TrazeProviderCard key={provider.id} provider={provider} lang={lang} />
            ))}
          </div>
        </TrazeSection>
      )}
    </>
  );
}
