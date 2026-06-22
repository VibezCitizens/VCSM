# INDEX — ENGINES / hydration

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/hydration/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| CLAUDE.md (engine root) | MISSING — governance gap |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/hydration/
├── index.js                              — primary export (9+ symbols)
└── src/
    ├── config.js                         — DI (supabaseClient + hydrators, no freeze guard)
    ├── dal.js                            — vc.get_actor_summaries RPC
    ├── extract.js                        — actor ID extraction (20 field patterns)
    ├── normalize.js                      — canonical normalization
    ├── hydrate.js                        — core pipeline
    ├── store.js                          — Zustand actor store (ANOM-HYDRATE-001)
    ├── useActorSummary.js                — React hook (ANOM-HYDRATE-001)
    ├── adapters/
    │   └── index.js                      — VESTIGIAL: 2 exports only (ANOM-HYDRATE-003)
    └── controller/
        └── hydrateActor.controller.js    — app hydrator delegation
```

Total: 10 files

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.hydration.architecture.md`
