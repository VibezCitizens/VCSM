import { listCities, listLocalitiesByCity, listNeighborhoodsByCity } from "@/data/repositories/city.repo";
import { getCountryByCode, listCountries } from "@/data/repositories/geo.repo";
import { getServiceBySlug, listServices, listSpecialtiesByService } from "@/data/repositories/service.repo";
import {
  listAllActiveProviders,
  listProviders,
  listProvidersByCityAndService,
  listProvidersByCountry,
  listProvidersByCountryAndService,
  listProvidersByCountryCitySlug,
  listProvidersByCountryCitySlugAndService,
  listProvidersByLocalityAndService,
  listProvidersByLocalityServiceAndSpecialty,
  listProvidersByNeighborhoodAndService,
  listStructuredCitiesByCountryCode
} from "@/data/repositories/provider.repo";
import {
  isCityIndexable,
  isCityServiceIndexable,
  isCountryIndexable,
  isCountryServiceIndexable,
  isNeighborhoodServiceIndexable,
  isNeighborhoodSpecialtyIndexable,
  isProviderIndexable
} from "@/seo/qualityGuards";

function getCountryServiceCityCount(providers) {
  return new Set(
    providers
      .map((item) => item.provider.primaryCitySlug)
      .filter(Boolean)
  ).size;
}

export function listCountryStaticParams() {
  return listCountries()
    .filter((country) => isCountryIndexable(listProvidersByCountry(country.code).length))
    .map((country) => ({ country: country.slug }));
}

export function listCountryServiceHubStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const service of listServices()) {
      const countryServiceProviders = listProvidersByCountryAndService(country.code, service.id);
      const cityCount = getCountryServiceCityCount(countryServiceProviders);

      if (!isCountryServiceIndexable(countryServiceProviders.length, cityCount)) {
        continue;
      }

      entries.push({ country: country.slug, service: service.slug });
    }
  }

  return entries;
}

export function listCountryCityStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listStructuredCitiesByCountryCode(country.code)) {
      const count = listProvidersByCountryCitySlug(country.code, city.slug).length;
      if (!isCityIndexable(count)) {
        continue;
      }

      entries.push({ country: country.slug, city: city.slug });
    }
  }

  return entries;
}

export function listCountryCityServiceStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listStructuredCitiesByCountryCode(country.code)) {
      for (const service of listServices()) {
        const count = listProvidersByCountryCitySlugAndService(
          country.code,
          city.slug,
          service.id
        ).length;
        if (!isCityServiceIndexable(count)) {
          continue;
        }

        entries.push({ country: country.slug, city: city.slug, service: service.slug });
      }
    }
  }

  return entries;
}

export function listCountryLocalityServiceStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          const count = listProvidersByLocalityAndService(locality.id, service.id).length;
          if (!isNeighborhoodServiceIndexable(count)) {
            continue;
          }

          entries.push({
            country: country.slug,
            city: city.slug,
            locality: locality.slug,
            service: service.slug
          });
        }
      }
    }
  }

  return entries;
}

export function listCountryLocalityServiceSpecialtyStaticParams() {
  const entries = [];

  for (const country of listCountries()) {
    for (const city of listCities({ countryId: country.id })) {
      for (const locality of listLocalitiesByCity(city.id)) {
        for (const service of listServices()) {
          for (const specialty of listSpecialtiesByService(service.id)) {
            const count = listProvidersByLocalityServiceAndSpecialty(
              locality.id,
              service.id,
              specialty.id
            ).length;

            if (!isNeighborhoodSpecialtyIndexable(count)) {
              continue;
            }

            entries.push({
              country: country.slug,
              city: city.slug,
              locality: locality.slug,
              service: service.slug,
              specialty: specialty.slug
            });
          }
        }
      }
    }
  }

  return entries;
}

export function listCountryProviderStaticParams() {
  return listProviders()
    .filter((provider) => isProviderIndexable(provider))
    .map((provider) => {
      const country = getCountryByCode(provider.primaryCountryCode);
      return country
        ? { country: country.slug, providerSlug: provider.slug }
        : null;
    })
    .filter(Boolean);
}

export function listCityStaticParams() {
  return listCities().map((city) => ({ city: city.slug }));
}

export function listCityServiceStaticParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const service of listServices()) {
      const count = listProvidersByCityAndService(city.id, service.id).length;
      if (!isCityServiceIndexable(count)) {
        continue;
      }

      entries.push({ city: city.slug, service: service.slug });
    }
  }

  return entries;
}

export function listNeighborhoodServiceStaticParams() {
  const entries = [];

  for (const city of listCities()) {
    for (const neighborhood of listNeighborhoodsByCity(city.id)) {
      for (const service of listServices()) {
        const count = listProvidersByNeighborhoodAndService(neighborhood.id, service.id).length;
        if (!isNeighborhoodServiceIndexable(count)) {
          continue;
        }

        entries.push({
          city: city.slug,
          neighborhood: neighborhood.slug,
          service: service.slug
        });
      }
    }
  }

  return entries;
}

export function listProviderStaticParams() {
  return listProviders()
    .filter((provider) => isProviderIndexable(provider))
    .map((provider) => ({ providerSlug: provider.slug }));
}

export function listAllActiveProviderStaticParams() {
  return listAllActiveProviders().map((provider) => ({ providerSlug: provider.slug }));
}

export function getServiceNameBySlug(serviceSlug) {
  return getServiceBySlug(serviceSlug)?.name ?? serviceSlug;
}
