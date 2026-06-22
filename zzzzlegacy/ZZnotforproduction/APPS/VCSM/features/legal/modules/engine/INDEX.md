---
title: Engine Module — Index
status: STUB
feature: legal
module: engine
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/legal/engine/ + adapters/ + docs/
scanner-version: 1.1.0
---

# legal / modules / engine

Internal compliance engine and public adapter surface. legalCompliance.engine.js is a pure compliance comparison engine — NOT a shared engine in engines/; it is feature-internal. Owns document version comparison logic used by the consent gate. legal.adapter.js is the only approved public surface for the legal feature consumed by other features.

## Module Summary

| Field | Value |
|---|---|
| Module | engine |
| Feature | legal |
| Source Path | apps/VCSM/src/features/legal/engine/ + adapters/ + docs/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | 0 |
| Engine Files | 1 |
| Adapters | 1 |
| Docs | contents unknown — requires listing |

## Known Source Files (ARCHITECT-verified)

### Engine
| File | Role | Notes |
|---|---|---|
| engine/legalCompliance.engine.js | Pure compliance comparison engine — compares user consent record against current document version; determines if re-consent is required | Feature-internal ONLY — not in engines/; not a shared platform engine |

### Adapters
| File | Role |
|---|---|
| adapters/legal.adapter.js | Public surface for the legal feature — exports consent gate check, recordSignupConsent, and document access to consuming features |

### Docs
| Path | Role |
|---|---|
| docs/ | Document content files — exact contents not confirmed |

## Engine Responsibility

legalCompliance.engine.js performs the version comparison that drives the consent gate decision:
- Input: current user consent record + current legal document version
- Output: needsConsent (boolean) or re-consent required signal
- Pure function — no DB access

## Write Surfaces

None. Engine and adapter layer are read/computation only.

## Security Flags

- LOW: BW-LEGAL-006 — BEHAVIOR.md is PLACEHOLDER; all §9 invariants unanchored; future changes to compliance engine cannot be contract-verified
- INFO: BW-LEGAL-008 — empty-docs cache bypass guard correctly implemented but undocumented

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] List docs/ directory contents
- [ ] Read legalCompliance.engine.js — confirm version comparison interface (inputs/outputs)
- [ ] Confirm legal.adapter.js exports — which functions are exposed to consuming features?
- [ ] Document empty-docs cache bypass guard (BW-LEGAL-008) once BEHAVIOR.md is authored
- [ ] Confirm styles/ ownership — does styles/ belong to engine module or shared across legal feature?
