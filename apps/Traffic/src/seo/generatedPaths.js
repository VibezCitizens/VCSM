/**
 * Generated-path oracle (build-time, deterministic).
 *
 * Single source of truth for the question "does this internal URL correspond to
 * a page that generateStaticParams() actually emits into the static export?".
 * Directory renderers filter their related-discovery links through
 * keepGeneratedLinks() so they never advertise a phantom page that would 404 in
 * production (TICKET-TRAZE-PHANTOM-LINKS-001).
 *
 * It mirrors the EXACT provider-gated static-param sets in staticParams.repo —
 * it does not introduce or loosen any SEO threshold, it only removes links to
 * pages that were never built. Canonical, hreflang, robots, and breadcrumb
 * emission are intentionally left untouched.
 *
 * Build-time only, no runtime fetch. The set is memoized per module instance.
 */
import {
  cityPath,
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityPath,
  countryCityServicePath,
  countryPath,
  countryProviderPath,
  countryServiceHubPath,
  neighborhoodServicePath,
  providerPath
} from "@/lib/paths";
import {
  listAllActiveProviderStaticParams,
  listCityServiceStaticParams,
  listCityStaticParams,
  listCountryCityServiceStaticParams,
  listCountryCityStaticParams,
  listCountryLocalityServiceSpecialtyStaticParams,
  listCountryLocalityServiceStaticParams,
  listCountryProviderStaticParams,
  listCountryServiceHubStaticParams,
  listCountryStaticParams,
  listNeighborhoodServiceStaticParams
} from "@/data/repositories/staticParams.repo";

let GENERATED = null;

// Normalize a link href to the form stored in the generated set: drop any
// query/hash, strip an optional /en or /es locale prefix (related links are
// emitted unprefixed; localization is applied later by the template), and trim
// a trailing slash.
function normalizePath(path) {
  const raw = String(path ?? "").split("?")[0].split("#")[0];
  if (!raw.startsWith("/")) return raw;
  const unlocalized = raw.replace(/^\/(en|es)(?=\/|$)/, "");
  const trimmed = unlocalized.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function buildGeneratedSet() {
  const set = new Set();

  for (const p of listCountryStaticParams()) {
    set.add(countryPath(p.country));
  }
  for (const p of listCountryServiceHubStaticParams()) {
    set.add(countryServiceHubPath(p.country, p.service));
  }
  for (const p of listCountryCityStaticParams()) {
    set.add(countryCityPath(p.country, p.city));
  }
  for (const p of listCountryCityServiceStaticParams()) {
    set.add(countryCityServicePath(p.country, p.city, p.service));
  }
  for (const p of listCountryLocalityServiceStaticParams()) {
    set.add(countryCityLocalityServicePath(p.country, p.city, p.locality, p.service));
  }
  for (const p of listCountryLocalityServiceSpecialtyStaticParams()) {
    set.add(
      countryCityLocalityServiceSpecialtyPath(p.country, p.city, p.locality, p.service, p.specialty)
    );
  }
  for (const p of listCountryProviderStaticParams()) {
    set.add(countryProviderPath(p.country, p.providerSlug));
  }

  // Legacy (unprefixed) routes that the directory tree still links to.
  for (const p of listCityStaticParams()) {
    set.add(cityPath(p.city));
  }
  for (const p of listCityServiceStaticParams()) {
    set.add(cityServicePath(p.city, p.service));
  }
  for (const p of listNeighborhoodServiceStaticParams()) {
    set.add(neighborhoodServicePath(p.city, p.neighborhood, p.service));
  }
  for (const p of listAllActiveProviderStaticParams()) {
    set.add(providerPath(p.providerSlug));
  }

  return set;
}

/**
 * True when `path` resolves to a page that the static export actually generates.
 * The site root ("/") is always real. Everything else must be present in the
 * generated static-param set.
 */
export function isGeneratedPath(path) {
  if (!GENERATED) {
    GENERATED = buildGeneratedSet();
  }
  const normalized = normalizePath(path);
  if (normalized === "/") return true;
  return GENERATED.has(normalized);
}

/**
 * Filter a related-links array down to links whose target page is actually
 * generated. Links without an href, or pointing at a phantom page, are dropped.
 */
export function keepGeneratedLinks(links) {
  return (Array.isArray(links) ? links : []).filter(
    (link) => link && typeof link.href === "string" && isGeneratedPath(link.href)
  );
}
