import { SERVICES, SPECIALTIES } from "@/data/connectors/taxonomyDataset";
import { slugEquals, normalizeSlug } from "@/lib/slugs";

// Service keys arriving from Supabase provider data (business_type / service_slug)
// don't always match the canonical taxonomy slug — e.g. providers store "exchange"
// but the taxonomy service slug is "money-exchange". Resolving these aliases lets
// category → service-hub links (and any getServiceBySlug caller) work for every
// provider key. Single source of truth; also consumed by category.repo for ES names.
export const SERVICE_KEY_ALIASES = {
  barbershop: "barber",
  "barber-shop": "barber",
  exchange: "money-exchange",
  "currency-exchange": "money-exchange",
  gas: "gas-station",
  fuel: "gas-station",
  hairdresser: "barber",
  salon: "barber"
};

export function listServices() {
  return SERVICES.filter((service) => service.isActive);
}

export function getServiceById(serviceId) {
  return listServices().find((service) => service.id === serviceId) ?? null;
}

export function getServiceBySlug(serviceSlug) {
  const direct = listServices().find((service) => slugEquals(service.slug, serviceSlug)) ?? null;
  if (direct) return direct;

  // Fall back to a known alias (provider key → taxonomy slug) before giving up.
  const aliasTarget = SERVICE_KEY_ALIASES[normalizeSlug(serviceSlug)];
  if (!aliasTarget) return null;
  return listServices().find((service) => slugEquals(service.slug, aliasTarget)) ?? null;
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
