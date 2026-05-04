"use client";

import Link from "next/link";
import { Scissors, ShieldCheck, Utensils, Fuel, DollarSign } from "lucide-react";
import { useTrafficLanguage } from "@/lib/language";
import { countryCityServicePath } from "@/lib/paths";

const CATEGORIES = [
  {
    id: "barber",
    label: "Barbers",
    labelEs: "Barberías",
    icon: Scissors,
    description: "Local barbershops with real availability and booking.",
    descriptionEs: "Barberías locales con disponibilidad y reservas en tiempo real.",
    live: true
  },
  {
    id: "locksmith",
    label: "Locksmiths",
    labelEs: "Cerrajeros",
    icon: ShieldCheck,
    description: "Emergency and scheduled locksmith services near you.",
    descriptionEs: "Servicios de cerrajería de emergencia y programados cerca de ti.",
    live: true
  },
  {
    id: "restaurant",
    label: "Restaurants",
    labelEs: "Restaurantes",
    icon: Utensils,
    description: "Dine-in, takeout, and delivery options around you.",
    descriptionEs: "Opciones de comer en el lugar, para llevar y a domicilio.",
    live: false
  },
  {
    id: "gas-station",
    label: "Gas Stations",
    labelEs: "Gasolineras",
    icon: Fuel,
    description: "Find fuel stops and compare prices by location.",
    descriptionEs: "Encuentra gasolineras y compara precios por ubicación.",
    live: false
  },
  {
    id: "money-exchange",
    label: "Money Exchange",
    labelEs: "Casa de Cambio",
    icon: DollarSign,
    description: "Currency exchange counters and wire transfer spots.",
    descriptionEs: "Casas de cambio y puntos de transferencia de dinero.",
    live: false
  }
];

export default function HomepageCategoryGrid({ defaultCountrySlug, defaultCitySlug }) {
  const { lang } = useTrafficLanguage();

  const liveCategories = CATEGORIES.filter((c) => c.live);
  const comingSoonCategories = CATEGORIES.filter((c) => !c.live);

  return (
    <section className="homepage-section homepage-section--divider homepage-directory-surface-soft" id="categories">
      <div className="homepage-section-heading">
        <h2 className="section-title">
          {lang === "es" ? "Explorar por categoría" : "Browse by category"}
        </h2>
        <p>
          {lang === "es"
            ? "Empieza con un tipo de servicio y filtra por ciudad y disponibilidad."
            : "Start with a service type, then narrow by city and availability."}
        </p>
      </div>

      <div className="hp-cat-grid">
        {liveCategories.map((cat) => {
          const Icon = cat.icon;
          const href = countryCityServicePath(defaultCountrySlug, defaultCitySlug, cat.id);
          const catLabel = lang === "es" && cat.labelEs ? cat.labelEs : cat.label;
          const catDescription = lang === "es" && cat.descriptionEs ? cat.descriptionEs : cat.description;

          return (
            <article key={cat.id} className="hp-cat-card hp-cat-card--live">
              <div className="hp-cat-card-icon">
                <Icon size={20} />
              </div>
              <div className="hp-cat-card-body">
                <div className="hp-cat-card-top">
                  <h3 className="hp-cat-card-name">{catLabel}</h3>
                  <span className="pill pill--live">
                    {lang === "es" ? "En vivo" : "Live"}
                  </span>
                </div>
                <p className="hp-cat-card-desc">{catDescription}</p>
                <Link className="hp-cat-card-cta" href={href}>
                  {lang === "es" ? "Explorar" : "Explore"}
                </Link>
              </div>
            </article>
          );
        })}

        {comingSoonCategories.map((cat) => {
          const Icon = cat.icon;
          const catLabel = lang === "es" && cat.labelEs ? cat.labelEs : cat.label;
          const catDescription = lang === "es" && cat.descriptionEs ? cat.descriptionEs : cat.description;

          return (
            <article key={cat.id} className="hp-cat-card">
              <div className="hp-cat-card-icon hp-cat-card-icon--muted">
                <Icon size={20} />
              </div>
              <div className="hp-cat-card-body">
                <div className="hp-cat-card-top">
                  <h3 className="hp-cat-card-name">{catLabel}</h3>
                  <span className="pill pill--coming">
                    {lang === "es" ? "Próximamente" : "Coming soon"}
                  </span>
                </div>
                <p className="hp-cat-card-desc">{catDescription}</p>
                <span className="hp-cat-card-cta hp-cat-card-cta--soon">
                  {lang === "es" ? "Notifícame" : "Notify me"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
