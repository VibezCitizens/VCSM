import { notFound, redirect } from "next/navigation";
import {
  listCityServiceStaticParams,
  listCountryCityStaticParams
} from "@/data/repositories/staticParams.repo";
import {
  listCountryCityTaxonomyParams,
  listCityServiceTaxonomyParams,
} from "@/data/repositories/taxonomyParams.repo";
import { resolvePage, buildCountryCityMetadata, buildLegacyCityServiceMetadata } from "./_graph";
import { renderCountryCityPage, renderLegacyCityServicePage } from "./_renderers";
import { countryCityPath } from "@/lib/paths";

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
    segment: entry.city,
  }));

  const legacyCityService = listCityServiceStaticParams().map((entry) => ({
    city: entry.city,
    segment: entry.service,
  }));

  const combined = dedupeParamPairs([...globalCountryCity, ...legacyCityService]);

  // Taxonomy fallback: when Supabase is unavailable at build time, provider-based
  // functions return empty. Enumerate taxonomy-based params so the route always
  // generates pages. Pages with no live data call notFound() at render time.
  if (combined.length > 0) return combined;

  const fallbackCountryCity = listCountryCityTaxonomyParams().map((entry) => ({
    city: entry.country,
    segment: entry.city,
  }));
  const fallbackCityService = listCityServiceTaxonomyParams().map((entry) => ({
    city: entry.city,
    segment: entry.service,
  }));

  return dedupeParamPairs([...fallbackCountryCity, ...fallbackCityService]);
}

export function generateMetadataForLocale({ params }, routeLocale = null) {
  const graph = resolvePage(params);
  if (!graph) {
    return {};
  }

  if (graph.routeMode === "country_city") {
    return buildCountryCityMetadata(graph, { routeLocale });
  }

  return buildLegacyCityServiceMetadata(graph, { routeLocale });
}

export function generateMetadata({ params }) {
  return generateMetadataForLocale({ params });
}

export default function DualSegmentPage({ params }) {
  const graph = resolvePage(params);
  if (!graph) {
    notFound();
  }

  if (graph.routeMode === "country_city") {
    if (params.city !== graph.country.slug) {
      redirect(countryCityPath(graph.country.slug, graph.city.slug));
    }

    return renderCountryCityPage(graph);
  }

  return renderLegacyCityServicePage(graph);
}
