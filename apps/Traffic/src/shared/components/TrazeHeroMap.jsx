"use client";

import { MapPin, Scissors, Key, Utensils, Fuel } from "lucide-react";
import { useTrafficLanguage } from "@/lib/language";

/**
 * TrazeHeroMap — shared hero visual.
 *
 * Dotted radar field with a pulsing center pin and four floating service
 * chips (Barber, Locksmith, Restaurant, Gas). Purely decorative; rendered
 * inside `.homepage-hero-visual` (aria-hidden, hidden below 980px). Shared by
 * the homepage and directory hubs so both heroes use the same visual language.
 */
export default function TrazeHeroMap() {
  const { t } = useTrafficLanguage();

  return (
    <div className="homepage-hero-map">
      <svg className="homepage-hero-map-bg" viewBox="0 0 360 360" fill="none">
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="18" r="1.2" fill="rgba(139,92,246,0.16)" />
          </pattern>
        </defs>
        <rect width="360" height="360" fill="url(#hero-dots)" />
        <circle cx="180" cy="180" r="140" stroke="rgba(139,92,246,0.11)" strokeWidth="1" strokeDasharray="5 8" />
        <circle cx="180" cy="180" r="88" stroke="rgba(139,92,246,0.09)" strokeWidth="1" />
        <circle cx="180" cy="180" r="38" stroke="rgba(139,92,246,0.2)" strokeWidth="1.5" fill="rgba(139,92,246,0.06)" />
      </svg>

      <div className="homepage-hero-map-pin">
        <MapPin size={34} className="homepage-hero-map-pin-icon" />
        <div className="homepage-hero-map-pulse" />
      </div>

      <div className="homepage-hero-chip homepage-hero-chip--1">
        <Scissors size={12} /> {t("homepage.barber")}
      </div>
      <div className="homepage-hero-chip homepage-hero-chip--2">
        <Key size={12} /> {t("homepage.locksmith")}
      </div>
      <div className="homepage-hero-chip homepage-hero-chip--3">
        <Utensils size={12} /> {t("homepage.restaurant")}
      </div>
      <div className="homepage-hero-chip homepage-hero-chip--4">
        <Fuel size={12} /> Gas
      </div>
    </div>
  );
}
