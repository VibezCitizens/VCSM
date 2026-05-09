"use client";

import { useTrafficLanguage } from "@/lib/language";
import { countryCityServicePath, countryServiceHubPath } from "@/lib/paths";
import TrazeCategoryCard from "@/shared/components/TrazeCategoryCard";

function getCategoryLabel(cat, lang) {
  return lang === "es" && cat.categoryLabelEs
    ? cat.categoryLabelEs
    : cat.categoryLabel;
}

function getCategoryDescription(cat, lang) {
  return lang === "es" && cat.categoryDescriptionEs
    ? cat.categoryDescriptionEs
    : (cat.categoryDescription ?? "");
}

function getCategoryRouteKey(cat) {
  const services = Array.isArray(cat.services) ? cat.services : [];
  const liveService =
    services.find((service) => Number(service.providerCount ?? 0) > 0) ??
    services[0] ??
    null;

  const serviceKey = String(liveService?.serviceKey ?? "").trim();
  if (serviceKey) return serviceKey;

  return String(cat?.categoryKey ?? "").trim();
}

function getCategoryHref(cat, defaultCountrySlug, defaultCitySlug) {
  const serviceSlug = getCategoryRouteKey(cat);
  if (!serviceSlug) return `/categories?filter=${encodeURIComponent(cat.categoryKey)}`;
  if (!defaultCountrySlug) return `/categories?filter=${encodeURIComponent(serviceSlug)}`;

  if (defaultCitySlug) {
    return countryCityServicePath(defaultCountrySlug, defaultCitySlug, serviceSlug);
  }

  return countryServiceHubPath(defaultCountrySlug, serviceSlug);
}

/**
 * HomepageCategoryGrid
 *
 * Renders live Traze service categories from server data. Cards appear only
 * when at least one public provider exists for the category/service.
 */
export default function HomepageCategoryGrid({
  categories = [],
  defaultCountrySlug = "",
  defaultCitySlug = null,
  showHeading = true,
  showInactiveCategories = false,
  showEmptyState = false,
  emptyQuery = "",
  emptyTitle = null,
  emptyDescription = null
}) {
  const { lang, t } = useTrafficLanguage();

  const allCategories = Array.isArray(categories) ? categories : [];
  const visibleCategories = showInactiveCategories
    ? allCategories
    : allCategories.filter((cat) => cat.isLive === true);

  if (!visibleCategories.length && !showEmptyState) {
    return null;
  }

  return (
    <section
      className="homepage-section homepage-section--divider homepage-directory-surface-soft traze-page-card"
      id="categories"
    >
      {showHeading && (
        <div className="homepage-section-heading">
          <h2 className="section-title">
            {t("homepage.browseByCategory")}
          </h2>
          <p>{t("homepage.categoryBody")}</p>
        </div>
      )}

      {visibleCategories.length === 0 ? (
        <div className="homepage-empty-state">
          <h3 className="homepage-card-title">
            {emptyTitle ??
            (emptyQuery
              ? t("homepage.noCategoriesFound")
              : t("homepage.noLiveCategories"))}
          </h3>
          <p className="homepage-meta-note">
            {emptyDescription ??
            (emptyQuery
              ? t("homepage.noCategoriesMatch", { query: emptyQuery })
              : t("homepage.categoriesPending"))}
          </p>
        </div>
      ) : (
        <div className="hp-cat-grid">
          {visibleCategories.map((cat) => {
            const catLabel       = getCategoryLabel(cat, lang);
            const catDescription = getCategoryDescription(cat, lang);
            const isLive         = cat.isLive === true;
            const href           = getCategoryHref(cat, defaultCountrySlug, defaultCitySlug);
            const distinctPills  = Array.isArray(cat.services)
              ? cat.services
                  .slice(0, 4)
                  .map((svc) => (lang === "es" && svc.serviceLabelEs ? svc.serviceLabelEs : svc.serviceLabel))
                  .filter((label) => label && label.toLowerCase() !== catLabel.toLowerCase())
              : [];

            return (
              <TrazeCategoryCard
                key={cat.categoryKey}
                categoryKey={cat.categoryKey}
                label={catLabel}
                description={catDescription}
                isLive={isLive}
                href={href}
                pills={distinctPills}
                lang={lang}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
