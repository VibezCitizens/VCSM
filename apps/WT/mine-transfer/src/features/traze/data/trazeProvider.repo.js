import { readVportProviderIndexRows } from "@/features/traze/data/vportProviderIndex.read.dal";
import { mapProviderIndexRow } from "@/features/traze/data/trazeProvider.mapper";

function normalizeCountryCode(value) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function applyFilters(providers, filters = {}) {
  const countryCode = normalizeCountryCode(filters.countryCode);
  const citySlug = normalizeSlug(filters.citySlug);
  const source = filters.source && filters.source !== "all" ? filters.source : null;
  const serviceSlug = normalizeSlug(filters.serviceSlug);

  return providers.filter((provider) => {
    if (!provider.isActive || !provider.isIndexable) return false;
    if (countryCode && provider.countryCode !== countryCode) return false;
    if (citySlug && normalizeSlug(provider.citySlug) !== citySlug) return false;
    if (source && provider.source !== source) return false;
    if (serviceSlug && normalizeSlug(provider.serviceSlug || provider.businessType) !== serviceSlug) return false;
    return true;
  });
}

export async function listTrazeProviders(filters = {}) {
  const rows = await readVportProviderIndexRows({ countryCode: filters.countryCode });
  const providers = rows.map(mapProviderIndexRow).filter(Boolean);
  return applyFilters(providers, filters).sort((left, right) => right.rankScore - left.rankScore);
}

export async function getTrazeProviderSummary(filters = {}) {
  const providers = await listTrazeProviders(filters);
  const countries = new Set();
  const cities = new Set();
  const services = new Set();

  for (const provider of providers) {
    if (provider.countryCode) countries.add(provider.countryCode);
    if (provider.countryCode && provider.citySlug) cities.add(`${provider.countryCode}:${provider.citySlug}`);
    if (provider.serviceSlug || provider.serviceId) services.add(provider.serviceSlug || provider.serviceId);
  }

  return {
    providers,
    totals: {
      providers: providers.length,
      vport: providers.filter((provider) => provider.source === "vport").length,
      seed: providers.filter((provider) => provider.source === "seed").length,
      claimed: providers.filter((provider) => provider.isClaimed).length,
      unclaimed: providers.filter((provider) => provider.claimStatus !== "claimed").length,
      indexable: providers.filter((provider) => provider.isIndexable).length,
      missingContact: providers.filter((provider) => !provider.hasContact).length,
      missingCity: providers.filter((provider) => !provider.citySlug).length,
      missingService: providers.filter((provider) => !provider.hasService).length,
      missingNeighborhood: providers.filter((provider) => !provider.neighborhoodName).length,
      countries: countries.size,
      cities: cities.size,
      services: services.size,
    },
    fetchedAt: new Date().toISOString(),
  };
}
