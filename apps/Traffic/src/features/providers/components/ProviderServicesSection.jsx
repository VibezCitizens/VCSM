"use client";

import { useTrafficLanguage } from "@/lib/language";

function formatCents(cents, currencyCode) {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode ?? "USD", maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export function ProviderServicesSection({ liveServices }) {
  const { t } = useTrafficLanguage();

  if (!liveServices?.length) return null;

  return (
    <section
      className="card card--subtle pro-services"
      aria-label={t("providerProfile.servicesOffered")}
    >
      <h2 className="pro-section-title">{t("providerProfile.services")}</h2>
      <ul className="pro-services-list">
        {liveServices.map((svc) => (
          <li key={svc.key ?? svc.id} className="pro-service-row">
            <span className="pro-service-name">{svc.label}</span>
            {svc.booking ? (
              <span className="pro-service-meta">
                {svc.booking.price_cents != null
                  ? <span className="pro-service-price">{formatCents(svc.booking.price_cents, svc.booking.currency_code)}</span>
                  : null}
                {svc.booking.duration_minutes != null
                  ? <span className="pro-service-duration">{svc.booking.duration_minutes} min</span>
                  : null}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
