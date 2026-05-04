"use client";

import { MapPin, Scissors, Key, Utensils, Fuel } from "lucide-react";
import { useTrafficLanguage } from "@/lib/language";
import HomepageSearchPanel from "@/features/home/components/HomepageSearchPanel";

export default function HomepageHeroSection({
  defaultLocation,
  locationOptions,
  liveServiceSlugs,
  popularLinks,
  heroStats
}) {
  const { lang } = useTrafficLanguage();

  const localizedPopularLinks = popularLinks.map((link) => ({
    ...link,
    label: lang === "es" && link.labelEs ? link.labelEs : link.label
  }));

  return (
    <section className="homepage-hero" id="hero">
      <div className="homepage-hero-layout">
        <div className="homepage-hero-content">
          <span className="pill homepage-eyebrow">
            <MapPin size={11} style={{ marginRight: 4 }} />
            {lang === "es" ? "DIRECTORIO DE SERVICIOS LOCALES" : "LOCAL SERVICES DIRECTORY"}
          </span>

          <h1 className="homepage-hero-title">
            {lang === "es" ? "Busca servicios locales." : "Search local services."}
            <span className="homepage-hero-title-accent">
              {lang === "es" ? "Reserva con confianza." : "Book with confidence."}
            </span>
          </h1>

          <p className="homepage-hero-copy">
            {lang === "es"
              ? "Compara proveedores de confianza por categoría, ubicación y disponibilidad en un solo lugar."
              : "Compare trusted providers by category, location, and availability in one clean marketplace."}
          </p>

          <HomepageSearchPanel
            defaultLocation={defaultLocation}
            locationOptions={locationOptions}
            liveServiceSlugs={liveServiceSlugs}
            popularLinks={localizedPopularLinks}
          />

          {heroStats.length > 0 ? (
            <div
              className="homepage-hero-facts"
              aria-label={lang === "es" ? "Destacados del directorio" : "Directory highlights"}
            >
              {heroStats.map((stat) => (
                <div className="homepage-hero-fact" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{lang === "es" && stat.labelEs ? stat.labelEs : stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          {defaultLocation?.label ? (
            <p className="homepage-hero-note">
              {lang === "es"
                ? `Mostrando rutas rápidas para ${defaultLocation.label}.`
                : `Showing quick routes for ${defaultLocation.label}.`}
            </p>
          ) : null}
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
              <Scissors size={12} /> {lang === "es" ? "Barbero" : "Barber"}
            </div>
            <div className="homepage-hero-chip homepage-hero-chip--2">
              <Key size={12} /> {lang === "es" ? "Cerrajero" : "Locksmith"}
            </div>
            <div className="homepage-hero-chip homepage-hero-chip--3">
              <Utensils size={12} /> {lang === "es" ? "Restaurante" : "Restaurant"}
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
