"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withLocale } from "@/lib/i18n";
import { useTrafficLanguage } from "@/lib/language";
import { countryServiceHubPath } from "@/lib/paths";
import {
  readStoredTrazeLocation,
  TRAZE_LOCATION_CHANGE_EVENT,
  writeStoredTrazeLocation
} from "@/lib/trazeLocationStorage";

function getCountryLabel(country, lang) {
  if (lang === "es" && country.nameEs) return country.nameEs;
  return country.name ?? country.countryCode;
}

function getCityLabel(city, lang) {
  if (lang === "es" && city.labelEs) return city.labelEs;
  return city.label ?? city.citySlug;
}

function getDefaultCountryCode(group, cityBySlug = new Map()) {
  return group.defaultCountryCode ?? "";
}

function useStoredCountryCode(group, cityBySlug = new Map()) {
  const [selectedCountryCode, setSelectedCountryCode] = useState(() =>
    getDefaultCountryCode(group, cityBySlug)
  );

  useEffect(() => {
    function syncStoredLocation(event) {
      const stored = event?.detail ?? readStoredTrazeLocation();
      const countryCode =
        stored?.countryCode ??
        (stored?.citySlug ? cityBySlug.get(stored.citySlug)?.countryCode : null) ??
        "";
      setSelectedCountryCode(countryCode);
    }

    syncStoredLocation();
    window.addEventListener("storage", syncStoredLocation);
    window.addEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);

    return () => {
      window.removeEventListener("storage", syncStoredLocation);
      window.removeEventListener(TRAZE_LOCATION_CHANGE_EVENT, syncStoredLocation);
    };
  }, [cityBySlug]);

  return [selectedCountryCode, setSelectedCountryCode];
}

function CitiesTrendingGroup({ group, lang, t }) {
  const cityBySlug = useMemo(
    () => new Map((group.cities ?? []).map((city) => [city.citySlug, city])),
    [group.cities]
  );
  const [selectedCountryCode, setSelectedCountryCode] = useStoredCountryCode(group, cityBySlug);

  const countries = group.countries ?? [];
  const cities = (group.cities ?? []).filter(
    (city) => city.countryCode === selectedCountryCode
  );

  return (
    <>
      <div className="homepage-trending-group-head homepage-trending-group-head--cities">
        <div>
          <h3 className="homepage-trending-title">
            {lang === "es" && group.titleEs ? group.titleEs : group.title}
          </h3>
          <p className="homepage-meta-note">
            {lang === "es" && group.descriptionEs ? group.descriptionEs : group.description}
          </p>
        </div>

        {countries.length > 1 && (
          <label className="homepage-country-select-wrap">
            <select
              className="homepage-country-select"
              value={selectedCountryCode}
              onChange={(event) => {
                const country = countries.find((item) => item.countryCode === event.target.value) ?? null;
                setSelectedCountryCode(event.target.value);
                writeStoredTrazeLocation(country);
              }}
              aria-label={t("common.selectCountry")}
            >
              <option value="">
                {t("common.country")}
              </option>
              {countries.map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {getCountryLabel(country, lang)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {cities.length > 0 ? (
        <ul className="homepage-directory-links">
          {cities.map((city) => (
            <li key={`${city.countryCode}-${city.citySlug}`}>
              <Link className="homepage-directory-link" href={withLocale(city.href, lang)}>
                <span>{getCityLabel(city, lang)}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="homepage-meta-note">
          {t("homepage.noActiveCities")}
        </p>
      )}
    </>
  );
}

function ServiceTrendingGroup({ group, lang, t }) {
  const [selectedCountryCode] = useStoredCountryCode(group);
  const selectedCountry = (group.countries ?? []).find(
    (country) => country.countryCode === selectedCountryCode
  );

  function resolveHref(link) {
    if (link.serviceSlug && selectedCountry) {
      return countryServiceHubPath(selectedCountry.countrySlug, link.serviceSlug);
    }

    if (selectedCountry && link.href === "/top-providers") {
      return `/${selectedCountry.countrySlug}/top-providers`;
    }

    if (selectedCountry && link.href === "/categories") {
      return `/${selectedCountry.countrySlug}/categories`;
    }

    return link.href ?? "/categories";
  }

  return (
    <>
      <div className="homepage-trending-group-head">
        <h3 className="homepage-trending-title">
          {lang === "es" && group.titleEs ? group.titleEs : group.title}
        </h3>
        <p className="homepage-meta-note">
          {selectedCountry
            ? (lang === "es" && group.descriptionEs ? group.descriptionEs : group.description)
            : t("homepage.selectCountryRoutes")}
        </p>
      </div>

      <ul className="homepage-directory-links">
        {(group.links ?? []).map((link) => {
          const linkLabel = lang === "es" && link.labelEs ? link.labelEs : link.label;
          return (
            <li key={`${group.title}-${link.label}`}>
              <Link className="homepage-directory-link" href={resolveHref(link)}>
                <span>{linkLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function HomepageTrendingSection({ groups }) {
  const { lang, t } = useTrafficLanguage();

  return (
    <section className="homepage-section homepage-section--divider homepage-trending-section homepage-directory-surface-soft" id="browse">
      <div className="homepage-section-heading">
        <h2 className="section-title">
          {t("homepage.exploreDirectory")}
        </h2>
        <p>{t("homepage.quickAccess")}</p>
      </div>

      <div className="homepage-trending-groups">
        {groups.map((group) => {
          const groupTitle = lang === "es" && group.titleEs ? group.titleEs : group.title;
          const groupDescription = lang === "es" && group.descriptionEs ? group.descriptionEs : group.description;

          return (
            <article key={group.title} className="homepage-trending-group">
              {group.type === "cities" ? (
                <CitiesTrendingGroup group={group} lang={lang} t={t} />
              ) : group.type === "service_links" ? (
                <ServiceTrendingGroup group={group} lang={lang} t={t} />
              ) : (
                <>
                  <div className="homepage-trending-group-head">
                    <h3 className="homepage-trending-title">{groupTitle}</h3>
                    <p className="homepage-meta-note">{groupDescription}</p>
                  </div>

                  <ul className="homepage-directory-links">
                    {(group.links ?? []).map((link) => {
                      const linkLabel = lang === "es" && link.labelEs ? link.labelEs : link.label;
                      return (
                        <li key={`${group.title}-${link.label}`}>
                          <Link className="homepage-directory-link" href={withLocale(link.href, lang)}>
                            <span>{linkLabel}</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
