# Gas — Performance Report

**KRAVEN status:** COMPLETE (P3 deferred)  
**Last reviewed:** 2026-05-28

## Known Issues

| ID | Issue | Impact | Status |
|---|---|---|---|
| K-GAS-01 | `fuel_price_submissions` + `station_price_settings` uncached | 3× DB hits per gas tab visit | RESOLVED — caches added: `fuelPriceCache` (60s), `settingsCache` (300s), `pendingSubmissionsCache` (30s). Confirmed in DAL code 2026-05-28. |
| LOKI-DASH-002 | `VportDashboardGasScreen` mounted both `useVportGasPrices` AND `useOwnerPendingSuggestions` — both called `getVportGasPricesController` on mount. Up to 6 profileId resolutions + 6 table reads on cold start. | MEDIUM — cold gas page load ~600–900ms | RESOLVED — `useOwnerPendingSuggestions` stripped of data-fetching; `useVportGasPrices` now exposes `pendingSubmissions`; single controller call per page load. 2026-05-28 |
| LOKI-DASH-003 | `getVportGasPricesController` ran 3 DAL calls sequentially. No `Promise.all`. | MEDIUM — ~150–250ms avoidable serial latency per cold call | RESOLVED — 3 DAL calls wrapped in `Promise.all`. 2026-05-28 |
