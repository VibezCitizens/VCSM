import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import { ProviderListItem } from "@/features/directories/components/ProviderListItem";
import { DirectoryCtaModules } from "@/features/conversion/components/CtaModules";
import { DirectoryFilterRow } from "@/features/directories/components/DirectoryFilterRow";
import { getRelatedGuideLinksForContext } from "@/features/directories/lib/relatedGuides";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
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

function buildPlaceLabel(context, breadcrumbs = []) {
  if (context?.citySlug) {
    return titleizeSlug(context.citySlug);
  }

  const breadcrumbTail = breadcrumbs[breadcrumbs.length - 1];
  const label = String(breadcrumbTail?.label ?? "").trim();
  if (label && label.toLowerCase() !== "home") {
    return label;
  }

  const countryCode = String(context?.countrySlug ?? "us").trim().toUpperCase();
  if (countryCode === "US") return "United States";
  return countryCode;
}

function buildDisplayTitle(context, serviceLabel, placeLabel) {
  if (context?.serviceSlug) {
    return `${serviceLabel} in ${placeLabel}`;
  }

  return `Top providers in ${placeLabel}`;
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
  const placeLabel = buildPlaceLabel(context, breadcrumbs);
  const displayTitle = buildDisplayTitle(context, serviceLabel, placeLabel);
  const locationLabel = context?.citySlug
    ? `${placeLabel}, ${String(context?.countrySlug ?? "US").toUpperCase()}`
    : placeLabel;
  const priceParts = parsePriceParts(model.priceSummary);
  const compareSubject = context?.serviceSlug
    ? `${serviceLabel.toLowerCase()} providers`
    : "local providers";

  const isDev = process.env.NODE_ENV !== "production";
  const liveDataFailed = liveDataStatus !== "ok";

  return (
    <div className="stack-grid">
      <JsonLdScript id="directory-schema" schema={schema} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="dir-hero">
        <DirectoryBreadcrumbs items={breadcrumbs} />
        <h1 className="dir-hero-title">{displayTitle}</h1>
        <p className="dir-hero-copy">
          Compare {compareSubject}, pricing, and availability.
        </p>
        <div className="dir-hero-stats">
          <span className="pill">
            {model.providerCount} {model.providerCount === 1 ? "provider" : "providers"}
          </span>
          <span className="pill pill--ghost">Live directory</span>
        </div>
        <div className="dir-hero-meta" aria-label="Directory details">
          <span className="dir-hero-meta-item">Scope: {placeLabel}</span>
          {priceParts.slice(0, 2).map((part) => (
            <span key={part} className="dir-hero-meta-item">{part}</span>
          ))}
        </div>
        {isDev && liveDataFailed && (
          <div className="dir-dev-warning">Live data unavailable</div>
        )}
      </section>

      {/* ── Search + filters ─────────────────────────────── */}
      <DirectoryFilterRow serviceLabel={serviceLabel} locationLabel={locationLabel} />

      {/* ── Provider list ─────────────────────────────────── */}
      <section className="dir-results-wrap" aria-label="Provider results">
        <header className="dir-results-header">
          <h2 className="dir-results-title">Available providers</h2>
          <p className="dir-results-subtitle">
            {model.providerCount} {model.providerCount === 1 ? "result" : "results"}
          </p>
        </header>
        <div className="dir-providers-section">
          {model.providers.length === 0 ? (
            <div className="dir-empty-state">
              <p className="dir-empty-title">No providers listed yet in this area.</p>
              <p className="dir-empty-copy">Be the first to list your {serviceLabel.toLowerCase()} service on TRAZE.</p>
            </div>
          ) : (
            model.providers.map((item, index) => (
              <ProviderListItem key={item.provider.id} item={item} rank={index + 1} />
            ))
          )}
        </div>
      </section>

      <InternalLinkGrid title="TRAZE Guides & Resources" links={contextGuideLinks} />
      <InternalLinkGrid title="Related TRAZE Discovery Pages" links={relatedLinks} />
      <DirectoryCtaModules context={context} />
    </div>
  );
}
