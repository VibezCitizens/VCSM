---
ticket: MOD-SCANNER-ENFORCEMENT-001
phase: 7
status: COMPLETE
date: 2026-06-07
---

# MOD-SCANNER-ENFORCEMENT-001 — Phase 7: Scanner Enforcement

## Files Changed

### `apps/scanner/src/scanners/featureImportMapScanner.js`

1. Added `ADAPTER_EXEMPT_FEATURES` constant — features exempt from RULE-001:
   - `debug` — dev-only panel, no external consumers
   - `hydration` — FROZEN, pending ARCH-ENGINESETUP-001
   - `reviews` — DELETE_CANDIDATE, single stub file

2. Added `hasAdapters(feature)` helper — checks `feature.layerCounts.adapters > 0`

3. Updated `featuresMap` initialization loop — computes `adapter_present` and `missing_adapter` per feature

4. Updated `scanFeatureImportMap` return value — adds:
   - `missing_adapter_count` — count of active features without an adapter
   - `missing_adapter_features` — array of feature names without adapters

5. Added `MISSING_ADAPTER_SURFACE` case to `ruleReason()`:
   > "Active feature has no adapters/ directory — external consumers have no public API surface."

### `apps/scanner/src/core/runScan.js`

- Updated return value to include:
  - `violations: featureImportMap.total_violations`
  - `missingAdapters: featureImportMap.missing_adapter_count`

### `apps/scanner/src/cli/index.js`

- Added post-scan violation report lines to stdout
- Added build-fail exit code 1 when `violations > 0 || missingAdapters > 0`
- Error message: `SCANNER FAIL — N import violation(s), N missing adapter(s). Fix before merge.`

## Rules Implemented

| Rule | Status |
|---|---|
| RULE-001: Every active feature must have adapters/ | IMPLEMENTED |
| RULE-004: Adapter files must not re-export DAL | DEFERRED — requires intra-feature import scanner pass (out of scope) |
| RULE-006: Scanner fails build on violation | IMPLEMENTED |

## Exempt Features

| Feature | Reason |
|---|---|
| debug | Dev-only panel — no external consumers |
| hydration | FROZEN — pending ARCH-ENGINESETUP-001 |
| reviews | DELETE_CANDIDATE — no surface to expose |

## Validation Results

- Stray `controller/` dirs in targets: 0
- Stray `model/` dirs in targets: 0
- Stray `ui/` dirs in targets: 0 (`profiles/adapters/ui` is intentional adapter sub-path)
- DAL in Phase 1 adapters (explore, invite, join, professional, wanderex): CLEAN
- Phase 6 stub index.js remaining: 0
- Upload: only `controllers/` present — consolidation confirmed

## Deferred

- `MOD-LAZY-ROUTES-001` — `lazyApp.jsx` / `lazyPublic.jsx` dynamic imports cannot be migrated to adapter named exports without logic change (React.lazy requires default export); blocked per scope constraints
- `RULE-004` (DAL in adapter) — requires intra-feature import content scanner; pre-existing adapters (auth, booking, feed, media, social, upload, vport) have DAL imports but are out of Phase 1 scope
