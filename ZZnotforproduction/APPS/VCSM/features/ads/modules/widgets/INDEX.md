---
title: Widgets Module — Index
status: STUB
feature: ads
module: widgets
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/ads/
scanner-version: 1.1.0
---

# ads / modules / widgets

Display-only widget layer for the ads feature. Renders ad units consumed by external feature contexts. No write surfaces — display only.

## Module Summary

| Field | Value |
|---|---|
| Module | widgets |
| Feature | ads |
| Source Path | apps/VCSM/src/features/ads/widgets/, apps/VCSM/src/features/ads/adapters/widgets/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | None |
| Widget Components | 1 (OnemoredaysAd.jsx) |
| Adapters | 1 (OnemoredaysAd.adapter.js) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| widgets/OnemoredaysAd.jsx | Component | Display ad unit — "One More Days" style |
| adapters/widgets/OnemoredaysAd.adapter.js | Adapter | Public surface for external widget consumption |

## Security Flags

- LOW: BW-ADS-004 — OnemoredaysAd.jsx renders user-supplied content; no confirmed sanitization of ad copy fields
- INFO: Display-only; no ownership checks required (read surface only)

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm what props OnemoredaysAd.jsx accepts (ad title, description, image URL?)
- [ ] Confirm whether ad copy is user-supplied or static config
- [ ] Confirm whether adapter injects actorId or pipeline data into widget
- [ ] Check if image URL rendered via <img> or CSS — relevant for injection risk
