import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Scissors,
  Utensils,
  DollarSign,
  Fuel,
  Building2,
  Star,
  Clock3,
  BadgeCheck
} from "lucide-react";

const CATEGORY_STYLES = {
  locksmith: { bg: "#4c1d95", icon: ShieldCheck },
  barber: { bg: "#5b21b6", icon: Scissors },
  barbers: { bg: "#5b21b6", icon: Scissors },
  restaurant: { bg: "#c2410c", icon: Utensils },
  exchange: { bg: "#15803d", icon: DollarSign },
  gas: { bg: "#0369a1", icon: Fuel },
  "gas station": { bg: "#0369a1", icon: Fuel }
};

function getCategoryStyle(category, categoryKey) {
  const key = (categoryKey || category || "").toLowerCase();
  for (const [lookup, style] of Object.entries(CATEGORY_STYLES)) {
    if (key.includes(lookup)) return style;
  }
  return { bg: "#374151", icon: Building2 };
}

function buildStatsLine(stats) {
  if (!stats || !stats.length) return null;
  return stats.map((entry) => `${entry.value} ${entry.label}`).join(" · ");
}

function formatProviderLocation(provider) {
  const city = provider.city ?? provider.primaryCityName ?? null;
  const state = provider.stateCode ?? provider.primaryRegionCode ?? null;

  if (city && state) {
    return `${city}, ${state}`;
  }

  if (city) {
    return city;
  }

  return provider.locationText ?? "Location pending";
}

function formatRating(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(1);
}

function formatReviewCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "No reviews yet";
  return parsed === 1 ? "1 review" : `${parsed} reviews`;
}

function formatResponseTime(provider) {
  const label = String(provider.responseTimeLabel ?? "").trim();
  if (label) return label;

  const minutes = Number(provider.responseTimeMinutes ?? provider.responseTimeP50Minutes ?? NaN);
  if (Number.isFinite(minutes) && minutes > 0) {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    return `${Math.max(1, Math.round(minutes / 60))} hr`;
  }

  return "Response time pending";
}

export default function HomepageTopProvidersSection({
  providers = [],
  stats = [],
  isLoading = false,
  claimHref = "/claim-profile"
}) {
  const statsLine = buildStatsLine(stats);

  return (
    <section className="homepage-section homepage-section--divider homepage-directory-surface" id="top-providers">
      <div className="hp-providers-header">
        <div>
          <h2 className="hp-providers-title">Top providers near you</h2>
          {statsLine && <p className="hp-providers-subtitle">{statsLine}</p>}
        </div>
        <a className="hp-view-all" href="/us">
          View all listings
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {isLoading ? (
        <div className="homepage-loading-state">
          <p className="homepage-meta-note">Loading providers...</p>
        </div>
      ) : null}

      {!isLoading && providers.length === 0 ? (
        <div className="homepage-empty-state">
          <h3 className="homepage-card-title">No providers listed yet.</h3>
          <p className="homepage-meta-note">Listings will appear here as providers activate profiles.</p>
          <div className="homepage-chip-row">
            <a className="pill pill--primary" href={claimHref} target="_blank" rel="noreferrer">
              Claim your profile
            </a>
          </div>
        </div>
      ) : null}

      {!isLoading && providers.length > 0 ? (
        <div className="hp-providers-row">
          {providers.map((provider) => {
            const { bg, icon: IconComp } = getCategoryStyle(provider.category, provider.categoryKey);
            const rating = formatRating(provider.rating);
            const reviewCountLabel = formatReviewCount(provider.reviewCount);
            const responseTimeLabel = formatResponseTime(provider);
            const statusLabel = provider.verified ? "Verified" : "Listed";

            return (
              <Link key={provider.id} className="hp-provider-card" href={provider.href}>
                <div className="hp-provider-card-head">
                  <div className="hp-provider-icon" style={{ background: bg }}>
                    <IconComp size={19} color="#fff" />
                  </div>

                  <div className="hp-provider-main">
                    <h3 className="hp-provider-name">{provider.name}</h3>
                    <p className="hp-provider-category">{provider.category}</p>
                  </div>

                  <span
                    className={`hp-provider-status${provider.verified ? " hp-provider-status--verified" : ""}`}
                  >
                    <BadgeCheck size={12} />
                    {statusLabel}
                  </span>
                </div>

                <p className="hp-provider-location">
                  <MapPin size={12} />
                  {formatProviderLocation(provider)}
                </p>

                <div className="hp-provider-stats">
                  <span className="hp-provider-stat hp-provider-stat--rating">
                    <Star size={12} />
                    {rating ? rating : "New"}
                  </span>
                  <span className="hp-provider-stat">{reviewCountLabel}</span>
                </div>

                <div className="hp-provider-footer">
                  <span className="hp-provider-response">
                    <Clock3 size={12} />
                    {responseTimeLabel}
                  </span>
                  <span className="hp-provider-cta">View profile</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
