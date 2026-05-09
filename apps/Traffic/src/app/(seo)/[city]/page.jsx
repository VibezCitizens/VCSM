import { notFound, redirect } from "next/navigation";
import {
  listCityStaticParams,
  listCountryStaticParams
} from "@/data/repositories/staticParams.repo";
import { resolvePage, buildCountryMetadata, buildLegacyCityMetadata } from "./_graph";
import { renderCountryPage, renderLegacyCityPage } from "./_renderers";
import { countryPath } from "@/lib/paths";

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

export function generateMetadataForLocale({ params }, routeLocale = null) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country") {
    return buildCountryMetadata(graph, { routeLocale });
  }

  return buildLegacyCityMetadata(graph, { routeLocale });
}

export function generateMetadata({ params }) {
  return generateMetadataForLocale({ params });
}

export default function CityPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country") {
    if (params.city !== graph.country.slug) {
      redirect(countryPath(graph.country.slug));
    }

    return renderCountryPage(graph);
  }

  return renderLegacyCityPage(graph);
}
