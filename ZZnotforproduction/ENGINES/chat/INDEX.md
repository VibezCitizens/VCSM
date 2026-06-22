# INDEX — ENGINES / chat

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/chat/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

103 files total across:

```
engines/chat/
├── index.js                  — entry point → adapters
├── CLAUDE.md                 — engine rules
├── note                      — ANOMALY: planning doc, must be removed
└── src/
    ├── config.js             — DI (10 points, no freeze guard)
    ├── events.js             — event bus + 16 EVENTS constants
    ├── types/index.js        — JSDoc typedefs
    ├── adapters/             (2 files — chat.adapter.js + index.js)
    ├── dal/                  (31 files — chat schema exclusively)
    ├── model/                (13 files + constants + permissions)
    ├── services/             (10 files)
    ├── hooks/                (9 React hooks — ANOM-CHAT-001: scope violation)
    ├── controller/           (21 controllers — no tests)
    ├── rules/                (2 files)
    └── utils/                (4 files)
```

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.chat.architecture.md`
