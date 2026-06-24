"use client";

import TrazeSearchBar from "@/shared/components/TrazeSearchBar";
import TrazeHeroMap from "@/shared/components/TrazeHeroMap";
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
          <TrazeHeroMap />
        </div>
      </div>
    </section>
  );
}
