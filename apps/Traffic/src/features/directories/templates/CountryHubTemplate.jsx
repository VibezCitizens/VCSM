"use client";

import Link from "next/link";
import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { DirectoryCtaModules } from "@/features/conversion/adapters/conversion.adapter";
import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import TrazeHeroMap from "@/shared/components/TrazeHeroMap";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import TrazeProviderCard from "@/shared/components/TrazeProviderCard";
import { TrazeSection } from "@/shared/components/TrazeSection";
import TrazeGeoExplorer from "@/shared/components/TrazeGeoExplorer";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { useTrafficLanguage } from "@/lib/language";

function FeaturedProviders({ providers, lang, t }) {
  if (!providers?.length) return null;
  return (
    <TrazeSection
      title={t("directory.featuredProviders")}
    >
      <div className="ch-featured-grid">
        {providers.map((provider) => (
          <TrazeProviderCard key={provider.id} provider={provider} lang={lang} />
        ))}
      </div>
    </TrazeSection>
  );
}


function ServiceBrowser({ serviceGroups, lang, t }) {
  if (!serviceGroups?.length) return null;
  return (
    <TrazeSection
      title={t("directory.browseByService")}
    >
      <div className="ch-service-grid">
        {serviceGroups.map((sg) => (
          <Link key={sg.slug} className="ch-service-chip" href={sg.href}>
            <span className="ch-service-name">{lang === "es" ? sg.nameEs : sg.name}</span>
          </Link>
        ))}
      </div>
    </TrazeSection>
  );
}

export function CountryHubTemplate({
  country,
  breadcrumbs,
  schema,
  context,
  featuredProviders,
  geoData,
  serviceGroups,
  locationOptions,
  countryOptions
}) {
  const { lang, t } = useTrafficLanguage();
  const countryName = lang === "es" ? (country.nameEs ?? country.name) : country.name;

  return (
    <TrazePageShell>
      <JsonLdScript id="directory-schema" schema={schema} />

      {/* ── Hero (homepage style + search) ────────────────── */}
      <section className="homepage-hero">
        <div className="homepage-hero-layout">
          <div className="homepage-hero-content">
            <DirectoryBreadcrumbs items={breadcrumbs} />
            <h1 className="homepage-hero-title">
              {t("directory.countryHubTitle", { country: countryName })}
            </h1>
            <p className="homepage-hero-copy">{t("directory.countryHubSubtitle")}</p>

            <TrazeSearchBar
              screenKey="home"
              {...TRAZE_SCREEN_SEARCH.home}
              locationOptions={locationOptions}
              countryOptions={countryOptions}
              selectedCountry={country.code}
              showCountrySelector
              showCitySelector
              locationPlaceholder={{
                en: "City, state, or country",
                es: "Ciudad, estado o pais"
              }}
            />
          </div>

          <div className="homepage-hero-visual" aria-hidden="true">
            <TrazeHeroMap />
          </div>
        </div>
      </section>

      {/* ── Featured providers ────────────────────────────── */}
      <FeaturedProviders providers={featuredProviders} lang={lang} t={t} />

      {/* ── Cities by state ───────────────────────────────── */}
      {geoData?.length > 0 && (
        <TrazeSection title={t("directory.browseByLocation")}>
          <TrazeGeoExplorer geoData={geoData} />
        </TrazeSection>
      )}

      {/* ── Services ──────────────────────────────────────── */}
      <ServiceBrowser serviceGroups={serviceGroups} lang={lang} t={t} />

      {/* ── CTA ───────────────────────────────────────────── */}
      <DirectoryCtaModules context={context} />
    </TrazePageShell>
  );
}
