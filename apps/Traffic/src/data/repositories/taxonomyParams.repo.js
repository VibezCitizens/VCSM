/**
 * Taxonomy-only static param generators.
 *
 * These functions enumerate route params from the static taxonomy (countries, cities,
 * localities, services, specialties) WITHOUT checking provider counts. They import
 * nothing from provider.repo or unifiedDataset, keeping the import chain synchronous.
 *
 * Use these in generateStaticParams() for routes where the provider data source
 * (Supabase/unifiedDataset) may be unavailable at build time. Pages that receive
 * params with no live providers call notFound() at render time.
 */

import { listCities, listLocalitiesByCity, listNeighborhoodsByCity } from "@/data/repositories/city.repo";
import { listCountries } from "@/data/repositories/geo.repo";
import { listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import { MOCK_PROVIDERS_A } from "@/data/connectors/mockProviders.a";
import { MOCK_PROVIDERS_B } from "@/data/connectors/mockProviders.b";
import { MOCK_PROVIDERS_C } from "@/data/connectors/mockProviders.c";

// ── Locality-level ────────────────────────────────────────────────────────────

export function listLocalityServiceTaxonomyParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          entries.push({
            country: country.slug,
            city: city.slug,
            locality: locality.slug,
            service: service.slug,
          });
        }
      }
    }
  }

  return entries;
}

export function listLocalityServiceSpecialtyTaxonomyParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          for (const specialty of listSpecialtiesByService(service.id)) {
            entries.push({
              country: country.slug,
              city: city.slug,
              locality: locality.slug,
              service: service.slug,
              specialty: specialty.slug,
            });
          }
        }
      }
    }
  }

  return entries;
}

// ── Country + city ────────────────────────────────────────────────────────────

export function listCountryCityTaxonomyParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      entries.push({ country: country.slug, city: city.slug });
    }
  }

  return entries;
}

// ── City + service (legacy route) ─────────────────────────────────────────────

export function listCityServiceTaxonomyParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const service of listServices()) {
      entries.push({ city: city.slug, service: service.slug });
    }
  }

  return entries;
}

// ── Country + city + service ──────────────────────────────────────────────────

export function listCountryCityServiceTaxonomyParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const service of listServices()) {
        entries.push({ country: country.slug, city: city.slug, service: service.slug });
      }
    }
  }

  return entries;
}

// ── Country + service hub ─────────────────────────────────────────────────────

export function listCountryServiceHubTaxonomyParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const service of listServices()) {
      entries.push({ country: country.slug, service: service.slug });
    }
  }

  return entries;
}

// ── Neighborhood + service (legacy) ──────────────────────────────────────────

export function listNeighborhoodServiceTaxonomyParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const neighborhood of listNeighborhoodsByCity(city.id)) {
      for (const service of listServices()) {
        entries.push({ city: city.slug, neighborhood: neighborhood.slug, service: service.slug });
      }
    }
  }

  return entries;
}

// ── Provider slugs (mock fallback) ────────────────────────────────────────────

const ALL_MOCK_PROVIDERS = [
  ...MOCK_PROVIDERS_A,
  ...MOCK_PROVIDERS_B,
  ...MOCK_PROVIDERS_C,
];

export function listMockProviderSlugParams() {
  return ALL_MOCK_PROVIDERS
    .filter((provider) => provider.isActive && provider.isIndexable)
    .map((provider) => ({ providerSlug: provider.slug }));
}
