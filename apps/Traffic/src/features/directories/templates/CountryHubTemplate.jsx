"use client";

import Link from "next/link";
import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { DirectoryFilterRow } from "@/features/directories/components/DirectoryFilterRow";
import { DirectoryCtaModules } from "@/features/conversion/adapters/conversion.adapter";
import TrazeProviderCard from "@/shared/components/TrazeProviderCard";
import { TrazeSection } from "@/shared/components/TrazeSection";
import TrazeGeoExplorer from "@/shared/components/TrazeGeoExplorer";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import { useTrafficLanguage } from "@/lib/language";

function StatPill({ value, label }) {
  if (!value) return null;
  return (
    <span className="traze-stat-pill">
      <strong>{value}</strong> {label}
    </span>
  );
}

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
  stats,
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

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="traze-hero-card traze-page-hero">
        <DirectoryBreadcrumbs items={breadcrumbs} />
        <h1 className="traze-hero-title">
          {t("directory.countryHubTitle", { country: countryName })}
        </h1>
        <p className="traze-hero-sub">{t("directory.countryHubSubtitle")}</p>
        <div className="traze-stats-row">
          <StatPill value={stats.providerCount} label={t("common.providers")} />
          <StatPill value={stats.cityCount} label={t("directory.activeCities")} />
          <StatPill value={stats.serviceCount} label={t("common.serviceTypes")} />
        </div>
      </section>

      {/* ── Search ────────────────────────────────────────── */}
      <DirectoryFilterRow
        locationLabel={countryName}
        countrySlug={context.countrySlug}
        countryCode={country.code}
        citySlug={null}
        locationOptions={locationOptions}
        countryOptions={countryOptions}
      />

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
