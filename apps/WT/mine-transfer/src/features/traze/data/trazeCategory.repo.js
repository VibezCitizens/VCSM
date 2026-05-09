import { listTrazeProviders } from "@/features/traze/data/trazeProvider.repo";
import { slugifyTrazeValue } from "@/features/traze/data/trazeProvider.mapper";

function titleize(value) {
  const text = String(value ?? "").trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!text) return "Uncategorized";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function listTrazeCategories(filters = {}) {
  const providers = await listTrazeProviders(filters);
  const buckets = new Map();

  for (const provider of providers) {
    const serviceKey = slugifyTrazeValue(provider.serviceSlug || provider.businessType || provider.serviceName);
    if (!serviceKey) continue;

    const countryKey = provider.countryCode || "unknown";
    const bucketKey = `${countryKey}:${serviceKey}`;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        countryCode: provider.countryCode,
        serviceKey,
        serviceId: provider.serviceId,
        serviceName: provider.serviceName || titleize(serviceKey),
        categoryKey: slugifyTrazeValue(provider.businessType || serviceKey),
        categoryName: titleize(provider.businessType || serviceKey),
        providerIds: new Set(),
        cityKeys: new Set(),
        sourceCounts: { vport: 0, seed: 0 },
      });
    }

    const bucket = buckets.get(bucketKey);
    bucket.providerIds.add(provider.id);
    if (provider.citySlug) bucket.cityKeys.add(provider.citySlug);
    if (provider.source === "seed") bucket.sourceCounts.seed += 1;
    if (provider.source === "vport") bucket.sourceCounts.vport += 1;
  }

  return [...buckets.values()]
    .map((bucket) => ({
      countryCode: bucket.countryCode,
      serviceKey: bucket.serviceKey,
      serviceId: bucket.serviceId,
      serviceName: bucket.serviceName,
      categoryKey: bucket.categoryKey,
      categoryName: bucket.categoryName,
      providerCount: bucket.providerIds.size,
      cityCount: bucket.cityKeys.size,
      vportCount: bucket.sourceCounts.vport,
      seedCount: bucket.sourceCounts.seed,
    }))
    .filter((row) => row.providerCount > 0)
    .sort((left, right) => {
      if (left.providerCount !== right.providerCount) return right.providerCount - left.providerCount;
      return left.serviceName.localeCompare(right.serviceName);
    });
}
