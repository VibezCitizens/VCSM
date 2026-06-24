import { InternalLinkGrid } from "@/features/directories/adapters/directories.adapter";
import { ProviderAccountPromptCard, ProviderCtaModules } from "@/features/conversion/adapters/conversion.adapter";
import { getProviderGuideLinks } from "@/features/providers/lib/providerGuideLinks";
import { ContactSection } from "@/features/providers/components/ContactSection";
import { ProviderHoursSection } from "@/features/providers/components/ProviderHoursSection";
import { ProviderServicesSection } from "@/features/providers/components/ProviderServicesSection";
import { ProviderMenuSection } from "@/features/providers/components/ProviderMenuSection";
import { ProviderGallerySection } from "@/features/providers/components/ProviderGallerySection";
import { ProviderHeroBadges, ProviderHeroStats } from "@/features/providers/components/ProviderHeroStatus";
import { ProviderTrustSection } from "@/features/providers/components/ProviderTrustSection";
import { JsonLdScript } from "@/shared/components/JsonLdScript";
import { SafeImage } from "@/shared/components/SafeImage";
import { safeMediaSrc } from "@/lib/safeMediaSrc";
import { ProviderDataDisclaimer } from "@/features/providers/components/ProviderDataDisclaimer";
import TrazeAccountCta from "@/shared/components/TrazeAccountCta";

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
  schema,
  liveServices = [],
  menuCategories = [],
  portfolio = []
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
  const isVerified = provider.source === "vport" || provider.claimStatus === "claimed";
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

  const safeBannerUrl = safeMediaSrc(provider.bannerUrl);
  const heroBannerStyle = safeBannerUrl
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(11,11,15,0.55) 0%, rgba(11,11,15,0.97) 100%), url(${safeBannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }
    : undefined;

  const heroAvatarSrc = safeMediaSrc(provider.logoUrl ?? provider.avatarUrl);

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
          <div
            className="pro-hero-avatar"
            style={heroAvatarSrc ? undefined : { background: serviceGradient }}
          >
            <SafeImage
              className="pro-hero-avatar-img"
              src={heroAvatarSrc}
              alt={provider.displayName}
              fallback={<span className="pro-hero-initials">{serviceInitials}</span>}
            />
          </div>

          <ProviderHeroBadges
            serviceNames={model.serviceNames}
            isVerified={isVerified}
          />
        </div>

        <h1 className="pro-hero-name">{provider.displayName}</h1>

        {locationSubtitle ? (
          <p className="pro-hero-subtitle">{locationSubtitle}</p>
        ) : null}

        {showBio ? (
          <p className="pro-hero-bio">{provider.shortBio}</p>
        ) : null}

        <ProviderHeroStats
          ratingValue={ratingValue}
          reviewCountValue={reviewCountValue}
          hasVisibleReviewSignals={hasVisibleReviewSignals}
        />
      </section>

      {/* ── BODY ─────────────────────────────────────────────── */}
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
            providerSource={provider.source}
            context={context}
          />
        </aside>

        <div className="pro-main">
          <ContactSection
            providerSlug={provider.slug}
            providerSource={provider.source}
            phone={provider.phoneE164}
            address={provider.addressLine1
              ? { street: provider.addressLine1, postal_code: provider.postalCode }
              : null}
            locationText={provider.locationText}
            cityName={model.cityName}
            regionCode={provider.primaryRegionCode}
            postalCode={provider.postalCode}
            email={provider.email}
            websiteUrl={provider.websiteUrl}
            bookingUrl={provider.bookingUrl}
            lat={provider.lat}
            lng={provider.lng}
          />

          <ProviderHoursSection hours={provider.hours} />
          <ProviderServicesSection liveServices={liveServices} />
          <ProviderMenuSection menuCategories={menuCategories} />
          <ProviderGallerySection portfolio={portfolio} />

          <ProviderTrustSection
            reviewSummary={reviewSummary}
            visibleReviews={visibleReviews}
            hasVisibleReviews={hasVisibleReviews}
            hasVisibleReviewSignals={hasVisibleReviewSignals}
          />

          {providerGuideLinks.length > 0 ? (
            <InternalLinkGrid title="Guides & Resources" titleEs="Guías y recursos" links={providerGuideLinks} />
          ) : null}

          {provider.claimStatus === "claimed" ? (
            <ProviderAccountPromptCard
              providerSlug={provider.slug}
              providerSource={provider.source}
            />
          ) : null}
        </div>
      </div>

      {/* ── OWNERSHIP — "Own this business?" ──────────────────────────
         Promoted ABOVE "Explore nearby" so the primary conversion action is
         more visible (TICKET-TRAZE-PROVIDER-PAGE-CTA-CONSOLIDATION).
         Renders only for unclaimed providers not yet linked to a VPORT.

         FUTURE (claimStatus === "claimed"): replace this block with a
         "✓ Verified Business — This profile is managed by its owner through
         Vibez Citizens." confirmation. Not implemented here (needs new copy +
         component); claim routing/params/destinations stay unchanged. */}
      {provider.claimStatus !== "claimed" && !provider.vcsmActorId ? (
        <TrazeAccountCta variant="provider" providerSlug={provider.slug} />
      ) : null}

      {/* ── EXPLORE NEARBY ───────────────────────────────────── */}
      {exploreLinks.length > 0 ? (
        <InternalLinkGrid title="Explore nearby" titleEs="Explorar cerca" links={exploreLinks} />
      ) : null}

      {/* ── DATA DISCLAIMER ──────────────────────────────────── */}
      <ProviderDataDisclaimer
        providerName={provider.displayName}
        providerSlug={provider.slug}
        claimStatus={provider.claimStatus}
      />
    </div>
  );
}
