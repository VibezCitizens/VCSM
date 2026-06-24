"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function countryName(country, lang) {
  return lang === "es" ? (country?.countryNameEs ?? country?.countryName) : country?.countryName;
}

const STATE_PAGE_SIZE = 8;
const CITY_PAGE_SIZE = 8;

function unitLabel(t, count, singularKey, pluralKey) {
  return count === 1 ? t(singularKey) : t(pluralKey);
}

// Compact numbered pager: [1] … [4] [5] [6] … [20]
function pageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("ellipsis-start");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("ellipsis-end");
  items.push(total);

  return items;
}

export default function TrazeGeoCoverageFallback({
  coverage,
  reason = null,
  activeCountryCode = null,
  activeStateCode = null,
  onCountrySelect = null,
  onStateSelect = null
}) {
  const { lang, t } = useTrafficLanguage();

  const countries = useMemo(() => coverage?.countries ?? [], [coverage]);
  const allStates = useMemo(() => coverage?.states ?? [], [coverage]);
  const allCities = useMemo(() => coverage?.cities ?? [], [coverage]);

  // Presentation-only derivation: states-per-country, from existing data.
  const stateCountByCountry = useMemo(() => {
    const counts = new Map();
    for (const state of allStates) {
      counts.set(state.countryCode, (counts.get(state.countryCode) ?? 0) + 1);
    }
    return counts;
  }, [allStates]);

  // Drill-down navigation is local UI state only — no data/query changes.
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const [selectedStateCode, setSelectedStateCode] = useState(null);
  const [stateQuery, setStateQuery] = useState("");
  const [statesExpanded, setStatesExpanded] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [citySort, setCitySort] = useState("providers");
  const [cityPage, setCityPage] = useState(1);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.countryCode === selectedCountryCode) ?? null,
    [countries, selectedCountryCode]
  );

  const statesForCountry = useMemo(
    () => allStates.filter((state) => state.countryCode === selectedCountryCode),
    [allStates, selectedCountryCode]
  );

  const selectedState = useMemo(
    () => statesForCountry.find((state) => state.stateCode === selectedStateCode) ?? null,
    [statesForCountry, selectedStateCode]
  );

  let level = "countries";
  if (selectedCountry && selectedState) level = "cities";
  else if (selectedCountry) level = "states";

  // Highlight the detected/active market (from the globe) while browsing countries.
  const highlightCountryCode = activeCountryCode ?? countries[0]?.countryCode ?? null;

  const filteredStates = useMemo(() => {
    const query = stateQuery.trim().toLowerCase();
    if (!query) return statesForCountry;
    return statesForCountry.filter((state) => {
      const name = (state.stateName || "").toLowerCase();
      const code = (state.stateCode || "").toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [stateQuery, statesForCountry]);

  const visibleStates = statesExpanded
    ? filteredStates
    : filteredStates.slice(0, STATE_PAGE_SIZE);

  const citiesForState = useMemo(
    () =>
      allCities.filter(
        (city) =>
          city.countryCode === selectedCountryCode && city.stateCode === selectedStateCode
      ),
    [allCities, selectedCountryCode, selectedStateCode]
  );

  const filteredCities = useMemo(() => {
    const query = cityQuery.trim().toLowerCase();
    const base = query
      ? citiesForState.filter((city) => (city.cityName || "").toLowerCase().includes(query))
      : citiesForState;

    return [...base].sort((left, right) => {
      if (citySort === "name") {
        return String(left.cityName ?? "").localeCompare(String(right.cityName ?? ""));
      }
      if ((right.providerCount ?? 0) !== (left.providerCount ?? 0)) {
        return (right.providerCount ?? 0) - (left.providerCount ?? 0);
      }
      return String(left.cityName ?? "").localeCompare(String(right.cityName ?? ""));
    });
  }, [cityQuery, citySort, citiesForState]);

  const cityPageCount = Math.max(1, Math.ceil(filteredCities.length / CITY_PAGE_SIZE));
  const safeCityPage = Math.min(cityPage, cityPageCount);
  const pagedCities = filteredCities.slice(
    (safeCityPage - 1) * CITY_PAGE_SIZE,
    safeCityPage * CITY_PAGE_SIZE
  );

  // Keep pagination in range whenever the city result set changes.
  useEffect(() => {
    setCityPage(1);
  }, [cityQuery, citySort, selectedStateCode]);

  function openCountry(countryCode) {
    setSelectedCountryCode(countryCode);
    setSelectedStateCode(null);
    setStateQuery("");
    setStatesExpanded(false);
    onCountrySelect?.(countryCode);
  }

  function openState(stateCode) {
    setSelectedStateCode(stateCode);
    setCityQuery("");
    setCitySort("providers");
    setCityPage(1);
    onStateSelect?.(stateCode);
  }

  function backToCountries() {
    setSelectedCountryCode(null);
    setSelectedStateCode(null);
  }

  function backToStates() {
    setSelectedStateCode(null);
  }

  return (
    <div className="geo-coverage-fallback">
      <div className="geo-coverage-fallback__header">
        <h3>{t("geoCoverage.directoryTitle")}</h3>
        <p>{t("geoCoverage.directorySubtitle")}</p>
        {reason ? <p className="geo-coverage-fallback__reason">{reason}</p> : null}
      </div>

      {level === "countries" && (
        <div className="geo-coverage-explorer">
          <div className="geo-coverage-explorer__bar">
            <div className="geo-coverage-explorer__heading">
              <span className="geo-coverage-explorer__title">{t("common.countries")}</span>
              <span className="geo-coverage-explorer__count">
                {formatCount(countries.length)}{" "}
                {unitLabel(t, countries.length, "geoCoverage.countryUnit", "geoCoverage.countriesUnit")}
              </span>
            </div>
          </div>

          {countries.length === 0 ? (
            <div className="geo-coverage-fallback__empty">{t("geoCoverage.noCoverage")}</div>
          ) : (
            <div className="geo-coverage-fallback__list geo-coverage-fallback__list--grid">
              {countries.map((country) => {
                const stateTotal = stateCountByCountry.get(country.countryCode) ?? 0;
                return (
                  <button
                    key={country.countryCode}
                    type="button"
                    className={`geo-coverage-fallback__item geo-coverage-fallback__item--button${
                      country.countryCode === highlightCountryCode ? " is-active" : ""
                    }`}
                    onClick={() => openCountry(country.countryCode)}
                  >
                    <span>
                      <strong>{countryName(country, lang)}</strong>
                      <small>{country.countryCode}</small>
                    </span>
                    <span className="geo-coverage-fallback__metrics">
                      <span>{formatCount(stateTotal)}</span>
                      <small>
                        {unitLabel(t, stateTotal, "geoCoverage.stateUnit", "geoCoverage.statesUnit")}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {level === "states" && selectedCountry && (
        <div className="geo-coverage-explorer">
          <div className="geo-coverage-explorer__bar">
            <div className="geo-coverage-explorer__heading">
              <button type="button" className="geo-coverage-back" onClick={backToCountries}>
                {t("geoCoverage.backToCountries")}
              </button>
              <span className="geo-coverage-explorer__title">
                {t("geoCoverage.allStatesIn", { country: countryName(selectedCountry, lang) })}
              </span>
            </div>
            {statesForCountry.length > 0 && (
              <div className="geo-coverage-toolbar">
                <input
                  type="search"
                  className="geo-coverage-search-input"
                  value={stateQuery}
                  onChange={(event) => {
                    setStateQuery(event.target.value);
                    setStatesExpanded(false);
                  }}
                  placeholder={t("geoCoverage.searchStates")}
                  aria-label={t("geoCoverage.searchStates")}
                />
              </div>
            )}
          </div>

          {filteredStates.length === 0 ? (
            <div className="geo-coverage-fallback__empty">
              {statesForCountry.length === 0
                ? t("geoCoverage.noStates")
                : t("geoCoverage.noStatesMatch")}
            </div>
          ) : (
            <>
              <div className="geo-coverage-fallback__list geo-coverage-fallback__list--grid">
                {visibleStates.map((state) => (
                  <button
                    key={`${state.countryCode}:${state.stateCode}`}
                    type="button"
                    className={`geo-coverage-fallback__item geo-coverage-fallback__item--button${
                      state.stateCode === selectedStateCode ? " is-active" : ""
                    }`}
                    onClick={() => openState(state.stateCode)}
                  >
                    <span>
                      <strong>{state.stateName || state.stateCode}</strong>
                      <small>{state.stateCode}</small>
                    </span>
                    <span className="geo-coverage-fallback__metrics">
                      <span>{formatCount(state.cityCount)}</span>
                      <small>
                        {unitLabel(t, state.cityCount, "geoCoverage.cityUnit", "geoCoverage.citiesUnit")}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              {filteredStates.length > STATE_PAGE_SIZE && (
                <button
                  type="button"
                  className="geo-coverage-more"
                  onClick={() => setStatesExpanded((value) => !value)}
                >
                  {statesExpanded
                    ? t("geoCoverage.showFewer")
                    : t("geoCoverage.showAllStates", { count: formatCount(filteredStates.length) })}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {level === "cities" && selectedCountry && selectedState && (
        <div className="geo-coverage-explorer">
          <div className="geo-coverage-explorer__bar">
            <div className="geo-coverage-explorer__heading">
              <button type="button" className="geo-coverage-back" onClick={backToStates}>
                {t("geoCoverage.backToStates")}
              </button>
              <span className="geo-coverage-explorer__title">
                {t("geoCoverage.citiesIn", {
                  state: selectedState.stateName || selectedState.stateCode,
                  country: countryName(selectedCountry, lang)
                })}
              </span>
            </div>
            <div className="geo-coverage-toolbar">
              <input
                type="search"
                className="geo-coverage-search-input"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder={t("geoCoverage.searchCities")}
                aria-label={t("geoCoverage.searchCities")}
              />
              <select
                className="geo-coverage-select"
                value={citySort}
                onChange={(event) => setCitySort(event.target.value)}
                aria-label={t("geoCoverage.sortLabel")}
              >
                <option value="providers">{t("geoCoverage.sortProviders")}</option>
                <option value="name">{t("geoCoverage.sortName")}</option>
              </select>
            </div>
          </div>

          {filteredCities.length === 0 ? (
            <div className="geo-coverage-fallback__empty">
              {citiesForState.length === 0
                ? t("geoCoverage.noCities")
                : t("geoCoverage.noCitiesMatch")}
            </div>
          ) : (
            <>
              <div className="geo-coverage-fallback__list">
                {pagedCities.map((city) => (
                  <Link
                    key={`${city.countryCode}:${city.citySlug}`}
                    className="geo-coverage-fallback__item"
                    href={withLocale(city.href || "/", lang)}
                  >
                    <span>
                      <strong>{city.cityName}</strong>
                      <small>{[city.stateCode, city.countryCode].filter(Boolean).join(" · ")}</small>
                    </span>
                    <span className="geo-coverage-fallback__metrics">
                      <span>{formatCount(city.providerCount)}</span>
                      <small>
                        {unitLabel(t, city.providerCount, "geoCoverage.providerUnit", "geoCoverage.providersUnit")}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>

              {cityPageCount > 1 && (
                <div
                  className="geo-coverage-pagination"
                  role="navigation"
                  aria-label={t("geoCoverage.pagination")}
                >
                  <button
                    type="button"
                    className="geo-coverage-page-btn"
                    onClick={() => setCityPage((page) => Math.max(1, page - 1))}
                    disabled={safeCityPage === 1}
                  >
                    {t("geoCoverage.prevPage")}
                  </button>
                  {pageItems(safeCityPage, cityPageCount).map((item) =>
                    typeof item === "string" ? (
                      <span key={item} className="geo-coverage-page-ellipsis" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`geo-coverage-page-btn${item === safeCityPage ? " is-active" : ""}`}
                        onClick={() => setCityPage(item)}
                        aria-current={item === safeCityPage ? "page" : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="geo-coverage-page-btn"
                    onClick={() => setCityPage((page) => Math.min(cityPageCount, page + 1))}
                    disabled={safeCityPage === cityPageCount}
                  >
                    {t("geoCoverage.nextPage")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
