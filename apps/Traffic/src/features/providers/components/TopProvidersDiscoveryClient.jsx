"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TrazeSearchBar from "@/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import HomepageTopProvidersSection from "@/features/home/components/HomepageTopProvidersSection";
import { stripLocaleFromPathname, withLocale } from "@/lib/i18n";
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

function writeUrlParams({ query, filter, location, country, countrySlug, router, lang }) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  if (query) params.set("query", query);
  else params.delete("query");

  if (filter) params.set("filter", filter);
  else params.delete("filter");

  if (location) params.set("location", location);
  else params.delete("location");

  if (country && !countrySlug) params.set("country", country);
  else params.delete("country");

  const queryString = params.toString();
  const path = countrySlug && stripLocaleFromPathname(window.location.pathname) === "/top-providers"
    ? withLocale(`/${countrySlug}/top-providers`, lang)
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

function providerSearchText(provider) {
  return [
    provider.name,
    provider.category,
    provider.categoryKey,
    provider.city,
    provider.stateCode,
    provider.primaryCityName,
    provider.primaryRegionCode,
    provider.primaryCountryCode,
    provider.locationText
  ]
    .filter(Boolean)
    .join(" ");
}

function hasProviderMatch(providers, predicate) {
  return providers.some(predicate);
}

function filterTopProviders(providers, { query, country, location, activeFilter }) {
  const normalizedQuery = normalizeSlug(query);
  const normalizedLocation = normalizeSlug(location);
  const normalizedCountry = String(country ?? "").trim().toUpperCase();

  let output = providers;

  if (normalizedQuery) {
    output = output.filter((provider) =>
      normalizeSlug(providerSearchText(provider)).includes(normalizedQuery)
    );
  }

  if (normalizedLocation) {
    output = output.filter((provider) =>
      normalizeSlug(provider.city ?? provider.primaryCityName ?? provider.locationText)
        .includes(normalizedLocation)
    );
  }

  if (normalizedCountry) {
    output = output.filter((provider) =>
      String(provider.primaryCountryCode ?? "").toUpperCase() === normalizedCountry
    );
  }

  if (activeFilter === "top_rated") {
    output = [...output].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
  }

  if (
    activeFilter === "with_reviews" &&
    hasProviderMatch(output, (provider) => Number(provider.reviewCount ?? 0) > 0)
  ) {
    output = output.filter((provider) => Number(provider.reviewCount ?? 0) > 0);
  }

  if (
    activeFilter === "with_phone" &&
    hasProviderMatch(output, (provider) => Boolean(provider.phone || provider.phoneNumber))
  ) {
    output = output.filter((provider) => Boolean(provider.phone || provider.phoneNumber));
  }

  if (
    activeFilter === "bookable" &&
    hasProviderMatch(output, (provider) => Boolean(provider.bookingUrl || provider.nextAvailableLabel))
  ) {
    output = output.filter((provider) => Boolean(provider.bookingUrl || provider.nextAvailableLabel));
  }

  return output;
}

export default function TopProvidersDiscoveryClient({
  providers = [],
  stats = [],
  claimHref = "/claim-profile",
  locationOptions = [],
  countryOptions = [],
  initialCountryCode = "",
  requireCountry = true
}) {
  const router = useRouter();
  const { lang, t } = useTrafficLanguage();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState(initialCountryCode);

  useEffect(() => {
    setQuery(readUrlParam("query"));
    setActiveFilter(readUrlParam("filter"));
    setLocation(readUrlParam("location"));

    const urlCountry = readUrlParam("country").toUpperCase();
    const storedCountry = readStoredTrazeLocation()?.countryCode ?? "";
    const nextCountry = initialCountryCode || urlCountry || storedCountry;
    if (nextCountry && countryOptions.some((item) => item.countryCode === nextCountry)) {
      setCountry(nextCountry);
    }
  }, [countryOptions, initialCountryCode]);

  useEffect(() => {
    function syncStoredLocation(event) {
      const countryCode = event?.detail?.countryCode ?? readStoredTrazeLocation()?.countryCode ?? "";
      if (countryCode && countryOptions.some((item) => item.countryCode === countryCode)) {
        setCountry(countryCode);
      }
    }

    window.addEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);
    return () => window.removeEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);
  }, [countryOptions]);

  const selectedCountry = countryOptions.find((item) => item.countryCode === country) ?? null;

  const filteredProviders = useMemo(
    () => {
      if (requireCountry && !country) return [];

      return filterTopProviders(providers, {
        query,
        country,
        location,
        activeFilter
      }).slice(0, 20);
    },
    [activeFilter, country, location, providers, query, requireCountry]
  );

  function handleSearch(payload) {
    const nextLocation = payload.location?.citySlug ?? "";
    const nextCountry = payload.location?.countryCode ?? "";
    const nextCountrySlug =
      payload.location?.countrySlug ??
      countryOptions.find((item) => item.countryCode === nextCountry)?.countrySlug ??
      "";

    setQuery(payload.query ?? "");
    setActiveFilter(payload.filter ?? "");
    setLocation(nextLocation);
    setCountry(nextCountry);
    writeUrlParams({
      query: payload.query ?? "",
      filter: payload.filter ?? "",
      location: nextLocation,
      country: nextCountry,
      countrySlug: nextCountrySlug,
      router,
      lang
    });
  }

  return (
    <>
      <section className="homepage-section homepage-directory-surface traze-page-hero">
        <div className="homepage-section-heading">
          <span className="pill homepage-eyebrow">
            {t("topProviders.eyebrow")}
          </span>
          <h1 className="section-title traze-page-hero-title">
            {t("topProviders.title")}
          </h1>
          <p className="homepage-hero-copy">{t("topProviders.subtitle")}</p>
        </div>

        <TrazeSearchBar
          screenKey="topProviders"
          {...TRAZE_SCREEN_SEARCH.topProviders}
          initialQuery={query}
          initialFilter={activeFilter || null}
          initialLocation={location ? { citySlug: location, countryCode: country || initialCountryCode || null } : null}
          locationOptions={locationOptions}
          countryOptions={countryOptions}
          selectedCountry={selectedCountry ?? (country || null)}
          showCountrySelector
          showCitySelector
          onSearch={handleSearch}
        />
      </section>

      <HomepageTopProvidersSection
        providers={filteredProviders}
        stats={stats}
        claimHref={claimHref}
        scopeLabel={selectedCountry?.name ?? (country || null)}
        requireCountry={requireCountry}
      />
    </>
  );
}
