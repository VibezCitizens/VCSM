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

/** @typedef {import("@/data/types").Provider} Provider */
/** @typedef {import("@/data/types").ProviderService} ProviderService */
/** @typedef {import("@/data/types").ProviderStats} ProviderStats */

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

// ─── Live-only exports ────────────────────────────────────────────────────────
// These names are kept for backward compat with importing repos.
// No mock data is mixed in — these arrays contain only real VPORT profiles.

/** @type {Provider[]} */
export const MOCK_PROVIDERS = providers;

/** @type {ProviderService[]} */
export const MOCK_PROVIDER_SERVICES = providerServices;

/** @type {ProviderStats[]} */
export const MOCK_PROVIDER_STATS = providerStats;

/** @type {import("@/data/types").PriceAggregate[]} */
export const MOCK_PRICE_AGGREGATES = [];

/** Whether live VPORT data loaded successfully. "ok" | "unavailable" */
export const LIVE_DATA_STATUS = providers.length > 0 ? "ok" : "unavailable";
