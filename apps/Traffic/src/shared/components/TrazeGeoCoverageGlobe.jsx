"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { feature } from "topojson-client";
import { findLiveCountryByCode, getBrowserCountryCode } from "@/lib/geo/clientMarket";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { translate } from "@/i18n";
import { readDetectedTrazeLocation, readStoredTrazeLocation } from "@/lib/trazeLocationStorage";
import TrazeGeoCoverageFallback from "@/shared/components/TrazeGeoCoverageFallback";
import ExpansionRoadmap from "@/shared/components/ExpansionRoadmap";
import TrazeSpotlightCarousel from "@/shared/components/TrazeSpotlightCarousel";

const ISO_NUMERIC_TO_ALPHA2 = {
  "840": "US",
  "484": "MX",
  "320": "GT",
  "084": "BZ",
  "340": "HN",
  "222": "SV",
  "558": "NI",
  "188": "CR",
  "591": "PA",
  "124": "CA",
  "826": "GB",
  "724": "ES",
  "250": "FR",
  "276": "DE",
  "784": "AE",
  "076": "BR",
  "356": "IN"
};

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString("en-US");
}

function placeCountryName(item, lang) {
  return lang === "es" ? (item?.countryNameEs ?? item?.countryName) : item?.countryName;
}

function tooltipHtml(item, label, lang) {
  if (!item) return "";
  const place = label || item.cityName || item.stateName || placeCountryName(item, lang) || item.countryCode;
  const meta = [
    item.stateCode,
    item.cityName ? item.countryCode : null
  ].filter(Boolean).join(" · ");
  const providersLabel = translate("common.providers", lang);
  const categoriesLabel = translate("common.categories", lang);

  return `<div class="geo-coverage-tooltip">
    <strong>${escapeHtml(place)}</strong>
    ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
    <small>${formatCount(item.providerCount)} ${providersLabel} · ${formatCount(item.categoryCount)} ${categoriesLabel}</small>
  </div>`;
}

function getFeatureCountryCode(feat) {
  const rawId = String(feat?.id ?? feat?.properties?.id ?? "").padStart(3, "0");
  return ISO_NUMERIC_TO_ALPHA2[rawId] ?? null;
}

function hasUsableGeometry(geoJson) {
  return Array.isArray(geoJson?.features) && geoJson.features.length > 0;
}

export default function TrazeGeoCoverageGlobe({
  coverage,
  spotlightProviders = [],
  title = "Traze coverage",
  subtitle = "Live provider coverage by country, state, and city.",
  showMeta = true,
  className = ""
}) {
  const router = useRouter();
  const { lang, t } = useTrafficLanguage();
  const isEs = lang === "es";
  const wrapRef = useRef(null);
  const globeRef = useRef(null);
  const [ReactGlobe, setReactGlobe] = useState(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [geoJson, setGeoJson] = useState(null);
  const [fallbackReason, setFallbackReason] = useState(null);
  const [activeCountryCode, setActiveCountryCode] = useState(
    coverage?.countries?.[0]?.countryCode ?? null
  );
  const [activeStateCode, setActiveStateCode] = useState(null);

  const countries = coverage?.countries ?? [];
  const cities = coverage?.cities ?? [];
  const states = coverage?.states ?? [];
  const countryByCode = useMemo(
    () => new Map(countries.map((country) => [country.countryCode, country])),
    [countries]
  );
  const activeCodes = useMemo(
    () => new Set(countries.map((country) => country.countryCode)),
    [countries]
  );
  const activeCountry = countryByCode.get(activeCountryCode) ?? countries[0] ?? null;
  const activeCities = useMemo(
    () => cities.filter((city) => !activeCountry || city.countryCode === activeCountry.countryCode),
    [activeCountry, cities]
  );
  const activeStates = useMemo(
    () => states.filter((state) => !activeCountry || state.countryCode === activeCountry.countryCode),
    [activeCountry, states]
  );
  const activeState = useMemo(
    () => activeStates.find((state) => state.stateCode === activeStateCode) ?? null,
    [activeStateCode, activeStates]
  );
  const cityPoints = useMemo(
    () =>
      activeCities
        .filter((city) => !activeState || city.stateCode === activeState.stateCode)
        .filter((city) => city.lat != null && city.lng != null),
    [activeCities, activeState]
  );
  const countryPoints = useMemo(
    () => countries.filter((country) => country.lat != null && country.lng != null),
    [countries]
  );
  const maxCityProviders = Math.max(1, ...cityPoints.map((city) => city.providerCount ?? 0));
  const totalProviders = countries.reduce((sum, country) => sum + Number(country.providerCount ?? 0), 0);
  const totalCities = countries.reduce((sum, country) => sum + Number(country.cityCount ?? 0), 0);
  const activeProviders = activeState?.providerCount ?? activeCountry?.providerCount ?? totalProviders;
  const activeCityCount = activeState?.cityCount ?? activeCountry?.cityCount ?? totalCities;
  // Coverage Insights — full-network totals (independent of the active-market
  // selection driving the globe / Current Market panel).
  const activeMarketName = activeState
    ? activeState.stateName || activeState.stateCode
    : activeCountry
      ? placeCountryName(activeCountry, lang)
      : null;

  useEffect(() => {
    let cancelled = false;

    import("react-globe.gl").then((module) => {
      if (!cancelled) setReactGlobe(() => module.default);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stored = readStoredTrazeLocation();
    const detected = readDetectedTrazeLocation();
    const preferred =
      findLiveCountryByCode(stored?.countryCode, countries) ??
      findLiveCountryByCode(detected?.countryCode, countries) ??
      findLiveCountryByCode(getBrowserCountryCode(), countries);

    if (preferred) {
      setActiveCountryCode(preferred.countryCode);
      setActiveStateCode(null);
    }
  }, [countries]);

  useEffect(() => {
    if (!wrapRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setDims({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height)
      });
    });

    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  function syncGlobeView(duration = 850) {
    if (!globeRef.current || activeCountry?.lat == null || activeCountry?.lng == null) return;

    globeRef.current.pointOfView(
      {
        lat: activeCountry.lat,
        lng: activeCountry.lng,
        altitude: 2.15
      },
      duration
    );
  }

  useEffect(() => {
    if (!ReactGlobe || !geoJson || !dims.width || !dims.height || !globeRef.current) {
      return undefined;
    }

    syncGlobeView(850);
    const timer = window.setTimeout(() => syncGlobeView(0), 120);
    return () => window.clearTimeout(timer);
  }, [ReactGlobe, activeCountry, dims.height, dims.width, geoJson]);

  useEffect(() => {
    if (!detectWebGL()) {
      setFallbackReason(
        isEs
          ? "WebGL no está disponible en este dispositivo. Los enlaces del directorio siguen disponibles."
          : "WebGL is unavailable on this device. Directory links remain available."
      );
      return undefined;
    }

    let cancelled = false;

    fetch("/geo/world-countries.topo.json")
      .then((response) => {
        if (!response.ok) throw new Error("Geometry asset unavailable");
        return response.json();
      })
      .then((topology) => {
        if (cancelled) return;
        const objectName = topology?.objects?.countries
          ? "countries"
          : Object.keys(topology?.objects ?? {})[0];
        if (!objectName) throw new Error("Geometry object missing");

        const geo = feature(topology, topology.objects[objectName]);
        if (!hasUsableGeometry(geo)) throw new Error("Geometry features missing");
        setGeoJson(geo);
      })
      .catch(() => {
        if (!cancelled) {
          setFallbackReason(t("geoCoverage.geometryUnavailable"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEs]);

  function routeTo(item) {
    if (!item?.href) return;
    router.push(withLocale(item.href, lang));
  }

  function selectCountry(countryCode) {
    if (!countryByCode.has(countryCode)) return;
    setActiveCountryCode(countryCode);
    setActiveStateCode(null);
  }

  function selectState(stateCode) {
    const state = activeStates.find((item) => item.stateCode === stateCode);
    if (!state) return;
    setActiveStateCode(state.stateCode);
  }

  function countryColor(feat) {
    const code = getFeatureCountryCode(feat);
    if (!code || !activeCodes.has(code)) return "rgba(26, 32, 62, 0.72)";
    if (code === activeCountryCode) return "rgba(167, 139, 250, 0.98)";
    return "rgba(93, 74, 210, 0.86)";
  }

  if (fallbackReason || countries.length === 0) {
    return (
      <section className={`geo-coverage-section ${className}`}>
        <TrazeGeoCoverageFallback
          coverage={coverage}
          reason={fallbackReason}
          activeCountryCode={activeCountry?.countryCode}
          activeStateCode={activeState?.stateCode}
          onCountrySelect={selectCountry}
          onStateSelect={selectState}
        />
      </section>
    );
  }

  return (
    <section className={`geo-coverage-section ${className}`}>
      <div className="geo-coverage-shell">
        <div className="geo-coverage-copy">
          {showMeta && (
            <span className="geo-coverage-eyebrow">
              {t("geoCoverage.liveGeography")}
            </span>
          )}
          <h2>{title === "Traze coverage" ? t("geoCoverage.coverageExplorer") : title}</h2>
          {showMeta && (
            <p>
              {isEs && subtitle === "Live provider coverage by country, state, and city."
                ? t("geoCoverage.subtitle")
                : subtitle}
            </p>
          )}
          {showMeta && (
            <div className="geo-coverage-stats">
              <span>
                <strong>{formatCount(activeProviders)}</strong>
                <small>{t("common.providers")}</small>
              </span>
              <span>
                <strong>{formatCount(activeStates.length)}</strong>
                <small>{t("common.states").toLowerCase()}</small>
              </span>
              <span>
                <strong>{formatCount(activeCityCount)}</strong>
                <small>{t("common.cities").toLowerCase()}</small>
              </span>
            </div>
          )}
          <div className="geo-coverage-insights">
            <span className="geo-coverage-insights__title">
              {t("geoCoverage.coverageInsights")}
            </span>
            <div className="geo-coverage-insights__grid">
              <span className="geo-coverage-insights__stat">
                <strong>{formatCount(countries.length)}</strong>
                <small>{t("common.countries")}</small>
              </span>
              <span className="geo-coverage-insights__stat">
                <strong>{formatCount(states.length)}</strong>
                <small>{t("common.states")}</small>
              </span>
              <span className="geo-coverage-insights__stat">
                <strong>{formatCount(cities.length)}</strong>
                <small>{t("common.cities")}</small>
              </span>
              <span className="geo-coverage-insights__stat">
                <strong>{formatCount(totalProviders)}</strong>
                <small>{t("common.providers")}</small>
              </span>
            </div>
            {activeCountry && (
              <button
                type="button"
                className="geo-coverage-active-market"
                onClick={() => {
                  if (activeState) return;
                  routeTo(activeCountry);
                }}
              >
                <span>{t("geoCoverage.currentMarket")}</span>
                <strong>{activeMarketName}</strong>
                <small>
                  {formatCount(activeProviders)} {t("common.providers")} ·{" "}
                  {formatCount(activeCityCount)} {t("common.cities").toLowerCase()}
                </small>
              </button>
            )}
          </div>

          <TrazeSpotlightCarousel providers={spotlightProviders} />
        </div>

        <div className="geo-coverage-globe-card">
          <div className="geo-coverage-globe" ref={wrapRef}>
            {dims.width > 0 && geoJson && ReactGlobe && (
              <ReactGlobe
                ref={globeRef}
                width={dims.width}
                height={dims.height}
                onGlobeReady={() => syncGlobeView(0)}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl=""
                atmosphereColor="#8b5cf6"
                atmosphereAltitude={0.24}
                polygonsData={geoJson.features}
                polygonCapColor={countryColor}
                polygonSideColor={() => "rgba(34, 42, 86, 0.45)"}
                polygonStrokeColor={(feat) => {
                  const code = getFeatureCountryCode(feat);
                  return code && activeCodes.has(code)
                    ? "rgba(196, 181, 253, 0.42)"
                    : "rgba(93, 103, 150, 0.12)";
                }}
                polygonAltitude={(feat) => {
                  const code = getFeatureCountryCode(feat);
                  return code && activeCodes.has(code) ? 0.018 : 0.004;
                }}
                polygonLabel={(feat) => {
                  const code = getFeatureCountryCode(feat);
                  const country = countryByCode.get(code);
                  return tooltipHtml(country, placeCountryName(country, lang), lang);
                }}
                onPolygonClick={(feat) => {
                  const code = getFeatureCountryCode(feat);
                  selectCountry(code);
                }}
                pointsData={[...countryPoints, ...cityPoints]}
                pointLat="lat"
                pointLng="lng"
                pointAltitude={(point) => point.citySlug ? 0.055 : 0.035}
                pointRadius={(point) => {
                  if (!point.citySlug) return 0.28 + Math.sqrt(point.providerCount ?? 1) * 0.08;
                  return 0.22 + Math.sqrt((point.providerCount ?? 1) / maxCityProviders) * 0.42;
                }}
                pointColor={(point) =>
                  point.citySlug
                    ? "rgba(96, 165, 250, 0.92)"
                    : "rgba(216, 180, 254, 0.94)"
                }
                pointLabel={(point) => tooltipHtml(point, null, lang)}
                onPointClick={(point) => {
                  if (point?.citySlug) {
                    routeTo(point);
                  } else if (point?.countryCode) {
                    selectCountry(point.countryCode);
                  }
                }}
              />
            )}
          </div>
        </div>

        <ExpansionRoadmap className="geo-coverage-spotlight" />
      </div>

      <TrazeGeoCoverageFallback
        coverage={coverage}
        activeCountryCode={activeCountry?.countryCode}
        activeStateCode={activeState?.stateCode}
        onCountrySelect={selectCountry}
        onStateSelect={selectState}
      />
    </section>
  );
}
