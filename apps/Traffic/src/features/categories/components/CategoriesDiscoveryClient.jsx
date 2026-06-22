"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import { HomepageCategoryGrid } from "@/features/home/adapters/home.adapter";
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
      <section className="traze-hero-card traze-page-hero">
        <span className="traze-eyebrow">
          {t("directory.serviceDirectory")}
        </span>
        <h1 className="traze-hero-title">
          {t("directory.serviceCategories")}
        </h1>
        <p className="traze-hero-sub">{t("directory.categoriesIntro")}</p>
      </section>

      <TrazeSearchBar
        screenKey="categories"
        {...TRAZE_SCREEN_SEARCH.categories}
        quickFilters={categoryQuickFilters}
        query={query}
        initialFilter={activeFilter || null}
        locationOptions={locationOptions}
        countryOptions={countries}
        selectedCountry={selectedCountry ?? null}
        showCountrySelector
        showCitySelector={false}
        onSearch={handleSearch}
      />

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
    </>
  );
}
