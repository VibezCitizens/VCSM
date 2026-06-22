---
title: Debug Module — Index
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: debug
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/debug/
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / debug

Two standalone runtime observability utilities. Pure JS, zero imports, no DB, no React.

## Module Summary

| Field | Value |
|---|---|
| Module | debug |
| Feature | chat |
| Source Path | apps/VCSM/src/features/chat/debug/ |
| Production Safe | PARTIAL — no NODE_ENV gate; defaults ENABLED; console-only output |
| Routes | None |
| Structure Correction | Scanner expected JSX panels; actual: 2 JS utility objects |

## Source Files (2)

| File | Lines | Purpose |
|---|---|---|
| chatBadgeDebugger.js | 75 | Badge count tracer — chatBadgeDbg object |
| chatNavDebugger.js | 169 | Navigation timeline — chatNavDbg object |

## Key Finding

ANOM-CHAT-DEBUG-001 (MEDIUM): Both debuggers default to ENABLED with no NODE_ENV guard.
Will run in production unless `window.__CHAT_BADGE_DEBUG = false` and `window.__CHAT_NAV_DEBUG = false`
are set explicitly. Fix: add `if (process.env.NODE_ENV !== 'development') return false` to each isEnabled().

## Governance Files

| File | Status |
|---|---|
| INDEX.md | ARCHITECT COMPLETE (2026-06-05) |
| ARCHITECTURE.md | ARCHITECT COMPLETE (2026-06-05) |
| CURRENT_STATUS.md | NOT PRESENT |
| BEHAVIOR.md | STUB (scanner 2026-06-04) |
| SECURITY.md | STUB (scanner 2026-06-04) |

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/chat.debug.architecture.md`
