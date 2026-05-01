import { notFound } from "next/navigation";
import {
  listCountryCityServiceStaticParams,
  listCountryProviderStaticParams,
  listCountryServiceHubStaticParams,
  listNeighborhoodServiceStaticParams
} from "@/data/repositories/staticParams.repo";
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

export const revalidate = 900;

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
    service: entry.service
  }));

  const countryServiceHubs = listCountryServiceHubStaticParams().map((entry) => ({
    city: entry.country,
    segment: "services",
    service: entry.service
  }));

  const legacyLocalityService = listNeighborhoodServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.neighborhood,
    service: entry.service
  }));

  const countryProvider = listCountryProviderStaticParams().map((entry) => ({
    city: entry.country,
    segment: "pro",
    service: entry.providerSlug
  }));

  return dedupeParamTriples([
    ...globalCountryCityService,
    ...countryServiceHubs,
    ...legacyLocalityService,
    ...countryProvider
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
