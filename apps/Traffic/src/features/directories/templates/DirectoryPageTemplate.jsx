import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import TrazeProviderCard from "@/shared/components/TrazeProviderCard";
import { buildHomepageProviderCard } from "@/data/repositories/homepage.repo";
import { DirectoryCtaModules } from "@/features/conversion/adapters/conversion.adapter";
import { DirectoryFilterRow } from "@/features/directories/components/DirectoryFilterRow";
import { DirectoryTitleClient } from "@/features/directories/components/DirectoryTitleClient";
import { DirectoryHeroClient } from "@/features/directories/components/DirectoryHeroClient";
import { DirectoryResultsClient, DirectoryEmptyStateClient } from "@/features/directories/components/DirectoryResultsClient";
import { getRelatedGuideLinksForContext } from "@/features/directories/lib/relatedGuides";
import {
  getServiceBySlug,
  getCountryBySlug
} from "@/features/directories/dal/directory.read.dal";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import TrazeHeroMap from "@/shared/components/TrazeHeroMap";

function titleizeSlug(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildServiceLabel(context) {
  return context?.serviceSlug ? `${titleizeSlug(context.serviceSlug)}s` : "Services";
}

function buildServiceLabelEs(context) {
  if (!context?.serviceSlug) return "Servicios";
  const service = getServiceBySlug(context.serviceSlug);
  if (service?.nameEs) return service.nameEs;
  return buildServiceLabel(context);
}

function buildPlaceLabel(context, breadcrumbs = []) {
  if (context?.citySlug) return titleizeSlug(context.citySlug);

  const breadcrumbTail = breadcrumbs[breadcrumbs.length - 1];
  const label = String(breadcrumbTail?.label ?? "").trim();
  if (label && label.toLowerCase() !== "home") return label;

  const countryCode = String(context?.countrySlug ?? "").trim().toUpperCase();
  if (countryCode === "US") return "United States";
  return countryCode || "Directory";
}

function buildPlaceLabelEs(context, breadcrumbs = []) {
  if (context?.countrySlug && !context?.citySlug) {
    const country = getCountryBySlug(context.countrySlug);
    if (country?.nameEs) return country.nameEs;
  }
  // City names are the same in both languages; fall through to EN
  return buildPlaceLabel(context, breadcrumbs);
}

function buildDisplayTitle(context, serviceLabel, placeLabel) {
  if (context?.serviceSlug) return `${serviceLabel} in ${placeLabel}`;
  return `Top providers in ${placeLabel}`;
}

function buildDisplayTitleEs(context, serviceLabelEs, placeLabelEs) {
  if (context?.serviceSlug) return `${serviceLabelEs} en ${placeLabelEs}`;
  return `Mejores proveedores en ${placeLabelEs}`;
}

function parsePriceParts(priceSummary) {
  if (!priceSummary) return [];
  return priceSummary.split(" · ").map((part) => part.charAt(0).toUpperCase() + part.slice(1));
}

export async function DirectoryPageTemplate({
  breadcrumbs,
  model,
  context,
  relatedLinks,
  guideLinks = [],
  schema,
  liveDataStatus = "ok"
}) {
  const contextGuideLinks = guideLinks.length
    ? guideLinks
    : await getRelatedGuideLinksForContext(context, { limit: 3 });

  const serviceLabel = buildServiceLabel(context);
  const serviceLabelEs = buildServiceLabelEs(context);

  const placeLabel = buildPlaceLabel(context, breadcrumbs);
  const placeLabelEs = buildPlaceLabelEs(context, breadcrumbs);

  const displayTitle = buildDisplayTitle(context, serviceLabel, placeLabel);
  const displayTitleEs = buildDisplayTitleEs(context, serviceLabelEs, placeLabelEs);

  const locationLabel = context?.citySlug
    ? [placeLabel, String(context?.countrySlug ?? "").toUpperCase()].filter(Boolean).join(", ")
    : placeLabel;

  const priceParts = parsePriceParts(model.priceSummary);

  const compareSubject = context?.serviceSlug
    ? `${serviceLabel.toLowerCase()} providers`
    : "local providers";
  const compareSubjectEs = context?.serviceSlug
    ? `${serviceLabelEs.toLowerCase()}`
    : "proveedores locales";

  const isDev = process.env.NODE_ENV !== "production";
  const liveDataFailed = liveDataStatus !== "ok";
  const countries = listLiveProviderCountries();
  const routeCountry = context?.countrySlug
    ? getCountryBySlug(context.countrySlug)
    : null;
  const locationOptions = listLiveProviderLocationOptions();

  return (
    <TrazePageShell>
      <JsonLdScript id="directory-schema" schema={schema} />

      {/* ── Hero (country-hub style + search) ─────────────── */}
      <section className="homepage-hero">
        <div className="homepage-hero-layout">
          <div className="homepage-hero-content">
            <DirectoryBreadcrumbs items={breadcrumbs} />
            <DirectoryTitleClient
              titleEn={displayTitle}
              titleEs={displayTitleEs}
              className="homepage-hero-title"
            />
            <DirectoryHeroClient
              variant="hero"
              compareSubject={compareSubject}
              compareSubjectEs={compareSubjectEs}
              providerCount={model.providerCount}
              placeLabel={placeLabel}
              placeLabelEs={placeLabelEs}
              priceParts={priceParts}
            />

            <DirectoryFilterRow
              locationLabel={locationLabel}
              countrySlug={context?.countrySlug ?? ""}
              countryCode={routeCountry?.code ?? ""}
              citySlug={context?.citySlug ?? null}
              locationOptions={locationOptions}
              countryOptions={countries}
            />

            {isDev && liveDataFailed && (
              <div className="dir-dev-warning">Live data unavailable</div>
            )}
          </div>

          <div className="homepage-hero-visual" aria-hidden="true">
            <TrazeHeroMap />
          </div>
        </div>
      </section>

      {/* ── Provider list ─────────────────────────────────── */}
      <section className="dir-results-wrap" aria-label="Provider results">
        <DirectoryResultsClient providerCount={model.providerCount} serviceLabel={serviceLabel} />
        {model.providers.length === 0 ? (
          <div className="dir-providers-section">
            <DirectoryEmptyStateClient serviceLabel={serviceLabel} />
          </div>
        ) : (
          <div className="ch-featured-grid">
            {model.providers
              .map((item) => ({ item, card: buildHomepageProviderCard(item.provider) }))
              .filter(({ card }) => card)
              .map(({ item, card }) => (
                <TrazeProviderCard key={item.provider.id} provider={card} />
              ))}
          </div>
        )}
      </section>

      <InternalLinkGrid title="TRAZE Guides & Resources" titleEs="Guías y recursos" links={contextGuideLinks} />
      <InternalLinkGrid title="Related TRAZE Discovery Pages" titleEs="Páginas de descubrimiento relacionadas" links={relatedLinks} />
      <DirectoryCtaModules context={context} />
    </TrazePageShell>
  );
}
