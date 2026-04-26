/**
 * Unified dataset — merges mock provider data with real VPORT data from Supabase.
 *
 * Uses top-level await (supported in Next.js 14 / webpack 5 ESM modules) so
 * repositories can continue to import synchronous arrays with no API changes.
 *
 * Merge rules:
 *   - Real VPORT providers win on slug collision (production data takes precedence)
 *   - Mock providers whose slug matches a live VPORT are silently dropped
 *   - If Supabase is unavailable (missing env vars or network error), the build
 *     continues with mock data only — this file never throws
 */

import {
  MOCK_PROVIDERS as RAW_MOCK_PROVIDERS,
  MOCK_PROVIDER_SERVICES as RAW_MOCK_PROVIDER_SERVICES,
  MOCK_PROVIDER_STATS as RAW_MOCK_PROVIDER_STATS,
  MOCK_PRICE_AGGREGATES as RAW_MOCK_PRICE_AGGREGATES
} from "@/data/connectors/mockDataset";
import { loadVportDataset } from "@/data/connectors/vportDataset";

// ─── Load real VPORT data ─────────────────────────────────────────────────────

let vportData = { providers: [], providerServices: [], providerStats: [] };

try {
  vportData = await loadVportDataset();
} catch {
  // Never let a load failure break the build — mock data carries on
}

// ─── Slug deduplication ───────────────────────────────────────────────────────
// Real VPORT data wins. Any mock provider sharing a slug with a live VPORT is
// dropped so the real profile page is the only one generated.

const realSlugs = new Set(vportData.providers.map((p) => p.slug.toLowerCase()));
const realProviderIds = new Set(vportData.providers.map((p) => p.id));

const dedupedMockProviders = RAW_MOCK_PROVIDERS.filter(
  (p) => !realSlugs.has(p.slug.toLowerCase())
);
const dedupedMockProviderServices = RAW_MOCK_PROVIDER_SERVICES.filter(
  (ps) => !realProviderIds.has(ps.providerId)
);
const dedupedMockProviderStats = RAW_MOCK_PROVIDER_STATS.filter(
  (s) => !realProviderIds.has(s.providerId)
);

// ─── Merged exports ───────────────────────────────────────────────────────────
// Exported under the exact same names that provider.repo.js and aggregate.repo.js
// already use, so those files only need their import path updated — nothing else.

/** @type {import("@/data/types").Provider[]} */
export const MOCK_PROVIDERS = [
  ...vportData.providers,
  ...dedupedMockProviders
];

/** @type {import("@/data/types").ProviderService[]} */
export const MOCK_PROVIDER_SERVICES = [
  ...vportData.providerServices,
  ...dedupedMockProviderServices
];

/** @type {import("@/data/types").ProviderStats[]} */
export const MOCK_PROVIDER_STATS = [
  ...vportData.providerStats,
  ...dedupedMockProviderStats
];

/** @type {import("@/data/types").PriceAggregate[]} */
export const MOCK_PRICE_AGGREGATES = RAW_MOCK_PRICE_AGGREGATES;
