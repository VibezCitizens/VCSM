import { notFound, redirect } from "next/navigation";
import {
  listCityStaticParams,
  listCountryStaticParams
} from "@/data/repositories/staticParams.repo";
import { listCountries } from "@/data/repositories/geo.repo";
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
  const combined = dedupeCityParams([...countryPages, ...listCityStaticParams()]);
  if (combined.length > 0) return combined;
  // Taxonomy fallback: when Supabase is unavailable at build time all provider-based
  // functions return empty. Enumerate country slugs from the static taxonomy so the
  // route is always included in the export. Pages with no live providers call notFound().
  return listCountries().map((c) => ({ city: c.slug }));
}

export async function generateMetadataForLocale({ params }, routeLocale = null) {
  const resolvedParams = await params;
  const graph = resolvePage(resolvedParams);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country") {
    return buildCountryMetadata(graph, { routeLocale });
  }

  return buildLegacyCityMetadata(graph, { routeLocale });
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return generateMetadataForLocale({ params: resolvedParams });
}

export default async function CityPage({ params }) {
  const resolvedParams = await params;
  const graph = resolvePage(resolvedParams);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country") {
    if (resolvedParams.city !== graph.country.slug) {
      redirect(countryPath(graph.country.slug));
    }

    return renderCountryPage(graph);
  }

  return renderLegacyCityPage(graph);
}
