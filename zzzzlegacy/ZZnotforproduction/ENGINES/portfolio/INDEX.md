# INDEX — ENGINES / portfolio

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/portfolio/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| CLAUDE.md (engine root) | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/portfolio/
├── CLAUDE.md                                 — scope rules (vport schema; layer rules)
├── index.js                                  — entry point → src/adapters/index.js
└── src/
    ├── adapters/index.js                     — 14 exported symbols
    ├── config.js                             — DI (supabaseClient, isActorOwner, debugReporter)
    ├── events.js                             — 6 domain events
    ├── types/index.js                        — JSDoc typedefs
    ├── controller/
    │   ├── createItem.controller.js
    │   ├── updateItem.controller.js
    │   ├── deleteItem.controller.js
    │   ├── getPortfolioItem.controller.js
    │   ├── listPortfolio.controller.js
    │   ├── addMedia.controller.js
    │   ├── removeMedia.controller.js
    │   ├── manageTags.controller.js
    │   └── __tests__/
    │       └── updateItem.controller.test.js
    ├── dal/
    │   ├── portfolioItems.read.dal.js
    │   ├── portfolioItems.write.dal.js
    │   ├── portfolioMedia.read.dal.js
    │   ├── portfolioMedia.write.dal.js        — ANOM-PORT-001: media hard delete RLS-only
    │   ├── portfolioTags.read.dal.js
    │   ├── portfolioTags.write.dal.js
    │   ├── barberDetails.read.dal.js          — ANOM-PORT-003: kind-specific in generic engine
    │   ├── locksmithDetails.read.dal.js       — ANOM-PORT-003: kind-specific in generic engine
    │   └── __tests__/
    │       └── portfolioTags.write.dal.test.js
    ├── model/
    │   ├── PortfolioItem.model.js
    │   ├── PortfolioMedia.model.js
    │   ├── BarberDetails.model.js
    │   └── LocksmithDetails.model.js
    └── services/
        └── portfolioService.js               — itemExists + resolveItem
```

Total: 29 files (2 test files — only engine in sprint with existing tests)

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.portfolio.architecture.md`
