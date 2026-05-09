"use client";

import TrazeSearchBar from "@/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";

export default function HomepageSearchPanel({
  defaultLocation,
  locationOptions,
  liveServiceSlugs = []
}) {
  return (
    <TrazeSearchBar
      screenKey="home"
      {...TRAZE_SCREEN_SEARCH.home}
      defaultLocation={defaultLocation}
      locationOptions={locationOptions}
      liveServiceSlugs={liveServiceSlugs}
    />
  );
}
