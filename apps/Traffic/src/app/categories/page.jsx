import { listTrazeCategories } from "@/data/repositories/category.repo";
import {
  listLiveProviderCountries,
  listLiveProviderLocationOptions
} from "@/data/repositories/provider.repo";
import { listCountryServiceHubStaticParams } from "@/data/repositories/staticParams.repo";
import { getServiceBySlug } from "@/data/repositories/service.repo";
import { countryServiceHubPath } from "@/lib/paths";
import { CategoriesDiscoveryClient } from "@/features/categories/adapters/categories.adapter";
import { buildProvidersByCountryCode } from "@/features/categories/lib/categoryProviders";
import { TrazePageShell } from "@/shared/components/TrazePageShell";
import SeoCrawlLinksLocalized from "@/shared/components/SeoCrawlLinksLocalized";
import { buildDirectoryMetadata } from "@/seo/metadata";
import { getAggregatorIndexRobots } from "@/seo/qualityGuards";

export function buildCategoriesMetadata(routeLocale = null) {
  return buildDirectoryMetadata({
    title: "Service Categories | TRAZE",
    description: "Choose your country to explore live service categories on TRAZE.",
    path: "/categories",
    routeLocale,
    // Density gate: this global aggregator is noindex unless >=2 live countries
    // exist (see getAggregatorIndexRobots) so it never becomes a thin surface.
    robots: getAggregatorIndexRobots(listLiveProviderCountries().length)
  });
}

export const metadata = buildCategoriesMetadata();

// Crawlable SSR links so Category -> Country -> Provider is discoverable without
// client interaction. Every target is guaranteed to exist: per-country category
// pages are generated for each live country, and service-hub links are taken
// straight from the generated static-param set (never a 404).
function buildCategoriesCrawlGroups(countries) {
  const countryNameBySlug = new Map(countries.map((country) => [country.countrySlug, country.name]));
  const countryNameEsBySlug = new Map(
    countries.map((country) => [country.countrySlug, country.nameEs ?? country.name])
  );

  // EN labels feed the SSR HTML (crawlable, lang=en invariant); ES labels are
  // swapped in client-side on /es routes by SeoCrawlLinksLocalized. hrefs are
  // shared by both languages.
  const countryLinks = countries.map((country) => ({
    href: `/${country.countrySlug}/categories`,
    label: `Service categories in ${country.name}`,
    labelEs: `Categorías de servicio en ${country.nameEs ?? country.name}`
  }));

  const serviceHubLinks = listCountryServiceHubStaticParams().map((entry) => {
    const service = getServiceBySlug(entry.service);
    const serviceName = service?.name ?? entry.service;
    const serviceNameEs = service?.nameEs ?? serviceName;
    const countryName = countryNameBySlug.get(entry.country) ?? entry.country;
    const countryNameEs = countryNameEsBySlug.get(entry.country) ?? countryName;
    return {
      href: countryServiceHubPath(entry.country, entry.service),
      label: `${serviceName} in ${countryName}`,
      labelEs: `${serviceNameEs} en ${countryNameEs}`
    };
  });

  return [
    {
      heading: "Browse categories by country",
      headingEs: "Explorar categorías por país",
      links: countryLinks
    },
    {
      heading: "Popular services by country",
      headingEs: "Servicios populares por país",
      links: serviceHubLinks
    }
  ];
}

export default async function CategoriesPage() {
  const countries = listLiveProviderCountries();
  const locationOptions = listLiveProviderLocationOptions();
  const entries = await Promise.all(
    countries.map(async (country) => [
      country.countryCode,
      await listTrazeCategories({ countryCode: country.countryCode })
    ])
  );

  return (
    <TrazePageShell>
      <CategoriesDiscoveryClient
        countries={countries}
        categoriesByCountryCode={Object.fromEntries(entries)}
        providersByCountryCode={buildProvidersByCountryCode(countries)}
        locationOptions={locationOptions}
      />
      <SeoCrawlLinksLocalized
        title="Explore service categories"
        titleEs="Explora categorías de servicios"
        groups={buildCategoriesCrawlGroups(countries)}
        muted
      />
    </TrazePageShell>
  );
}
