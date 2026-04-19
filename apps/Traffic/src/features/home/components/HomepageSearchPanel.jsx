"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { countryCityPath, countryCityServicePath } from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";

function mapServiceQuery(rawQuery) {
  const normalized = normalizeSlug(rawQuery);
  if (!normalized) {
    return null;
  }

  if (["locksmith", "lock", "lockout", "key-service", "keys"].includes(normalized)) {
    return "locksmith";
  }

  if (["barber", "barbers", "barbershop", "haircut", "fade"].includes(normalized)) {
    return "barber";
  }

  if (normalized.includes("locksmith") || normalized.includes("lockout")) {
    return "locksmith";
  }

  if (normalized.includes("barber") || normalized.includes("haircut")) {
    return "barber";
  }

  return null;
}

export default function HomepageSearchPanel({
  defaultLocation,
  locationOptions,
  liveServiceSlugs = []
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locationSlug, setLocationSlug] = useState(defaultLocation?.citySlug ?? "miami");

  const optionMap = useMemo(
    () => new Map(locationOptions.map((option) => [option.citySlug, option])),
    [locationOptions]
  );

  const location = optionMap.get(locationSlug) ?? defaultLocation;

  function handleSubmit(event) {
    event.preventDefault();

    if (!location) {
      router.push("/");
      return;
    }

    const serviceSlug = mapServiceQuery(query);
    const hasLiveService = serviceSlug && liveServiceSlugs.includes(serviceSlug);

    if (hasLiveService) {
      router.push(countryCityServicePath(location.countrySlug, location.citySlug, serviceSlug));
      return;
    }

    if (query.trim().length > 0) {
      const basePath = countryCityPath(location.countrySlug, location.citySlug);
      const search = new URLSearchParams({ query: query.trim() });
      router.push(`${basePath}?${search.toString()}`);
      return;
    }

    router.push(countryCityPath(location.countrySlug, location.citySlug));
  }

  return (
    <div className="homepage-search-panel card card--subtle">
      <form className="homepage-search-form" onSubmit={handleSubmit}>
        <div className="homepage-search-main">
          <input
            aria-label="Search services, providers, or locations"
            className="homepage-search-input"
            placeholder="Search services, providers, or locations"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="pill pill--primary pill--strong homepage-search-submit" type="submit">
            Search
          </button>
        </div>

        <div className="homepage-search-support">
          <label className="homepage-field" htmlFor="homepage-location-select">
            <span className="text-xs homepage-field-label">Location</span>
            <select
              id="homepage-location-select"
              className="homepage-location-select"
              value={locationSlug}
              onChange={(event) => setLocationSlug(event.target.value)}
            >
              {locationOptions.map((option) => (
                <option key={option.citySlug} value={option.citySlug}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="homepage-search-examples text-xs">
            Try: locksmith, barber, gas station
          </p>
        </div>
      </form>

      <div className="homepage-location-context">
        <div className="homepage-location-context-text">
          <span className="pill">Showing results near {location?.label ?? "Miami, FL"}</span>
          <p className="text-sm">Location detection and precision radius controls are coming soon.</p>
        </div>
        <button className="pill pill--ghost" type="button" aria-label="Change location">
          Change location
        </button>
      </div>
    </div>
  );
}
