import { SERVICES, SPECIALTIES } from "@/data/connectors/taxonomyDataset";
import { slugEquals } from "@/lib/slugs";

export function listServices() {
  return SERVICES.filter((service) => service.isActive);
}

export function getServiceById(serviceId) {
  return listServices().find((service) => service.id === serviceId) ?? null;
}

export function getServiceBySlug(serviceSlug) {
  return listServices().find((service) => slugEquals(service.slug, serviceSlug)) ?? null;
}

export function listSpecialtiesByService(serviceId) {
  return SPECIALTIES.filter(
    (specialty) => specialty.serviceId === serviceId && specialty.isActive
  );
}

export function getSpecialtyBySlug(serviceId, specialtySlug) {
  return (
    listSpecialtiesByService(serviceId).find((specialty) =>
      slugEquals(specialty.slug, specialtySlug)
    ) ?? null
  );
}
