"use client";

import Link from "next/link";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { translate } from "@/i18n";

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function countryName(country, lang) {
  return lang === "es" ? (country?.countryNameEs ?? country?.countryName) : country?.countryName;
}

function CoverageMetric({ item, lang }) {
  return (
    <span className="geo-coverage-fallback__metrics">
      <span>{formatCount(item.providerCount)}</span>
      <small>
        {formatCount(item.categoryCount)} {translate("common.categoryShort", lang)}
      </small>
    </span>
  );
}

function PlaceLabel({ item, label }) {
  return (
    <span>
      <strong>{label}</strong>
      <small>
        {item.countryCode}
        {item.stateCode ? ` · ${item.stateCode}` : ""}
      </small>
    </span>
  );
}

function CoverageLink({ item, label, lang }) {
  return (
    <Link className="geo-coverage-fallback__item" href={withLocale(item.href || "/", lang)}>
      <PlaceLabel item={item} label={label} />
      <CoverageMetric item={item} lang={lang} />
    </Link>
  );
}

function CountryButton({ country, isActive, onSelect, lang }) {
  return (
    <button
      type="button"
      className={`geo-coverage-fallback__item geo-coverage-fallback__item--button${
        isActive ? " is-active" : ""
      }`}
      onClick={() => onSelect?.(country.countryCode)}
    >
      <PlaceLabel item={country} label={countryName(country, lang)} />
      <CoverageMetric item={country} lang={lang} />
    </button>
  );
}

function StateButton({ state, isActive, onSelect, lang }) {
  return (
    <button
      type="button"
      className={`geo-coverage-fallback__item geo-coverage-fallback__item--button${
        isActive ? " is-active" : ""
      }`}
      onClick={() => onSelect?.(state.stateCode)}
    >
      <PlaceLabel item={state} label={state.stateName || state.stateCode} />
      <CoverageMetric item={state} lang={lang} />
    </button>
  );
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
  const countries = coverage?.countries ?? [];
  const resolvedActiveCountryCode = activeCountryCode ?? countries[0]?.countryCode ?? null;
  const activeCountry = countries.find((country) => country.countryCode === resolvedActiveCountryCode) ?? countries[0] ?? null;
  const states = (coverage?.states ?? []).filter(
    (state) => !activeCountry || state.countryCode === activeCountry.countryCode
  );
  const activeState = states.find((state) => state.stateCode === activeStateCode) ?? null;
  const cities = (coverage?.cities ?? []).filter(
    (city) =>
      (!activeCountry || city.countryCode === activeCountry.countryCode) &&
      (!activeState || city.stateCode === activeState.stateCode)
  );

  return (
    <div className="geo-coverage-fallback">
      <div className="geo-coverage-fallback__header">
        <span className="geo-coverage-eyebrow">
          {t("geoCoverage.activeDirectory")}
        </span>
        <h3>{t("geoCoverage.availableCoverage")}</h3>
        {activeCountry ? (
          <p>
            {activeState
              ? t("geoCoverage.showingState", {
                  state: activeState.stateName || activeState.stateCode,
                  country: countryName(activeCountry, lang)
                })
              : t("geoCoverage.showingCountry", { country: countryName(activeCountry, lang) })}
          </p>
        ) : null}
        {reason ? <p>{reason}</p> : null}
      </div>

      <div className="geo-coverage-fallback__columns">
        <section>
          <h4>{t("common.countries")}</h4>
          <div className="geo-coverage-fallback__list">
            {countries.map((country) => (
              <CountryButton
                key={country.countryCode}
                country={country}
                isActive={country.countryCode === activeCountry?.countryCode}
                onSelect={onCountrySelect}
                lang={lang}
              />
            ))}
          </div>
        </section>

        {states.length > 0 && (
          <section>
            <h4>{t("common.states")}</h4>
            <div className="geo-coverage-fallback__list">
              {states.slice(0, 8).map((state) => (
                <StateButton
                  key={`${state.countryCode}:${state.stateCode}`}
                  state={state}
                  isActive={state.stateCode === activeState?.stateCode}
                  onSelect={onStateSelect}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        )}

        {cities.length > 0 && (
          <section>
            <h4>{t("common.cities")}</h4>
            <div className="geo-coverage-fallback__list">
              {cities.slice(0, 10).map((city) => (
                <CoverageLink
                  key={`${city.countryCode}:${city.citySlug}`}
                  item={city}
                  label={city.cityName}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        )}

        {states.length > 0 && !activeState && (
          <section>
            <h4>{t("common.cities")}</h4>
            <div className="geo-coverage-fallback__empty">
              {t("geoCoverage.selectStatePrompt")}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
