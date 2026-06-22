/**
 * Live dataset — loads real TRAZE public provider data from Supabase.
 *
 * All public provider rows come from the canonical VPORT provider index view:
 * vport.public_traze_provider_index_v. The view itself merges real VPORT
 * profiles and public-safe seed listings, with VPORT winning by slug.
 *
 * Preview builds can continue with empty provider arrays when Supabase is
 * unavailable. Production branch builds fail instead of exporting empty pages.
 */

import { loadVportRows } from "@/data/connectors/vportDataset";
import { mapProviderIndexRowToProvider } from "@/data/mappers/providerIndex.model";
import { readAllServicePriceRows } from "@/data/dal/priceAggregate.read.dal";
import { shouldRequireLiveProviderIndex } from "@/lib/env";

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
let loadedProviderRowCount = 0;

function logDatasetError(scope, error) {
  console.error(`[unifiedDataset] ${scope}:`, error?.message ?? error);
}

function addMappedProvider(mapped) {
  if (!mapped?.provider?.id || !mapped.provider.slug) return;

  providers.push(mapped.provider);

  if (Array.isArray(mapped.providerServices)) {
    providerServices.push(...mapped.providerServices);
  } else if (mapped.providerService) {
    providerServices.push(mapped.providerService);
  }

  if (mapped.providerStats) {
    providerStats.push(mapped.providerStats);
  }
}

try {
  const rows = await loadVportRows();
  loadedProviderRowCount = rows.length;

  for (const row of rows) {
    let mapped;
    try {
      mapped = mapProviderIndexRowToProvider(row);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        logDatasetError(`Failed to map provider index row ${row?.slug ?? ""}`, err);
      }
      continue;
    }

    if (!mapped) continue;

    addMappedProvider(mapped);
  }
} catch (error) {
  logDatasetError("provider index load failed", error);
  if (shouldRequireLiveProviderIndex()) {
    throw error;
  }
}

if (shouldRequireLiveProviderIndex() && providers.length === 0) {
  throw new Error(
    `Traffic build produced no mapped providers from ${loadedProviderRowCount} provider index rows. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for build-time data reads, fix provider row shape, or set TRAFFIC_ALLOW_EMPTY_PROVIDER_INDEX=true.`
  );
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
        countryId: primaryCountryCode ? `country-${primaryCountryCode.toLowerCase()}` : null,
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
} catch (error) {
  logDatasetError("price aggregate computation failed", error);
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
// No mock data is mixed in — these arrays contain canonical provider-index rows.

/** @type {Provider[]} */
export const LIVE_PROVIDER_INDEX_PROVIDERS = providers;

/** @type {ProviderService[]} */
export const LIVE_PROVIDER_INDEX_PROVIDER_SERVICES = providerServices;

/** @type {ProviderStats[]} */
export const LIVE_PROVIDER_INDEX_PROVIDER_STATS = providerStats;

/** @type {PriceAggregate[]} */
export const LIVE_PROVIDER_INDEX_PRICE_AGGREGATES = priceAggregates;

/** Whether live VPORT data loaded successfully. "ok" | "unavailable" */
export const LIVE_DATA_STATUS = providers.length > 0 ? "ok" : "unavailable";
