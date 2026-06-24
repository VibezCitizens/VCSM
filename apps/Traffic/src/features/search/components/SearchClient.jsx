"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";
import TrazeProviderCard from "@/shared/components/TrazeProviderCard";
import { useTrafficLanguage } from "@/lib/language";
import { withLocale } from "@/lib/i18n";
import { trackSearch } from "@/lib/analytics";
import { searchPublicProviders } from "@/features/search/dal/searchProviders.read.dal";
import { searchRowToCard } from "@/features/search/lib/searchResultCard";

const PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 80;
const MIN_AUTOCOMPLETE = 2;
const DEBOUNCE_MS = 260;

function readParam(key) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

function filterCities(text, locationOptions, countryCode) {
  const q = String(text ?? "").toLowerCase().trim();
  if (q.length < MIN_AUTOCOMPLETE) return [];
  const country = String(countryCode ?? "").trim().toUpperCase();

  return locationOptions
    .filter((option) => {
      if (country && option.countryCode !== country) return false;
      const name = (option.name || "").toLowerCase();
      const nameEs = (option.nameEs || "").toLowerCase();
      return name.startsWith(q) || nameEs.startsWith(q);
    })
    .slice(0, 6);
}

export default function SearchClient({ countryOptions = [], locationOptions = [] }) {
  const router = useRouter();
  const { lang, t } = useTrafficLanguage();

  const [query, setQuery] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [cityText, setCityText] = useState("");
  const [citySlug, setCitySlug] = useState("");

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  // "idle" | "loading" | "loadingMore" | "loaded" | "error"
  const [status, setStatus] = useState("idle");

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Latest committed search criteria, used by load-more and to ignore stale
  // responses when the user changes the query mid-flight.
  const criteriaRef = useRef({ query: "", countryCode: "", citySlug: "" });
  const requestIdRef = useRef(0);

  const updateUrl = useCallback((next) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (next.query) params.set("q", next.query);
    if (next.countryCode) params.set("country", next.countryCode);
    if (next.citySlug) params.set("city", next.citySlug);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  const runSearch = useCallback(
    async (criteria, nextPage) => {
      const hasCriteria = Boolean(criteria.query || criteria.countryCode || criteria.citySlug);
      if (!hasCriteria) {
        setResults([]);
        setTotal(0);
        setPage(0);
        setStatus("idle");
        return;
      }

      const append = nextPage > 0;
      const requestId = ++requestIdRef.current;
      setStatus(append ? "loadingMore" : "loading");

      const { data, total: totalCount, error } = await searchPublicProviders({
        query: criteria.query,
        countryCode: criteria.countryCode || null,
        citySlug: criteria.citySlug || null,
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE
      });

      // Drop stale responses (a newer search started after this one).
      if (requestId !== requestIdRef.current) return;

      if (error) {
        setStatus("error");
        return;
      }

      const cards = data.map((row) => searchRowToCard(row, countryOptions)).filter(Boolean);
      setResults((prev) => (append ? [...prev, ...cards] : cards));
      setTotal(totalCount);
      setPage(nextPage);
      setStatus("loaded");
    },
    [countryOptions]
  );

  const commitSearch = useCallback(
    (overrides = {}) => {
      const criteria = {
        query: (overrides.query ?? query).trim().slice(0, MAX_QUERY_LENGTH),
        countryCode: overrides.countryCode ?? countryCode,
        citySlug: overrides.citySlug ?? citySlug
      };
      criteriaRef.current = criteria;
      setShowCitySuggestions(false);
      updateUrl(criteria);
      if (criteria.query) {
        trackSearch({ query: criteria.query, citySlug: criteria.citySlug || null, serviceSlug: null });
      }
      runSearch(criteria, 0);
    },
    [citySlug, countryCode, query, runSearch, updateUrl]
  );

  // Initial load: hydrate state from the URL and run the first search.
  useEffect(() => {
    const initialQuery = readParam("q").slice(0, MAX_QUERY_LENGTH);
    const initialCountry = readParam("country").toUpperCase();
    const initialCity = readParam("city").toLowerCase();

    setQuery(initialQuery);
    setCountryCode(initialCountry);
    setCitySlug(initialCity);

    if (initialCity) {
      const match = locationOptions.find((o) => o.citySlug === initialCity);
      if (match) setCityText(match.name ?? match.label ?? initialCity);
    }

    const criteria = { query: initialQuery, countryCode: initialCountry, citySlug: initialCity };
    criteriaRef.current = criteria;
    runSearch(criteria, 0);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    commitSearch();
  }

  function handleCountryChange(event) {
    const next = event.target.value || "";
    setCountryCode(next);
    // Clear city if it no longer belongs to the chosen country.
    if (next && citySlug) {
      const stillValid = locationOptions.some(
        (o) => o.citySlug === citySlug && o.countryCode === next
      );
      if (!stillValid) {
        setCitySlug("");
        setCityText("");
      }
    }
    commitSearch({ countryCode: next, citySlug: "" });
  }

  function handleCityChange(event) {
    const value = event.target.value;
    setCityText(value);
    setCitySlug("");
    const found = filterCities(value, locationOptions, countryCode);
    setCitySuggestions(found);
    setShowCitySuggestions(found.length > 0);
  }

  function selectCity(option) {
    setCityText(option.name ?? option.label ?? option.citySlug);
    setCitySlug(option.citySlug);
    setCountryCode(option.countryCode ?? countryCode);
    setShowCitySuggestions(false);
    commitSearch({ citySlug: option.citySlug, countryCode: option.countryCode ?? countryCode });
  }

  function clearCity() {
    setCityText("");
    setCitySlug("");
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    commitSearch({ citySlug: "" });
  }

  function handleLoadMore() {
    runSearch(criteriaRef.current, page + 1);
  }

  const hasMore = results.length < total;
  const isLoading = status === "loading";
  const isLoadingMore = status === "loadingMore";
  const showEmpty =
    status === "loaded" &&
    results.length === 0 &&
    Boolean(criteriaRef.current.query || criteriaRef.current.countryCode || criteriaRef.current.citySlug);

  return (
    <section className="traze-searchpage">
      <div className="traze-searchpage__head">
        <h1 className="traze-searchpage__title">{t("searchPage.title")}</h1>
        <p className="traze-searchpage__subtitle">{t("searchPage.subtitle")}</p>
      </div>

      <form className="traze-searchpage__form" onSubmit={handleSubmit}>
        <div className="traze-searchpage__input-wrap">
          <Search size={17} className="traze-searchpage__icon" aria-hidden="true" />
          <input
            className="traze-searchpage__input"
            type="text"
            value={query}
            maxLength={MAX_QUERY_LENGTH}
            placeholder={t("searchPage.inputPlaceholder")}
            aria-label={t("searchPage.inputPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <button className="traze-searchpage__button" type="submit">
            {t("common.search")}
          </button>
        </div>

        <div className="traze-searchpage__filters">
          <label className="traze-searchpage__country-wrap">
            <select
              className="traze-searchpage__country"
              value={countryCode}
              onChange={handleCountryChange}
              aria-label={t("common.selectCountry")}
            >
              <option value="">{t("searchPage.allCountries")}</option>
              {countryOptions.map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {lang === "es" && country.nameEs ? country.nameEs : country.name}
                </option>
              ))}
            </select>
          </label>

          <div className="traze-searchpage__city-wrap">
            <MapPin size={14} className="traze-searchpage__city-icon" aria-hidden="true" />
            <input
              className="traze-searchpage__city"
              type="text"
              value={cityText}
              placeholder={t("searchPage.cityPlaceholder")}
              aria-label={t("common.enterCity")}
              autoComplete="off"
              onChange={handleCityChange}
              onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 160)}
            />
            {cityText && (
              <button
                type="button"
                className="traze-searchpage__city-clear"
                onClick={clearCity}
                tabIndex={-1}
                aria-label={t("common.clearLocation")}
              >
                <X size={13} />
              </button>
            )}
            {showCitySuggestions && citySuggestions.length > 0 && (
              <ul className="traze-searchpage__suggestions" role="listbox">
                {citySuggestions.map((option) => (
                  <li key={`${option.countryCode}-${option.citySlug}`} role="option" aria-selected="false">
                    <button
                      type="button"
                      className="traze-searchpage__suggestion"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectCity(option);
                      }}
                    >
                      <MapPin size={11} aria-hidden="true" />
                      <span>{option.name}</span>
                      {(option.stateCode || option.countryCode) && (
                        <span className="traze-searchpage__suggestion-meta">
                          {[option.stateCode, option.countryCode].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </form>

      <div className="traze-searchpage__results" aria-live="polite">
        {isLoading && (
          <p className="traze-searchpage__state">{t("searchPage.searching")}</p>
        )}

        {status === "error" && (
          <div className="traze-searchpage__state traze-searchpage__state--error">
            <p>{t("searchPage.errorTitle")}</p>
            <p className="traze-searchpage__state-body">{t("searchPage.errorBody")}</p>
          </div>
        )}

        {showEmpty && (
          <div className="traze-searchpage__state">
            <p>{t("searchPage.noResultsTitle")}</p>
            <p className="traze-searchpage__state-body">{t("searchPage.noResultsBody")}</p>
          </div>
        )}

        {status === "idle" && (
          <p className="traze-searchpage__state traze-searchpage__state--muted">
            {t("searchPage.idleHint")}
          </p>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <p className="traze-searchpage__count">
              {t("searchPage.resultsCount", { count: total })}
            </p>
            <div className="ch-featured-grid">
              {results.map((card) => (
                <TrazeProviderCard key={card.id} provider={card} lang={lang} showCountryBadge />
              ))}
            </div>

            {hasMore && (
              <div className="traze-searchpage__more">
                <button
                  type="button"
                  className="traze-searchpage__more-button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? t("searchPage.searching") : t("searchPage.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="traze-searchpage__foot">
        <a href={withLocale("/directory", lang)}>{t("searchPage.browseDirectory")}</a>
      </p>
    </section>
  );
}
