# BlackWidow V2 — Adversarial Review Report
# Feature: ui | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-UI-2026-06-04 |
| Feature | ui |
| App | VCSM |
| Run Date | 2026-06-04 |
| Reviewer | BLACKWIDOW V2 (BW2.5) |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Cross-Ref | VEN-UI-001, VEN-UI-002, VEN-UI-003 (all LOW, OPEN) |

---

## 2. Scanner Preflight

- Status: FRESH
- Generated: 2026-06-04T19:48:25.152Z
- Scanner Version: 1.1.0
- Security paths attributed to ui in scanner: 0 (zero write-path attribution)
- Total platform security paths: 598

Scanner signals indicate the `ui` feature has no attributed security paths. This is
consistent with the feature being a pure UI primitive library (ModernPrimitives.jsx,
module-modern.css) plus an in-process dev tooling subsystem (DiagnosticsPanel, DiagnosticsGroup,
DiagnosticsRow). Neither category has conventional write DAL paths. The attack surface
is therefore UI rendering, dev tooling data exposure, and CSS token hygiene.

---

## 3. Scanner Inputs Block

```
security-path-map.json  → 0 paths attributed to feature:ui
callgraph.json          → 192 nodes, 218 edges attributed to /ui/ paths
                           layers: adapter(2), barrel(13), component(146), model(6), screen(25)
                           NO hook or controller layer nodes
write-execution-map.json → 0 write paths for feature:ui
rpc-execution-map.json   → 0 RPC paths for feature:ui
```

**Key scanner observation:** Zero hook/controller layer nodes. The `ui` feature has no
mutation surfaces of its own. All 192 callgraph nodes are components, adapters, barrels,
models, and screens. The attack surface is limited to:
1. ModernPrimitives.jsx — render-only, pure UI primitives
2. module-modern.css — CSS token and style system
3. DiagnosticsPanel + supporting components — dev-only data display and download

---

## 4. Attack Surface Inventory

### 4.1 Security Paths in Scope

**Count: 0 scanner-attributed security paths**

The scanner attributes no security paths to this feature. Source review confirms:
- ModernPrimitives.jsx: zero DB calls, zero mutations, pure JSX render
- module-modern.css: static CSS, no scripting
- DiagnosticsPanel.jsx: no DB calls; receives pre-built data via props
- DiagnosticsGroup.jsx: no DB calls; pure render
- DiagnosticsRow.jsx: no DB calls; renders row data in a `<pre>` block
- diagnosticsPanel.helpers.js: pure date formatting utilities, no network calls
- DevDiagnosticsScreen.jsx: orchestration shell; delegates to runAllDiagnostics — does
  make live Supabase calls but these are in the diagnostics engine, not the ui feature

### 4.2 HIGH Confidence vs LOW Confidence

- HIGH confidence paths: none (no attributed paths)
- LOW confidence paths: none (no attributed paths)
- PRIMARY ATTACK TARGETS per Rule BW-002: the dev tooling download surface and inline
  style injection are the highest-consequence surfaces reachable without write attribution

### 4.3 Hook Entry Points

None. The scanner confirms zero hook-layer nodes in this feature.

### 4.4 DAL Write Surfaces

None. The scanner confirms zero write-path attribution.

### 4.5 Callgraph Trace: DAL Write → Hook

Not applicable. No write DAL in this feature.

---

## 5. Scanner Signals Block

| Signal Type | Count | Notes |
|---|---|---|
| security paths | 0 | No attributed paths |
| callgraph nodes | 192 | All component/adapter/barrel/model/screen layers |
| callgraph edges | 218 | All intra-feature render dependencies |
| write paths | 0 | No mutations |
| rpc paths | 0 | No RPCs |
| hook nodes | 0 | Feature has no hooks |
| controller nodes | 0 | Feature has no controllers |

---

## 6. Adversarial Path Analysis

### 6.A — OWNERSHIP BYPASS

**Attack vector:** None applicable. The `ui` feature contains no ownership-gated
operations. ModernPrimitives.jsx exports render-only layout primitives. DiagnosticsPanel
accepts all its data via props and never reads or writes actor ownership state.

**Result:** BLOCKED — no ownership surfaces exist in this feature.

**Finding:** None.

---

### 6.B — SESSION MUTATION

**Attack vector:** DiagnosticsScreen (the container for DiagnosticsPanel) calls
`ensureAuthContext` which reads `supabase.auth.getSession()` and `supabase.auth.getUser()`.
The returned `session` object (including `access_token`, `refresh_token`) is stored in
the shared diagnostics cache as `shared.cache.authContext.session`.

In `actorSystem.group.js` line 90, test result data explicitly returns:
```js
return {
  userId: auth.userId,
  email: auth.email,
  hasSession: Boolean(auth.session),
};
```

`userId` and `email` are placed directly in `row.data` (test result data field).
`DiagnosticsPanel.downloadPayload()` at line 141-154 serializes ALL `row.data` fields
into a JSON blob and triggers a browser download. A developer who clicks "Download JSON"
will produce a file containing their `userId` and `email` in plaintext.

This is a developer credential/PII export risk. The session token itself (`access_token`)
is NOT exported — only `hasSession: Boolean(...)` is included — so direct bearer token
exfiltration via download is blocked. However, the `userId` UUID and `email` string are
exported without sanitization.

**Severity calibration:** This is a dev-only surface (behind `import.meta.env.DEV`
plus Vite tree-shaking). In production builds, `DevDiagnosticsScreen` resolves to
`() => null` (lazyApp.jsx line 53) and the route redirects to `/feed`
(app.routes.jsx line 164). The exposure is dev-environment-only.

**Result:** PARTIAL — PII (userId, email) serialized to downloadable file. Access token
NOT exposed. Dev-only gate confirmed BLOCKED in production.

**Finding:** BW-UI-001 (LOW) — see §7.

---

### 6.C — RUNTIME ABUSE

**Attack vector 1 — actor kind gate:** DiagnosticsPanel has no actor kind check.
Any authenticated user who reaches `/dev/diagnostics` in a DEV build can run all tests.
There is no "admin-only" or "vport-owner-only" gate. This is acceptable for a dev tool
but confirms the panel should never be reachable in production.

Production gate: `devDiagnosticsEnabled = import.meta.env.DEV` (confirmed at
`apps/VCSM/src/app/routes/protected/app.routes.jsx:22` and
`apps/VCSM/src/app/routes/lazyApp.jsx:3`). In production builds Vite drops the module.

**Attack vector 2 — ModernButton `onClick`:** `ModernButton` accepts an `onClick` prop
with no validation. If a caller passes an async function that throws, there is no
`try/catch` wrapper. This is a React unhandled rejection concern, not a security finding.

**Result:** BLOCKED — runtime abuse paths exist only in dev builds, correctly gated.

**Finding:** None new.

---

### 6.D — RLS VERIFICATION

**Attack vector:** The ui feature itself has no DAL calls. The diagnostics helpers
(`ensureActorContext.js`, `ensureAuthContext.js`) do make Supabase calls under the
authenticated user's session — all reads go through RLS-gated tables. These are
diagnostic reads of data the viewer already owns. No cross-actor reads are attempted.

`settingsAccountFeature.group.helpers.js` line 40-62 queries `vc.actor_owners` and
`vc.actors` filtered by the authenticated user's `userId`. No other-actor data is read.

**Result:** BLOCKED — no cross-actor RLS bypass surface in ui feature.

**Finding:** None.

---

### 6.E — VIEWER CONTEXT FUZZING

**Attack vector:** DiagnosticsPanel receives no `viewerActorId`. It is a pure presenter.
`DevDiagnosticsScreen` calls `getDiagnosticsCatalog()` synchronously and initializes
state without an actor context. Actor context is lazily resolved inside individual test
runners via `ensureActorContext(shared)`. If the user is not authenticated,
`ensureAuthContext` throws: `"No authenticated user found. Log in first, then rerun
diagnostics at /dev/diagnostics."` (ensureAuthContext.js line 17-20). The error is
caught in `runOneGroup`'s try/catch at runAllDiagnostics.js line 69-99, producing a
failure result row rather than a crash.

Null/undefined viewerActorId is handled gracefully. The screen remains functional with
test rows in "failed" state.

**Result:** BLOCKED — null actor context handled via error propagation to row state.

**Finding:** None.

---

### 6.F — MUTATION REPLAY

**Attack vector:** DiagnosticsPanel has no terminal-state resources. The "Run" buttons
can be re-triggered at any time (no idempotency concern from a security perspective;
the diagnostic DB operations are upserts, not irreversible mutations). No booking,
payment, or state-machine resources are involved.

The `isRunningAll` and `runningGroups[groupId]` booleans in `DevDiagnosticsScreen`
prevent concurrent re-execution of the same group, but this is a UX guard, not a
security one.

**Result:** BLOCKED — no replay attack surface.

**Finding:** None.

---

### 6.G — HYDRATION POISONING

**Attack vector:** ModernPrimitives.jsx and module-modern.css do not interact with the
hydration store. DiagnosticsPanel does not touch the hydration store. No actor summaries
are read or written from this feature.

**Result:** BLOCKED — no hydration store interaction.

**Finding:** None.

---

### 6.H — URL SURFACE

**Attack vector:** The `ui` feature constructs no notification linkPaths, share links,
or deep links. DiagnosticsPanel.downloadPayload() builds a blob URL internally:

```js
// DiagnosticsPanel.jsx line 143-152
const blob = new Blob([text], { type: "application/json" });
const url = URL.createObjectURL(blob);
const anchor = document.createElement("a");
anchor.href = url;
anchor.download = `${filenamePrefix}-${toSafeDateStamp(lastRunAt)}.json`;
document.body.appendChild(anchor);
anchor.click();
document.body.removeChild(anchor);
URL.revokeObjectURL(url);
```

`toSafeDateStamp` is called with `lastRunAt` (a developer-controlled timestamp, not
user input from URL). The `filenamePrefix` is a hardcoded string literal ("diagnostics"
or "diagnostics-failed-skipped"). No raw UUID appears in the download URL or filename.

`URL.createObjectURL` produces a `blob:` URL scoped to the current browsing context.
It is immediately revoked after the click. No persistent URL with sensitive data is
created.

**Result:** BLOCKED — no raw UUID exposure, no persistent URL.

**Finding:** None.

---

### 6.I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is PLACEHOLDER status. No §9 Must Never Happen entries are documented.
All invariants are UNANCHORED.

**Source-inferred invariant attack harnesses (from architectural understanding):**

**Inferred invariant I-1:** The diagnostics panel must never be reachable in a
production build.

Attack: Navigate to `/dev/diagnostics` in a production deployment.

Verification: `app.routes.jsx:164` shows:
```js
const devDiagnosticsEnabled = import.meta.env.DEV;
// ...
{
  path: "/dev/diagnostics",
  element: devDiagnosticsEnabled ? (
    <DevDiagnosticsScreen />
  ) : (
    <Navigate to="/feed" replace />
  ),
}
```
`lazyApp.jsx:51-53` confirms the component itself also resolves to `() => null` in
production. Two independent gates, both keyed on `import.meta.env.DEV`.
Vite replaces `import.meta.env.DEV` with `false` in production builds, enabling
tree-shaking of the diagnostics module bundle. The screen module is never included
in the production bundle.

Result: BLOCKED — dual gate plus tree-shaking confirmed.

**Inferred invariant I-2:** ModernPrimitives style props must not enable XSS via
dangerouslySetInnerHTML.

Attack: Pass a crafted `children` prop containing a script element. React's JSX
rendering escapes text children. ModernPrimitives components accept `children` and
`style` props only — no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` usage
(confirmed by source scan, ModernPrimitives.jsx lines 1-104 — grep returned zero
matches).

Result: BLOCKED — no unsafe rendering API in ModernPrimitives.

**Inferred invariant I-3:** DiagnosticsRow must not render unescaped error data as HTML.

Attack: Inject HTML in a test `error.message` field. DiagnosticsRow.jsx line 41-44:
```jsx
<pre className="mt-2 max-h-72 overflow-auto rounded border ...">
  {toJson({ data: row?.data ?? null, error: row?.error ?? null })}
</pre>
```
`toJson` calls `JSON.stringify` which escapes all HTML special characters as Unicode
escape sequences. React additionally escapes children of `<pre>` as text nodes.
No `dangerouslySetInnerHTML` present.

Result: BLOCKED — double escaping (JSON.stringify + React text rendering).

**Inferred invariant I-4:** The CSS token bypass in module-modern.css must not
introduce externally loadable resources.

Attack: Exploit any `url()` expression in the CSS to load attacker-controlled content.

Verification: `module-modern.css` was scanned. No `url()` calls are present. The three
hardcoded rgba/hex values found (lines 19, 61-63) are static color values. Line 61:
`rgba(139, 92, 246, 0.7)` is the primary button border; line 62: `#fff`; line 63:
`rgba(167, 139, 250, 0.88)` is a gradient stop. None are `url()` calls. No external
resource loading is possible.

Result: BLOCKED — no url() expressions, no external resource loading.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Attack Chain | Exploitability |
|---|---|---|---|
| BW-UI-001 | LOW | Dev PII export — userId+email in download JSON | Requires DEV build, authenticated session, manual download trigger. Not exploitable in production. |

**No CRITICAL or HIGH exploitable paths found.**

The feature's attack surface is narrow by design: it is a pure UI primitive library
with a dev-only diagnostic panel. All mutation surfaces belong to other features
(diagnostics engine, settings, etc.) that are reviewed separately.

---

## 8. Source Verification Summary

All findings are [SOURCE_VERIFIED] — every claim has a file:line citation.

| Claim | Source | Line | Status |
|---|---|---|---|
| Dev gate in routes | apps/VCSM/src/app/routes/protected/app.routes.jsx | 22, 164 | VERIFIED |
| Dev gate in lazy loader | apps/VCSM/src/app/routes/lazyApp.jsx | 3, 51-53 | VERIFIED |
| userId+email in test result data | apps/VCSM/src/dev/diagnostics/groups/actorSystem.group.js | 88-90 | VERIFIED |
| downloadPayload serializes all data | apps/VCSM/src/dev/diagnostics/ui/DiagnosticsPanel.jsx | 141-154 | VERIFIED |
| No dangerouslySetInnerHTML in ModernPrimitives | apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx | 1-104 | VERIFIED |
| No dangerouslySetInnerHTML in DiagnosticsRow | apps/VCSM/src/dev/diagnostics/ui/DiagnosticsRow.jsx | 24-48 | VERIFIED |
| JSON.stringify escaping in DiagnosticsRow | apps/VCSM/src/dev/diagnostics/ui/DiagnosticsRow.jsx | 15-21 | VERIFIED |
| No url() in module-modern.css | apps/VCSM/src/features/ui/modern/module-modern.css | 1-67 | VERIFIED |
| Blob URL revoked immediately | apps/VCSM/src/dev/diagnostics/ui/DiagnosticsPanel.jsx | 152 | VERIFIED |
| Null auth handled with error propagation | apps/VCSM/src/dev/diagnostics/helpers/ensureAuthContext.js | 17-20 | VERIFIED |
| access_token NOT in download output | apps/VCSM/src/dev/diagnostics/groups/actorSystem.group.js | 87-91 | VERIFIED |

---

## 9. Confidence Summary

| Attack Category | Result | Confidence |
|---|---|---|
| A — Ownership Bypass | BLOCKED — no ownership surfaces | HIGH |
| B — Session Mutation | PARTIAL — userId+email in dev download | HIGH |
| C — Runtime Abuse | BLOCKED — dual dev gate | HIGH |
| D — RLS Verification | BLOCKED — no cross-actor reads | HIGH |
| E — Viewer Context Fuzzing | BLOCKED — graceful error propagation | HIGH |
| F — Mutation Replay | BLOCKED — no mutation surfaces | HIGH |
| G — Hydration Poisoning | BLOCKED — no hydration interaction | HIGH |
| H — URL Surface | BLOCKED — blob:// revoked, no UUID in filename | HIGH |
| I — §9 Invariant Attack | BLOCKED (all 4 inferred invariants held) | HIGH |

Overall confidence: HIGH across all categories. No SCANNER_LOW_CONF findings required
escalation. Zero unresolved paths.

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — no formal §9 invariants are documented. Four
source-inferred invariants were attacked:

| Invariant | Attack Harness | Result |
|---|---|---|
| I-1: Diagnostics never reachable in production | Navigate /dev/diagnostics in production | BLOCKED — dual gate + tree-shaking |
| I-2: ModernPrimitives no XSS via children | Inject script element in children prop | BLOCKED — React JSX escaping, no dangerouslySetInnerHTML |
| I-3: DiagnosticsRow no HTML injection via error data | Inject HTML in test error.message | BLOCKED — JSON.stringify + React text node escaping |
| I-4: CSS token bypass no external resource loading | Exploit url() in module-modern.css | BLOCKED — no url() expressions present |

**Governance note:** BEHAVIOR.md must be populated with formal §9 invariants for the
diagnostics panel. The unanchored state (VEN-UI-003) remains an open governance deficit.

---

## 11. Behavior Contract Attack Summary

**Contract status:** PLACEHOLDER — no §4 Failure Paths, no §9 Must Never Happen entries.

This is the highest-governance-risk finding from this run. Without a documented behavior
contract, future engineers cannot reason about invariants from BEHAVIOR.md alone. All
four source-inferred invariants were held in the current codebase, but they are not
memorialized in any contract.

**Correlation with VENOM findings:**
- VEN-UI-003 (OPEN, LOW): BEHAVIOR.md placeholder — confirmed still unresolved. This BW
  run did not find any invariant violations, but the unanchored status means future
  changes to ModernPrimitives or DiagnosticsPanel may silently violate undocumented
  invariants.

---

## 12. THOR Impact

**THOR Release Blocker: NO**

Zero CRITICAL or HIGH findings. The single finding (BW-UI-001, LOW) is dev-only and
not exploitable in production. No THOR blockers introduced by this review.

**Open finding cross-reference:**

| Finding | Severity | THOR Blocker |
|---|---|---|
| BW-UI-001 | LOW | NO |
| VEN-UI-001 | LOW | NO |
| VEN-UI-002 | LOW | NO |
| VEN-UI-003 | LOW | NO |

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are recommended to lock the security posture of this
feature. None are THOR-blocking but all are governance improvements.

| Test ID | Description | Priority |
|---|---|---|
| SM-BW-UI-001 | Assert `/dev/diagnostics` returns 302 to `/feed` in production mode (NODE_ENV=production) | MEDIUM |
| SM-BW-UI-002 | Assert DevDiagnosticsScreen module is not included in production bundle (bundle analysis or import check) | MEDIUM |
| SM-BW-UI-003 | Assert DiagnosticsPanel download JSON does not contain `access_token` or `refresh_token` fields at any depth | MEDIUM |
| SM-BW-UI-004 | Assert DiagnosticsRow renders arbitrary error.message as escaped text, not injected HTML | LOW |
| SM-BW-UI-005 | Assert ModernPrimitives JSX components do not accept or render dangerouslySetInnerHTML | LOW |

---

*Report generated by BLACKWIDOW V2 — 2026-06-04*
*Output: ZZnotforproduction/APPS/VCSM/features/ui/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_ui-adversarial-review.md*
