"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export function ProviderListItemFooter({ href, rank, reviewCount, responseTime, serviceCount }) {
  const { lang } = useTrafficLanguage();

  const reviewLabel =
    reviewCount <= 0
      ? null
      : reviewCount === 1
        ? (lang === "es" ? "1 reseña" : "1 review")
        : (lang === "es" ? `${reviewCount} reseñas` : `${reviewCount} reviews`);

  const responseLabel = responseTime
    ? (lang === "es" ? `Responde en ${responseTime}` : `Replies in ${responseTime}`)
    : null;

  const serviceLabel =
    serviceCount > 0
      ? (lang === "es" ? `${serviceCount} servicios` : `${serviceCount} services`)
      : null;

  const viewProfileLabel = lang === "es" ? "Ver perfil" : "View profile";

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
