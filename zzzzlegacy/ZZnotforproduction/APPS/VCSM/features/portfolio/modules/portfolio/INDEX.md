---
title: Portfolio Module — Index
status: STUB
feature: portfolio
module: portfolio
source: venom+bw-derived
created: 2026-06-05
---

# portfolio / modules / portfolio

Thin VCSM wiring for engines/portfolio. Only 2 source files at feature layer — all logic lives in engines/portfolio. Security findings reference engine-layer code.

## Source Files

| File | Layer |
|---|---|
| setup.js | boot config |
| adapters/portfolioTrace.adapter.js | debug adapter (always bundled) |

## Note on Engine Layer

Security findings VEN-PORTFOLIO-001 through VEN-PORTFOLIO-007 and BW-PORT-001 through BW-PORT-007 reference `engines/portfolio` controllers and DAL functions. Governance for those surfaces belongs in an `engines/portfolio/` module build (not yet created).

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — engine-layer findings (see SECURITY.md). Feature-layer: LOW (debug adapter).
