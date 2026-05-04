"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useTrafficLanguage } from "@/lib/language";

const FILTER_CHIPS_EN = ["Open now", "Top rated", "Bookable", "Near me"];
const FILTER_CHIPS_ES = ["Abierto ahora", "Mejor calificados", "Con reserva", "Cerca de mí"];

export function DirectoryFilterRow({ serviceLabel = "services", locationLabel = "Miami, US" }) {
  const { lang } = useTrafficLanguage();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  const chips = lang === "es" ? FILTER_CHIPS_ES : FILTER_CHIPS_EN;
  const normalizedServiceLabel = String(serviceLabel ?? "").trim().toLowerCase();
  const isGeneric = normalizedServiceLabel === "services";

  const placeholder =
    lang === "es"
      ? isGeneric
        ? "Busca proveedores, categorías o servicios…"
        : `Busca ${normalizedServiceLabel}, proveedores o palabras clave…`
      : isGeneric
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
        {chips.map((chip) => (
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
