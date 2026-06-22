"use client";

import { MapPin, Scissors, Key, Utensils, Fuel } from "lucide-react";
import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import { TRAZE_SCREEN_SEARCH } from "@/config/trazeScreenSearch.config";
import { useTrafficLanguage } from "@/lib/language";

export default function HomepageHeroSection({
  defaultLocation,
  locationOptions,
  countryOptions,
  liveServiceSlugs
}) {
  const { t } = useTrafficLanguage();

  return (
    <section className="homepage-hero" id="hero">
      <div className="homepage-hero-layout">
        <div className="homepage-hero-content">
          <span className="pill homepage-eyebrow">
            <MapPin size={11} style={{ marginRight: 4 }} />
            {t("homepage.heroEyebrow")}
          </span>

          <h1 className="homepage-hero-title">
            {t("homepage.heroTitle")}
            <span className="homepage-hero-title-accent">
              {t("homepage.heroTitleAccent")}
            </span>
          </h1>

          <p className="homepage-hero-copy">{t("homepage.heroBody")}</p>

          <TrazeSearchBar
            screenKey="home"
            {...TRAZE_SCREEN_SEARCH.home}
            defaultLocation={defaultLocation}
            locationOptions={locationOptions}
            countryOptions={countryOptions}
            liveServiceSlugs={liveServiceSlugs}
            showCountrySelector
            showCitySelector
            locationPlaceholder={{
              en: "City, state, or country",
              es: "Ciudad, estado o pais"
            }}
          />
        </div>

        <div className="homepage-hero-visual" aria-hidden="true">
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
        </div>
      </div>
    </section>
  );
}
