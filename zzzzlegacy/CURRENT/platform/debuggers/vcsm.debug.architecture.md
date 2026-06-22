# MODULE ARCHITECTURE REPORT

**Module:** debug
**Application Scope:** apps/VCSM
**Module Type:** Dev Tool Module — Login/Identity Debug Panel
**Primary Root:** `apps/VCSM/src/features/debug/`
**Independence Status:** DEPRECATED (re-exports from centralized debuggers)
**Completeness Status:** DEPRECATED — SAFE TO REMOVE

---

## PURPOSE

Originally housed login debug tooling. Now fully deprecated — `loginDebug.store.js` is a re-export shim pointing to `@debuggers/identity`. The actual debug implementation has been migrated to `zNOTFORPRODUCTION/debuggers/identity/`. This module is a legacy wrapper.

---

## ENTRY POINTS

- None (no routes/screens)
- `LoginDebugPanel.jsx` — dev-only component (unknown if still mounted anywhere)

---

## LAYER MAP

**DEPRECATED store:** `loginDebug.store.js` — re-exports all functions from `@debuggers/identity` under old names:
- `isLoginDebugEnabled` ← `isIdentityDebugEnabled`
- `addLoginDebugEvent` ← `addIdentityDebugEvent`
- `setLoginDebugSessionSnapshot` ← `setSessionSnapshot`
- `setLoginDebugIdentitySnapshot` ← `setIdentitySnapshot`
- `clearLoginDebugEvents` ← `clearIdentityDebugEvents`
- `getLoginDebugState` ← `getIdentityDebugState`
- `subscribeLoginDebug` ← `subscribeIdentityDebug`
- `setLoginDebugEnabled` ← `isIdentityDebugEnabled` (note: incorrectly re-exported as setter)

**Helpers:** `loginDebug.helpers.js` — content unknown (not read)
**Component:** `components/LoginDebugPanel.jsx` — content unknown (not read)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | DEPRECATED | Was login debug — now centralized | — |
| Controllers present | N/A | Dev tool | — |
| DAL present | N/A | Dev tool | — |
| Models present | N/A | Dev tool | — |
| Hooks present | N/A | Dev tool | — |
| Screens present | N/A | Dev tool — no routes | — |
| Adapter present | N/A | Dev tool | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Deprecated re-export shim | `loginDebug.store.js` explicitly marked DEPRECATED | HIGH — stale consumers may use old names | IRONMAN |
| Wrong setter re-export | `setLoginDebugEnabled` re-exports `isIdentityDebugEnabled` (getter) — name mismatch | MEDIUM — may cause confusion | IRONMAN |
| `LoginDebugPanel.jsx` active status unknown | Could be dead component or still mounted | MEDIUM — dead code risk | IRONMAN |
| Entire module in production `src/features/` | Debug tooling should live in `zNOTFORPRODUCTION/debuggers/` | HIGH — dev code in production path | IRONMAN |

---

## MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Delete or relocate module | HIGH | Debug module in production feature tree | IRONMAN |
| Confirm `LoginDebugPanel.jsx` consumers | MEDIUM | Unknown if component is still mounted | IRONMAN |
| Fix `setLoginDebugEnabled` wrong re-export | MEDIUM | Re-exports getter as setter — misleading name | IRONMAN |
| Logan documentation | LOW | Module is deprecated — document and archive | LOGAN |

---

## FINAL MODULE STATUS: DEPRECATED

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: delete or relocate — debug module in production tree)
- LOGAN (documentation: archive)
