import { getCountryByCode } from "@/data/repositories/geo.repo";
import { getServiceById } from "@/data/repositories/service.repo";
import { getPublicReviewSummaryForProvider } from "@/data/repositories/reviewSummary.repo";
import { countryProviderPath, providerPath } from "@/lib/paths";
import { ProviderListItemFooter } from "@/features/directories/components/ProviderListItemFooter";

function resolveProviderHref(provider) {
  const country = getCountryByCode(provider.primaryCountryCode);
  if (!country) return providerPath(provider.slug);
  return countryProviderPath(country.slug, provider.slug);
}

const AVATAR_PALETTE = [
  "#4c1d95", "#5b21b6", "#7c3aed",
  "#0369a1", "#15803d", "#c2410c", "#1e3a5f"
];

function getAvatarColor(name) {
  const n = [...(name ?? "?")].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

function getInitials(name) {
  return (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRating(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toFixed(1) : null;
}

function formatResponseTime(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 60 ? `${Math.round(n)}m` : `${Math.round(n / 60)}h`;
}

function toTitleCase(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/\s+/g)
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeRegion(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.length <= 3 ? raw.toUpperCase() : toTitleCase(raw);
}

function normalizeLocationText(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return raw;

  return parts
    .map((part, index) => {
      if (index > 0 && /^[a-z]{2,3}$/i.test(part)) {
        return part.toUpperCase();
      }
      return toTitleCase(part);
    })
    .join(", ");
}

function formatProviderLocation(provider) {
  const city = toTitleCase(provider.primaryCityName ?? "");
  const region = normalizeRegion(provider.primaryRegionCode ?? "");

  if (city && region) {
    return `${city}, ${region}`;
  }

  if (city) {
    return city;
  }

  return normalizeLocationText(provider.locationText);
}

function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldShowBio(provider) {
  const bio = String(provider?.shortBio ?? "").trim();
  if (!bio) return false;

  const displayName = String(provider?.displayName ?? "").trim();
  if (!displayName) return true;

  const placeholderPattern = new RegExp(
    `^visit\\s+${escapeRegex(displayName)}\\s+on\\s+vibez\\s+citizens\\.?$`,
    "i"
  );

  return !placeholderPattern.test(bio);
}

export async function ProviderListItem({ item, rank }) {
  const { provider, stats, providerServices } = item;
  const reviewSummary = await getPublicReviewSummaryForProvider(provider, stats);

  const href = resolveProviderHref(provider);

  const primaryServiceId = providerServices[0]?.serviceId;
  const primaryService = primaryServiceId ? getServiceById(primaryServiceId) : null;

  const rating = reviewSummary?.averageRating
    ? formatRating(reviewSummary.averageRating)
    : formatRating(stats?.ratingAvg);
  const reviewCount = Number(reviewSummary?.reviewCount ?? stats?.reviewCount ?? 0);
  const responseTime = formatResponseTime(stats?.responseTimeP50Minutes);

  const avatarColor = getAvatarColor(provider.displayName);
  const initials = getInitials(provider.displayName);
  const locationText = formatProviderLocation(provider);
  const showBio = shouldShowBio(provider);

  return (
    <article className="dir-card">
      <div className="dir-card-inner">

        <div className="dir-card-avatar" style={{ background: avatarColor }}>
          {provider.avatarUrl ? (
            <img
              className="dir-card-avatar-img"
              src={provider.avatarUrl}
              alt={provider.displayName}
              loading="lazy"
            />
          ) : (
            initials
          )}
        </div>

        <div className="dir-card-main">
          <h3 className="dir-card-name">{provider.displayName}</h3>

          <p className="dir-card-meta">
            {primaryService?.name ?? null}
            {primaryService?.name && locationText
              ? <span className="dir-card-meta-sep">·</span>
              : null}
            {locationText}
          </p>

          {showBio && (
            <p className="dir-card-bio">{provider.shortBio}</p>
          )}

          {rating && (
            <div className="dir-card-stats">
              <span className="dir-card-stat">
                <strong>★ {rating}</strong>
              </span>
            </div>
          )}
        </div>

        <ProviderListItemFooter
          href={href}
          rank={rank}
          reviewCount={reviewCount}
          responseTime={responseTime}
          serviceCount={providerServices.length}
        />

      </div>
    </article>
  );
}
