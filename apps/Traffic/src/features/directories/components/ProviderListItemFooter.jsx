"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export function ProviderListItemFooter({ href, rank, reviewCount, responseTime, serviceCount }) {
  const { t } = useTrafficLanguage();

  const reviewLabel =
    reviewCount <= 0
      ? null
      : reviewCount === 1
        ? `1 ${t("common.review")}`
        : `${reviewCount} ${t("common.reviews").toLowerCase()}`;

  const responseLabel = responseTime
    ? t("directory.repliesIn", { time: responseTime })
    : null;

  const serviceLabel =
    serviceCount > 0
      ? `${serviceCount} ${t("common.services")}`
      : null;

  const viewProfileLabel = t("providerCard.viewProfile");

  return (
    <div className="dir-card-actions">
      {rank != null && <span className="dir-card-rank">#{rank}</span>}
      <div className="dir-card-stats-footer">
        {reviewLabel && <span className="dir-card-stat">{reviewLabel}</span>}
        {responseLabel && (
          <>
            <span className="dir-card-stat-divider">·</span>
            <span className="dir-card-stat">{responseLabel}</span>
          </>
        )}
        {serviceLabel && (
          <>
            <span className="dir-card-stat-divider">·</span>
            <span className="dir-card-stat">{serviceLabel}</span>
          </>
        )}
      </div>
      <Link className="dir-card-cta" href={href}>{viewProfileLabel}</Link>
    </div>
  );
}
