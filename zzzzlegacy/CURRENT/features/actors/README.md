# Actors — Governance
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

| Field | Value |
|---|---|
| Feature | actors |
| Classification | PLATFORM |
| Auth Surface | OWNER |
| Priority | P0 |
| Risk Level | CRITICAL |
| Governance Status | BOOTSTRAPPED |
| Last Updated | 2026-06-02 |
| Ticket | TICKET-DOCS-CLEANUP-001 |
| Gap ID | GAP-001 |

## What This Feature Does

The `actors` feature is the core identity abstraction for the VCSM platform. It provides headless batch hydration and search services over actor records — resolving actor summaries by ID and supporting actor search across the platform. All VPORT ownership operations depend on actor identity: `assertActorOwnsVportActorController` queries `vc.actor_owners` to authorize every privileged write, making this module the foundational trust boundary for the entire platform. It has no UI surface of its own — it is consumed by dashboard, identity, booking, feed, and profile features via its public adapter boundary.

## Layer Summary

| Layer | Present |
|---|---|
| Controllers | YES — `hydrateActors.controller.js`, `searchActors.controller.js` |
| DAL | YES — `getActorSummariesByIds.dal.js`, `searchActors.dal.js` |
| Models | YES — `extractActorIdsForHydration.model.js`, `searchActors.model.js` |
| Adapter | YES — `actors.adapter.js` (public cross-feature boundary) |
| Hooks | NO |
| Screens | NO |

## See Also

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [OWNERSHIP.md](OWNERSHIP.md)
- [TESTS.md](TESTS.md)
- [PERFORMANCE.md](PERFORMANCE.md)
- [DEFERRED.md](DEFERRED.md)
- [HISTORY_INDEX.md](HISTORY_INDEX.md)
