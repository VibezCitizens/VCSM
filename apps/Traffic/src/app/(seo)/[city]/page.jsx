import { notFound } from "next/navigation";
import {
  listCityStaticParams,
  listCountryStaticParams
} from "@/data/repositories/staticParams.repo";
import { resolvePage, buildCountryMetadata, buildLegacyCityMetadata } from "./_graph";
import { renderCountryPage, renderLegacyCityPage } from "./_renderers";

export const revalidate = 900;

function dedupeCityParams(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = entry.city;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entry);
  }

  return output;
}

export function generateStaticParams() {
  const countryPages = listCountryStaticParams().map((entry) => ({ city: entry.country }));
  return dedupeCityParams([...countryPages, ...listCityStaticParams()]);
}

export function generateMetadata({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country") {
    return buildCountryMetadata(graph);
  }

  return buildLegacyCityMetadata(graph);
}

export default function CityPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country") {
    return renderCountryPage(graph);
  }

  return renderLegacyCityPage(graph);
}
