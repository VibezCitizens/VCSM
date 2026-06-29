"use client";

import { useTrafficLanguage } from "@/lib/language";
import { countryCityServicePath, countryServiceHubPath } from "@/lib/paths";
import { getServiceBySlug } from "@/data/repositories/service.repo";
import { isCountryServiceIndexable } from "@/seo/qualityGuards";
import TrazeCategoryCard from "@/shared/components/TrazeCategoryCard";

function getCategoryLabel(cat, lang) {
  return lang === "es" && cat.categoryLabelEs
    ? cat.categoryLabelEs
    : cat.categoryLabel;
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
  const routeKey = getCategoryRouteKey(cat);
  const service = routeKey ? getServiceBySlug(routeKey) : null;

  // The filtered categories view lists a category's providers, so any category
  // without a live country-service hub — an unmapped/uncategorized bucket
  // (e.g. "other") or a thin service below the hub gate — links to that filter
  // view (country-scoped when a country is selected) instead of a phantom hub.
  // The filter key matches CategoriesDiscoveryClient's category resolution:
  // taxonomy slug for mapped services, raw category key otherwise.
  const filterKey = service ? service.slug : (cat.categoryKey || routeKey || "");
  const filterBase = defaultCountrySlug ? `/${defaultCountrySlug}/categories` : "/categories";
  const filterHref = `${filterBase}?filter=${encodeURIComponent(filterKey)}`;

  if (!service || !defaultCountrySlug) return filterHref;

  if (defaultCitySlug) {
    return countryCityServicePath(defaultCountrySlug, defaultCitySlug, service.slug);
  }

  // The country-service hub only exists when it clears the SAME gate static
  // generation uses (>=3 providers across >=2 cities, isCountryServiceIndexable).
  // Below that the hub page is never exported, so linking it 404s.
  if (isCountryServiceIndexable(cat.providerCount, cat.cityCount)) {
    return countryServiceHubPath(defaultCountrySlug, service.slug);
  }
  return filterHref;
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
            const catLabel = getCategoryLabel(cat, lang);
            const href     = getCategoryHref(cat, defaultCountrySlug, defaultCitySlug);
            // A live category with no safe destination (unmapped / "other")
            // renders via the inactive, non-clickable tile path rather than a
            // dead link.
            const clickable = cat.isLive === true && Boolean(href);

            return (
              <TrazeCategoryCard
                key={cat.categoryKey}
                categoryKey={cat.categoryKey}
                label={catLabel}
                isLive={clickable}
                href={href ?? ""}
                lang={lang}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
