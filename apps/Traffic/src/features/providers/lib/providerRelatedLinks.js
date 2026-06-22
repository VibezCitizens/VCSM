import { dedupeInternalLinks } from "@/seo/internalLinks";
import { listSpecialtiesByService } from "@/features/providers/dal/provider.read.dal";
import {
  cityServicePath,
  countryCityLocalityServicePath,
  countryCityLocalityServiceSpecialtyPath,
  countryCityServicePath,
  neighborhoodServicePath
} from "@/lib/paths";

export function buildProviderRelatedLinks({ provider, country, city, citySlug, locality, cityCategoryHref, services, providerServices }) {
  return dedupeInternalLinks([
    ...(city && locality
      ? services.map((service) => ({
          label: `${service.name} in ${locality.name}`,
          href: countryCityLocalityServicePath(country.slug, city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city && locality
      ? services.flatMap((service) => {
          const specialtyById = new Map(
            listSpecialtiesByService(service.id).map((specialty) => [specialty.id, specialty])
          );
          const specialtyIds = providerServices
            .filter((ps) => ps.serviceId === service.id && Boolean(ps.specialtyId))
            .map((ps) => ps.specialtyId);
          const uniqueSpecialties = [...new Set(specialtyIds)]
            .map((id) => specialtyById.get(id))
            .filter(Boolean);
          return uniqueSpecialties.map((specialty) => ({
            label: `${specialty.name} ${service.name} in ${locality.name}`,
            href: countryCityLocalityServiceSpecialtyPath(country.slug, city.slug, locality.slug, service.slug, specialty.slug)
          }));
        })
      : []),
    ...(citySlug
      ? services.map((service) => ({
          label: `All ${service.name} in ${city?.name ?? provider.primaryCityName ?? citySlug}`,
          href: countryCityServicePath(country.slug, citySlug, service.slug)
        }))
      : []),
    ...(cityCategoryHref
      ? [{ label: "Back to city listings", href: cityCategoryHref }]
      : []),
    ...(city && locality
      ? services.map((service) => ({
          label: `Legacy locality path (${city.slug}/${locality.slug}/${service.slug})`,
          href: neighborhoodServicePath(city.slug, locality.slug, service.slug)
        }))
      : []),
    ...(city
      ? services.map((service) => ({
          label: `Legacy city-service path (${city.slug}/${service.slug})`,
          href: cityServicePath(city.slug, service.slug)
        }))
      : [])
  ]);
}
