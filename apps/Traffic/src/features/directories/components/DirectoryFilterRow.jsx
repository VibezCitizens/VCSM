"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";

const FILTER_CHIPS = ["Open now", "Top rated", "Bookable", "Near me"];

export function DirectoryFilterRow({ serviceLabel = "services", locationLabel = "Miami, US" }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  const normalizedServiceLabel = String(serviceLabel ?? "").trim().toLowerCase();
  const placeholder =
    normalizedServiceLabel === "services"
      ? "Search providers, categories, or services…"
      : `Search ${normalizedServiceLabel}, providers, or keywords…`;

  return (
    <div className="dir-filter-wrap">
      <div className="dir-filter-row">
        <div className="dir-filter-input-wrap">
          <Search size={15} className="dir-filter-icon" aria-hidden="true" />
          <input
            className="dir-filter-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
        </div>
        <div className="dir-filter-location">
          <MapPin size={12} aria-hidden="true" />
          {locationLabel}
        </div>
      </div>
      <div className="dir-filter-chips">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`pill dir-filter-chip${active === chip ? " pill--primary" : ""}`}
            onClick={() => setActive(active === chip ? null : chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
