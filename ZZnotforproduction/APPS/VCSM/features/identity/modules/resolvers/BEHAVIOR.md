---
title: Resolvers Module — Behavior
status: STUB
feature: identity
module: resolvers
source: architect-derived
created: 2026-06-05
---

# identity / modules / resolvers — BEHAVIOR

## Status

STUB. No behavior contract written. All entries below are seeded from ARCHITECT and VENOM/BW evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-IDENT-RESOLVERS-001 | Resolve Actor Identity | vcsmIdentity.resolver.js accepts a context and returns identity object for the current actor | UNVERIFIED |
| BEH-IDENT-RESOLVERS-002 | Inject Identity Context | Resolver is injected into consuming features; they call it to get actorId, userId, realmId, actorKind without importing the identity engine directly | UNVERIFIED |
| BEH-IDENT-RESOLVERS-003 | Cache Identity Result | Identity engine caches resolution result for 120s — resolver returns cached value within TTL | UNVERIFIED — SECURITY FINDING (SPA-safe only) |
| BEH-IDENT-RESOLVERS-004 | Actor Kind Discrimination | Resolver returns actorKind (citizen / vport / etc.) used by consuming features to gate eligibility (e.g. canCitizenBook) | UNVERIFIED |

## Route Entry Points

None.

## TODO

- [ ] Read vcsmIdentity.resolver.js — confirm interface signature and return shape
- [ ] Enumerate cross-feature consumers (features that import this resolver)
- [ ] Confirm cache location — resolver layer or identity engine layer?
- [ ] Document whether resolver result is stable across React renders or re-invoked each call
- [ ] Assess actorKind discrimination path — does resolver validate the kind gate or return raw kind for caller to interpret?
