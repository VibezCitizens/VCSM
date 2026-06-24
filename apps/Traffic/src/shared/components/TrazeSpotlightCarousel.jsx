"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { trackProviderCardClick } from "@/lib/analytics";
import { SafeImage } from "@/shared/components/SafeImage";
import { safeMediaSrc } from "@/lib/safeMediaSrc";
import { getCategoryStyle } from "@/shared/components/TrazeProviderCard";

// Premium auto-rotating spotlight carousel rendered inside the Coverage
// Explorer panel. Uses the same live provider cards the homepage Featured /
// Top Providers section consumes — no new data source, queries, or schema.
// NOT a paid-sponsorship surface: labelled "TRAZE spotlight".

const MAX_SLIDES = 6;
const ROTATE_MS = 5000;

function buildLocation(provider) {
  const city = typeof provider.city === "string" ? provider.city.trim() : "";
  const country = provider.primaryCountryCode
    ? String(provider.primaryCountryCode).toUpperCase()
    : "";
  return [city, country].filter(Boolean).join(", ");
}

function formatRating(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(1);
}

function positiveReviewCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function TrazeSpotlightCarousel({ providers = [] }) {
  const { lang, t } = useTrafficLanguage();

  const slides = (Array.isArray(providers) ? providers : [])
    .filter((provider) => provider && provider.name && provider.href)
    .slice(0, MAX_SLIDES);
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Touch-swipe tracking (mobile). `swiped` guards the slide link so a
  // horizontal swipe navigates the carousel instead of opening a profile.
  const touchStart = useRef(null);
  const swiped = useRef(false);

  // Respect the user's reduced-motion preference; disables auto-rotation.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-rotate, paused on hover/focus, single slide, or reduced motion.
  useEffect(() => {
    if (reducedMotion || count <= 1 || hovered || focused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, count, hovered, focused]);

  const safeIndex = count ? index % count : 0;

  if (count === 0) {
    return (
      <section className="traze-spotlight traze-spotlight--empty" aria-label={t("spotlight.region")}>
        <div className="traze-spotlight__head">
          <span className="traze-spotlight__eyebrow">
            <Sparkles size={13} aria-hidden="true" />
            {t("spotlight.eyebrow")}
          </span>
        </div>
        <div className="traze-spotlight__empty">
          <strong>{t("spotlight.emptyTitle")}</strong>
          <span>{t("spotlight.emptyBody")}</span>
        </div>
      </section>
    );
  }

  const provider = slides[safeIndex];
  const { bg, icon: IconComp } = getCategoryStyle(provider.category, provider.categoryKey);
  const avatarSrc = provider.avatarUrl || provider.logoUrl || null;
  const safeAvatarSrc = safeMediaSrc(avatarSrc);
  const location = buildLocation(provider);
  const rating = formatRating(provider.rating);
  const reviewCount = positiveReviewCount(provider.reviewCount);
  const hasControls = count > 1;

  function goTo(next) {
    setIndex(((next % count) + count) % count);
  }

  function onTouchStart(event) {
    const point = event.touches[0];
    touchStart.current = { x: point.clientX, y: point.clientY };
    swiped.current = false;
  }

  function onTouchMove(event) {
    if (!touchStart.current) return;
    const point = event.touches[0];
    const dx = point.clientX - touchStart.current.x;
    const dy = point.clientY - touchStart.current.y;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swiped.current = true;
  }

  function onTouchEnd(event) {
    if (!touchStart.current) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touchStart.current.x;
    const dy = point.clientY - touchStart.current.y;
    touchStart.current = null;
    if (count <= 1) return;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? safeIndex + 1 : safeIndex - 1);
    }
  }

  return (
    <section
      className="traze-spotlight"
      aria-roledescription="carousel"
      aria-label={t("spotlight.region")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="traze-spotlight__head">
        <span className="traze-spotlight__eyebrow">
          <Sparkles size={13} aria-hidden="true" />
          {t("spotlight.eyebrow")}
        </span>
        {hasControls && (
          <span className="traze-spotlight__position" aria-hidden="true">
            {t("spotlight.slidePosition", { current: safeIndex + 1, total: count })}
          </span>
        )}
      </div>

      <div
        className="traze-spotlight__viewport"
        aria-live={hovered || focused ? "polite" : "off"}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link
          key={provider.id ?? safeIndex}
          className="traze-spotlight__slide"
          href={withLocale(provider.href, lang)}
          aria-roledescription="slide"
          aria-label={t("spotlight.slidePosition", { current: safeIndex + 1, total: count })}
          onClick={(event) => {
            // A horizontal swipe ended on this slide — don't open the profile.
            if (swiped.current) {
              event.preventDefault();
              swiped.current = false;
              return;
            }
            trackProviderCardClick({
              providerSlug: provider.slug,
              surface: "spotlight-carousel",
              countrySlug: provider.countrySlug,
              citySlug: provider.primaryCitySlug,
              serviceSlug: provider.categoryKey
            });
          }}
        >
          <span
            className="traze-spotlight__media"
            style={safeAvatarSrc ? undefined : { background: bg }}
          >
            <SafeImage
              src={avatarSrc}
              alt=""
              className="traze-spotlight__avatar"
              fallback={
                <span className="traze-spotlight__icon" style={{ background: bg }}>
                  <IconComp size={26} color="#fff" aria-hidden="true" />
                </span>
              }
            />
          </span>

          <span className="traze-spotlight__body">
            <span className="traze-spotlight__namerow">
              <strong className="traze-spotlight__name">{provider.name}</strong>
              <span
                className={`traze-spotlight__badge${
                  provider.verified ? " traze-spotlight__badge--verified" : ""
                }`}
              >
                <BadgeCheck size={12} aria-hidden="true" />
                {provider.verified ? t("providerCard.verified") : t("providerCard.listed")}
              </span>
            </span>

            {provider.category && (
              <span className="traze-spotlight__category">{provider.category}</span>
            )}

            {location && (
              <span className="traze-spotlight__location">
                <MapPin size={12} aria-hidden="true" />
                {location}
              </span>
            )}

            {rating && (
              <span className="traze-spotlight__rating">
                <Star size={12} aria-hidden="true" />
                {rating}
                {reviewCount ? (
                  <span className="traze-spotlight__reviews">
                    {" · "}
                    {reviewCount === 1
                      ? t("providerCard.oneReview")
                      : t("providerCard.reviews", { count: reviewCount })}
                  </span>
                ) : null}
              </span>
            )}

            <span className="traze-spotlight__cta">{t("providerCard.viewProfile")}</span>
          </span>
        </Link>
      </div>

      {hasControls && (
        <div className="traze-spotlight__controls">
          <button
            type="button"
            className="traze-spotlight__nav"
            aria-label={t("spotlight.prev")}
            onClick={() => goTo(safeIndex - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          <div className="traze-spotlight__dots">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id ?? dotIndex}
                type="button"
                className={`traze-spotlight__dot${
                  dotIndex === safeIndex ? " is-active" : ""
                }`}
                aria-label={t("spotlight.goToSlide", { index: dotIndex + 1 })}
                aria-current={dotIndex === safeIndex ? "true" : undefined}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>

          <button
            type="button"
            className="traze-spotlight__nav"
            aria-label={t("spotlight.next")}
            onClick={() => goTo(safeIndex + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
