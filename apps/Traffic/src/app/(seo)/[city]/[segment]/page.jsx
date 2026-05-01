import { notFound } from "next/navigation";
import {
  listCityServiceStaticParams,
  listCountryCityStaticParams
} from "@/data/repositories/staticParams.repo";
import { resolvePage, buildCountryCityMetadata, buildLegacyCityServiceMetadata } from "./_graph";
import { renderCountryCityPage, renderLegacyCityServicePage } from "./_renderers";

export const revalidate = 900;

function dedupeParamPairs(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.city}::${entry.segment}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const globalCountryCity = listCountryCityStaticParams().map((entry) => ({
    city: entry.country,
    segment: entry.city
  }));

  const legacyCityService = listCityServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.service
  }));

  return dedupeParamPairs([...globalCountryCity, ...legacyCityService]);
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_city") {
    return buildCountryCityMetadata(graph);
  }

  return buildLegacyCityServiceMetadata(graph);
}

export default function DualSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_city") {
    return renderCountryCityPage(graph);
  }

  return renderLegacyCityServicePage(graph);
}
