"use client";

import { useTrafficLanguage } from "@/lib/language";

export function ProviderGallerySection({ portfolio }) {
  const { t } = useTrafficLanguage();

  if (!portfolio?.length) return null;

  return (
    <section
      className="card card--subtle pro-gallery"
      aria-label={t("providerProfile.galleryAria")}
    >
      <h2 className="pro-section-title">{t("providerProfile.gallery")}</h2>
      <div className="pro-gallery-grid">
        {portfolio.slice(0, 9).map((item) => (
          <div key={item.portfolioItemId} className="pro-gallery-item">
            <img
              className="pro-gallery-img"
              src={item.mediaUrl}
              alt={item.altText ?? item.title ?? t("providerProfile.portfolioImage")}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
