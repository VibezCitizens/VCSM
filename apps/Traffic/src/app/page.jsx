import Link from "next/link";
import { MapPin, Scissors, Key, Utensils, Fuel, ShieldCheck, DollarSign } from "lucide-react";
import { getPlatformOrigin } from "@/lib/env";
import {
  countryCityPath,
  countryCityServicePath
} from "@/lib/paths";
import { listCities } from "@/data/repositories/city.repo";
import { getCountryById } from "@/data/repositories/geo.repo";
import { getHomepageLiveDirectoryData } from "@/data/repositories/homepage.repo";
import HomepageSearchPanel from "@/features/home/components/HomepageSearchPanel";
import HomepageTopProvidersSection from "@/features/home/components/HomepageTopProvidersSection";
import HomepageTrendingSection from "@/features/home/components/HomepageTrendingSection";

const HOMEPAGE_TITLE = "Find Local Service Providers | TRAZE";
const HOMEPAGE_DESCRIPTION =
  "Find local services by location, compare availability, and book fast on TRAZE.";

export const metadata = {
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: "/",
    type: "website",
    siteName: "TRAZE"
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION
  }
};

const DEFAULT_LOCATION_CITY_SLUG = "miami";

const TRAZE_CATEGORIES = [
  {
    id: "barber",
    label: "Barbers",
    icon: Scissors,
    description: "Local barbershops with real availability and booking.",
    live: true
  },
  {
    id: "locksmith",
    label: "Locksmiths",
    icon: ShieldCheck,
    description: "Emergency and scheduled locksmith services near you.",
    live: true
  },
  {
    id: "restaurant",
    label: "Restaurants",
    icon: Utensils,
    description: "Dine-in, takeout, and delivery options around you.",
    live: false
  },
  {
    id: "gas-station",
    label: "Gas Stations",
    icon: Fuel,
    description: "Find fuel stops and compare prices by location.",
    live: false
  },
  {
    id: "money-exchange",
    label: "Money Exchange",
    icon: DollarSign,
    description: "Currency exchange counters and wire transfer spots.",
    live: false
  }
];

function withQuery(pathname, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildClaimLandingLink(verticalId = null) {
  const url = new URL("/claim-profile", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  if (verticalId) url.searchParams.set("vertical", verticalId);
  return url.toString();
}

function buildMainPlatformLink() {
  const url = new URL("/", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  return url.toString();
}

function getHomepageLocationOptions(cities) {
  return cities
    .slice(0, 8)
    .map((city) => {
      const country = getCountryById(city.countryId);
      if (!country) return null;
      return {
        citySlug: city.slug,
        countrySlug: country.slug,
        label: `${city.name}, ${country.code}`,
        href: countryCityPath(country.slug, city.slug),
        lat: city.lat ?? null,
        lon: city.lon ?? null,
      };
    })
    .filter(Boolean);
}

function buildPopularLinks(defaultCountrySlug, defaultCitySlug) {
  return [
    {
      label: "Barber near me",
      href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber")
    },
    {
      label: "Locksmith",
      href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith")
    },
    {
      label: "Open now",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { open: "now" })
    },
    {
      label: "Top rated",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { sort: "rating" })
    }
  ];
}

function buildBrowseGroups(defaultCountrySlug, defaultCitySlug, locationOptions) {
  return [
    {
      title: "Open now",
      description: "Fast routes for immediate bookings.",
      links: [
        {
          label: "Locksmith open now",
          href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith"), { open: "now" })
        },
        {
          label: "Barber available today",
          href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber"), { open: "today" })
        },
        {
          label: "Emergency support",
          href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { query: "emergency" })
        }
      ]
    },
    {
      title: "Popular services",
      description: "Jump straight to a service type.",
      links: [
        { label: "Barber near me", href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber") },
        { label: "Locksmith near me", href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith") },
        {
          label: "Top rated providers",
          href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { sort: "rating" })
        }
      ]
    },
    {
      title: "Cities",
      description: "Browse providers by city.",
      links: locationOptions.slice(0, 6).map((entry) => ({ label: entry.label, href: entry.href }))
    }
  ];
}

function buildHeroStats(stats = []) {
  return stats
    .slice(0, 3)
    .filter((entry) => entry?.value != null && entry?.label)
    .map((entry) => ({ value: entry.value, label: entry.label }));
}

export default async function TrafficHomePage() {
  const cities = listCities();
  const locationOptions = getHomepageLocationOptions(cities);

  const defaultLocation =
    locationOptions.find((option) => option.citySlug === DEFAULT_LOCATION_CITY_SLUG) ??
    locationOptions[0] ?? null;

  const defaultCountrySlug = defaultLocation?.countrySlug ?? "us";
  const defaultCitySlug = defaultLocation?.citySlug ?? "miami";

  const homepageData = await getHomepageLiveDirectoryData({
    defaultCitySlug,
    providerLimit: 8
  });

  const popularLinks = buildPopularLinks(defaultCountrySlug, defaultCitySlug);
  const browseGroups = buildBrowseGroups(defaultCountrySlug, defaultCitySlug, locationOptions);

  const claimHref = buildClaimLandingLink();
  const mainPlatformHref = buildMainPlatformLink();
  const liveCategories = TRAZE_CATEGORIES.filter((c) => c.live);
  const comingSoonCategories = TRAZE_CATEGORIES.filter((c) => !c.live);
  const heroStats = buildHeroStats(homepageData.stats);

  return (
    <div className="homepage homepage--immersive">
      <section className="homepage-hero" id="hero">
        <div className="homepage-hero-layout">
          <div className="homepage-hero-content">
            <span className="pill homepage-eyebrow">
              <MapPin size={11} style={{ marginRight: 4 }} />
              LOCAL SERVICES DIRECTORY
            </span>

            <h1 className="homepage-hero-title">
              Search local services.
              <span className="homepage-hero-title-accent">Book with confidence.</span>
            </h1>

            <p className="homepage-hero-copy">
              Compare trusted providers by category, location, and availability in one clean marketplace.
            </p>

            <HomepageSearchPanel
              defaultLocation={defaultLocation}
              locationOptions={locationOptions}
              liveServiceSlugs={["locksmith", "barber"]}
              popularLinks={popularLinks}
            />

            {heroStats.length > 0 ? (
              <div className="homepage-hero-facts" aria-label="Directory highlights">
                {heroStats.map((stat) => (
                  <div className="homepage-hero-fact" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {defaultLocation?.label ? (
              <p className="homepage-hero-note">Showing quick routes for {defaultLocation.label}.</p>
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
                <Scissors size={12} /> Barber
              </div>
              <div className="homepage-hero-chip homepage-hero-chip--2">
                <Key size={12} /> Locksmith
              </div>
              <div className="homepage-hero-chip homepage-hero-chip--3">
                <Utensils size={12} /> Restaurant
              </div>
              <div className="homepage-hero-chip homepage-hero-chip--4">
                <Fuel size={12} /> Gas
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomepageTopProvidersSection
        providers={homepageData.providers}
        stats={homepageData.stats}
        claimHref={claimHref}
      />

      <section className="homepage-section homepage-section--divider homepage-directory-surface-soft" id="categories">
        <div className="homepage-section-heading">
          <h2 className="section-title">Browse by category</h2>
          <p>Start with a service type, then narrow by city and availability.</p>
        </div>

        <div className="hp-cat-grid">
          {liveCategories.map((cat) => {
            const Icon = cat.icon;
            const href = countryCityServicePath(defaultCountrySlug, defaultCitySlug, cat.id);
            return (
              <article key={cat.id} className="hp-cat-card hp-cat-card--live">
                <div className="hp-cat-card-icon">
                  <Icon size={20} />
                </div>
                <div className="hp-cat-card-body">
                  <div className="hp-cat-card-top">
                    <h3 className="hp-cat-card-name">{cat.label}</h3>
                    <span className="pill pill--live">Live</span>
                  </div>
                  <p className="hp-cat-card-desc">{cat.description}</p>
                  <Link className="hp-cat-card-cta" href={href}>
                    Explore
                  </Link>
                </div>
              </article>
            );
          })}

          {comingSoonCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <article key={cat.id} className="hp-cat-card">
                <div className="hp-cat-card-icon hp-cat-card-icon--muted">
                  <Icon size={20} />
                </div>
                <div className="hp-cat-card-body">
                  <div className="hp-cat-card-top">
                    <h3 className="hp-cat-card-name">{cat.label}</h3>
                    <span className="pill pill--coming">Coming soon</span>
                  </div>
                  <p className="hp-cat-card-desc">{cat.description}</p>
                  <span className="hp-cat-card-cta hp-cat-card-cta--soon">Notify me</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <HomepageTrendingSection groups={browseGroups} />

      <section className="homepage-section homepage-section--divider homepage-cta-panel homepage-directory-surface" id="provider-cta">
        <h2 className="homepage-claim-title">Get discovered. Get booked.</h2>
        <p className="homepage-hero-copy">
          Publish your business, show availability, and accept bookings from local customers.
        </p>
        <div className="homepage-cta-row">
          <a className="pill pill--primary pill--strong" href={claimHref} target="_blank" rel="noreferrer">
            Start listing
          </a>
          <a className="pill pill--ghost" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Open Vibez Citizens
          </a>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="homepage-footer-brand">
          <p className="homepage-footer-name">TRAZE</p>
          <p className="homepage-footer-powered">Powered by Vibez Citizens</p>
        </div>

        <div className="homepage-footer-links">
          <a className="homepage-footer-link" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Vibez Citizens
          </a>
          <Link className="homepage-footer-link" href="/us">
            Directory
          </Link>
          <Link className="homepage-footer-link" href="/sitemap-index.xml">
            Sitemap
          </Link>
          <a className="homepage-footer-link homepage-footer-link--strong" href={claimHref} target="_blank" rel="noreferrer">
            Claim Profile
          </a>
        </div>
      </footer>
    </div>
  );
}
