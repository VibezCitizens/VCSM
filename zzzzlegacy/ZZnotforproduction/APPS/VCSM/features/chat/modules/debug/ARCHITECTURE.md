---
title: Debug Module — Architecture
status: ARCHITECT COMPLETE (2026-06-05)
feature: chat
module: debug
source: ARCHITECT
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/debug/
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / debug — ARCHITECTURE

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Architecture State:** SOURCE_VERIFIED — COMPLETE

## Module Role

Two standalone runtime observability utilities. Pure JS objects, zero imports, no DB, no React.

## File Inventory

| File | Lines | Purpose |
|---|---|---|
| chatBadgeDebugger.js | 75 | Badge count pipeline tracer (timing + delta detection) |
| chatNavDebugger.js | 169 | Navigation state timeline recorder |

## Structure Correction

Scanner expected a diagnostics group pattern with JSX panels.
[SOURCE_VERIFIED] Actual: 2 JS utility objects (chatBadgeDbg, chatNavDbg). No JSX.

## Consumer Map

| Debugger | Consumers |
|---|---|
| chatBadgeDbg | chatUnread.controller.js, bootstrap.invalidate.js |
| chatNavDbg | ConversationView.jsx |

## Production Safety

Toggle: `window.__CHAT_BADGE_DEBUG` / `window.__CHAT_NAV_DEBUG`
Default: ENABLED if flag not set — NOT gated by NODE_ENV.

## Architecture Anomalies

| ID | Severity | Summary |
|----|---------|---------|
| ANOM-CHAT-DEBUG-001 | MEDIUM | Both debuggers default ENABLED — no NODE_ENV gate — run in production |
| ANOM-CHAT-DEBUG-002 | INFO | chatNavDebugger uses Math.random() for IDs — debug-only, acceptable |
| ANOM-CHAT-DEBUG-003 | INFO | chatNavDebugger uses new Date().toISOString() — debug-only, acceptable |

## Independence

FULLY INDEPENDENT — zero imports, no state, no DB.

## Full Report

`outputs/2026/06/05/ARCHITECT/chat.debug.architecture.md`
