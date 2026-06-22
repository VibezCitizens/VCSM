# INDEX — ENGINES / notifications

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/notifications/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/notifications/
├── index.js                                — entry point → adapters
├── CLAUDE.md                               — engine rules (notification schema only)
└── src/
    ├── config.js                           — DI (no freeze guard)
    ├── events.js                           — 12 event constants + in-process emitter
    ├── adapters/
    │   └── index.js                        — public API surface (32 exported symbols)
    ├── types/
    │   └── index.js                        — JSDoc typedefs (no runtime code)
    ├── dal/                                (10 files)
    │   ├── deliveryAttempts.write.dal.js
    │   ├── eventTypes.read.dal.js
    │   ├── events.read.dal.js
    │   ├── events.write.dal.js
    │   ├── inbox.read.dal.js
    │   ├── inbox.write.dal.js
    │   ├── preferences.read.dal.js
    │   ├── recipients.read.dal.js
    │   ├── recipients.write.dal.js
    │   ├── rendered.write.dal.js            — NOTE: contains both read and write functions
    │   └── templates.read.dal.js
    ├── model/                              (7 files — pure row mappers)
    │   ├── DeliveryAttempt.model.js
    │   ├── Event.model.js
    │   ├── InboxItem.model.js
    │   ├── Preference.model.js
    │   ├── Recipient.model.js
    │   ├── Rendered.model.js
    │   └── Template.model.js
    ├── services/                           (4 files)
    │   ├── deliveryOrchestrator.service.js
    │   ├── preferenceEvaluator.service.js
    │   ├── templateRenderer.service.js
    │   └── trace.service.js
    └── controller/                         (4 files — no tests)
        ├── countUnread.controller.js
        ├── getInbox.controller.js
        ├── inboxState.controller.js
        └── publishEvent.controller.js
```

Total: 33 files (including CLAUDE.md and index.js)

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.notifications.architecture.md`
