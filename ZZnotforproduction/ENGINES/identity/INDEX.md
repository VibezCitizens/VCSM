# INDEX — ENGINES / identity

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/identity/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/identity/
├── index.js                              — entry point → adapters
├── CLAUDE.md                             — engine rules (platform schema only)
└── src/
    ├── config.js                         — DI (supabaseClient, debugReporter, enrichActorLinks, resolveAppContext)
    ├── events.js                         — domain event emitter + 6 event constants
    ├── resolveTrace.js                   — structured debug trace utility
    ├── adapters/
    │   └── index.js                      — public API surface (15 exported symbols)
    ├── types/
    │   └── index.js                      — JSDoc domain types (no runtime code)
    ├── dal/                              (11 files)
    │   ├── access.read.dal.js
    │   ├── account.read.dal.js
    │   ├── actorLinks.read.dal.js
    │   ├── actorLinks.write.dal.js
    │   ├── app.read.dal.js
    │   ├── capabilities.read.dal.js
    │   ├── preferences.read.dal.js
    │   ├── roles.read.dal.js
    │   ├── session.read.dal.js
    │   ├── state.read.dal.js
    │   └── state.write.dal.js
    ├── model/                            (6 files — pure row mappers)
    │   ├── Access.model.js
    │   ├── Account.model.js
    │   ├── ActorLink.model.js
    │   ├── App.model.js
    │   ├── Preferences.model.js
    │   └── State.model.js
    ├── services/                         (7 files)
    │   ├── accessService.js
    │   ├── accountService.js
    │   ├── actorService.js
    │   ├── capabilityService.js
    │   ├── destinationService.js
    │   ├── roleService.js
    │   └── sessionService.js
    └── controller/                       (3 files — no tests)
        ├── logoutCleanup.controller.js
        ├── resolveAuthenticatedContext.controller.js
        └── switchActiveActor.controller.js
```

Total: 34 files (including CLAUDE.md and index.js)

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.identity.architecture.md`
