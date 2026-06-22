# BLACKWIDOW V2 Adversarial Review — debug
## BW2.9 Full Report

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | debug |
| App | VCSM |
| BW Version | BW2.5 V2 |
| Report Format | BW2.9 |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Scanner Preflight | FRESH (2026-06-04T19:48:25.152Z) |
| Scanner Version | 1.1.0 |
| Status | COMPLETE |

---

## 2. Scanner Preflight

- Scanner maps generated: 2026-06-04T19:48:25.152Z
- Age at run time: approx. 7 hours (FRESH — within 24-hour window)
- Scanner version: 1.1.0
- Security paths attributed to debug in scanner: 0
- Total platform security paths: 598
- Scanner attribution gap: debug feature has zero scanner-attributed security paths. All callgraph nodes attributed to VCSM:debug or VCSM:chat debug paths are component or module layer — no write paths, no RPC paths.

---

## 3. Scanner Inputs Block

```
security-path-map.json   → 0 paths attributed to feature: debug
callgraph.json           → 13 nodes (2 component, 11 module), 27 edges
write-execution-map.json → 0 write paths for debug
rpc-execution-map.json   → 0 RPC paths for debug
```

Callgraph ownership breakdown:
- VCSM:debug: 2 component nodes (LoginDebugPanel, buildJsonDump)
- VCSM:chat: 11 module nodes (chatBadgeDebugger, chatNavDebugger utilities)
- VCSM:profiles: 2 module nodes (ProfileRouteDebug, ROW) — in profiles feature /debug/ subdirectory

No hook or controller layer nodes detected in scanner. All nodes are component or module layer. Zero DAL write surfaces attributed to debug.

---

## 4. Attack Surface Inventory

### 4a. Security Paths
- HIGH confidence paths: 0
- LOW confidence paths: 0
- Attack target classification: Scanner gap — all attack surface inferred from source code survey.

### 4b. Hook Entry Points (UI-accessible)
| Hook | File | Access Mode |
|---|---|---|
| useDebugPrivacyRows | feed/hooks/useDebugPrivacyRows.js | Read-only, enabled: isDev guard |
| subscribeLoginDebug | loginDebug.store.js (via @debuggers stub) | Subscriber, no-op in prod |
| isIOSProdDebuggerEnabled | shared/lib/iosProdDebugger.js | Boolean read, localStorage-gated |
| bootstrapIOSProdDebuggerFromUrl | shared/lib/iosProdDebugger.js | URL param toggle, DEV-gated at call site |

### 4c. DAL Write Surfaces
None. The debug feature has zero DAL write operations. The only write surfaces are:
- `sessionStorage.setItem(LOGS_KEY, ...)` in iosProdDebugger.js — client-side only, IS_PROD guarded
- `localStorage.setItem(ENABLE_KEY, '1')` in setIOSProdDebuggerEnabled — IS_PROD guarded

### 4d. DAL Read Surfaces (relevant for data exposure)
| DAL | File | Tables Read | Production Guard |
|---|---|---|---|
| readPostActorsByIdsDAL | feed.read.debugPrivacyRows.dal.js | vc.posts | enabled: isDev at hook level |
| readActorsByIdsDAL | feed.read.debugPrivacyRows.dal.js | vc.actors | enabled: isDev at hook level |
| readActorPrivacyByActorIdsDAL | feed.read.debugPrivacyRows.dal.js | vc.actor_privacy_settings | enabled: isDev at hook level |
| readOwnedActorIdsByUserIdDAL | feed.read.debugPrivacyRows.dal.js | vc.actor_owners | enabled: isDev at hook level |
| readFollowRowsByActorsDAL | feed.read.debugPrivacyRows.dal.js | vc.actor_follows | enabled: isDev at hook level |

---

## 5. Scanner Signals Block

- Security paths: 0 attributed (scanner gap for this feature category)
- Write execution paths: 0
- RPC paths: 0
- Callgraph: 13 nodes, 27 edges — all internal to debug component/module layer
- PRIMARY ATTACK VECTOR per BW-002: scanner low-confidence zone — all attack surfaces are source-inferred, not scanner-resolved
- Vite alias audit: `@debuggers` alias in vite.config.js resolves to `debuggers-stub/` in production mode and `../../zNOTFORPRODUCTION/_ACTIVE/debuggers` in dev mode. The dev-mode path does not exist at the repository root; `ZZnotforproduction/` exists but the path `zNOTFORPRODUCTION/_ACTIVE/debuggers` does not resolve.

---

## 6. Adversarial Path Analysis

### A) OWNERSHIP BYPASS (§5.1)

**Target:** getDebugPrivacyRowsController — accepts actorId and postIds parameters

**Attack scenario:** Actor A passes Actor B's actorId to retrieve B's ownership map and privacy settings.

**Source read:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:31-43`

```js
export async function getDebugPrivacyRowsController({ actorId, postIds }) {
  if (!actorId) return [];
  // No ownership assertion — actorId is caller-supplied
  const [actors, actorPrivacyRows, ownedActorRows] = await Promise.all([
    readActorsByIdsDAL(actorIds),
    readActorPrivacyByActorIdsDAL(actorIds),
    readOwnedActorIdsByUserIdDAL(actorId),
  ]);
```

The controller has no ownership assertion. Any caller-supplied `actorId` is used to query `actor_owners`, `actor_privacy_settings`, and `actor_follows`. However, the only call site is `useDebugPrivacyRows.js`, which passes `enabled: isDev`. In production `isDev = false` → the hook short-circuits at line 11 before calling the controller. The controller is never reached in production.

**Result: BLOCKED** (production call-site guard)
**Provenance: [SOURCE_VERIFIED]** — controller:31-43, hook:11-12, panel:12 `enabled: isDev`
**Severity: MEDIUM** (controller would be HIGH if reachable)
**Exploit chain type: Single-step** (if enabled gate removed)

---

### B) SESSION MUTATION (§5.2)

**Target:** appendIOSProdDebugLog writes sessionStorage with userId, auth state transitions

**Attack scenario:** Session data including userId and auth event type is written to sessionStorage where it could be read by other scripts or XSS.

**Source read:** `apps/VCSM/src/shared/lib/iosProdDebugger.js:222-223`

```js
export function appendIOSProdDebugLog(event, payload = null) {
  if (IS_PROD) return null                        // line 222
  if (!isIOSProdDebuggerEnabled()) return null    // line 223
```

In production, `IS_PROD = import.meta.env.PROD` is statically `true`, causing early return before any sessionStorage write. The function never writes in production.

Call sites in `AuthProvider.jsx:90-93`:
```js
appendIOSProdDebugLog('auth_session_hydrated', {
  hasSession: !!nextSession,
  userId: nextSession?.user?.id ?? null,
})
```

No DEV guard at the call site, but the function's internal IS_PROD guard prevents execution.

**Concern for defense-in-depth:** Call sites in `ProtectedRoute.jsx:20-22` pass `userId: user?.id ?? null` without a call-site DEV guard. If IS_PROD detection were somehow bypassed (non-standard build, SSR context without env replacement), userId would reach sessionStorage.

**Result: BLOCKED** (IS_PROD guard internal to function; statically eliminated by Vite)
**Provenance: [SOURCE_VERIFIED]** — iosProdDebugger.js:222, AuthProvider.jsx:90, ProtectedRoute.jsx:22
**Severity: LOW** (defense-in-depth gap — call sites lack local DEV guard)
**Exploit chain type: Single-step** (requires IS_PROD bypass)

---

### C) RUNTIME ABUSE (§5.3)

**Target:** IOSProdRouteDebugger — full-screen debug panel, mounts on document.body

**Attack scenario:** A non-dev user enables the production debug overlay by setting `localStorage.__vcsm_ios_dbg = '1'`.

**Source read:** `apps/VCSM/src/app/layout/RootLayout.jsx:102`

```jsx
{import.meta.env.DEV && <IOSProdRouteDebugger />}
```

The component is rendered only when `import.meta.env.DEV` is truthy. In production builds, Vite statically replaces this with `false`, so React never renders the component. Even if somehow rendered, `isIOSProdDebuggerEnabled()` checks `IS_PROD` at line 124.

**Result: BLOCKED** (double-guarded: RootLayout DEV check + internal IS_PROD check)
**Provenance: [SOURCE_VERIFIED]** — RootLayout.jsx:102, iosProdDebugger.js:124
**Severity: INFO**

---

**Target:** chatBadgeDebugger — `isEnabled()` defaults to `true` in production if `window.__CHAT_BADGE_DEBUG` not set.

**Attack scenario:** A production user sets `window.__CHAT_BADGE_DEBUG = true` to force badge debug logging.

**Source read:** `apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js:17-20`

```js
function isEnabled() {
  if (typeof window === 'undefined') return false
  if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
  return true   // defaults to true if not set
}
```

However, all production call sites use lazy import with DEV guard:

`apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js:3,8`
```js
const DEV = import.meta.env?.DEV
async function dbg() {
  if (!DEV) return null   // never loads module in production
  ...
}
```

In production, `DEV = false` → `dbg()` returns null → `chatBadgeDbg` is never imported, `isEnabled()` never called.

**Result: BLOCKED** (lazy import guarded by DEV check; module never loaded in production)
**Provenance: [SOURCE_VERIFIED]** — chatUnread.controller.js:3,8-10, bootstrap.invalidate.js:12,15
**Severity: INFO**

---

### D) RLS VERIFICATION (§5.4)

**Target:** feed.read.debugPrivacyRows.dal.js — five DAL read functions

**Source read:** `apps/VCSM/src/features/feed/dal/feed.read.debugPrivacyRows.dal.js:1-72`

The DAL performs reads on `vc.actors`, `vc.actor_privacy_settings`, `vc.actor_owners`, `vc.actor_follows`, `vc.posts`. No application-layer ownership filter is applied in these queries — they rely entirely on Supabase RLS for row-level access control.

The DAL is never called in production (guarded at hook level). However, the DAL itself would be a HIGH concern if reachable, as it returns potentially sensitive privacy configuration and ownership mappings without application-layer identity verification.

**RLS assumption:** The queries rely on RLS policies on the `vc` schema tables. These policies have not been verified within this review scope. The dependency is noted.

**Result: PARTIAL** (not reachable in production; RLS is sole server-side barrier)
**Provenance: [SOURCE_VERIFIED]** — feed.read.debugPrivacyRows.dal.js:1-72, useDebugPrivacyRows.js:11-12
**Severity: MEDIUM** (if production guard bypassed, RLS is the only barrier for privacy data)
**Exploit chain type: Multi-step** (requires hook guard removal + RLS bypass)

---

### E) VIEWER CONTEXT FUZZING (§5.5)

**Target:** getDebugPrivacyRowsController null/undefined actorId

**Source read:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:31-33`

```js
export async function getDebugPrivacyRowsController({ actorId, postIds }) {
  if (!actorId) return [];
  if (!Array.isArray(postIds) || postIds.length === 0) return [];
```

Null actorId is handled — returns empty array. Controller does not proceed with null identity.

**Result: BLOCKED** (null guard at controller entry)
**Provenance: [SOURCE_VERIFIED]** — getDebugPrivacyRows.controller.js:31-33
**Severity: INFO**

---

**Target:** isIOSProdDebuggerEnabled null/undefined input to setIOSProdDebuggerEnabled

**Source read:** `apps/VCSM/src/shared/lib/iosProdDebugger.js:136-150`

```js
export function setIOSProdDebuggerEnabled(enabled) {
  if (IS_PROD) return
  ...
  if (enabled) window.localStorage?.setItem(ENABLE_KEY, '1')
  else {
    window.localStorage?.removeItem(ENABLE_KEY)
    window.localStorage?.removeItem(LEGACY_ENABLE_KEY)
  }
```

Passing null/undefined to `enabled` causes the falsy branch — removes the key. Safe behavior.

**Result: BLOCKED**
**Provenance: [SOURCE_VERIFIED]** — iosProdDebugger.js:136-150
**Severity: INFO**

---

### F) MUTATION REPLAY (§5.6)

**Finding:** Not applicable. The debug feature has no state-machine resources, no bookings, no write operations that could be replayed.

**Result: N/A**

---

### G) HYDRATION POISONING (§5.7)

**Finding:** The debug feature does not interact with the hydration store. Debug panels read from debug state stores (sessionStorage) and debug event buses (CustomEvent). No hydration store interaction detected.

`useActorConsistencyCheck.js` (debuggers-stub): no-op stub in production. Even in dev, the real implementation (legacy path) performs read-only consistency checks on the hydration store, not writes.

**Result: BLOCKED / N/A**
**Provenance: [SOURCE_VERIFIED]** — debuggers-stub/identity/useActorConsistencyCheck.js:2
**Severity: INFO**

---

### H) URL SURFACE (§5.9)

**Target:** Debug panel URL construction and any notification linkPaths

**Finding:** The debug feature constructs no notification linkPaths, share links, or deep links. Debug panels render locally in the browser DOM — they do not generate navigable URLs or emit notification objects.

`bootstrapIOSProdDebuggerFromUrl` reads URL params (`iosdbg`, `__vcsm_ios_dbg`, `vcsm_ios_dbg`) to toggle the debugger but does not construct URLs.

The panel's `getIOSProdDebugMeta()` captures `window.location.href` and `window.location.pathname` in the debug payload — these are stored in sessionStorage (only when enabled in dev). No UUID exposure risk in public URLs from this feature.

**Result: BLOCKED / N/A**
**Provenance: [SOURCE_VERIFIED]** — iosProdDebugger.js:152-180, 209-219
**Severity: INFO**

---

### I) §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md status:** PLACEHOLDER — Status: PLACEHOLDER. No §4 Failure Paths, no §9 Must Never Happen invariants are defined.

Per BW protocol: all §9 invariants are UNANCHORED. Source-inferred invariants are derived from the feature's actual behavior and used as attack targets.

**Source-inferred invariants for debug:**

**SI-1: Debug panels must never render in production builds.**

Attack: Force render of `LoginDebugPanel` in production by removing `if (!import.meta.env.DEV) return null` guard.

Source: `apps/VCSM/src/features/debug/components/LoginDebugPanel.jsx:49`

```jsx
export default function LoginDebugPanel() {
  if (!import.meta.env.DEV) return null
```

In Vite production builds, `import.meta.env.DEV` is statically replaced with `false`. Dead code elimination removes the component body. Consumers of this module in production only receive a null-returning function. Attack cannot succeed in a correctly built artifact.

**Result: BLOCKED** — invariant holds via static Vite replacement.

---

**SI-2: Debug sessionStorage writes (iosProdDebugger) must never write in production.**

Attack: Call `appendIOSProdDebugLog` with sensitive userId payload while `IS_PROD = true`.

Source: `apps/VCSM/src/shared/lib/iosProdDebugger.js:5,222`

```js
const IS_PROD = import.meta.env.PROD   // line 5 — statically true in prod build
...
if (IS_PROD) return null               // line 222 — always hits in prod
```

IS_PROD is evaluated once at module load time. In production, it is statically `true`. No write path is reachable.

**Result: BLOCKED** — invariant holds.

---

**SI-3: Debug DAL reads (feed.read.debugPrivacyRows) must never execute in production.**

Attack: Invoke `useDebugPrivacyRows({ actorId, postIds, enabled: true })` in a production build.

Source: `apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx:12,19`

```js
const isDev = import.meta.env.DEV;
const rows = useDebugPrivacyRows({ actorId, postIds, enabled: isDev });
```

The `enabled` parameter is derived from a statically-replaced constant. Any component passing `enabled: true` unconditionally would trigger DB reads in production. However, the only call site (`DebugPrivacyPanel.jsx`) correctly uses `enabled: isDev`.

**Concern:** The DAL and controller are in the production bundle. If a developer adds a second call site and forgets the DEV guard, the queries execute. There is no server-side guard on these DAL reads (beyond RLS). The invariant is enforced at a single call site, not at the controller or DAL layer.

**Result: PARTIAL** — invariant holds via single call-site guard only. Fragile single-point enforcement.
**Severity: MEDIUM** — single call-site guard; no controller-layer dev check.
**Exploit chain type: Single-step** (remove `enabled: isDev` at any call site)

---

**SI-4: setLoginDebugEnabled must not expose a functional setter in production.**

Background (VEN-DEBUG-001): `loginDebug.store.js:13` exports `isIdentityDebugEnabled` as `setLoginDebugEnabled`. The name implies a setter but the underlying function is a getter. Any code calling `setLoginDebugEnabled(true)` to enable the debugger would not actually enable it — the call reads and returns current state.

Attack: Call `setLoginDebugEnabled(true)` expecting it to enable debug mode.

Source: `apps/VCSM/src/features/debug/loginDebug.store.js:13`

```js
export { isIdentityDebugEnabled as setLoginDebugEnabled } from '@debuggers/identity'
```

In production, `@debuggers` resolves to `debuggers-stub/identity/index.js:11`:

```js
export function isIdentityDebugEnabled() { return false }
```

`setLoginDebugEnabled(true)` returns `false` and performs no mutation. No debug state is set. The broken export name cannot be exploited to enable the debugger.

**Result: BLOCKED** — calling the misnamed setter performs no mutation. Stub returns false.
**Provenance: [SOURCE_VERIFIED]** — loginDebug.store.js:13, debuggers-stub/identity/index.js:11
**Severity: LOW** (code quality / confusion risk; no runtime exploit in current usage)

---

**SI-5: chatNavDebugger must not log sensitive data in production.**

Attack: Exploit the fact that `chatNavDebugger.js` is statically imported (not lazy) in `ConversationView.jsx` and `isEnabled()` defaults to `true` when `window.__CHAT_NAV_DEBUG` is not set. If a production call path invokes `chatNavDbg.startRun()` without checking DEV, the run would be logged.

Source: `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx:34,39,201`

```js
import { chatNavDbg } from '@/features/chat/debug/chatNavDebugger'  // line 34 — static import
const DEV = import.meta.env?.DEV                                      // line 39
...
if (!DEV) return                                                       // line 201 — all call sites
```

All six call sites in ConversationView check `if (!DEV) return` before invoking `chatNavDbg`. In production DEV=false, all calls short-circuit. The module-level `runs = new Map()` is initialized but never used.

Secondary concern: the module IS in the production bundle (static import, module-level side effect prevents tree-shaking). It could theoretically be reached via browser console: `window.__chatNavDbg` — but the module does not expose itself to the window object.

**Result: BLOCKED** (call-site DEV guards prevent any execution in production)
**Provenance: [SOURCE_VERIFIED]** — ConversationView.jsx:34,39,201,218,224,230,236
**Severity: LOW** (module in production bundle unnecessarily; INFO-level exposure risk)

---

## 7. Exploitability Assessment

| Attack Vector | Exploitable in Production | Exploit Requires |
|---|---|---|
| SI-1 (debug panel render) | NO | Rebuilt artifact with guard removed |
| SI-2 (sessionStorage write) | NO | IS_PROD bypass or non-Vite build |
| SI-3 (privacy DAL reads) | NO in current state | Adding unsecured call site |
| SI-4 (setter name confusion) | NO | Nothing — stub returns false |
| SI-5 (chatNavDebugger) | NO | Call-site guard removal |
| §5.1 Ownership bypass | NO in current state | Production guard removal |
| §5.2 Session mutation | NO | IS_PROD static override |
| §5.3 Runtime abuse | NO | Double-guarded by Vite |

**No production exploit chains confirmed in adversarial testing.**

The primary risk profile of this feature is:
1. Defense-in-depth weaknesses — individual guards are non-redundant (single call-site enforcement)
2. Code organization — debug modules outside `debuggers-stub` are bundled into production
3. Broken dev-mode alias path (zNOTFORPRODUCTION/_ACTIVE/debuggers missing)
4. Open VEN findings (VEN-DEBUG-001, VEN-DEBUG-002) remain OPEN

---

## 8. Source Verification Summary

| Finding | Files Read | Lines Cited | Verification Status |
|---|---|---|---|
| BW-DEBUG-001 | getDebugPrivacyRows.controller.js, useDebugPrivacyRows.js, DebugPrivacyPanel.jsx | controller:31-43, hook:11-12, panel:12,19 | SOURCE_VERIFIED |
| BW-DEBUG-002 | iosProdDebugger.js, AuthProvider.jsx, ProtectedRoute.jsx | lib:222-223, auth:90-93, prot:20-22 | SOURCE_VERIFIED |
| BW-DEBUG-003 | iosProdDebugger.js, useDebugPrivacyRows.js, feed.read.debugPrivacyRows.dal.js | lib:222, hook:11-12, dal:1-72 | SOURCE_VERIFIED |
| BW-DEBUG-004 | vite.config.js, loginDebug.store.js | config:50-53, store:13 | SOURCE_VERIFIED |
| BW-DEBUG-005 | loginDebug.store.js, debuggers-stub/identity/index.js | store:13, stub:11 | SOURCE_VERIFIED |
| BW-DEBUG-006 | chatNavDebugger.js, ConversationView.jsx | nav:17-47,53, conv:34,39,201,218,224,230,236 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Category | Confidence | Basis |
|---|---|---|
| Production safety of LoginDebugPanel | HIGH | import.meta.env.DEV guard + Vite static replacement |
| Production safety of IOSProdRouteDebugger | HIGH | Double guard: RootLayout DEV + internal IS_PROD |
| Production safety of iosProdDebugger writes | HIGH | IS_PROD statically true; function returns null before write |
| Production safety of debug DAL reads | MEDIUM | Single call-site guard only; no controller-layer protection |
| chatNavDebugger production bundling | HIGH | Static import confirmed; call-site guards confirmed present |
| @debuggers stub routing in production | HIGH | vite.config.js:50-52 confirmed |
| @debuggers dev-mode alias broken | HIGH | Path zNOTFORPRODUCTION/_ACTIVE/debuggers not found at repo root |
| setLoginDebugEnabled mutation safety | HIGH | Stub resolves to getter returning false |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — no §9 invariants are defined. All invariants below are source-inferred.

| Invariant | Source Basis | Attack Harness | Result |
|---|---|---|---|
| SI-1: No debug panels in prod | LoginDebugPanel.jsx:49 | Force render without DEV guard | BLOCKED — Vite static elimination |
| SI-2: No sessionStorage writes in prod | iosProdDebugger.js:222 | Call appendIOSProdDebugLog with userId in prod | BLOCKED — IS_PROD early return |
| SI-3: No debug DAL reads in prod | DebugPrivacyPanel.jsx:19 | Pass enabled:true to useDebugPrivacyRows | PARTIAL — single call-site guard only |
| SI-4: setLoginDebugEnabled not a setter | loginDebug.store.js:13 | Call setLoginDebugEnabled(true) to enable debug | BLOCKED — resolves to no-op getter |
| SI-5: chatNavDebugger no prod logging | ConversationView.jsx:201 | Invoke chatNavDbg without DEV check | BLOCKED — all call sites guarded |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: PLACEHOLDER

- §4 Failure Paths: UNDEFINED — all failure path analysis is source-inferred
- §9 Must Never Happen: UNDEFINED — all invariants are source-inferred (SI-1 through SI-5)
- Risk: Any future changes to debug instrumentation have no formal invariants to test against
- VEN-DEBUG-004 (MEDIUM, OPEN): remains valid — BEHAVIOR.md is still a PLACEHOLDER as of this run

**Recommendation:** Write a minimal §9 with at minimum:
1. "Debug panels must never render in production builds"
2. "Debug sessionStorage must never be written in production"
3. "Debug DAL reads must never execute in production"

---

## 12. THOR Impact

**THOR Release Blockers from BW findings:**

No BW findings introduce new CRITICAL or HIGH severity results that are BYPASSED. All attacks result in BLOCKED.

BW-DEBUG-001 through BW-DEBUG-006 are all MEDIUM, LOW, or INFO severity findings with BLOCKED or PARTIAL results.

**Carryover THOR blockers from VENOM (remain unchanged):**
- VEN-DEBUG-001 (HIGH): THOR blocker — broken export name `setLoginDebugEnabled`
- VEN-DEBUG-002 (HIGH): THOR blocker — dead-code `__vcsm_dbg` localStorage panel with documented key name

BW does not add new THOR release blockers. The two VEN findings remain as existing governance blockers.

---

## 13. SPIDER-MAN Test Requirements

The following tests are recommended based on BW adversarial findings:

**T-BW-DEBUG-001 (Priority: HIGH)**
Verify `LoginDebugPanel` renders `null` when `import.meta.env.DEV = false`.
Attack vector: §9 SI-1.
Test: Render component in test env with `DEV = false` → expect null output.

**T-BW-DEBUG-002 (Priority: HIGH)**
Verify `appendIOSProdDebugLog` returns null without writing to sessionStorage when `PROD = true`.
Attack vector: §9 SI-2, §5.2.
Test: Mock `import.meta.env.PROD = true` → call function with userId payload → assert sessionStorage.getItem(LOGS_KEY) returns null.

**T-BW-DEBUG-003 (Priority: MEDIUM)**
Verify `useDebugPrivacyRows` never calls the controller when `enabled = false`.
Attack vector: §9 SI-3.
Test: Render hook with `enabled: false` → assert `getDebugPrivacyRowsController` is not called.

**T-BW-DEBUG-004 (Priority: MEDIUM)**
Verify `getDebugPrivacyRowsController` returns empty array for null actorId.
Attack vector: §5.5 viewer context fuzzing.
Test: Call controller with `actorId: null` → expect `[]` return.

**T-BW-DEBUG-005 (Priority: MEDIUM)**
Verify `setLoginDebugEnabled` does not mutate debug state (broken setter contract).
Attack vector: §9 SI-4, VEN-DEBUG-001.
Test: Call `setLoginDebugEnabled(true)` → assert `isLoginDebugEnabled()` still returns `false`.

**T-BW-DEBUG-006 (Priority: LOW)**
Verify `chatBadgeDbg` is never loaded in production (lazy import DEV guard).
Attack vector: §5.3 runtime abuse.
Test: Mock `import.meta.env.DEV = false` → call `getChatInboxUnreadBadgeCount` → assert dynamic import of chatBadgeDebugger never fires.

**T-BW-DEBUG-007 (Priority: LOW)**
Verify `isIOSProdDebuggerEnabled` returns false in production regardless of localStorage state.
Attack vector: §5.3 runtime abuse.
Test: Set `localStorage.__vcsm_ios_dbg = '1'` → mock `IS_PROD = true` → assert function returns false.

---

## 14. Full Finding Registry

| Finding ID | Severity | Description | Result | Status | Provenance |
|---|---|---|---|---|---|
| BW-DEBUG-001 | MEDIUM | getDebugPrivacyRowsController has no ownership assertion — relies on single call-site DEV guard as sole production barrier; privacy data, ownership rows, and follow graphs accessible to any caller-supplied actorId if guard removed | BLOCKED (currently) | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-002 | LOW | appendIOSProdDebugLog call sites in ProtectedRoute.jsx and AuthProvider.jsx pass userId without call-site DEV guard; production safety relies solely on IS_PROD internal guard with no defense-in-depth | BLOCKED | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-003 | MEDIUM | feed.read.debugPrivacyRows.dal.js and getDebugPrivacyRowsController are included in production bundle without any controller-layer or DAL-layer production guard — enforcement is single-point at hook call site | PARTIAL | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-004 | LOW | vite.config.js:52 dev-mode @debuggers alias references nonexistent path zNOTFORPRODUCTION/_ACTIVE/debuggers — dev builds may fail to resolve real debugger implementations; production is unaffected (stub path correct) | N/A | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-005 | LOW | loginDebug.store.js:13 exports isIdentityDebugEnabled as setLoginDebugEnabled — misnamed export cannot actually set debug state; in production resolves to stub no-op; risk is developer confusion and inability to toggle debugger | BLOCKED | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-006 | LOW | chatNavDebugger.js statically imported in ConversationView.jsx (not lazy) and has module-level side effect (const runs = new Map()); included in production bundle; isEnabled() defaults to true if window.__CHAT_NAV_DEBUG not set; all call sites guarded but module is unnecessary production overhead | BLOCKED | DRAFT | SOURCE_VERIFIED |
| BW-DEBUG-007 | INFO | BEHAVIOR.md is PLACEHOLDER — no §9 invariants anchored; all production safety relies on implicit source-inferred contracts with no formal governance | N/A | DRAFT | SOURCE_VERIFIED (BEHAVIOR.md read) |
