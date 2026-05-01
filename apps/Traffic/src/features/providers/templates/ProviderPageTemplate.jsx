import { InternalLinkGrid } from "@/features/directories/components/InternalLinkGrid";
import { ProviderCtaModules } from "@/features/conversion/components/CtaModules";
import { getProviderGuideLinks } from "@/features/providers/lib/providerGuideLinks";
import { ContactSection } from "@/features/providers/components/ContactSection";
import ProviderReviewList from "@/features/providers/components/ProviderReviewList";
import { ReviewTrustSummary } from "@/features/reviews/components/ReviewTrustSummary";
import { JsonLdScript } from "@/shared/components/JsonLdScript";

const SERVICE_GRADIENT = {
  locksmith: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)",
  barber: "linear-gradient(135deg, #3b0764 0%, #7e22ce 55%, #9333ea 100%)",
  "hair color": "linear-gradient(135deg, #3b0764 0%, #7e22ce 55%, #9333ea 100%)",
  makeup: "linear-gradient(135deg, #500724 0%, #9f1239 55%, #e11d48 100%)",
  restaurant: "linear-gradient(135deg, #431407 0%, #9a3412 55%, #ea580c 100%)",
  "gas station": "linear-gradient(135deg, #052e16 0%, #166534 55%, #15803d 100%)",
  "money exchange": "linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #0284c7 100%)"
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #7c3aed 100%)";

function getServiceKey(serviceNames) {
  return (serviceNames?.[0] ?? "").toLowerCase();
}

function getServiceInitials(serviceNames) {
  const name = serviceNames?.[0] ?? "";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "VC";
}

function getServiceGradient(serviceNames) {
  return SERVICE_GRADIENT[getServiceKey(serviceNames)] ?? DEFAULT_GRADIENT;
}

function buildLocationSubtitle(serviceNames, cityName, countryName) {
  const service = serviceNames?.[0] ?? "";
  const place = [cityName, countryName].filter(Boolean).join(", ");
  if (service && place) return `${service} services · ${place}`;
  if (place) return place;
  return service;
}

function isDefaultBio(bio, displayName) {
  return !bio || bio === `Visit ${displayName} on Vibez Citizens.`;
}

export async function ProviderPageTemplate({
  model,
  stats,
  context,
  reviewSummary = null,
  visibleReviews = [],
  guideLinks = [],
  relatedLinks,
  schema
}) {
  const providerGuideLinks = guideLinks.length
    ? guideLinks
    : await getProviderGuideLinks(model.provider, { limit: 4 });

  const { provider } = model;
  const serviceInitials = getServiceInitials(model.serviceNames);
  const serviceGradient = getServiceGradient(model.serviceNames);
  const locationSubtitle = buildLocationSubtitle(
    model.serviceNames,
    model.cityName,
    model.countryName
  );
  const isVerified = Boolean(provider.vcsmActorId);
  const summaryReviewCount = Number(reviewSummary?.reviewCount ?? 0);
  const summaryAverageRating = Number(reviewSummary?.averageRating ?? 0);
  const statsReviewCount = Number(stats?.reviewCount ?? 0);
  const statsAverageRating = Number(stats?.ratingAvg ?? 0);

  const ratingValue = summaryAverageRating > 0 ? summaryAverageRating : (statsAverageRating > 0 ? statsAverageRating : null);
  const reviewCountValue = summaryReviewCount > 0 ? summaryReviewCount : (statsReviewCount > 0 ? statsReviewCount : null);
  const hasVisibleReviewSignals = Boolean(
    (reviewCountValue ?? 0) > 0 &&
    (ratingValue ?? 0) > 0
  );
  const hasVisibleReviews = visibleReviews.length > 0 || hasVisibleReviewSignals;
  const showBio = !isDefaultBio(provider.shortBio, provider.displayName);

  // Banner: real image with dark overlay, else pure CSS gradient hero
  const heroBannerStyle = provider.bannerUrl
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(11,11,15,0.55) 0%, rgba(11,11,15,0.97) 100%), url(${provider.bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }
    : undefined;

  // Strip legacy SEO-plumbing links — only show human-readable discovery links
  const exploreLinks = relatedLinks.filter(
    (link) => !link.label.toLowerCase().startsWith("legacy")
  );

  return (
    <div className="pro-page">
      <JsonLdScript id="provider-schema" schema={schema} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="card card--hero pro-hero"
        style={heroBannerStyle}
        aria-label="Provider identity"
      >
        <div className="pro-hero-top">
          {/* Avatar: real image or gradient initials fallback */}
          <div
            className="pro-hero-avatar"
            style={provider.avatarUrl ? undefined : { background: serviceGradient }}
          >
            {provider.avatarUrl ? (
              <img
                className="pro-hero-avatar-img"
                src={provider.avatarUrl}
                alt={provider.displayName}
              />
            ) : (
              <span className="pro-hero-initials">{serviceInitials}</span>
            )}
          </div>

          <div className="pro-hero-badges">
            {model.serviceNames.map((name) => (
              <span className="pill pill--live" key={name}>{name}</span>
            ))}
            {isVerified ? (
              <span className="pill pill--ok">Verified</span>
            ) : (
              <span className="pill">Unclaimed</span>
            )}
          </div>
        </div>

        <h1 className="pro-hero-name">{provider.displayName}</h1>

        {locationSubtitle ? (
          <p className="pro-hero-subtitle">{locationSubtitle}</p>
        ) : null}

        {showBio ? (
          <p className="pro-hero-bio">{provider.shortBio}</p>
        ) : null}

        <div className="pro-hero-stats">
          {hasVisibleReviewSignals ? (
            <>
              <span className="pro-stat">
                <span className="pro-stat-value">&#9733; {ratingValue.toFixed(1)}</span>
                <span className="pro-stat-label">Rating</span>
              </span>
              <span className="pro-stat-divider" aria-hidden="true" />
              <span className="pro-stat">
                <span className="pro-stat-value">{reviewCountValue}</span>
                <span className="pro-stat-label">Reviews</span>
              </span>
            </>
          ) : (
            <span className="pro-new-badge">New on TRAZE</span>
          )}
        </div>
      </section>

      {/* ── BODY (sidebar first in DOM → top on mobile, right on desktop) ── */}
      <div className="pro-body">
        <aside className="pro-sidebar">
          <ProviderCtaModules
            providerSlug={provider.slug}
            providerProfileId={provider.id}
            providerPhone={provider.phoneE164}
            providerName={provider.displayName}
            claimStatus={provider.claimStatus}
            vcsmActorId={provider.vcsmActorId}
            vcsmSlug={provider.vcsmSlug}
          />
        </aside>

        <div className="pro-main">
          {/* Contact */}
          <ContactSection
            phone={provider.phoneE164}
            address={provider.addressLine1
              ? { street: provider.addressLine1, postal_code: provider.postalCode }
              : null}
            locationText={provider.locationText}
            cityName={model.cityName}
            regionCode={provider.primaryRegionCode}
            postalCode={provider.postalCode}
          />

          {/* Trust / Reviews */}
          <section className="card card--subtle pro-trust" aria-label="Reviews and trust">
            {hasVisibleReviews ? (
              <>
                <h2 className="pro-section-title">Reviews</h2>
                {reviewSummary ? (
                  <ReviewTrustSummary summary={reviewSummary} />
                ) : null}

                {visibleReviews.length > 0 ? (
                  <ProviderReviewList reviews={visibleReviews} />
                ) : hasVisibleReviewSignals ? (
                  <p className="pro-review-meta-note">
                    This profile has ratings, but no written comments yet.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="pro-trust-empty">
                <p className="pro-trust-empty-text">
                  This provider is new. Visit their live profile to connect or be the first to review.
                </p>
              </div>
            )}
          </section>

          {providerGuideLinks.length > 0 ? (
            <InternalLinkGrid title="Guides & Resources" links={providerGuideLinks} />
          ) : null}
        </div>
      </div>

      {/* ── EXPLORE NEARBY ───────────────────────────────────── */}
      {exploreLinks.length > 0 ? (
        <InternalLinkGrid title="Explore nearby" links={exploreLinks} />
      ) : null}
    </div>
  );
}
