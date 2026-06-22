"use client";

import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";

export function DirectoryFilterRow({
  locationLabel = "Directory",
  countrySlug = "",
  countryCode = "",
  citySlug = null,
  locationOptions = [],
  countryOptions = []
}) {
  return (
    <TrazeSearchBar
      screenKey="directory"
      {...TRAZE_SCREEN_SEARCH.directory}
      initialLocation={citySlug ? { label: locationLabel, countrySlug, citySlug } : null}
      locationOptions={locationOptions}
      countryOptions={countryOptions}
      selectedCountry={countryCode || countrySlug || null}
      selectedCity={citySlug ? { countryCode, countrySlug, citySlug, label: locationLabel } : null}
      showCountrySelector
      showCitySelector
    />
  );
}
