---
title: Resolvers Module — Architecture
status: STUB
feature: identity
module: resolvers
source: architect-derived
created: 2026-06-05
---

# identity / modules / resolvers — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04 report. Single-file module — architecture is minimal. Verification required.

## Layer Stack (unverified)

### Identity Resolution (injectable pattern)
```
[consuming feature] (e.g. feed, booking, profiles, dashboard)
  └── vcsmIdentity.resolver.js (injected)
        └── engines/identity (read path)
              └── identity engine cache (120s TTL)
                    └── [on cache miss] → identity tables / session context
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| resolvers/vcsmIdentity.resolver.js | Resolver / identity read interface | ARCHITECT-derived |

## Write Surfaces

None.

## Known Cross-Feature Consumers (unverified)

The resolver is described as the injectable pattern consumed by other features. Confirmed consumers not yet enumerated — requires callgraph search.

Known consumers by architectural implication:
- feed (getFeedViewerContext.controller uses identity engine — may use resolver)
- booking (actor eligibility checks reference identity)
- dashboard (ownership gate may reference identity)
- profiles (actor kind checks)

## Cache Architecture

Identity engine caches resolution result. VEN-IDENTITY-004 flags 120s TTL as SPA-safe only — if resolver is ever consumed server-side or in a non-SPA context, stale identity may be served.

## Module Boundaries

- This module owns identity read resolution only
- Bootstrap and provisioning operations are owned by the identity module
- The resolver does not mutate identity state

## TODO

- [ ] Read vcsmIdentity.resolver.js — confirm full interface (inputs, return shape, error handling)
- [ ] Grep codebase for vcsmIdentity.resolver.js consumers to build cross-feature consumer list
- [ ] Confirm cache implementation — is it in the resolver or in the underlying engine?
- [ ] Confirm whether resolver is ever used outside a React/SPA render context
- [ ] Document actorKind values returned by resolver (citizen, vport, etc.)
