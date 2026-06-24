"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { MapPin, Star, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { trackProviderCardClick } from "@/lib/analytics";
import { SafeImage } from "@/shared/components/SafeImage";
import { safeMediaSrc } from "@/lib/safeMediaSrc";
import { getCategoryStyle } from "@/shared/components/TrazeProviderCard";

const ROTATE_INTERVAL_MS = 5000;

function formatRating(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(1);
}

// Spotlight uses the same featured-provider card data as the grid below it.
// No extra fetch, no fabricated ratings/reviews/descriptions — every field is
// rendered only when the provider actually carries real data for it.
function SpotlightCard({ provider, lang }) {
  const { t } = useTrafficLanguage();
  const { bg, icon: IconComp } = getCategoryStyle(provider.category, provider.categoryKey);
  const mediaSrc = provider.bannerUrl || provider.avatarUrl || provider.logoUrl || null;
  const safeMedia = safeMediaSrc(mediaSrc);
  const rating = formatRating(provider.rating);
  const reviewCount = Number(provider.reviewCount);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
  const href = withLocale(provider.href, lang);
  const categoryLabel = provider.category || provider.categoryKey || null;

  const handleClick = () =>
    trackProviderCardClick({
      providerSlug: provider.slug,
      surface: "directory-spotlight",
      countrySlug: provider.countrySlug,
      citySlug: provider.primaryCitySlug,
      serviceSlug: provider.categoryKey
    });

  return (
    <article className="dir-spotlight-card">
      <Link
        className="dir-spotlight-media"
        href={href}
        onClick={handleClick}
        tabIndex={-1}
        aria-hidden="true"
      >
        <SafeImage
          src={mediaSrc}
          alt=""
          className="dir-spotlight-image"
          fallback={
            <span className="dir-spotlight-media-fallback" style={{ background: bg }}>
              <IconComp size={54} color="#fff" strokeWidth={1.5} />
            </span>
          }
        />
        {categoryLabel && (
          <span className="dir-spotlight-pill" style={safeMedia ? undefined : { background: bg }}>
            {categoryLabel}
          </span>
        )}
      </Link>

      <div className="dir-spotlight-content">
        <div className="dir-spotlight-name-row">
          <h3 className="dir-spotlight-name">
            <Link href={href} onClick={handleClick} className="dir-spotlight-name-link">
              {provider.name}
            </Link>
          </h3>
          {provider.verified && (
            <span className="dir-spotlight-verified">
              <BadgeCheck size={15} />
              {t("providerCard.verified")}
            </span>
          )}
        </div>

        {provider.locationText && (
          <p className="dir-spotlight-location">
            <MapPin size={14} />
            {provider.locationText}
          </p>
        )}

        {categoryLabel && <p className="dir-spotlight-desc">{categoryLabel}</p>}

        {rating && (
          <p className="dir-spotlight-rating">
            <Star size={14} />
            <span className="dir-spotlight-rating-value">{rating}</span>
            {hasReviews && (
              <span className="dir-spotlight-review-count">
                {reviewCount === 1
                  ? t("providerCard.oneReview")
                  : t("providerCard.reviews", { count: reviewCount })}
              </span>
            )}
          </p>
        )}

        <Link className="dir-spotlight-cta" href={href} onClick={handleClick}>
          {t("providerCard.viewProfile")}
        </Link>
      </div>
    </article>
  );
}

export default function DirectorySpotlight({ providers = [] }) {
  const { lang, t } = useTrafficLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const liveId = useId();
  const count = providers.length;
  const isCarousel = count > 1;

  // Honor prefers-reduced-motion: disable autoplay when the user opts out.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  // Autoplay — only when multiple providers exist, not paused (hover/focus),
  // and reduced motion is off.
  useEffect(() => {
    if (!isCarousel || paused || reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isCarousel, paused, reducedMotion, count]);

  if (count === 0) {
    return (
      <section className="dir-spotlight" aria-label={t("spotlight.region")}>
        <div className="dir-spotlight-empty">
          <p className="dir-spotlight-empty-title">{t("spotlight.emptyTitle")}</p>
          <p className="dir-spotlight-empty-body">{t("spotlight.emptyBody")}</p>
        </div>
      </section>
    );
  }

  const safeIndex = activeIndex % count;
  const goTo = (next) => setActiveIndex(((next % count) + count) % count);

  return (
    <section
      className="dir-spotlight"
      aria-label={t("spotlight.region")}
      aria-roledescription={isCarousel ? "carousel" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        // Keep autoplay paused while focus moves between controls inside the
        // card; only resume once focus leaves the section entirely.
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="dir-spotlight-viewport" aria-live="polite" id={liveId}>
        <span className="dir-spotlight-flag">{t("spotlight.eyebrow")}</span>
        <SpotlightCard provider={providers[safeIndex]} lang={lang} />
      </div>

      {isCarousel && (
        <div className="dir-spotlight-controls">
          <button
            type="button"
            className="dir-spotlight-nav"
            onClick={() => goTo(safeIndex - 1)}
            aria-label={t("spotlight.prev")}
            aria-controls={liveId}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="dir-spotlight-dots" role="tablist">
            {providers.map((provider, index) => (
              <button
                key={provider.id}
                type="button"
                role="tab"
                className={`dir-spotlight-dot${index === safeIndex ? " dir-spotlight-dot--active" : ""}`}
                aria-selected={index === safeIndex}
                aria-label={t("spotlight.goToSlide", { index: index + 1 })}
                aria-controls={liveId}
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="dir-spotlight-nav"
            onClick={() => goTo(safeIndex + 1)}
            aria-label={t("spotlight.next")}
            aria-controls={liveId}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {isCarousel && (
        <span className="dir-spotlight-sr-status" aria-live="polite">
          {t("spotlight.slidePosition", { current: safeIndex + 1, total: count })}
        </span>
      )}
    </section>
  );
}
