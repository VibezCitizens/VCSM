import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPublicContentGuideParamsForStaticGeneration,
  getPublicContentPagesByProfileSlug,
  getPublicContentPageByProfileAndSlug,
  getPublicContentPagesByLocation,
  getPublicContentPagesByService,
} from "@/data/repositories/content.repo";
import { getPublicReviewSummaryForContentPage } from "@/data/repositories/reviewSummary.repo";
import { buildContentMetadata } from "@/seo/metadata";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/seo/schemaOrg";
import {
  contentGuideCanonicalPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath
} from "@/lib/paths";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { DirectoryBreadcrumbs } from "@/features/directories/components/DirectoryBreadcrumbs";
import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import { ReviewTrustSummary } from "@/features/reviews/components/ReviewTrustSummary";

export const revalidate = 3600;

function getLabelFromSlug(slug) {
  return String(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPrimaryServiceKey(page) {
  return page.serviceKeys?.[0] ?? null;
}

function getLocationContextLabel(page) {
  if (page.locationText) {
    return page.locationText;
  }

  const segments = [page.localitySlug, page.citySlug, page.countrySlug]
    .filter(Boolean)
    .map(getLabelFromSlug);

  return segments.length ? segments.join(", ") : null;
}

function toSentence(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function buildContextSummary(page) {
  return [page.providerName, getLocationContextLabel(page)].filter(Boolean).join(" · ");
}

function buildContentTitle(page) {
  const fromSeo = page.seoTitle?.trim();
  if (fromSeo) {
    return fromSeo;
  }

  const contextSummary = buildContextSummary(page);
  if (!contextSummary) {
    return `${page.title} | TRAZE Guides`;
  }

  return `${page.title} | ${contextSummary} | TRAZE Guides`;
}

function buildContentDescription(page) {
  const fromSeo = page.seoDescription?.trim();
  if (fromSeo) {
    return fromSeo;
  }

  const contextSummary = buildContextSummary(page);
  const fromExcerpt = page.excerpt?.trim();

  if (fromExcerpt) {
    const enrichedExcerpt = contextSummary
      ? `${toSentence(fromExcerpt)} ${contextSummary}`
      : fromExcerpt;

    return enrichedExcerpt.slice(0, 320);
  }

  const fromBody = String(page.body ?? "").trim().slice(0, 220);
  if (fromBody) {
    const enrichedBody = contextSummary
      ? `${toSentence(fromBody)} ${contextSummary}`
      : fromBody;

    return enrichedBody.slice(0, 320);
  }

  return contextSummary || "TRAZE local service guide and resource.";
}

function formatPublishDate(value) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function splitBody(body) {
  return String(body ?? "")
    .split(/\n{2,}/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildBreadcrumbs(page) {
  const breadcrumbs = [{ label: "Home", href: "/" }];
  const primaryService = getPrimaryServiceKey(page);

  if (page.countrySlug) {
    breadcrumbs.push({
      label: getLabelFromSlug(page.countrySlug),
      href: countryPath(page.countrySlug)
    });
  }

  if (page.countrySlug && page.citySlug) {
    breadcrumbs.push({
      label: getLabelFromSlug(page.citySlug),
      href: countryCityPath(page.countrySlug, page.citySlug)
    });
  }

  if (page.countrySlug && page.citySlug && primaryService) {
    breadcrumbs.push({
      label: getLabelFromSlug(primaryService),
      href: countryCityServicePath(page.countrySlug, page.citySlug, primaryService)
    });
  } else if (page.countrySlug && primaryService) {
    breadcrumbs.push({
      label: getLabelFromSlug(primaryService),
      href: countryServiceHubPath(page.countrySlug, primaryService)
    });
  }

  breadcrumbs.push({ label: page.title });
  return breadcrumbs;
}

function buildGuideHref(page) {
  return contentGuideCanonicalPath(page.profileSlug, page.slug);
}

async function buildContextualNavigation(page) {
  const primaryService = getPrimaryServiceKey(page);
  const serviceLabel = primaryService ? getLabelFromSlug(primaryService) : null;

  const providerGuides = page.profileSlug
    ? await getPublicContentPagesByProfileSlug(page.profileSlug, { limit: 6 })
    : [];

  const moreFromProvider = providerGuides
    .filter((entry) => entry.slug !== page.slug)
    .slice(0, 3)
    .map((entry) => ({
      label: entry.title,
      href: contentGuideCanonicalPath(entry.profileSlug, entry.slug)
    }));

  const relatedServiceInCity = [];
  if (page.countrySlug && page.citySlug && primaryService) {
    relatedServiceInCity.push({
      label: `${serviceLabel} in ${getLabelFromSlug(page.citySlug)}`,
      href: countryCityServicePath(page.countrySlug, page.citySlug, primaryService)
    });
  }

  const browseProvidersForService = [];
  if (page.countrySlug && primaryService) {
    if (page.citySlug) {
      browseProvidersForService.push({
        label: `Browse ${serviceLabel} providers in ${getLabelFromSlug(page.citySlug)}`,
        href: countryCityServicePath(page.countrySlug, page.citySlug, primaryService)
      });
    }

    browseProvidersForService.push({
      label: `Browse ${serviceLabel} providers across ${getLabelFromSlug(page.countrySlug)}`,
      href: countryServiceHubPath(page.countrySlug, primaryService)
    });
  }

  return {
    moreFromProvider,
    relatedServiceInCity,
    browseProvidersForService
  };
}

async function buildRelatedGuideLinks(page) {
  const primaryService = getPrimaryServiceKey(page);
  const [serviceRelated, locationRelated] = await Promise.all([
    primaryService
      ? getPublicContentPagesByService(primaryService, { limit: 6 })
      : Promise.resolve([]),
    page.citySlug
      ? getPublicContentPagesByLocation(page.citySlug, { limit: 6 })
      : page.countrySlug
        ? getPublicContentPagesByLocation(page.countrySlug, { limit: 6 })
        : Promise.resolve([])
  ]);

  const combined = [...serviceRelated, ...locationRelated]
    .filter((entry) => entry.slug !== page.slug || entry.profileSlug !== page.profileSlug)
    .slice(0, 5);

  const seen = new Set();
  return combined
    .filter((entry) => {
      const key = `${entry.profileSlug ?? ""}::${entry.slug}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((entry) => ({
      label: entry.title,
      href: contentGuideCanonicalPath(entry.profileSlug, entry.slug),
      description: entry.excerpt ?? undefined
    }));
}

export async function generateStaticParams() {
  const entries = await getAllPublicContentGuideParamsForStaticGeneration();
  return entries.map((entry) => ({
    profileSlug: entry.profileSlug,
    contentSlug: entry.contentSlug
  }));
}

export async function generateMetadata({ params }) {
  const page = await getPublicContentPageByProfileAndSlug(params.profileSlug, params.contentSlug);
  if (!page) {
    return {};
  }

  return buildContentMetadata({
    title: buildContentTitle(page),
    description: buildContentDescription(page),
    path: buildGuideHref(page),
    publishedTime: page.publishedAt,
    modifiedTime: page.updatedAt
  });
}

export default async function GuidePage({ params }) {
  const page = await getPublicContentPageByProfileAndSlug(params.profileSlug, params.contentSlug);
  if (!page) {
    notFound();
  }

  const primaryService = getPrimaryServiceKey(page);
  const locationContext = getLocationContextLabel(page);
  const publishedLabel = formatPublishDate(page.publishedAt);
  const bodyBlocks = splitBody(page.body);
  const breadcrumbs = buildBreadcrumbs(page);
  const relatedLinks = await buildRelatedGuideLinks(page);
  const contextualNavigation = await buildContextualNavigation(page);
  const providerReviewSummary = await getPublicReviewSummaryForContentPage(page);

  const hierarchyLinks = [];
  if (page.countrySlug) {
    hierarchyLinks.push({
      label: "Country directory",
      href: countryPath(page.countrySlug)
    });
  }

  if (page.countrySlug && page.citySlug) {
    hierarchyLinks.push({
      label: "City directory",
      href: countryCityPath(page.countrySlug, page.citySlug)
    });
  }

  if (page.countrySlug && page.citySlug && primaryService) {
    hierarchyLinks.push({
      label: "Service directory",
      href: countryCityServicePath(page.countrySlug, page.citySlug, primaryService)
    });
  } else if (page.countrySlug && primaryService) {
    hierarchyLinks.push({
      label: "Country service hub",
      href: countryServiceHubPath(page.countrySlug, primaryService)
    });
  }

  if (page.countrySlug && page.providerSlug) {
    hierarchyLinks.push({
      label: "Provider profile",
      href: countryProviderPath(page.countrySlug, page.providerSlug)
    });
  }

  const schema = [
    buildBreadcrumbSchema(breadcrumbs),
    buildArticleSchema({
      title: page.title,
      description: buildContentDescription(page),
      category: page.category,
      path: buildGuideHref(page),
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      authorName: page.providerName ?? undefined,
      authorUrl:
        page.countrySlug && page.providerSlug
          ? countryProviderPath(page.countrySlug, page.providerSlug)
          : undefined,
      publisherName: "TRAZE",
      publisherUrl: "/",
      about: [
        page.category ? { "@type": "Thing", name: page.category } : null,
        primaryService ? { "@type": "Thing", name: primaryService } : null,
        page.primaryCategoryLabel ? { "@type": "Thing", name: page.primaryCategoryLabel } : null,
        locationContext ? { "@type": "Place", name: locationContext } : null,
        page.providerName ? { "@type": "Organization", name: page.providerName } : null
      ]
    })
  ];

  return (
    <div className="stack-grid">
      <JsonLdScript id="guide-schema" schema={schema} />

      <section className="card stack-grid">
        <DirectoryBreadcrumbs items={breadcrumbs} />
        <span className="pill">TRAZE Resource · {page.category}</span>
        <h1 className="template-title">{page.title}</h1>
        {page.excerpt ? <p>{page.excerpt}</p> : null}
        <div className="row-wrap">
          {publishedLabel ? <span className="pill">Published {publishedLabel}</span> : null}
          {primaryService ? <span className="pill">Service {primaryService}</span> : null}
          {page.providerName ? <span className="pill">Source {page.providerName}</span> : null}
          {locationContext ? <span className="pill">Location {locationContext}</span> : null}
        </div>
      </section>

      <section className="card stack-grid">
        {bodyBlocks.length ? (
          bodyBlocks.map((block, index) => <p key={`${page.slug}-${index}`}>{block}</p>)
        ) : (
          <p>No TRAZE content available for this guide yet.</p>
        )}
      </section>

      {page.providerName || page.profileBio || page.websiteUrl || page.phonePublic || page.emailPublic ? (
        <section className="card stack-grid">
          <h3 className="homepage-card-title">Business Context</h3>
          {page.providerName ? <p>{page.providerName}</p> : null}
          {providerReviewSummary ? <ReviewTrustSummary summary={providerReviewSummary} /> : null}
          {page.profileBio ? <p className="text-sm">{page.profileBio}</p> : null}
          <div className="row-wrap">
            {page.websiteUrl ? (
              <a className="pill" href={page.websiteUrl} target="_blank" rel="noreferrer">
                Website
              </a>
            ) : null}
            {page.phonePublic ? <span className="pill">Phone {page.phonePublic}</span> : null}
            {page.emailPublic ? <span className="pill">Email {page.emailPublic}</span> : null}
          </div>
        </section>
      ) : null}

      {hierarchyLinks.length ? (
        <section className="card stack-grid">
          <h3 className="homepage-card-title">Back To Provider & Directories</h3>
          <div className="row-wrap">
            {hierarchyLinks.map((link) => (
              <Link key={link.href} className="pill" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {contextualNavigation.moreFromProvider.length ||
      contextualNavigation.relatedServiceInCity.length ||
      contextualNavigation.browseProvidersForService.length ? (
        <section className="card stack-grid">
          <h3 className="homepage-card-title">Continue Exploring</h3>

          {contextualNavigation.moreFromProvider.length ? (
            <div className="stack-grid">
              <p className="text-xs text-muted">More from this provider</p>
              <div className="row-wrap">
                {contextualNavigation.moreFromProvider.map((link) => (
                  <Link key={link.href} className="pill" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {contextualNavigation.relatedServiceInCity.length ? (
            <div className="stack-grid">
              <p className="text-xs text-muted">Related services in this city</p>
              <div className="row-wrap">
                {contextualNavigation.relatedServiceInCity.map((link) => (
                  <Link key={link.href} className="pill" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {contextualNavigation.browseProvidersForService.length ? (
            <div className="stack-grid">
              <p className="text-xs text-muted">Browse providers for this service</p>
              <div className="row-wrap">
                {contextualNavigation.browseProvidersForService.map((link) => (
                  <Link key={link.href} className="pill" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <InternalLinkGrid title="More TRAZE Guides & Resources" links={relatedLinks} />
    </div>
  );
}
