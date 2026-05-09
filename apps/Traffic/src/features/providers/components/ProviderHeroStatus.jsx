"use client";

import { useTrafficLanguage } from "@/lib/language";

export function ProviderHeroBadges({ serviceNames, isVerified }) {
  const { t } = useTrafficLanguage();

  return (
    <div className="pro-hero-badges">
      {serviceNames.map((name) => (
        <span className="pill pill--live" key={name}>{name}</span>
      ))}
      {isVerified ? (
        <span className="pill pill--ok">{t("providerProfile.verified")}</span>
      ) : (
        <span className="pill">{t("providerProfile.unclaimedProfile")}</span>
      )}
    </div>
  );
}

export function ProviderHeroStats({ ratingValue, reviewCountValue, hasVisibleReviewSignals }) {
  const { t } = useTrafficLanguage();

  return (
    <div className="pro-hero-stats">
      {hasVisibleReviewSignals ? (
        <>
          <span className="pro-stat">
            <span className="pro-stat-value">&#9733; {ratingValue.toFixed(1)}</span>
            <span className="pro-stat-label">{t("providerProfile.rating")}</span>
          </span>
          <span className="pro-stat-divider" aria-hidden="true" />
          <span className="pro-stat">
            <span className="pro-stat-value">{reviewCountValue}</span>
            <span className="pro-stat-label">{t("common.reviews")}</span>
          </span>
        </>
      ) : (
        <span className="pro-new-badge">{t("providerProfile.newOnTraze")}</span>
      )}
    </div>
  );
}
