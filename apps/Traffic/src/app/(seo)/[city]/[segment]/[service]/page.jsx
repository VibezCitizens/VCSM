import { notFound } from "next/navigation";
import {
  listCountryCityServiceStaticParams,
  listCountryProviderStaticParams,
  listCountryServiceHubStaticParams,
  listNeighborhoodServiceStaticParams
} from "@/data/repositories/staticParams.repo";
import {
  listCountryCityServiceTaxonomyParams,
  listCountryServiceHubTaxonomyParams,
  listNeighborhoodServiceTaxonomyParams,
  listMockProviderSlugParams,
} from "@/data/repositories/taxonomyParams.repo";
import {
  resolvePage,
  buildCountryProviderMetadata,
  buildCountryServiceHubMetadata,
  buildCountryCityServiceMetadata,
  buildLegacyLocalityServiceMetadata
} from "./_graph";
import { renderCountryProviderPage } from "./_providerRenderer";
import {
  renderCountryServiceHubPage,
  renderCountryCityServicePage,
  renderLegacyLocalityServicePage
} from "./_directoryRenderers";

function dedupeParamTriples(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}::${entry.service}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCityService = listCountryCityServiceStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.service,
  }));

  const countryServiceHubs = listCountryServiceHubStaticParams().map((entry) => ({
    city: entry.country,
    segment: "services",
    service: entry.service,
  }));

  const legacyLocalityService = listNeighborhoodServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.neighborhood,
    service: entry.service,
  }));

  const countryProvider = listCountryProviderStaticParams().map((entry) => ({
    city: entry.country,
    segment: "pro",
    service: entry.providerSlug,
  }));

  const combined = dedupeParamTriples([
    ...globalCountryCityService,
    ...countryServiceHubs,
    ...legacyLocalityService,
    ...countryProvider,
  ]);

  // Taxonomy fallback: when Supabase is unavailable at build time, all provider-based
  // functions return empty. Enumerate taxonomy-based params so the route always
  // generates pages. Pages with no live data call notFound() at render time.
  if (combined.length > 0) return combined;

  const fallbackCityService = listCountryCityServiceTaxonomyParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
    service: entry.service,
  }));
  const fallbackServiceHubs = listCountryServiceHubTaxonomyParams().map((entry) => ({
    city: entry.country,
    segment: "services",
    service: entry.service,
  }));
  const fallbackNeighborhood = listNeighborhoodServiceTaxonomyParams().map((entry) => ({
    city: entry.city,
    segment: entry.neighborhood,
    service: entry.service,
  }));
  const fallbackProviders = listMockProviderSlugParams().map((entry) => ({
    city: "united-states",
    segment: "pro",
    service: entry.providerSlug,
  }));

  return dedupeParamTriples([
    ...fallbackCityService,
    ...fallbackServiceHubs,
    ...fallbackNeighborhood,
    ...fallbackProviders,
  ]);
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_provider") {
    return buildCountryProviderMetadata(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return buildCountryCityServiceMetadata(graph);
  }

  if (graph.routeMode === "country_service_hub") {
    return buildCountryServiceHubMetadata(graph);
  }

  return buildLegacyLocalityServiceMetadata(graph);
}

export default async function TripleSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_provider") {
    return renderCountryProviderPage(graph);
  }

  if (graph.routeMode === "country_city_service") {
    return renderCountryCityServicePage(graph);
  }

  if (graph.routeMode === "country_service_hub") {
    return renderCountryServiceHubPage(graph);
  }

  return renderLegacyLocalityServicePage(graph);
}
