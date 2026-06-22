# ARCHITECT — chat / modules / debug

**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Scanner Version:** 1.1.0
**Architecture State:** SOURCE_VERIFIED

---

## MODULE ARCHITECTURE REPORT

Module: debug
Application Scope: VCSM
Module Type: chat feature sub-module — dev-only runtime observability utilities
Primary Root: apps/VCSM/src/features/chat/debug/
Independence Status: FULLY INDEPENDENT
Completeness Status: COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] The debug module contains two standalone runtime observability utilities
for the chat feature. Both are pure JavaScript objects with no imports, no state, no DB
access, and no React dependency.

- `chatBadgeDebugger.js` — tracks the badge count pipeline: fetch timing, count changes, cache invalidation
- `chatNavDebugger.js` — tracks navigation state transitions: run timelines with ordered marks

Neither file is gated by `process.env.NODE_ENV`.

---

## FILE INVENTORY

| File | Lines | Purpose |
|---|---|---|
| chatBadgeDebugger.js | 75 | Badge count pipeline tracer (timing + delta detection) |
| chatNavDebugger.js | 169 | Navigation state timeline recorder |

---

## chatBadgeDebugger.js — Architecture Detail

**Export:** `chatBadgeDbg` (named)

**Toggle:** `window.__CHAT_BADGE_DEBUG = true/false`

**Default:** ENABLED (isEnabled returns `true` if flag is not set)

**API:**

| Method | Purpose |
|---|---|
| `startFetch(actorId)` | Call before DB fetch — returns opaque timing token `{ actorId, t0 }` |
| `endFetch(token, count)` | Call after fetch resolves — logs timing + count change detection |
| `endFetchError(token)` | Call on fetch error — logs timing |
| `invalidate(reason)` | Log an imperative cache invalidation event |

**State:** `_lastCount: Map<actorId, count>` — module-level singleton for delta detection.

**Output:** `console.groupCollapsed` / `console.log` / `console.groupEnd`

**Consumers (SOURCE_VERIFIED):**
- `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js` — wraps badge fetch pipeline
- `apps/VCSM/src/bootstrap/bootstrap.invalidate.js` — invalidate() call on cache reset

---

## chatNavDebugger.js — Architecture Detail

**Export:** `chatNavDbg` (named)

**Toggle:** `window.__CHAT_NAV_DEBUG = true/false`

**Default:** ENABLED (isEnabled returns `true` if flag is not set)

**API:**

| Method | Purpose |
|---|---|
| `startRun(name, meta)` | Start a navigation run — returns runId string |
| `mark(runId, label, data)` | Record a timestamped mark in the run timeline |
| `snapshot(runId, label, fn)` | Lazy mark — fn() only evaluated if enabled |
| `endRun(runId, label, data)` | End run — logs full timeline via console.table |

**State:** `runs: Map<runId, runObject>` — module-level singleton. Runs are deleted after `endRun`.

**runId format:** `${Math.random().toString(16).slice(2,8)}-${Math.random().toString(16).slice(2,8)}`

**Output:** `console.groupCollapsed`, `console.log`, `console.table`, `console.groupEnd`

**Consumers (SOURCE_VERIFIED):**
- `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx` — navigation tracking

---

## DB ACCESS MAP

None. Both utilities are pure client-side observability with no DB or API calls.

---

## PRODUCTION SAFETY AUDIT

| Check | Result |
|---|---|
| Gated by NODE_ENV | NO — neither file checks `process.env.NODE_ENV` |
| Runtime toggle available | YES — `window.__CHAT_*_DEBUG` flag |
| Default state | ENABLED (both default to `true` if not explicitly set) |
| Output channel | `console.*` only — no network calls, no file writes |
| Sensitive data exposure | MEDIUM — logs actorId slices, timing, navigation state, message data |

**Assessment:** Both debuggers will run in production unless the host environment
explicitly sets `window.__CHAT_BADGE_DEBUG = false` and `window.__CHAT_NAV_DEBUG = false`.
There is no build-time tree-shaking guard. The data logged (actorId fragments, navigation
state) is not highly sensitive but the console output is visible to any user with DevTools.

---

## ARCHITECTURE ANOMALIES

| ID | Severity | Summary | Evidence |
|---|---|---|---|
| ANOM-CHAT-DEBUG-001 | MEDIUM | Both debuggers default to ENABLED — not gated by NODE_ENV — run in production | [SOURCE_VERIFIED] chatBadgeDebugger.js line 19, chatNavDebugger.js line 44 |
| ANOM-CHAT-DEBUG-002 | INFO | chatNavDebugger uses Math.random() for run IDs — acceptable for debug-only, not a platform concern | [SOURCE_VERIFIED] chatNavDebugger.js lines 49-51 |
| ANOM-CHAT-DEBUG-003 | INFO | chatNavDebugger uses `new Date().toISOString()` — acceptable for debug timestamps | [SOURCE_VERIFIED] chatNavDebugger.js line 26 |

**ANOM-CHAT-DEBUG-001 detail:**

```javascript
// chatBadgeDebugger.js
function isEnabled() {
  if (typeof window === 'undefined') return false
  if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
  return true  // ← DEFAULT ON
}

// chatNavDebugger.js
function isEnabled() {
  if (typeof window === 'undefined') return true  // SSR: returns true
  if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
  return true  // ← DEFAULT ON
}
```

Recommended fix: add `if (process.env.NODE_ENV !== 'development') return false` as the
first check in each `isEnabled()` function. This would make the debuggers no-ops in
production while preserving runtime toggle capability in dev.

---

## INDEPENDENCE CLASSIFICATION

**FULLY INDEPENDENT**

Both files have zero imports. No React, no Supabase, no engine, no shared utilities.
Pure JavaScript objects with closures over module-level state.

---

## HANDOFF RECOMMENDATIONS

| Command | Reason | Priority |
|---|---|---|
| VENOM | ANOM-CHAT-DEBUG-001: production exposure — actorId fragments in console output | P2 |
| ELEKTRA | Trace whether debug output is harvested in any CSP/logging pipeline | P3 |
| SPIDER-MAN | Zero tests — debug utilities are untested | P3 |
