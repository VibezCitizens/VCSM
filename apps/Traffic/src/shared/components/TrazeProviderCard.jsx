"use client";

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
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { translate } from "@/i18n";
import { trackProviderCardClick } from "@/lib/analytics";

const CATEGORY_STYLES = {
  locksmith:      { bg: "#4c1d95", icon: ShieldCheck },
  barber:         { bg: "#5b21b6", icon: Scissors },
  barbers:        { bg: "#5b21b6", icon: Scissors },
  restaurant:     { bg: "#c2410c", icon: Utensils },
  exchange:       { bg: "#15803d", icon: DollarSign },
  gas:            { bg: "#0369a1", icon: Fuel },
  "gas station":  { bg: "#0369a1", icon: Fuel }
};

export function getCategoryStyle(category, categoryKey) {
  const key = (categoryKey || category || "").toLowerCase();
  for (const [lookup, style] of Object.entries(CATEGORY_STYLES)) {
    if (key.includes(lookup)) return style;
  }
  return { bg: "#374151", icon: Building2 };
}

function formatProviderLocation(provider, lang) {
  const city    = provider.city ?? provider.primaryCityName ?? null;
  const state   = provider.stateCode ?? provider.primaryRegionCode ?? null;
  const country = provider.primaryCountryCode
    ? String(provider.primaryCountryCode).toUpperCase()
    : null;

  if (city && state && country) return `${city}, ${state.toUpperCase()}, ${country}`;
  if (city && state)            return `${city}, ${state.toUpperCase()}`;
  if (city && country)          return `${city}, ${country}`;
  if (city)                     return city;
  if (country)                  return country;
  return provider.locationText ?? translate("providerCard.locationPending", lang);
}

function formatRating(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed.toFixed(1);
}

function formatReviewCount(value, lang) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return translate("providerCard.noReviews", lang);
  }
  if (parsed === 1) return translate("providerCard.oneReview", lang);
  return translate("providerCard.reviews", lang, { count: parsed });
}

function formatResponseTime(provider, lang) {
  const label = String(provider.responseTimeLabel ?? "").trim();
  if (label) return label;
  const minutes = Number(provider.responseTimeMinutes ?? provider.responseTimeP50Minutes ?? NaN);
  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes < 60
      ? `${Math.round(minutes)} min`
      : `${Math.max(1, Math.round(minutes / 60))} hr`;
  }
  return translate("providerCard.responsePending", lang);
}

export default function TrazeProviderCard({ provider, lang }) {
  const { lang: contextLang, t } = useTrafficLanguage();
  const resolvedLang = lang ?? contextLang;
  const { bg, icon: IconComp } = getCategoryStyle(provider.category, provider.categoryKey);
  const rating           = formatRating(provider.rating);
  const reviewCountLabel = formatReviewCount(provider.reviewCount, resolvedLang);
  const responseLabel    = formatResponseTime(provider, resolvedLang);
  const statusLabel      = provider.verified
    ? t("providerCard.verified")
    : t("providerCard.listed");
  const avatarSrc = provider.avatarUrl || provider.logoUrl || null;

  return (
    <Link
      className="hp-provider-card"
      href={withLocale(provider.href, resolvedLang)}
      onClick={() =>
        trackProviderCardClick({
          providerSlug: provider.slug,
          surface: "provider-card",
          countrySlug: provider.countrySlug,
          citySlug: provider.primaryCitySlug,
          serviceSlug: provider.categoryKey
        })
      }
    >
      <div className="hp-provider-card-head">
        <div className="hp-provider-icon" style={avatarSrc ? undefined : { background: bg }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={provider.name}
              className="hp-provider-avatar"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className="hp-provider-icon-fallback"
            style={{ background: bg, display: avatarSrc ? "none" : "flex" }}
          >
            <IconComp size={19} color="#fff" />
          </span>
        </div>

        <div className="hp-provider-main">
          <h3 className="hp-provider-name">{provider.name}</h3>
          <p className="hp-provider-category">{provider.category}</p>
        </div>

        <span className={`hp-provider-status${provider.verified ? " hp-provider-status--verified" : ""}`}>
          <BadgeCheck size={12} />
          {statusLabel}
        </span>
      </div>

      <p className="hp-provider-location">
        <MapPin size={12} />
        {formatProviderLocation(provider, resolvedLang)}
      </p>

      <div className="hp-provider-stats">
        <span className="hp-provider-stat hp-provider-stat--rating">
          <Star size={12} />
          {rating ? rating : t("providerCard.new")}
        </span>
        <span className="hp-provider-stat">{reviewCountLabel}</span>
      </div>

      <div className="hp-provider-footer">
        <span className="hp-provider-response">
          <Clock3 size={12} />
          {responseLabel}
        </span>
        <span className="hp-provider-cta">
          {t("providerCard.viewProfile")}
        </span>
      </div>
    </Link>
  );
}
