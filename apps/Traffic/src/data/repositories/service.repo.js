import { MOCK_SERVICES, MOCK_SPECIALTIES } from "@/data/connectors/mockDataset";
import { slugEquals } from "@/lib/slugs";

export function listServices() {
  return MOCK_SERVICES.filter((service) => service.isActive);
}

export function getServiceById(serviceId) {
  return listServices().find((service) => service.id === serviceId) ?? null;
}

export function getServiceBySlug(serviceSlug) {
  return listServices().find((service) => slugEquals(service.slug, serviceSlug)) ?? null;
}

export function listSpecialtiesByService(serviceId) {
  return MOCK_SPECIALTIES.filter(
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
