import { getPlatformOrigin } from "@/lib/env";
import {
  countryCityPath,
  countryCityServicePath
} from "@/lib/paths";
import { listCities } from "@/data/repositories/city.repo";
import { getCountryById } from "@/data/repositories/geo.repo";
import { getHomepageLiveDirectoryData } from "@/data/repositories/homepage.repo";
import HomepageHeroSection from "@/features/home/components/HomepageHeroSection";
import HomepageTopProvidersSection from "@/features/home/components/HomepageTopProvidersSection";
import HomepageTrendingSection from "@/features/home/components/HomepageTrendingSection";
import HomepageCategoryGrid from "@/features/home/components/HomepageCategoryGrid";
import HomepageCtaFooter from "@/features/home/components/HomepageCtaFooter";

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
      labelEs: "Barbero cerca de mí",
      href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber")
    },
    {
      label: "Locksmith",
      labelEs: "Cerrajero",
      href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith")
    },
    {
      label: "Open now",
      labelEs: "Abierto ahora",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { open: "now" })
    },
    {
      label: "Top rated",
      labelEs: "Mejor calificados",
      href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { sort: "rating" })
    }
  ];
}

function buildBrowseGroups(defaultCountrySlug, defaultCitySlug, locationOptions) {
  return [
    {
      title: "Open now",
      titleEs: "Abierto ahora",
      description: "Fast routes for immediate bookings.",
      descriptionEs: "Rutas rápidas para reservas inmediatas.",
      links: [
        {
          label: "Locksmith open now",
          labelEs: "Cerrajero disponible ahora",
          href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith"), { open: "now" })
        },
        {
          label: "Barber available today",
          labelEs: "Barbero disponible hoy",
          href: withQuery(countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber"), { open: "today" })
        },
        {
          label: "Emergency support",
          labelEs: "Soporte de emergencia",
          href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { query: "emergency" })
        }
      ]
    },
    {
      title: "Popular services",
      titleEs: "Servicios populares",
      description: "Jump straight to a service type.",
      descriptionEs: "Ve directo a un tipo de servicio.",
      links: [
        {
          label: "Barber near me",
          labelEs: "Barbero cerca de mí",
          href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "barber")
        },
        {
          label: "Locksmith near me",
          labelEs: "Cerrajero cerca de mí",
          href: countryCityServicePath(defaultCountrySlug, defaultCitySlug, "locksmith")
        },
        {
          label: "Top rated providers",
          labelEs: "Proveedores mejor calificados",
          href: withQuery(countryCityPath(defaultCountrySlug, defaultCitySlug), { sort: "rating" })
        }
      ]
    },
    {
      title: "Cities",
      titleEs: "Ciudades",
      description: "Browse providers by city.",
      descriptionEs: "Explora proveedores por ciudad.",
      links: locationOptions.slice(0, 6).map((entry) => ({
        label: entry.label,
        labelEs: entry.label,
        href: entry.href
      }))
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
  const heroStats = buildHeroStats(homepageData.stats);

  return (
    <div className="homepage homepage--immersive">
      <HomepageHeroSection
        defaultLocation={defaultLocation}
        locationOptions={locationOptions}
        liveServiceSlugs={["locksmith", "barber"]}
        popularLinks={popularLinks}
        heroStats={heroStats}
      />

      <HomepageTopProvidersSection
        providers={homepageData.providers}
        stats={homepageData.stats}
        claimHref={claimHref}
      />

      <HomepageCategoryGrid
        defaultCountrySlug={defaultCountrySlug}
        defaultCitySlug={defaultCitySlug}
      />

      <HomepageTrendingSection groups={browseGroups} />

      <HomepageCtaFooter
        claimHref={claimHref}
        mainPlatformHref={mainPlatformHref}
      />
    </div>
  );
}
