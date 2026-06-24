"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import {
  TRAZE_QUICK_FILTER_LABELS,
  TRAZE_SCREEN_SEARCH
} from "@/config/trazeScreenSearch.config";
import { SERVICES } from "@/data/connectors/taxonomyDataset";
import { trackSearch } from "@/lib/analytics";
import { translate } from "@/i18n";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import {
  countryCityPath,
  countryCityServicePath,
  countryServiceHubPath
} from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";
import { findNearestLiveTrazeCity } from "@/lib/geo/reverseGeocode";
import {
  buildTrazeLocationKey,
  readStoredTrazeLocation,
  validateStoredTrazeLocation,
  writeDetectedTrazeLocation,
  writeStoredTrazeLocation
} from "@/lib/trazeLocationStorage";

const SERVICE_ALIASES = {
  lock: "locksmith",
  locks: "locksmith",
  lockout: "locksmith",
  keys: "locksmith",
  "key-service": "locksmith",
  barbers: "barber",
  barbershop: "barber",
  haircut: "barber",
  fade: "barber",
  food: "restaurant",
  dining: "restaurant",
  eat: "restaurant",
  gas: "gas-station",
  fuel: "gas-station",
  petrol: "gas-station",
  exchange: "money-exchange",
  forex: "money-exchange",
  "currency-exchange": "money-exchange"
};

const SERVICE_BY_SLUG = new Map(SERVICES.map((service) => [service.slug, service]));

function toTitleCase(value) {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function localized(value, lang, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? fallback;
}

function labelForQuickFilter(filter, lang) {
  const label = TRAZE_QUICK_FILTER_LABELS[filter];
  if (label) return localized(label, lang, toTitleCase(filter));
  return toTitleCase(filter);
}

function labelForServiceSlug(slug, lang) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return translate("search.serviceFallback", lang);

  const service = SERVICE_BY_SLUG.get(normalized);
  if (service) {
    return lang === "es" && service.nameEs ? service.nameEs : service.name;
  }

  return toTitleCase(normalized);
}

function mapServiceQuery(rawQuery) {
  const normalized = normalizeSlug(rawQuery);
  if (!normalized) return null;

  if (SERVICE_ALIASES[normalized]) return SERVICE_ALIASES[normalized];
  if (SERVICE_BY_SLUG.has(normalized)) return normalized;

  for (const service of SERVICES) {
    const candidates = [
      service.slug,
      service.name,
      service.nameEs,
      ...(service.searchTerms ?? []),
      ...(service.searchTermsEs ?? [])
    ]
      .filter(Boolean)
      .map((entry) => normalizeSlug(entry));

    if (
      candidates.some(
        (candidate) =>
          candidate === normalized ||
          normalized.includes(candidate) ||
          candidate.includes(normalized)
      )
    ) {
      return service.slug;
    }
  }

  return null;
}

// Stricter variant used for HERO ROUTING decisions: only treats the query as a
// known service when the WHOLE normalized query is exactly a service slug,
// alias, name, or search term. Multi-token queries ("restaurant san salvador",
// "locksmith laredo") and partials ("barb") return null → they fall through to
// the real /search engine instead of collapsing onto a single service page.
function mapServiceQueryExact(rawQuery) {
  const normalized = normalizeSlug(rawQuery);
  if (!normalized) return null;

  if (SERVICE_ALIASES[normalized]) return SERVICE_ALIASES[normalized];
  if (SERVICE_BY_SLUG.has(normalized)) return normalized;

  for (const service of SERVICES) {
    const exacts = [
      service.slug,
      service.name,
      service.nameEs,
      ...(service.searchTerms ?? []),
      ...(service.searchTermsEs ?? [])
    ]
      .filter(Boolean)
      .map((entry) => normalizeSlug(entry));

    if (exacts.includes(normalized)) return service.slug;
  }

  return null;
}

function normalizeCountryOption(option) {
  const countryCode = String(option?.countryCode ?? option?.country_code ?? "").trim().toUpperCase();
  const countrySlug = String(option?.countrySlug ?? option?.country_slug ?? "").trim();
  if (!countryCode || !countrySlug) return null;

  const name = option?.name ?? option?.countryName ?? option?.label ?? countryCode;

  return {
    countryCode,
    countrySlug,
    name,
    nameEs: option?.nameEs ?? option?.countryNameEs ?? option?.labelEs ?? name,
    label: option?.label ?? name
  };
}

function getCountryOptions(locationOptions, countryOptions = []) {
  const countries = new Map();

  for (const option of countryOptions) {
    const normalized = normalizeCountryOption(option);
    if (!normalized || countries.has(normalized.countryCode)) continue;
    countries.set(normalized.countryCode, normalized);
  }

  for (const option of locationOptions) {
    const normalized = normalizeCountryOption({
      countryCode: option.countryCode,
      countrySlug: option.countrySlug,
      name: option.countryName,
      nameEs: option.countryNameEs,
      label: option.countryName
    });
    if (!normalized || countries.has(normalized.countryCode)) continue;
    countries.set(normalized.countryCode, normalized);
  }

  return [...countries.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeCountrySelection(selectedCountry, countryOptions) {
  if (!selectedCountry) return null;

  if (typeof selectedCountry === "string") {
    const raw = selectedCountry.trim();
    const countryCode = raw.toUpperCase();
    return (
      countryOptions.find((country) => country.countryCode === countryCode) ??
      countryOptions.find((country) => country.countrySlug === normalizeSlug(raw)) ??
      null
    );
  }

  const normalized = normalizeCountryOption(selectedCountry);
  if (!normalized) return null;

  return (
    countryOptions.find((country) => country.countryCode === normalized.countryCode) ??
    normalized
  );
}

function searchCities(query, locationOptions, countryCode = null) {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];
  const normalizedCountry = String(countryCode ?? "").trim().toUpperCase();

  return locationOptions
    .filter((option) => {
      if (normalizedCountry && option.countryCode !== normalizedCountry) {
        return false;
      }

      const name = (option.name || "").toLowerCase();
      const nameEs = (option.nameEs || "").toLowerCase();
      const state = (option.stateCode || "").toLowerCase();
      const country = (option.countryCode || "").toLowerCase();
      const label = (option.label || "").toLowerCase();
      const labelEs = (option.labelEs || "").toLowerCase();

      return (
        name.startsWith(q) ||
        nameEs.startsWith(q) ||
        label.startsWith(q) ||
        labelEs.startsWith(q) ||
        `${name}, ${state}`.startsWith(q) ||
        state === q ||
        country === q
      );
    })
    .sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();

      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (!aName.startsWith(q) && bName.startsWith(q)) return 1;

      return aName.localeCompare(bName);
    })
    .slice(0, 7);
}

function normalizeInitialLocation(initialLocation, locationOptions) {
  if (!initialLocation) return null;

  if (typeof initialLocation === "string") {
    const normalized = normalizeSlug(initialLocation);
    const match = locationOptions.find(
      (option) =>
        normalizeSlug(option.citySlug) === normalized ||
        normalizeSlug(option.name) === normalized ||
        normalizeSlug(option.label) === normalized
    );

    return match ?? { label: initialLocation };
  }

  const citySlug = initialLocation.citySlug ?? initialLocation.slug ?? null;
  if (citySlug) {
    const countryCode = String(initialLocation.countryCode ?? "").trim().toUpperCase();
    const matches = locationOptions.filter((option) =>
      option.citySlug === citySlug &&
      (!countryCode || option.countryCode === countryCode)
    );
    const match = matches.length === 1 ? matches[0] : null;
    if (match) return match;
  }

  const label = initialLocation.label ?? initialLocation.name ?? "";
  return {
    ...initialLocation,
    citySlug,
    countrySlug: initialLocation.countrySlug ?? null,
    countryCode: initialLocation.countryCode ?? null,
    label
  };
}

function stripEmptySearchParams(params) {
  for (const key of [...params.keys()]) {
    if (!params.get(key)) params.delete(key);
  }

  return params;
}

function getCurrentSearchParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function readUrlParam(key) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

function variantClassName(variant) {
  if (variant === "topProviders") return "top-providers";
  return normalizeSlug(variant);
}

export default function TrazeSearchBar({
  screenKey = "home",
  variant,
  placeholder,
  locationPlaceholder,
  query: queryProp,
  selectedCountry = null,
  selectedCity = null,
  showLocation,
  showCountrySelector,
  showCitySelector,
  showUseLocation,
  showQuickFilters,
  quickFilters,
  submitMode,
  initialQuery = "",
  initialLocation = null,
  initialFilter = null,
  defaultLocation = null,
  locationOptions: locationOptionsProp = [],
  countryOptions: countryOptionsProp = [],
  liveServiceSlugs = [],
  onSearch
}) {
  const router = useRouter();
  const pathname = usePathname();
  const instanceId = useId();
  const { lang, t } = useTrafficLanguage();
  const localizePath = (path) => withLocale(path, lang);

  const screenConfig = TRAZE_SCREEN_SEARCH[screenKey] ?? {};
  const resolvedVariant = variant ?? screenConfig.variant ?? screenKey;
  const resolvedPlaceholder = localized(
    placeholder ?? screenConfig.placeholder,
    lang,
    t("search.defaultPlaceholder")
  );
  const screenShowLocation = showLocation ?? screenConfig.showLocation ?? false;
  const resolvedShowCountrySelector =
    showCountrySelector ?? screenConfig.showCountrySelector ?? screenShowLocation;
  const resolvedShowCitySelector =
    showCitySelector ?? screenConfig.showCitySelector ?? screenShowLocation;
  const resolvedShowLocation =
    screenShowLocation || resolvedShowCountrySelector || resolvedShowCitySelector;
  const resolvedShowUseLocation = showUseLocation ?? screenConfig.showUseLocation ?? false;
  const resolvedQuickFilters = quickFilters ?? screenConfig.quickFilters ?? [];
  const resolvedShowQuickFilters =
    showQuickFilters ?? screenConfig.showQuickFilters ?? resolvedQuickFilters.length > 0;
  const resolvedSubmitMode = submitMode ?? screenConfig.submitMode ?? "directorySearch";

  const locationOptions = useMemo(
    () => (Array.isArray(locationOptionsProp) ? locationOptionsProp : []),
    [locationOptionsProp]
  );

  const explicitCountryOptions = useMemo(
    () => (Array.isArray(countryOptionsProp) ? countryOptionsProp : []),
    [countryOptionsProp]
  );

  const countryOptions = useMemo(
    () => getCountryOptions(locationOptions, explicitCountryOptions),
    [explicitCountryOptions, locationOptions]
  );

  const optionMap = useMemo(
    () => new Map(
      locationOptions
        .map((option) => [buildTrazeLocationKey(option), option])
        .filter(([key]) => Boolean(key))
    ),
    [locationOptions]
  );

  const normalizedInitialLocation = useMemo(
    () => normalizeInitialLocation(selectedCity ?? initialLocation, locationOptions),
    [initialLocation, locationOptions, selectedCity]
  );
  const normalizedInitialCountry = useMemo(
    () => normalizeCountrySelection(selectedCountry, countryOptions),
    [countryOptions, selectedCountry]
  );
  const normalizedInitialCountryCode =
    normalizedInitialLocation?.countryCode ??
    normalizedInitialCountry?.countryCode ??
    countryOptions.find((country) => country.countrySlug === normalizedInitialLocation?.countrySlug)?.countryCode ??
    null;

  const [query, setQuery] = useState(queryProp ?? initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState(initialFilter ?? null);
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    normalizedInitialCountryCode
  );
  const [locationSlug, setLocationSlug] = useState(normalizedInitialLocation?.citySlug ?? null);
  const [locationObject, setLocationObject] = useState(normalizedInitialLocation ?? null);
  const [locationText, setLocationText] = useState(normalizedInitialLocation?.label ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [detectedLocation, setDetectedLocation] = useState(null);

  const locationInputRef = useRef(null);

  useEffect(() => {
    const nextQuery = queryProp ?? initialQuery ?? readUrlParam("query");
    setQuery(nextQuery ?? "");
  }, [initialQuery, queryProp]);

  useEffect(() => {
    const nextFilter = initialFilter || readUrlParam("filter");
    setActiveFilter(nextFilter ?? null);
  }, [initialFilter]);

  useEffect(() => {
    if (!resolvedShowLocation) return;

    if (normalizedInitialLocation) {
      setSelectedCountryCode(normalizedInitialCountryCode);
      setLocationSlug(normalizedInitialLocation.citySlug ?? null);
      setLocationObject({
        ...normalizedInitialLocation,
        countryCode: normalizedInitialCountryCode
      });
      setLocationText(normalizedInitialLocation.label ?? "");
      return;
    }

    if (normalizedInitialCountry) {
      setSelectedCountryCode(normalizedInitialCountry.countryCode);
      setLocationSlug(null);
      setLocationObject(normalizedInitialCountry);
      setLocationText("");
      return;
    }

    const stored = validateStoredTrazeLocation(readStoredTrazeLocation(), {
      countryOptions,
      locationOptions
    });
    if (!stored) {
      writeStoredTrazeLocation(null);
      return;
    }

    if (stored.citySlug) {
      setSelectedCountryCode(stored.countryCode ?? null);
      setLocationSlug(stored.citySlug);
      setLocationObject(stored);
      setLocationText(stored.label);
      setGeoStatus("restored");
      return;
    }

    if (stored.countryCode) {
      setSelectedCountryCode(stored.countryCode);
      setLocationSlug(null);
      setLocationObject(stored);
      setLocationText("");
      setGeoStatus("restored");
    }
  }, [
    countryOptions,
    locationOptions,
    normalizedInitialCountry,
    normalizedInitialCountryCode,
    normalizedInitialLocation,
    optionMap,
    resolvedShowLocation
  ]);

  const selectedCityKey = selectedCountryCode && locationSlug
    ? `${selectedCountryCode}:${locationSlug}`
    : null;
  const selectedLocation =
    (selectedCityKey ? optionMap.get(selectedCityKey) : null) ??
    locationObject ??
    defaultLocation ??
    (selectedCountryCode
      ? countryOptions.find((country) => country.countryCode === selectedCountryCode) ?? null
      : null) ??
    null;

  function resolveLocationFromText() {
    if (selectedLocation?.citySlug || selectedLocation?.countrySlug) {
      return selectedLocation;
    }

    const trimmedLocation = locationText.trim();
    if (trimmedLocation.length < 2) return selectedLocation;

    const matches = searchCities(trimmedLocation, locationOptions, selectedCountryCode);
    if (matches.length === 1) return matches[0];

    const exact = matches.find(
      (option) =>
        option.name.toLowerCase() === trimmedLocation.toLowerCase() ||
        option.label.toLowerCase() === trimmedLocation.toLowerCase()
    );

    return exact ?? selectedLocation;
  }

  function pushWithParams(nextParams) {
    const params = stripEmptySearchParams(nextParams);
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  // Hand a free-text query off to the real (noindex) search engine at /search,
  // carrying the active country/city as filters (TRAZE-SEARCH-004).
  function pushToSearch(rawQuery, location) {
    const params = new URLSearchParams();
    const q = String(rawQuery ?? "").trim();
    if (q) params.set("q", q);

    const countryCode = location?.countryCode ?? selectedCountryCode ?? null;
    if (countryCode) params.set("country", String(countryCode).toUpperCase());
    if (location?.citySlug) params.set("city", location.citySlug);

    const queryString = params.toString();
    router.push(queryString ? `${localizePath("/search")}?${queryString}` : localizePath("/search"));
  }

  function notifyOrRoute(payload) {
    if (onSearch) {
      onSearch(payload);
      return;
    }

    if (payload.submitMode === "directorySearch") {
      handleDirectorySearchSubmit(payload);
      return;
    }

    if (payload.submitMode === "filterDirectory") {
      handleDirectoryFilterSubmit(payload);
      return;
    }

    handleCurrentPageFilterSubmit(payload);
  }

  function handleDirectorySearchSubmit(payload) {
    const resolvedLocation = payload.location;

    // Exact match only: a clean single-service query routes to the SEO page;
    // anything else (partials, multi-token, unknown) goes to /search.
    const serviceSlug = mapServiceQueryExact(payload.query);
    const hasLiveService = Boolean(serviceSlug && liveServiceSlugs.includes(serviceSlug));
    const countrySlug = resolvedLocation?.countrySlug;
    const hasQuery = String(payload.query ?? "").trim().length > 0;

    trackSearch({
      query: payload.query,
      citySlug: resolvedLocation?.citySlug ?? null,
      serviceSlug: hasLiveService ? serviceSlug : null
    });

    // Recognized live service → route to the real, pre-built static SEO page
    // (unchanged behavior — the SEO directory architecture is preserved).
    if (hasLiveService && countrySlug) {
      router.push(
        localizePath(
          resolvedLocation?.citySlug
            ? countryCityServicePath(countrySlug, resolvedLocation.citySlug, serviceSlug)
            : countryServiceHubPath(countrySlug, serviceSlug)
        )
      );
      return;
    }

    // Any other query (unknown text, or a live service without a chosen country)
    // → hand off to the real /search engine (TRAZE-SEARCH-004). No more
    // "service not available" dead-end now that real search exists.
    if (hasQuery) {
      pushToSearch(payload.query, resolvedLocation);
      return;
    }

    // No query → navigate by location only.
    if (resolvedLocation?.citySlug && countrySlug) {
      router.push(localizePath(countryCityPath(countrySlug, resolvedLocation.citySlug)));
      return;
    }

    if (countrySlug) {
      router.push(localizePath(`/${countrySlug}`));
      return;
    }

    router.push(localizePath("/directory"));
  }

  function handleDirectoryFilterSubmit(payload) {
    const serviceSlug = mapServiceQueryExact(payload.query);
    const resolvedLocation = payload.location;
    const hasQuery = String(payload.query ?? "").trim().length > 0;

    if (serviceSlug && resolvedLocation?.citySlug && resolvedLocation?.countrySlug) {
      router.push(
        localizePath(countryCityServicePath(
          resolvedLocation.countrySlug,
          resolvedLocation.citySlug,
          serviceSlug
        ))
      );
      return;
    }

    if (serviceSlug && resolvedLocation?.countrySlug) {
      router.push(localizePath(countryServiceHubPath(resolvedLocation.countrySlug, serviceSlug)));
      return;
    }

    if (!payload.query && !payload.filter && resolvedLocation?.citySlug && resolvedLocation?.countrySlug) {
      router.push(localizePath(countryCityPath(resolvedLocation.countrySlug, resolvedLocation.citySlug)));
      return;
    }

    // Query typed but not a routable service → hand off to the real /search
    // engine instead of writing a ?query= the static page ignores (TRAZE-SEARCH-004).
    if (hasQuery && !serviceSlug) {
      pushToSearch(payload.query, resolvedLocation);
      return;
    }

    handleCurrentPageFilterSubmit(payload);
  }

  function handleCurrentPageFilterSubmit(payload) {
    const params = getCurrentSearchParams();

    if (payload.query) params.set("query", payload.query);
    else params.delete("query");

    if (payload.filter) params.set("filter", payload.filter);
    else params.delete("filter");

    if (payload.location?.citySlug) params.set("location", payload.location.citySlug);
    else params.delete("location");

    if (payload.location?.countryCode) params.set("country", payload.location.countryCode);
    else if (selectedCountryCode) params.set("country", selectedCountryCode);
    else params.delete("country");

    pushWithParams(params);
  }

  function runSearch(overrides = {}) {
    const nextQuery = String(overrides.query ?? query ?? "").trim();
    const nextFilter = overrides.filter === undefined ? activeFilter : overrides.filter;
    const resolvedLocation = resolvedShowLocation ? resolveLocationFromText() : null;

    notifyOrRoute({
      screenKey,
      variant: resolvedVariant,
      submitMode: resolvedSubmitMode,
      query: nextQuery,
      filter: nextFilter,
      location: resolvedLocation,
      locationText,
      serviceSlug: mapServiceQuery(nextQuery)
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    runSearch();
  }

  function handleLocationChange(event) {
    const value = event.target.value;
    setLocationText(value);
    setLocationSlug(null);
    setLocationObject(null);
    setActiveIndex(-1);

    const found = searchCities(value, locationOptions, selectedCountryCode);
    setSuggestions(found);
    setShowSuggestions(found.length > 0);
  }

  function handleLocationKeyDown(event) {
    if (!showSuggestions || !suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  function selectSuggestion(option) {
    setSelectedCountryCode(option.countryCode ?? null);
    setLocationSlug(option.citySlug);
    setLocationObject(option);
    setLocationText(option.label);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    writeStoredTrazeLocation(option);
    setGeoStatus("chosen");
  }

  function handleCountryChange(event) {
    const countryCode = event.target.value || null;
    const country = countryOptions.find((item) => item.countryCode === countryCode) ?? null;

    setSelectedCountryCode(countryCode);
    setLocationSlug(null);
    setLocationObject(country);
    setLocationText("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    writeStoredTrazeLocation(country);
    setGeoStatus(country ? "chosen" : "idle");

    if (onSearch) {
      onSearch({
        screenKey,
        variant: resolvedVariant,
        submitMode: resolvedSubmitMode,
        query: String(query ?? "").trim(),
        filter: activeFilter,
        location: country,
        locationText: "",
        serviceSlug: mapServiceQuery(query)
      });
    } else if (country?.countrySlug) {
      router.push(localizePath(`/${country.countrySlug}`));
    }
  }

  function handleLocationFocus() {
    if (suggestions.length > 0) setShowSuggestions(true);
  }

  function handleLocationBlur() {
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }, 160);
  }

  function clearLocation() {
    setLocationSlug(null);
    setLocationObject(null);
    setLocationText("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    writeStoredTrazeLocation(selectedCountryCode ? countryOptions.find((country) => country.countryCode === selectedCountryCode) : null);
    setGeoStatus("idle");
    locationInputRef.current?.focus();
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }

    // Clear stale displayed city immediately so the old value never persists
    setLocationText("");
    setLocationSlug(null);
    setLocationObject(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setGeoStatus("locating");

    async function onGpsSuccess(position) {
      const { latitude, longitude } = position.coords;

      try {
        const nearest = findNearestLiveTrazeCity(
          { lat: latitude, lng: longitude },
          locationOptions
        );

        writeDetectedTrazeLocation({
          lat: latitude,
          lng: longitude,
          countryCode: nearest?.countryCode ?? null,
          stateCode: nearest?.stateCode ?? null,
          cityName: nearest?.name ?? null,
          citySlug: nearest?.citySlug ?? null,
          distanceKm: nearest?.distanceKm ?? null,
          detectedAt: new Date().toISOString()
        });

        if (nearest) {
          const detected = {
            lat: latitude,
            lng: longitude,
            countryCode: nearest.countryCode ?? null,
            stateCode: nearest.stateCode ?? null,
            cityName: nearest.name ?? nearest.citySlug,
            citySlug: nearest.citySlug,
            distanceKm: nearest.distanceKm ?? null
          };

          setDetectedLocation(detected);
          setSelectedCountryCode(nearest.countryCode ?? null);
          setLocationSlug(nearest.citySlug);
          setLocationObject(nearest);
          setLocationText(nearest.label ?? nearest.citySlug);
          writeStoredTrazeLocation(nearest);
          setGeoStatus("located");
          return;
        }

        setDetectedLocation({ lat: latitude, lng: longitude });
        setGeoStatus("no-match");
      } catch {
        writeDetectedTrazeLocation({
          lat: latitude,
          lng: longitude,
          detectedAt: new Date().toISOString()
        });
        setDetectedLocation({ lat: latitude, lng: longitude });
        setGeoStatus("no-match");
      }
    }

    function onGpsError(err) {
      if (err?.code === 1) {
        setGeoStatus("denied");
      } else {
        setGeoStatus("unavailable");
      }
    }

    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, { timeout: 8000 });
  }

  function handleFilterClick(filter) {
    const nextFilter = activeFilter === filter ? null : filter;
    setActiveFilter(nextFilter);
    runSearch({ filter: nextFilter });
  }

  function clearCategoryFilters() {
    setQuery("");
    setActiveFilter(null);
    notifyOrRoute({
      screenKey,
      variant: resolvedVariant,
      submitMode: resolvedSubmitMode,
      query: "",
      filter: null,
      location: null,
      locationText: "",
      serviceSlug: null
    });
  }

  function geoButtonLabel() {
    if (geoStatus === "locating") {
      return t("search.detecting");
    }
    if (geoStatus === "located" && detectedLocation?.cityName) {
      const region = detectedLocation.stateCode ?? detectedLocation.countryCode ?? "";
      const label = region
        ? `${detectedLocation.cityName}, ${region}`
        : detectedLocation.cityName;
      return t("search.usingLocation", { place: label });
    }
    return t("search.useMyLocation");
  }

  function locationHint() {
    if (geoStatus === "unsupported-city" && detectedLocation) {
      const city = detectedLocation.cityName ?? "";
      const region = detectedLocation.stateCode ?? detectedLocation.countryCode ?? "";
      const where = region ? `${city}, ${region}` : city;
      return t("search.unsupportedCity", { place: where });
    }

    if (geoStatus === "unsupported-country" && detectedLocation) {
      const country = detectedLocation.countryCode ?? "";
      return t("search.unsupportedCountry", { country });
    }

    if (geoStatus === "no-geocode") {
      return t("search.noGeocode");
    }

    if (geoStatus === "country-only") {
      return t("search.countryOnly");
    }

    if (geoStatus === "no-match") {
      return t("search.noMatch");
    }

    if (geoStatus === "denied") {
      return t("search.denied");
    }

    if (geoStatus === "unavailable") {
      return t("search.unavailable");
    }

    return null;
  }

  const isLocating = geoStatus === "locating";
  const hint = locationHint();
  const suggestionId = `${instanceId}-city-suggestions`;
  const isHero = resolvedVariant === "hero";
  const shouldRenderLocationRow =
    resolvedShowLocation &&
    ((resolvedShowCountrySelector && countryOptions.length > 0) || resolvedShowCitySelector);

  return (
    <div className={`traze-search traze-search--${variantClassName(resolvedVariant)}`}>
      <form className="traze-search__form" onSubmit={handleSubmit}>
        <div className="traze-search__main">
          <div className="traze-search__input-wrap">
            <Search size={isHero ? 17 : 15} className="traze-search__icon" aria-hidden="true" />
            <input
              aria-label={resolvedPlaceholder}
              className="traze-search__input"
              placeholder={resolvedPlaceholder}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <button className="traze-search__button" type="submit">
            {t("common.search")}
          </button>
        </div>

        {shouldRenderLocationRow && (
          <div className="traze-search__location">
            {resolvedShowCountrySelector && countryOptions.length > 0 && (
              <label className="traze-search__country-wrap">
                <select
                  className="traze-search__country-select"
                  value={selectedCountryCode ?? ""}
                  onChange={handleCountryChange}
                  aria-label={t("common.selectCountry")}
                >
                  <option value="">
                    {t("common.selectCountry")}
                  </option>
                  {countryOptions.map((country) => (
                    <option key={country.countryCode} value={country.countryCode}>
                      {lang === "es" && country.nameEs ? country.nameEs : country.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {resolvedShowCitySelector && (
            <div className="traze-search__location-input-wrap">
              <MapPin size={14} className="traze-search__location-icon" aria-hidden="true" />
              <input
                ref={locationInputRef}
                type="text"
                className="traze-search__location-input"
                placeholder={
                  localized(
                    locationPlaceholder,
                    lang,
                    t("common.cityStateCountry")
                  )
                }
                value={locationText}
                onChange={handleLocationChange}
                onKeyDown={handleLocationKeyDown}
                onFocus={handleLocationFocus}
                onBlur={handleLocationBlur}
                autoComplete="off"
                spellCheck={false}
                aria-label={t("common.enterCity")}
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-controls={suggestionId}
                aria-activedescendant={
                  activeIndex >= 0 ? `${suggestionId}-item-${activeIndex}` : undefined
                }
                role="combobox"
              />

              {locationText && (
                <button
                  type="button"
                  className="traze-search__location-clear"
                  onClick={clearLocation}
                  tabIndex={-1}
                  aria-label={t("common.clearLocation")}
                >
                  <X size={13} />
                </button>
              )}

              {showSuggestions && suggestions.length > 0 && (
                <ul
                  className="traze-search__suggestions"
                  id={suggestionId}
                  role="listbox"
                  aria-label={t("common.availableCities")}
                >
                  {suggestions.map((option, index) => (
                    <li
                      key={`${option.countryCode}-${option.citySlug}`}
                      id={`${suggestionId}-item-${index}`}
                      className={`traze-search__suggestion${
                        index === activeIndex ? " traze-search__suggestion--active" : ""
                      }`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectSuggestion(option);
                      }}
                    >
                      <MapPin size={11} className="traze-search__suggestion-icon" aria-hidden="true" />
                      <span className="traze-search__suggestion-name">{option.name}</span>
                      {(option.stateCode || option.countryCode) && (
                        <span className="traze-search__suggestion-meta">
                          {[option.stateCode, option.countryCode].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            )}

            {resolvedShowCitySelector && resolvedShowUseLocation && (
              <button
                type="button"
                className="traze-search__use-location"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                aria-label={t("search.detectCurrentLocation")}
              >
                <LocateFixed size={13} aria-hidden="true" />
                {geoButtonLabel()}
              </button>
            )}
          </div>
        )}

        {hint && (
          <p className="traze-search__hint traze-search__hint--warn" role="status">
            {hint}
          </p>
        )}

        {!hint && (geoStatus === "chosen" || geoStatus === "located") && (selectedLocation?.label || detectedLocation?.cityName) && (
          <p className="traze-search__hint">
            {t("search.showingResultsFor", { place: selectedLocation.label })}{" "}
            {resolvedShowUseLocation && (
              <button type="button" className="traze-search__hint-button" onClick={handleUseMyLocation}>
                {t("search.notYourLocation")}
              </button>
            )}
          </p>
        )}

        {resolvedShowQuickFilters && resolvedQuickFilters.length > 0 && (
          <div className="traze-search__filters" aria-label={t("search.quickFilters")}>
            {resolvedQuickFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`traze-search__filter${activeFilter === filter ? " traze-search__filter--active" : ""}`}
                onClick={() => handleFilterClick(filter)}
                aria-pressed={activeFilter === filter}
              >
                {labelForQuickFilter(filter, lang)}
              </button>
            ))}

            {resolvedVariant === "categories" && (query || activeFilter) && (
              <button
                type="button"
                className="traze-search__filter traze-search__filter--clear"
                onClick={clearCategoryFilters}
              >
                {t("search.browseAllCategories")}
              </button>
            )}
          </div>
        )}
      </form>

      {resolvedVariant === "categories" && activeFilter && (
        <p className="traze-search__context">
          {t("search.browsingFilter", { filter: labelForQuickFilter(activeFilter, lang) })}
        </p>
      )}

      {resolvedVariant === "directory" && query && (
        <p className="traze-search__context">
          {t("search.searchDirectory", { query })}
        </p>
      )}

      {resolvedVariant === "topProviders" && query && (
        <p className="traze-search__context">
          {t("search.filteringTopProviders", { query })}
        </p>
      )}
    </div>
  );
}

export { labelForServiceSlug, mapServiceQuery };
