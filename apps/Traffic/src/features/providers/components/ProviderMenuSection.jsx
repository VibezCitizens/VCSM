"use client";

import { useTrafficLanguage } from "@/lib/language";
import { SafeImage } from "@/shared/components/SafeImage";

function formatCents(cents, currencyCode) {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode ?? "USD", maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

export function ProviderMenuSection({ menuCategories }) {
  const { t } = useTrafficLanguage();

  if (!menuCategories?.length) return null;
  const preview = menuCategories.slice(0, 2);

  return (
    <section className="card card--subtle pro-menu" aria-label="Menu">
      <h2 className="pro-section-title">{t("providerProfile.menu")}</h2>
      {preview.map((cat) => (
        <div key={cat.key} className="pro-menu-category">
          <p className="pro-menu-category-name">{cat.name}</p>
          <ul className="pro-menu-items">
            {cat.items.slice(0, 4).map((item) => (
              <li key={item.key ?? item.name} className="pro-menu-item">
                <SafeImage className="pro-menu-item-img" src={item.imageUrl} alt={item.name} loading="lazy" />
                <div className="pro-menu-item-info">
                  <span className="pro-menu-item-name">{item.name}</span>
                  {item.description ? <span className="pro-menu-item-desc">{item.description}</span> : null}
                  {item.priceCents != null ? (
                    <span className="pro-menu-item-price">{formatCents(item.priceCents, item.currencyCode)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
