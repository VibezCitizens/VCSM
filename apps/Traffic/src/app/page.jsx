import Link from "next/link";
import { getPlatformOrigin } from "@/lib/env";
import {
  contentGuideCanonicalPath,
  countryCityPath,
  countryCityServicePath,
  countryProviderPath
} from "@/lib/paths";
import { getProviderStats } from "@/data/repositories/aggregate.repo";
import { getHomepageGuidePreviewPages } from "@/data/repositories/content.repo";
import { listCities, listLocalitiesByCity } from "@/data/repositories/city.repo";
import { getCountryById } from "@/data/repositories/geo.repo";
import { listProviders, listProvidersByCity } from "@/data/repositories/provider.repo";
import { getServiceById } from "@/data/repositories/service.repo";
import HomepageGuidesPreviewSection from "@/features/home/components/HomepageGuidesPreviewSection";
import HomepageLocationContext from "@/features/home/components/HomepageLocationContext";
import HomepageQuickActions from "@/features/home/components/HomepageQuickActions";
import HomepageSearchPanel from "@/features/home/components/HomepageSearchPanel";
import HomepageTopProvidersSection from "@/features/home/components/HomepageTopProvidersSection";
import HomepageTrendingSection from "@/features/home/components/HomepageTrendingSection";
import HomepageTrustStrip from "@/features/home/components/HomepageTrustStrip";

const HOMEPAGE_TITLE = "Find Local Service Providers | TRAZE";
const HOMEPAGE_DESCRIPTION =
  "Discover trusted local providers by city and category on TRAZE, compare credibility signals, and take action quickly.";

export const metadata = {
  title: HOMEPAGE_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
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

const HOMEPAGE_VERTICALS = [
  {
    id: "barbers",
    label: "Barbers",
    blurb: "Fades, beard trims, and local barbershop discovery.",
    href: "/us/san-francisco/barber",
    status: "Live"
  },
  {
    id: "locksmiths",
    label: "Locksmiths",
    blurb: "Emergency lockout, rekey, and mobile key services.",
    href: "/us/san-francisco/locksmith",
    status: "Live"
  },
  {
    id: "restaurants",
    label: "Restaurants",
    blurb: "Restaurant discovery and menu-rich business profiles.",
    href: null,
    status: "Launching"
  },
  {
    id: "gas-stations",
    label: "Gas Stations",
    blurb: "Fuel-stop discovery with location-first coverage.",
    href: null,
    status: "Launching"
  },
  {
    id: "money-exchange",
    label: "Money Exchange",
    blurb: "Currency exchange providers by city and district.",
    href: null,
    status: "Launching"
  }
];

const HOMEPAGE_CITY_SLUGS = [
  "san-francisco",
  "miami",
  "london",
  "berlin",
  "mexico-city",
  "dubai",
  "toronto"
];

const DEFAULT_LOCATION_CITY_SLUG = "miami";
const FALLBACK_GUIDE_ITEMS = [
  {
    title: "What To Do During a Lockout",
    summary: "Step-by-step emergency actions before calling a provider.",
    tag: "Emergency",
    href: null
  },
  {
    title: "How To Compare Local Provider Profiles",
    summary: "A quick framework for ratings, response speed, and trust cues.",
    tag: "Booking Tips",
    href: null
  },
  {
    title: "Neighborhood Service Safety Checklist",
    summary: "Practical checks for first-time local service bookings.",
    tag: "Safety",
    href: null
  }
];

function withQuery(pathname, params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildClaimLandingLink(verticalId = null) {
  const url = new URL("/claim-profile", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");

  if (verticalId) {
    url.searchParams.set("vertical", verticalId);
  }

  return url.toString();
}

function buildMainPlatformLink() {
  const url = new URL("/", getPlatformOrigin());
  url.searchParams.set("source", "traffic");
  url.searchParams.set("surface", "homepage");
  return url.toString();
}

function getServiceMixForCity(cityDirectoryItems) {
  const serviceCounts = new Map();

  for (const item of cityDirectoryItems) {
    const uniqueServiceIds = new Set(item.providerServices.map((providerService) => providerService.serviceId));
    for (const serviceId of uniqueServiceIds) {
      serviceCounts.set(serviceId, (serviceCounts.get(serviceId) ?? 0) + 1);
    }
  }

  return [...serviceCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([serviceId]) => getServiceById(serviceId)?.name)
    .filter(Boolean);
}

function getPopularCityCards(cities) {
  return HOMEPAGE_CITY_SLUGS.map((citySlug) => cities.find((entry) => entry.slug === citySlug))
    .filter(Boolean)
    .map((city) => {
      const country = getCountryById(city.countryId);
      if (!country) {
        return null;
      }

      const cityDirectoryItems = listProvidersByCity(city.id);
      const providerCount = cityDirectoryItems.length;
      const localityCount = listLocalitiesByCity(city.id).length;
      const verifiedCount = cityDirectoryItems.filter((item) => Boolean(item.provider.vcsmActorId)).length;
      const topServices = getServiceMixForCity(cityDirectoryItems);

      return {
        city,
        country,
        providerCount,
        localityCount,
        verifiedCount,
        topServices,
        href: countryCityPath(country.slug, city.slug),
        contextLabel: topServices.length ? `Top in ${topServices.join(" + ")}` : "Multi-service coverage"
      };
    })
    .filter(Boolean);
}

function getMedian(values) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middleIndex];
  }

  return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function getHomepageTrustData(cities) {
  const providers = listProviders();
  const statsRows = providers
    .map((provider) => getProviderStats(provider.id))
    .filter(Boolean);

  const verifiedCount = providers.filter((provider) => Boolean(provider.vcsmActorId)).length;
  const activeCityCount = new Set(providers.map((provider) => provider.primaryCityId)).size;
  const bookings30d = statsRows.reduce((sum, row) => sum + (row.bookingCount30d ?? 0), 0);

  const averageRating =
    statsRows.reduce((sum, row) => sum + (row.ratingAvg ?? 0), 0) / Math.max(statsRows.length, 1);

  const medianResponseMinutes = getMedian(
    statsRows
      .map((row) => row.responseTimeP50Minutes)
      .filter((value) => Number.isFinite(value))
  );

  return {
    heroPills: [
      `${verifiedCount} verified businesses`,
      `Avg rating ${averageRating.toFixed(1)}`,
      `${Math.round(medianResponseMinutes ?? 0)}m median response`
    ],
    stripSignals: [
      {
        label: "Verified businesses",
        value: formatCompact(verifiedCount)
      },
      {
        label: "Average provider rating",
        value: averageRating.toFixed(1)
      },
      {
        label: "Median response speed",
        value: `${Math.round(medianResponseMinutes ?? 0)} min`
      },
      {
        label: "Active cities",
        value: String(activeCityCount || cities.length)
      },
      {
        label: "Bookings in last 30 days",
        value: formatCompact(bookings30d)
      }
    ]
  };
}

function getHomepageLocationOptions(cities) {
  return cities
    .slice(0, 7)
    .map((city) => {
      const country = getCountryById(city.countryId);
      if (!country) {
        return null;
      }

      return {
        citySlug: city.slug,
        countrySlug: country.slug,
        label: `${city.name}, ${country.code}`,
        href: countryCityPath(country.slug, city.slug)
      };
    })
    .filter(Boolean);
}

function getTopProvidersNearCity(cities, citySlug = DEFAULT_LOCATION_CITY_SLUG, limit = 5) {
  const city = cities.find((entry) => entry.slug === citySlug) ?? cities[0] ?? null;
  if (!city) {
    return [];
  }

  const country = getCountryById(city.countryId);
  if (!country) {
    return [];
  }

  return listProvidersByCity(city.id)
    .slice(0, limit)
    .map((item) => {
      const firstService = item.providerServices
        .map((providerService) => getServiceById(providerService.serviceId))
        .find(Boolean);

      return {
        id: item.provider.id,
        name: item.provider.displayName,
        category: firstService?.name ?? "Local service provider",
        cityLabel: `${city.name}, ${country.name}`,
        rating: item.stats?.ratingAvg?.toFixed(1) ?? "--",
        reviewCount: item.stats?.reviewCount ?? 0,
        responseMinutes: item.stats?.responseTimeP50Minutes ?? "--",
        verified: Boolean(item.provider.vcsmActorId),
        href: countryProviderPath(country.slug, item.provider.slug)
      };
    });
}

function buildQuickActions(defaultCountrySlug, defaultCitySlug, claimHref) {
  return [
    {
      label: "Emergency locksmith",
      href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith"), {
        intent: "emergency"
      })
    },
    {
      label: "Barber near me",
      href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber")
    },
    {
      label: "Gas station nearby",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), {
        query: "gas station"
      })
    },
    {
      label: "Open now",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), {
        open: "now"
      })
    },
    {
      label: "Top rated",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), {
        sort: "rating"
      })
    },
    {
      label: "Claim your profile",
      href: claimHref,
      external: true
    }
  ];
}

function buildTrendingGroups(defaultCountrySlug, defaultCitySlug, cityCards) {
  const londonCard = cityCards.find((entry) => entry.city.slug === "london") ?? cityCards[0] ?? null;
  const miamiCard = cityCards.find((entry) => entry.city.slug === "miami") ?? cityCards[0] ?? null;

  return [
    {
      title: "Popular searches",
      description: "What users search for most often right now.",
      links: [
        { label: "Locksmith in Miami", href: countryCityServicePath(defaultCountrySlug, "miami", "locksmith") },
        { label: "Barber in San Francisco", href: countryCityServicePath(defaultCountrySlug, "san-francisco", "barber") },
        {
          label: "24/7 lockout help",
          href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith"), { intent: "after-hours" })
        }
      ]
    },
    {
      title: "Trending services",
      description: "Growing service categories with strong profile activity.",
      links: [
        { label: "Top locksmiths", href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith") },
        { label: "Top barbers", href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber") },
        { label: "Emergency support", href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { query: "emergency" }) }
      ]
    },
    {
      title: "Browse by city",
      description: "Jump into active local directories.",
      links: cityCards.slice(0, 4).map((entry) => ({
        label: entry.city.name,
        href: entry.href
      }))
    },
    {
      title: "Emergency services",
      description: "Fast-access routes for urgent local intents.",
      links: [
        {
          label: miamiCard ? `Miami emergency` : "Emergency near me",
          href: miamiCard ? withQuery(miamiCard.href, { query: "emergency" }) : countryCityPath(defaultCountrySlug, defaultCitySlug)
        },
        {
          label: londonCard ? `London rapid response` : "Rapid response",
          href: londonCard ? withQuery(londonCard.href, { query: "rapid response" }) : countryCityPath(defaultCountrySlug, defaultCitySlug)
        },
        {
          label: "See all cities",
          href: "/"
        }
      ]
    }
  ];
}

async function getGuidePreviewItems() {
  const liveGuides = await getHomepageGuidePreviewPages({ limit: 3 });

  if (!liveGuides.length) {
    return FALLBACK_GUIDE_ITEMS;
  }

  return liveGuides.map((guide) => ({
    title: guide.title,
    summary: guide.excerpt ?? "Local service insights and practical tips.",
    tag: guide.category,
    meta: [guide.providerName, guide.locationText].filter(Boolean).join(" · ") || null,
    href: contentGuideCanonicalPath(guide.profileSlug, guide.slug)
  }));
}

export default async function TrafficHomePage() {
  const cities = listCities();
  const cityCards = getPopularCityCards(cities);
  const locationOptions = getHomepageLocationOptions(cities);

  const defaultLocation =
    locationOptions.find((option) => option.citySlug === DEFAULT_LOCATION_CITY_SLUG) ?? locationOptions[0] ?? null;

  const defaultCountrySlug = defaultLocation?.countrySlug ?? "us";
  const defaultCitySlug = defaultLocation?.citySlug ?? "miami";
  const topProviders = getTopProvidersNearCity(cities, defaultCitySlug, 5);

  const trustData = getHomepageTrustData(cities);
  const quickActions = buildQuickActions(defaultCountrySlug, defaultCitySlug, buildClaimLandingLink());
  const trendingGroups = buildTrendingGroups(defaultCountrySlug, defaultCitySlug, cityCards);
  const guidePreviewItems = await getGuidePreviewItems();

  const activeProviderCount = listProviders().length;
  const liveCategoryCount = HOMEPAGE_VERTICALS.filter((vertical) => Boolean(vertical.href)).length;

  const exploreHref = countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith");
  const claimHref = buildClaimLandingLink();
  const mainPlatformHref = buildMainPlatformLink();

  return (
    <div className="homepage">
      <section className="card card--hero homepage-hero">
        <span className="pill homepage-eyebrow">Global Local Services Directory</span>
        <h1 className="homepage-hero-title">Find trusted providers near you and book with confidence.</h1>
        <p className="homepage-hero-copy">
          Explore city-based service directories, compare real credibility signals, and connect with
          businesses growing on TRAZE.
        </p>

        <HomepageSearchPanel
          defaultLocation={defaultLocation}
          locationOptions={locationOptions}
          liveServiceSlugs={["locksmith", "barber"]}
        />

        <div className="homepage-stat-row">
          {trustData.heroPills.map((item) => (
            <span key={item} className="pill">
              {item}
            </span>
          ))}
          <span className="pill">{activeProviderCount} active providers</span>
          <span className="pill">{liveCategoryCount} live categories</span>
        </div>

        <div className="homepage-cta-row">
          <Link className="pill pill--primary pill--strong" href={exploreHref}>
            Explore on TRAZE
          </Link>
          <a className="pill pill--ghost" href={claimHref} target="_blank" rel="noreferrer">
            Claim Your Profile
          </a>
        </div>
      </section>

      <HomepageQuickActions actions={quickActions} />

      <HomepageTrustStrip signals={trustData.stripSignals} />

      <HomepageTopProvidersSection providers={topProviders} />

      <section className="card homepage-section">
        <div className="homepage-section-heading">
          <h2 className="section-title">Browse Service Categories</h2>
          <p>Start with live verticals today and claim your business in upcoming categories.</p>
        </div>

        <div className="homepage-grid-categories">
          {HOMEPAGE_VERTICALS.map((vertical) => {
            const href = vertical.href ?? buildClaimLandingLink(vertical.id);
            const isExternal = !vertical.href;
            const isLive = Boolean(vertical.href);

            return (
              <article
                key={vertical.id}
                className={`homepage-card ${
                  isLive ? "homepage-category-card--live" : "homepage-category-card--launching"
                }`}
              >
                <div className="homepage-card-top">
                  <h3 className="homepage-card-title">{vertical.label}</h3>
                  <span className={`pill ${isLive ? "pill--live" : "pill--coming"}`}>
                    {isLive ? "Live Now" : "Coming Soon"}
                  </span>
                </div>
                <p className="text-sm">{vertical.blurb}</p>
                {!isLive ? (
                  <p className="homepage-meta-note">
                    Provider onboarding is open while this category is being rolled out.
                  </p>
                ) : null}
                {isExternal ? (
                  <a className="pill pill--ghost fit-width" href={href} target="_blank" rel="noreferrer">
                    Join As Provider
                  </a>
                ) : (
                  <Link className="pill pill--ghost fit-width" href={href}>
                    Open TRAZE Directory
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <HomepageTrendingSection groups={trendingGroups} />

      <HomepageLocationContext
        currentLocationLabel={defaultLocation?.label ?? "Miami, FL"}
        nearbyOptions={locationOptions.slice(0, 5).map((option) => ({
          label: option.label,
          href: option.href
        }))}
      />

      <section className="card homepage-section">
        <div className="homepage-section-heading">
          <h2 className="section-title">Popular Cities</h2>
          <p>Jump directly into active city directories with live providers.</p>
        </div>

        <div className="homepage-grid-cities">
          {cityCards.map((entry) => (
            <Link key={entry.city.id} href={entry.href} className="homepage-card homepage-city-card">
              <h3 className="homepage-city-title">{entry.city.name}</h3>
              <p className="text-sm">{entry.country.name}</p>
              <p className="homepage-meta-note">{entry.contextLabel}</p>
              <div className="homepage-chip-row">
                <span className="pill">{entry.providerCount} providers</span>
                <span className="pill">{entry.localityCount} local areas</span>
                {entry.verifiedCount > 0 ? <span className="pill pill--ok">{entry.verifiedCount} verified</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <HomepageGuidesPreviewSection items={guidePreviewItems} />

      <section className="card homepage-section">
        <h2 className="section-title">How It Works</h2>

        <div className="homepage-grid-steps">
          {[
            {
              step: "1",
              title: "Search and discover",
              text: "Start with quick intents, city pages, or category hubs to find local matches faster."
            },
            {
              step: "2",
              title: "Compare trust signals",
              text: "Use ratings, verification status, and response indicators before contacting providers."
            },
            {
              step: "3",
              title: "Claim and grow with TRAZE",
              text: "Business owners can claim listings and activate full profile, trust, and booking tools on TRAZE."
            }
          ].map((item) => (
            <article key={item.step} className="homepage-card homepage-step-card">
              <span className="pill fit-width">Step {item.step}</span>
              <h3 className="homepage-card-title">{item.title}</h3>
              <p className="text-sm">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card card--cta homepage-section">
        <h2 className="homepage-claim-title">Own a Service Business?</h2>
        <p className="homepage-hero-copy">
          Claim your listing and run your full business profile on TRAZE with discovery,
          trust signals, and conversion workflows built for local service growth.
        </p>
        <div className="homepage-cta-row">
          <a className="pill pill--primary pill--strong" href={claimHref} target="_blank" rel="noreferrer">
            Claim Your Profile
          </a>
          <a className="pill pill--ghost" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Open TRAZE
          </a>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="homepage-footer-top">
          <p className="text-sm">TRAZE Directory</p>
          <p className="text-xs">Discovery for users. Growth for providers.</p>
        </div>
        <div className="homepage-footer-links">
          <a className="pill pill--ghost" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Main Platform
          </a>
          <Link className="pill" href="/sitemap-index.xml">
            Sitemap
          </Link>
          <a className="pill" href={claimHref} target="_blank" rel="noreferrer">
            Claim Profile
          </a>
        </div>
      </footer>
    </div>
  );
}
