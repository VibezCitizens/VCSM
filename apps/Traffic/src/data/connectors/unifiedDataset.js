/**
 * Live dataset — loads real VPORT data from Supabase.
 *
 * Previously merged mock provider data with live VPORT data.
 * Mock provider merging has been removed. Only real VPORT profiles
 * from vport.public_traze_profiles_v are used at runtime.
 *
 * Export names kept for backward compatibility with provider.repo.js
 * and aggregate.repo.js — the MOCK_ prefix is now a legacy artifact.
 *
 * If Supabase is unavailable (missing env vars or network error), the
 * build continues with empty provider arrays — this file never throws.
 */

import { loadVportRows } from "@/data/connectors/vportDataset";
import { mapVportRowToProvider } from "@/data/mappers/vportToProvider.model";
import { readAllServicePriceRows } from "@/data/dal/priceAggregate.read.dal";

/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */
/** @typedef {import("@/data/types").PriceAggregate} PriceAggregate */

// ─── Load and map real VPORT data ────────────────────────────────────────────

/** @type {Provider[]} */
const providers = [];
/** @type {ProviderService[]} */
const providerServices = [];
/** @type {ProviderStats[]} */
const providerStats = [];

try {
  const rows = await loadVportRows();

  for (const row of rows) {
    let mapped;
    try {
      mapped = mapVportRowToProvider(row);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[unifiedDataset] Failed to map row", row?.slug, err?.message ?? err);
      }
      continue;
    }

    if (!mapped) continue;

    providers.push(mapped.provider);
    if (mapped.providerService) providerServices.push(mapped.providerService);
    providerStats.push(mapped.providerStats);
  }
} catch {
  // Never let a load failure break the build
}

// ─── Compute real price aggregates ───────────────────────────────────────────

/** @type {PriceAggregate[]} */
const priceAggregates = [];

try {
  const priceRows = await readAllServicePriceRows();

  if (priceRows.length > 0) {
    // Map profile_id -> min price_cents (lowest listed price per provider)
    /** @type {Map<string, number>} */
    const profileMinPrice = new Map();
    for (const row of priceRows) {
      if (!row.profile_id || row.price_cents == null) continue;
      const current = profileMinPrice.get(row.profile_id);
      if (current === undefined || row.price_cents < current) {
        profileMinPrice.set(row.profile_id, row.price_cents);
      }
    }

    // Map providerId -> serviceId from providerServices
    /** @type {Map<string, string>} */
    const providerToService = new Map();
    for (const ps of providerServices) {
      if (!providerToService.has(ps.providerId)) {
        providerToService.set(ps.providerId, ps.serviceId);
      }
    }

    // Bucket min prices by (cityId, serviceId)
    /** @type {Map<string, { cityId: string, serviceId: string, countryId: string, prices: number[] }>} */
    const buckets = new Map();
    for (const provider of providers) {
      const { id, primaryCityId, primaryCountryCode } = provider;
      if (!primaryCityId) continue;

      const serviceId = providerToService.get(id);
      if (!serviceId) continue;

      const minPrice = profileMinPrice.get(id);
      if (minPrice == null) continue;

      const key = `${primaryCityId}||${serviceId}`;
      const bucket = buckets.get(key) ?? {
        cityId: primaryCityId,
        serviceId,
        countryId: `country-${(primaryCountryCode ?? "us").toLowerCase()}`,
        prices: []
      };
      bucket.prices.push(minPrice);
      buckets.set(key, bucket);
    }

    const today = new Date().toISOString().slice(0, 10);
    let idx = 0;
    for (const { cityId, serviceId, countryId, prices } of buckets.values()) {
      if (prices.length < 2) continue;
      const sorted = [...prices].sort((a, b) => a - b);
      priceAggregates.push({
        id: `agg-${idx++}`,
        countryId,
        regionId: null,
        cityId,
        neighborhoodId: null,
        serviceId,
        specialtyId: null,
        sampleSize: sorted.length,
        priceP25Cents: computePercentile(sorted, 25),
        priceP50Cents: computePercentile(sorted, 50),
        priceP75Cents: computePercentile(sorted, 75),
        currencyCode: "USD",
        asOfDate: today
      });
    }
  }
} catch {
  // Never let price computation failure break the build
}

function computePercentile(sorted, p) {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

// ─── Live-only exports ────────────────────────────────────────────────────────
// These names are kept for backward compat with importing repos.
// No mock data is mixed in — these arrays contain only real VPORT profiles.

/** @type {Provider[]} */
export const MOCK_PROVIDERS = providers;

/** @type {ProviderService[]} */
export const MOCK_PROVIDER_SERVICES = providerServices;

/** @type {ProviderStats[]} */
export const MOCK_PROVIDER_STATS = providerStats;

/** @type {PriceAggregate[]} */
export const MOCK_PRICE_AGGREGATES = priceAggregates;

/** Whether live VPORT data loaded successfully. "ok" | "unavailable" */
export const LIVE_DATA_STATUS = providers.length > 0 ? "ok" : "unavailable";
