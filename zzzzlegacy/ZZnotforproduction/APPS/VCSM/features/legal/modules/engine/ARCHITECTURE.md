---
title: Engine Module — Architecture
status: STUB
feature: legal
module: engine
source: architect-derived
created: 2026-06-05
---

# legal / modules / engine — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04. Verification required.

## Layer Stack (unverified)

### Compliance Version Check (consumed by consent module)
```
legalConsent.controller.js (consent module)
  └── legalCompliance.engine.js
        Input: userConsentRecord (version), currentDocument (version)
        Output: needsConsent (boolean) | re-consent signal
        [Pure function — no DB, no side effects]
```

### Public Adapter Surface
```
[Consuming feature]
  └── legal.adapter.js (approved public surface)
        ├── consent gate check → legalConsent.controller.js (consent module)
        └── recordSignupConsent → legalConsent.controller.js (consent module)
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| engine/legalCompliance.engine.js | Pure compliance engine (feature-internal) | ARCHITECT-derived |
| adapters/legal.adapter.js | Public adapter (outbound surface) | ARCHITECT-derived |
| docs/ | Document content files | ARCHITECT-derived (contents unconfirmed) |

## Engine Classification

legalCompliance.engine.js is NOT a shared engine from engines/. It is a feature-internal engine — lives in apps/VCSM/src/features/legal/engine/, not in engines/. This engine is only consumed within the legal feature.

## Module Boundaries

- legal.adapter.js is the ONLY approved import surface for features consuming legal functionality
- Direct imports of legalConsent.controller.js or legalCompliance.engine.js by other features are not approved
- This module has no DB access — pure computation layer

## TODO

- [ ] List docs/ directory contents — confirm whether these are static document text files or config
- [ ] Read legalCompliance.engine.js — confirm pure function contract and input/output shape
- [ ] Confirm legal.adapter.js full export list
- [ ] Confirm styles/ ownership — part of this module or shared across feature
