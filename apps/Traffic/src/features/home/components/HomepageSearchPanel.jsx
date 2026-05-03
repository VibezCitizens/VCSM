"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, LocateFixed } from "lucide-react";
import { countryCityPath, countryCityServicePath } from "@/lib/paths";
import { normalizeSlug } from "@/lib/slugs";

function mapServiceQuery(rawQuery) {
  const normalized = normalizeSlug(rawQuery);
  if (!normalized) return null;

  if (["locksmith", "lock", "lockout", "key-service", "keys"].includes(normalized)) return "locksmith";
  if (["barber", "barbers", "barbershop", "haircut", "fade"].includes(normalized)) return "barber";
  if (normalized.includes("locksmith") || normalized.includes("lockout")) return "locksmith";
  if (normalized.includes("barber") || normalized.includes("haircut")) return "barber";

  return null;
}

function toTitleCase(value) {
  return String(value ?? "")
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function labelForServiceSlug(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return "Service";
  if (normalized === "barber") return "Barbers";
  if (normalized === "locksmith") return "Locksmiths";
  return toTitleCase(normalized);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomepageSearchPanel({
  defaultLocation,
  locationOptions,
  liveServiceSlugs = [],
  popularLinks = []
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locationSlug, setLocationSlug] = useState(defaultLocation?.citySlug ?? "miami");
  const [locating, setLocating] = useState(false);

  const optionMap = useMemo(
    () => new Map(locationOptions.map((option) => [option.citySlug, option])),
    [locationOptions]
  );

  const location = optionMap.get(locationSlug) ?? defaultLocation;

  const quickServiceLinks = useMemo(() => {
    if (!location) return [];

    return liveServiceSlugs
      .map((serviceSlug) => normalizeSlug(serviceSlug))
      .filter(Boolean)
      .map((serviceSlug) => ({
        label: labelForServiceSlug(serviceSlug),
        href: countryCityServicePath(location.countrySlug, location.citySlug, serviceSlug)
      }));
  }, [liveServiceSlugs, location]);

  const quickLocationLinks = useMemo(
    () => locationOptions.slice(0, 6).map((option) => ({ label: option.label, href: option.href })),
    [locationOptions]
  );

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

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = locationOptions
          .filter((o) => o.lat != null && o.lon != null)
          .reduce((best, option) => {
            const dist = haversineKm(latitude, longitude, option.lat, option.lon);
            return best === null || dist < best.dist ? { slug: option.citySlug, dist } : best;
          }, null);
        if (nearest) setLocationSlug(nearest.slug);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 6000 }
    );
  }

  return (
    <div className="hp-search-wrap">
      <form className="hp-search-form" onSubmit={handleSubmit}>
        <div className="hp-search-row">
          <div className="hp-search-input-wrap">
            <Search size={17} className="hp-search-icon" />
            <input
              aria-label="Search services, providers, or locations"
              className="hp-search-input"
              placeholder="Search services or businesses"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button className="hp-search-btn" type="submit">
            Search
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="hp-location-row">
          <div className="hp-location-select-wrap">
            <MapPin size={14} className="hp-location-icon" />
            <select
              id="homepage-location-select"
              className="hp-location-select"
              value={locationSlug}
              onChange={(event) => setLocationSlug(event.target.value)}
              aria-label="Select city"
            >
              {locationOptions.map((option) => (
                <option key={option.citySlug} value={option.citySlug}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg className="hp-select-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            className="hp-use-location-btn"
            onClick={handleUseMyLocation}
            disabled={locating}
          >
            <LocateFixed size={13} />
            {locating ? "Detecting..." : "Use my location"}
          </button>
        </div>
      </form>

      {popularLinks.length > 0 && (
        <div className="hp-popular-links" aria-label="Popular searches">
          <span className="hp-popular-label">Popular searches</span>
          <div className="hp-popular-list">
            {popularLinks.map((link) => (
              <Link key={link.label} className="hp-popular-link" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="hp-quick-filters" aria-label="Quick filters">
        {quickServiceLinks.length > 0 && (
          <div className="hp-quick-filter-group">
            <p className="hp-quick-filter-label">Categories</p>
            <div className="hp-quick-filter-links">
              {quickServiceLinks.map((entry) => (
                <Link key={`service-${entry.label}`} className="hp-quick-filter-link" href={entry.href}>
                  {entry.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {quickLocationLinks.length > 0 && (
          <div className="hp-quick-filter-group">
            <p className="hp-quick-filter-label">Locations</p>
            <div className="hp-quick-filter-links">
              {quickLocationLinks.map((entry) => (
                <Link key={`location-${entry.label}`} className="hp-quick-filter-link hp-quick-filter-link--muted" href={entry.href}>
                  {entry.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
