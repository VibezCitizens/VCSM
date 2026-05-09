"use client";

import { useState } from "react";
import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";
import { translate } from "@/i18n";

function CityLink({ city, lang }) {
  const label = lang === "es" && city.nameEs ? city.nameEs : city.name;
  return (
    <Link className="tge-city-chip" href={city.href}>
      <span className="tge-city-name">{label}</span>
      {city.providerCount > 0 && (
        <span className="tge-city-count">{city.providerCount}</span>
      )}
    </Link>
  );
}

function StateGroup({ state, expanded, onToggle, lang }) {
  const label = state.stateName ?? state.stateCode ?? "—";
  const meta = `${state.providerCount} ${translate("common.providers", lang)} · ${state.cityCount} ${translate("common.cities", lang).toLowerCase()}`;

  return (
    <div className={`tge-state-group${expanded ? "" : " tge-state-group--collapsed"}`}>
      <button className="tge-state-toggle" onClick={onToggle} type="button">
        {state.stateCode && (
          <span className="tge-state-code">{state.stateCode}</span>
        )}
        <span className="tge-state-name">{label}</span>
        <span className="tge-state-meta">{meta}</span>
        <span className="tge-state-chevron" aria-hidden="true">›</span>
      </button>
      {expanded && (
        <div className="tge-city-grid">
          {state.cities.map((city) => (
            <CityLink key={city.slug} city={city} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function CountryHeader({ country, lang }) {
  const name = lang === "es" && country.countryNameEs ? country.countryNameEs : country.countryName;
  const meta = `${country.providerCount} ${translate("common.providers", lang)} · ${country.cityCount} ${translate("common.cities", lang).toLowerCase()}`;
  return (
    <div className="tge-country-header">
      <span className="tge-country-code">{country.countryCode}</span>
      <span className="tge-country-name">{name}</span>
      <span className="tge-country-meta">{meta}</span>
    </div>
  );
}

export default function TrazeGeoExplorer({ geoData }) {
  const { lang } = useTrafficLanguage();

  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  function toggleState(key) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const visibleCountries = geoData.filter(
    (c) => c.stateGroups.some((s) => s.cities.length > 0)
  );
  const showCountryHeaders = visibleCountries.length > 1;

  if (!visibleCountries.length) return null;

  return (
    <div className="tge-wrap">
      {visibleCountries.map((country) => (
        <div key={country.countryCode} className="tge-country-block">
          {showCountryHeaders && (
            <CountryHeader country={country} lang={lang} />
          )}
          <div className="tge-state-list">
            {country.stateGroups
              .filter((s) => s.cities.length > 0)
              .map((state) => {
                const key = state.stateCode ?? "__none__";
                return (
                  <StateGroup
                    key={key}
                    state={state}
                    expanded={expandedKeys.has(key)}
                    onToggle={() => toggleState(key)}
                    lang={lang}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
