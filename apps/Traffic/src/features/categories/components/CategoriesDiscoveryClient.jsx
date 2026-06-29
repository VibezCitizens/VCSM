"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import TrazeHeroMap from "@/shared/components/TrazeHeroMap";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import { HomepageCategoryGrid } from "@/features/home/adapters/home.adapter";
import HomepageProviderCard from "@/features/home/components/HomepageProviderCard";
import { findLiveCountryByCode, getBrowserCountryCode } from "@/lib/geo/clientMarket";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { normalizeSlug } from "@/lib/slugs";
import {
  readStoredTrazeLocation,
  TRAZE_LOCATION_CHANGE_EVENT
} from "@/lib/trazeLocationStorage";

function readUrlParam(key) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

function writeUrlParams({ query, filter, countryCode, countrySlug, preferCountryRoute, router, lang }) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  if (query) params.set("query", query);
  else params.delete("query");

  if (filter) params.set("filter", filter);
  else params.delete("filter");

  if (countryCode && !preferCountryRoute) params.set("country", countryCode);
  else params.delete("country");

  const queryString = params.toString();
  const path = preferCountryRoute && countrySlug
    ? withLocale(`/${countrySlug}/categories`, lang)
    : window.location.pathname;
  const nextUrl = queryString
    ? `${path}?${queryString}`
    : path;

  if (path !== window.location.pathname && router?.push) {
    router.push(nextUrl);
    return;
  }

  window.history.pushState({}, "", nextUrl);
}

function buildCategorySearchText(category) {
  const serviceText = (category.services ?? [])
    .flatMap((service) => [
      service.serviceKey,
      service.serviceLabel,
      service.serviceLabelEs,
      service.serviceDescription,
      service.serviceGroup
    ])
    .filter(Boolean)
    .join(" ");

  return [
    category.categoryKey,
    category.categoryLabel,
    category.categoryLabelEs,
    category.categoryDescription,
    category.categoryDescriptionEs,
    serviceText
  ]
    .filter(Boolean)
    .join(" ");
}

function filterCategories(categories, query, activeFilter) {
  const normalizedQuery = normalizeSlug(query);
  const normalizedFilter = normalizeSlug(activeFilter);
  const needle = normalizedQuery || normalizedFilter;

  if (!needle) return categories;

  return categories.filter((category) =>
    normalizeSlug(buildCategorySearchText(category)).includes(needle)
  );
}

function readInitialCountryCode(countries) {
  const urlCountry = readUrlParam("country").toUpperCase();
  if (urlCountry && countries.some((country) => country.countryCode === urlCountry)) {
    return urlCountry;
  }

  const stored = readStoredTrazeLocation();
  if (stored?.countryCode && countries.some((country) => country.countryCode === stored.countryCode)) {
    return stored.countryCode;
  }

  const browserCountry = findLiveCountryByCode(getBrowserCountryCode(), countries);
  if (browserCountry) {
    return browserCountry.countryCode;
  }

  return "";
}

export default function CategoriesDiscoveryClient({
  countries = [],
  categoriesByCountryCode = {},
  providersByCountryCode = {},
  locationOptions = [],
  initialCountryCode = "",
  preferCountryRoute = false
}) {
  const router = useRouter();
  const { lang, t } = useTrafficLanguage();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountryCode);

  const selectedCountry = countries.find((country) => country.countryCode === selectedCountryCode) ?? null;
  const categories = selectedCountryCode
    ? (categoriesByCountryCode[selectedCountryCode] ?? [])
    : [];
  const providers = selectedCountryCode
    ? (providersByCountryCode[selectedCountryCode] ?? [])
    : [];

  useEffect(() => {
    setQuery(readUrlParam("query"));
    setActiveFilter(readUrlParam("filter"));

    const initial = initialCountryCode || readInitialCountryCode(countries);
    if (initial && countries.some((country) => country.countryCode === initial)) {
      setSelectedCountryCode(initial);
    }
  }, [countries, initialCountryCode]);

  useEffect(() => {
    function syncStoredLocation(event) {
      const countryCode = event?.detail?.countryCode ?? readStoredTrazeLocation()?.countryCode ?? "";
      if (countryCode && countries.some((country) => country.countryCode === countryCode)) {
        setSelectedCountryCode(countryCode);
      }
    }

    window.addEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);
    return () => window.removeEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);
  }, [countries]);

  const categoryQuickFilters = useMemo(
    () =>
      categories
        .filter((category) => category?.categoryKey)
        .sort((a, b) => {
          if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
          if (a.sortOrder !== b.sortOrder) {
            return Number(a.sortOrder ?? 999) - Number(b.sortOrder ?? 999);
          }
          return String(a.categoryLabel ?? a.categoryKey).localeCompare(
            String(b.categoryLabel ?? b.categoryKey)
          );
        })
        .slice(0, 6)
        .map((category) => category.categoryKey),
    [categories]
  );

  const filteredCategories = useMemo(
    () => filterCategories(categories, query, activeFilter),
    [categories, query, activeFilter]
  );

  // When a single category is selected (via a card click → ?filter=<key>), the
  // view lists that category's providers instead of looping the card back to
  // itself. Recognized services match by category key OR service key; unmapped
  // buckets (e.g. "other") match providers whose bucketKey collapsed to "other".
  const activeCategory = useMemo(() => {
    const needle = normalizeSlug(activeFilter);
    if (!needle) return null;
    return (
      categories.find((category) => normalizeSlug(category.categoryKey) === needle) ??
      categories.find((category) =>
        (category.services ?? []).some((service) => normalizeSlug(service.serviceKey) === needle)
      ) ??
      null
    );
  }, [categories, activeFilter]);

  const activeProviders = useMemo(() => {
    if (!activeCategory) return [];
    return providers.filter((provider) => provider.bucketKey === activeCategory.categoryKey);
  }, [providers, activeCategory]);

  const activeCategoryLabel = activeCategory
    ? (lang === "es" && activeCategory.categoryLabelEs
        ? activeCategory.categoryLabelEs
        : activeCategory.categoryLabel)
    : "";

  function clearFilter() {
    setQuery("");
    setActiveFilter("");
    writeUrlParams({
      query: "",
      filter: "",
      countryCode: selectedCountryCode,
      countrySlug: selectedCountry?.countrySlug,
      preferCountryRoute,
      router,
      lang
    });
  }

  function handleSearch(payload) {
    const nextCountry = payload.location?.countryCode ?? selectedCountryCode;
    const country = countries.find((item) => item.countryCode === nextCountry) ?? null;

    setQuery(payload.query ?? "");
    setActiveFilter(payload.filter ?? "");
    setSelectedCountryCode(nextCountry ?? "");
    writeUrlParams({
      query: payload.query ?? "",
      filter: payload.filter ?? "",
      countryCode: nextCountry,
      countrySlug: country?.countrySlug,
      preferCountryRoute,
      router,
      lang
    });
  }

  const emptyQuery = query || activeFilter;

  return (
    <>
      <section className="homepage-hero">
        <div className="homepage-hero-layout">
          <div className="homepage-hero-content">
            <h1 className="homepage-hero-title">
              {t("directory.serviceCategories")}
            </h1>
            <p className="homepage-hero-copy">{t("directory.categoriesIntro")}</p>

            <TrazeSearchBar
              screenKey="home"
              {...TRAZE_SCREEN_SEARCH.home}
              quickFilters={categoryQuickFilters}
              query={query}
              initialFilter={activeFilter || null}
              locationOptions={locationOptions}
              countryOptions={countries}
              selectedCountry={selectedCountry ?? null}
              showCountrySelector
              showCitySelector
              onSearch={handleSearch}
              locationPlaceholder={{
                en: "City, state, or country",
                es: "Ciudad, estado o pais"
              }}
            />
          </div>

          <div className="homepage-hero-visual" aria-hidden="true">
            <TrazeHeroMap />
          </div>
        </div>
      </section>

      {selectedCountryCode && activeCategory ? (
        <section className="homepage-section homepage-section--divider homepage-directory-surface-soft traze-page-card">
          <div className="homepage-section-heading">
            <h2 className="section-title">
              {activeCategoryLabel}
              {selectedCountry?.name ? ` · ${selectedCountry.name}` : ""}
            </h2>
            <p>
              <button type="button" className="traze-section-link" onClick={clearFilter}>
                {t("directory.serviceCategories")}
              </button>
            </p>
          </div>

          {activeProviders.length > 0 ? (
            <div className="ch-featured-grid">
              {activeProviders.map((provider) => (
                <HomepageProviderCard key={provider.id} provider={provider} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="homepage-empty-state">
              <h3 className="homepage-card-title">{t("homepage.noLiveCategories")}</h3>
              <p className="homepage-meta-note">{t("homepage.categoriesPending")}</p>
            </div>
          )}
        </section>
      ) : (
        <HomepageCategoryGrid
          categories={filteredCategories}
          defaultCountrySlug={selectedCountry?.countrySlug ?? ""}
          defaultCitySlug={null}
          showHeading={false}
          showEmptyState
          emptyQuery={selectedCountryCode ? emptyQuery : ""}
          emptyTitle={
            selectedCountryCode
              ? null
              : t("directory.selectCountryTitle")
          }
          emptyDescription={
            selectedCountryCode
              ? null
              : t("directory.selectCountryDescription")
          }
        />
      )}
    </>
  );
}
