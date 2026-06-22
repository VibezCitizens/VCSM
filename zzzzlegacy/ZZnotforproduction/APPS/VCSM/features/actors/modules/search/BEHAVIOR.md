---
title: Search Module — Behavior
status: STUB
feature: actors
module: search
source: architect-derived
created: 2026-06-05
---

# actors / modules / search — BEHAVIOR

## Status

STUB. Feature-level BEHAVIOR.md is a PLACEHOLDER (VEN-ACTORS-004). No §5 Security Rules or §9 Must Never Happen invariants defined. All entries below are seeded from ARCHITECT and security review evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-ACTORS-SEARCH-001 | Search Actors (authenticated) | searchActors.controller.js receives query + viewerActorId; passes to DAL with p_filter='all'; returns all visible actors matching query | UNVERIFIED |
| BEH-ACTORS-SEARCH-002 | Search Actors (unauthenticated) | viewerActorId=null → p_filter='public'; only public profiles returned; private actors excluded | UNVERIFIED |
| BEH-ACTORS-SEARCH-003 | Map Result Rows | mapSearchActorsRows transforms raw RPC result array into typed actor search shape | UNVERIFIED |
| BEH-ACTORS-SEARCH-004 | Adapter Surface | actors.adapter.js is the only approved import path; direct DAL/controller imports by other features are not sanctioned | UNVERIFIED |

## Critical Invariants (inferred from security findings — NOT yet in formal contract)

1. viewerActorId must ALWAYS be passed when the caller is authenticated — never drop it
2. Unauthenticated callers must NEVER receive non-public actor records
3. p_filter must NEVER be hardcoded to 'all' by any caller without a validated authenticated session
4. All callers must route through actors.adapter.js — direct RPC callsites are a bypass

## Behavior Flow (unverified)

```
[Consuming feature] → actors.adapter.js
  └── searchActors.controller.js (query + viewerActorId)
        └── searchActors.dal.js
              └── identity.search_actor_directory RPC
                    ├── viewerActorId=null → p_filter='public' (unauthenticated guard)
                    └── viewerActorId present → p_filter='all' (authenticated result set)
        └── searchActors.model.js (mapSearchActorsRows)
  → typed actor result array
```

## TODO

- [ ] Confirm controller input interface — does it accept limit, offset, or cursor pagination?
- [ ] Confirm null-viewer guard location (controller assertion vs DAL conditional vs RPC default)
- [ ] Document edge cases: empty query, special characters, extremely long queries
- [ ] Confirm model output shape — what fields does a mapped actor row contain?
