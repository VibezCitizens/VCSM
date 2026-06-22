# BLACKWIDOW V2 Adversarial Review — styles
## Feature: styles | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-STYLES-2026-06-04 |
| Feature | styles |
| Application | VCSM |
| Run Date | 2026-06-04 |
| Protocol Version | BW2.5 V2 |
| Analyst | BLACKWIDOW V2 |
| Status | COMPLETE |
| THOR Blocker | YES — BW-STYLES-001 (inherited from VEN-STYLES-001) |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Map Freshness | FRESH (~7h old at review time) |
| Security Paths Attributed to Feature | 0 |
| Total Platform Security Paths | 598 |
| Callgraph Nodes for Feature | 5 |
| Callgraph Edges for Feature | 19 |
| Write Execution Paths | 0 |
| RPC Execution Paths | 0 |

---

## 3. Scanner Inputs

| Map | Result |
|---|---|
| security-path-map.json | 0 paths attributed to styles |
| callgraph.json | 5 nodes (2 screen, 3 style), 19 edges |
| write-execution-map.json | 0 write paths for styles |
| rpc-execution-map.json | 0 RPC paths for styles |

**Callgraph node breakdown by layer:**
- `style`: 3 nodes — `authInputClass`, `authSelectClass`, `createFlyerEditorScreenStyles`
- `screen`: 2 nodes — `createVportDashboardShellStyles`, `createConfirmBtnStyle`

**Edge summary:** All 19 edges are CALLS or REEXPORTED_FROM; no hook or controller nodes found in the callgraph for this feature. This is consistent with styles being a presentation-only feature with no DAL, no controller, and no write surfaces.

---

## 4. Attack Surface Inventory

### A. Behavior Contract Status
- BEHAVIOR.md status: **PLACEHOLDER** (no §4 Failure Paths, no §9 Must Never Happen sections)
- All §9 invariants are UNANCHORED — attack categories B through I cannot be anchored to contract invariants
- Finding issued: **BW-STYLES-001** (MISSING_BEHAVIOR_CONTRACT — HIGH)

### B. Security Path Coverage
- 0 security paths attributed to styles in the scanner
- No HIGH or LOW confidence security paths in scope
- No attack surface directly attributable via scanner

### C. Write Surfaces
- **Zero write surfaces** — styles feature contains no DAL, no controllers, no hooks that perform mutations
- No database interaction present in any styles file
- No Supabase client calls in any scoped file

### D. Hook Entry Points
- No hook layer nodes found in callgraph
- Style functions are pure utilities: `authInputClass`, `authSelectClass`, `createVportDashboardShellStyles`, `createFlyerEditorScreenStyles`, `createConfirmBtnStyle`
- Entry points are React rendering callers (screens), not hooks

### E. DAL Write Surfaces
- None — styles feature is a purely presentational layer

### F. External Dependency Surfaces
- `https://fonts.googleapis.com` — GFS Didot font (index.html:54)
- `https://fonts.googleapis.com` — DM Serif Display + Inter (index.html:58)
- `https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js` — Push SDK (index.html:135)
- `public/_headers` — Cloudflare Pages HTTP headers including CSP-Report-Only

### G. CSS Custom Property Write Surface
- `setLearningTheme()` at `src/learning/utils/setLearningTheme.js` — calls `document.documentElement.style.setProperty()` for 4 CSS custom properties
- Values are **hardcoded literals** at the call site (`LearningLayout.jsx:148-153`), not user-controlled

---

## 5. Scanner Signals

| Signal Type | Result |
|---|---|
| Security paths | 0 attributed |
| Write paths | 0 attributed |
| RPC paths | 0 attributed |
| Callgraph hook nodes | 0 |
| Callgraph controller nodes | 0 |
| Unresolved/null sourceRoute paths | 0 (no paths at all) |

Scanner confidence: LOW for runtime security surfaces (none exist), HIGH for absence of write surfaces.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)
**Attack:** Can an actor submit a mutation using another actor's resource ID?

**Result: BLOCKED (by architecture)**

Source analysis: The styles feature has zero DAL, zero controllers, zero hooks that perform mutations. No resource IDs are accepted as style function parameters. `createVportDashboardShellStyles` accepts `{ isDesktop, maxWidthDesktop }` — application-computed layout values, not actor-scoped identifiers. `createConfirmBtnStyle(danger)` accepts a boolean. `authInputClass(disabled)` accepts a boolean. No ownership bypass surface exists.

Verified: All 5 callgraph nodes, all source files read. No actor ID parameter in any style function signature.

---

### B. SESSION MUTATION (§5.2)
**Attack:** Is viewerActorId taken from session (trusted) or from client payload (untrusted)?

**Result: BLOCKED (not applicable)**

Source analysis: No viewerActorId is accepted or processed by any styles function. The `disabled` and `danger` parameters passed to `authInputClass` and `createConfirmBtnStyle` are application-state booleans (`loading`, `danger={true}`), never sourced from user input or session tokens.

Verified: `Onboarding.jsx:82` passes `loading` (application state) to `authInputClass`. `VportActorMenuManageModals.jsx:78` hardcodes `danger={true}`.

---

### C. RUNTIME ABUSE (§5.3)
**Attack:** Can a non-owner actor type reach owner-only style paths?

**Result: BLOCKED (not applicable)**

Source analysis: All styles functions are pure utility functions. They contain no actor-kind checks because they produce no side effects and perform no access control. The screens that call them (`VportDashboardScreen`, `VportActorMenuFlyerEditorScreen`) are responsible for actor-kind gating — that is outside the styles feature boundary. Within styles, there are no privileged paths.

---

### D. RLS VERIFICATION (§5.4)
**Attack:** Are there tables assumed to have RLS that have not been verified?

**Result: BLOCKED (not applicable)**

Source analysis: The styles feature performs zero database operations. No Supabase queries, no RPC calls, no DAL imports found in any scoped file. RLS is not a relevant attack surface for this feature.

---

### E. VIEWER CONTEXT FUZZING (§5.5)
**Attack:** What happens if null/undefined viewerActorId is passed to each controller?

**Result: BLOCKED (not applicable)**

Source analysis: No controller layer exists in the styles feature. Style functions accept: booleans (`disabled`, `danger`), layout primitives (`isDesktop`, `maxWidthDesktop`). Passing `null` or `undefined` to these functions results in safe CSS class string fallbacks or numeric defaults — no mutation path exists.

Edge case noted: `createVportDashboardShellStyles({ isDesktop: undefined })` would produce `padding: undefined` in the returned style object. This is a cosmetic rendering defect, not a security concern.

---

### F. MUTATION REPLAY (§5.6)
**Attack:** Can a completed/cancelled operation be re-triggered?

**Result: BLOCKED (not applicable)**

Source analysis: No stateful operations exist in the styles feature. Style functions are pure and idempotent — they can be called any number of times with the same inputs and produce the same output. No state machine, no terminal state, no replay attack surface.

---

### G. HYDRATION POISONING (§5.7)
**Attack:** Does this feature interact with the hydration store?

**Result: BLOCKED (not applicable)**

Source analysis: No hydration store imports found in any scoped styles file. Style functions are pure functions with no side effects. `setLearningTheme()` mutates CSS custom properties on `document.documentElement` — a DOM mutation, not a hydration store write. The values written at `LearningLayout.jsx:148-153` are hardcoded literals (`"#111827"`, `"#ffffff"`), not user-controlled.

---

### H. URL SURFACE (§5.9)
**Attack:** Do notification linkPaths, share links, or deep links expose raw UUIDs?

**Result: BLOCKED (not applicable)**

Source analysis: The styles feature generates no URLs, no notification payloads, no share links, no deep links. No UUID-bearing strings are constructed in any scoped file.

---

### I. §9 INVARIANT ATTACK — UNANCHORED (HIGHEST PRIORITY)
**Attack:** Attack each §9 Must Never Happen invariant.

**Result: UNRESOLVED — BEHAVIOR.MD IS PLACEHOLDER**

BEHAVIOR.md has status `PLACEHOLDER` with no §4 Failure Paths and no §9 Must Never Happen sections. There are zero anchored invariants to attack.

**Source-inferred invariants** (derived from codebase analysis):
1. Style functions must never accept user-controlled strings as CSS property values
2. CSS custom property writes must never use unsanitized user input
3. External CDN resources must be integrity-verified (SRI)
4. CSP must be in enforcement mode before production traffic

Attack on inferred invariant 1: BLOCKED — all style function parameters are booleans or numeric layout values, not CSS property value strings.

Attack on inferred invariant 2: BLOCKED (for core styles) — `setLearningTheme()` writes hardcoded values only at `LearningLayout.jsx:148`. However, the function signature ACCEPTS external strings, meaning a future caller could pass user-controlled color data. This is a latent injection surface. No current exploit chain exists. Finding: **BW-STYLES-003** (MEDIUM).

Attack on inferred invariant 3: BYPASSED — OneSignal SDK at `index.html:135` has no `integrity` attribute. Google Fonts links at `index.html:54,58` have no `integrity` attribute. This confirms VEN-STYLES-002.

Attack on inferred invariant 4: BLOCKED (report-only) — CSP is in `Content-Security-Policy-Report-Only` mode per `public/_headers:14`. No XSS enforcement is active. This confirms VEN-STYLES-001.

---

### J. CSP PROMOTION RISK (styles-specific attack)
**Attack:** If CSP is promoted from Report-Only to enforcement, what breaks?

**Result: BYPASSED (MEDIUM) — BW-STYLES-004**

Source analysis (`public/_headers:14`):
- `script-src 'self' 'unsafe-inline'` — OneSignal SDK (`https://cdn.onesignal.com`) is NOT listed in `script-src`. Promoting CSP to enforcement mode will **block** the OneSignal SDK script from loading, silently breaking push notifications platform-wide.
- The `unsafe-inline` entry covers inline scripts (including the `<script>` block at `index.html:148`) but external scripts from unlisted origins will be blocked.
- `font-src 'self' https://fonts.gstatic.com` — covers both Google Font requests.
- `img-src` — does not include `https://cdn.onesignal.com` either; if OneSignal serves badge images from their CDN those will also be blocked.

This is a CSP promotion trap: the CSP whitelist was written without accounting for the OneSignal SDK origin. Promoting from report-only to enforcement without adding `cdn.onesignal.com` will silently break push notifications.

Finding: **BW-STYLES-004** (MEDIUM)

---

### K. FONT PRECONNECT ORDERING (styles-specific attack)
**Attack:** Can the GFS Didot font load order create a timing attack vector?

**Result: INFO — BW-STYLES-005**

Source analysis (`index.html:54-58`):
- GFS Didot font stylesheet is loaded at line 54 BEFORE the `<link rel="preconnect" href="https://fonts.googleapis.com">` hint at line 56.
- The preconnect hint for `fonts.googleapis.com` is therefore a no-op for the GFS Didot request — the connection is already being established when the hint arrives.
- This is a performance defect, not a security vulnerability. No exploit chain.

Finding: **BW-STYLES-005** (INFO)

---

### L. CSS INJECTION VIA INLINE STYLE OBJECTS
**Attack:** Can user-controlled data reach a `style={}` prop as a CSS property value?

**Result: BLOCKED**

Source analysis:
- `createVportDashboardShellStyles` — parameters are `isDesktop` (boolean from `useDesktopBreakpoint()`) and `maxWidthDesktop` (hardcoded number). Neither originates from user input.
- `createFlyerEditorScreenStyles()` — no parameters at all. Purely static return value.
- `createConfirmBtnStyle(danger)` — `danger` is `true` at `VportActorMenuManageModals.jsx:78` (hardcoded). Not user-controlled.
- `authInputClass(disabled)` / `authSelectClass(disabled)` — `disabled` is `loading` (application state boolean).
- `authTheme` — static object. Values reference CSS custom properties via `var(--vc-*)` strings.

No user-controlled string can reach a `style={}` prop via any styles function. React's `style` prop does not interpret CSS injection in string values for inline styles. BLOCKED on two levels: (1) no user-controlled input reaches these functions; (2) React inline style objects do not execute CSS injection.

---

## 7. Exploitability Assessment

| Attack Vector | Exploitable | Severity | Notes |
|---|---|---|---|
| Ownership Bypass | NO | — | No DAL, no resource IDs |
| Session Mutation | NO | — | No viewerActorId surface |
| Runtime Abuse | NO | — | No actor-kind gating needed |
| RLS Gap | NO | — | No DB queries |
| Viewer Context Fuzzing | NO | — | No controllers |
| Mutation Replay | NO | — | No stateful operations |
| Hydration Poisoning | NO | — | No hydration store interaction |
| URL UUID Exposure | NO | — | No URLs generated |
| §9 Invariant Violation | UNRESOLVED | HIGH | BEHAVIOR.md is PLACEHOLDER |
| CSP Enforcement Trap | YES (latent) | MEDIUM | OneSignal not in CSP script-src |
| Unanchored SRI | YES (latent) | MEDIUM | OneSignal + Google Fonts lack integrity= |
| setLearningTheme injection | NO (latent risk) | MEDIUM | Hardcoded values only; signature is unsafe |
| Focus Ring Elimination | YES | MEDIUM | Global outline:none, no :focus-visible compensating rule in global.css |
| Font Preconnect Order | NO | INFO | Performance defect only |

---

## 8. Source Verification Summary

| File | Read | Key Finding |
|---|---|---|
| `apps/VCSM/src/styles/global.css` | YES | `outline: none` at line 88, no `:focus-visible` compensating rule |
| `apps/VCSM/src/styles/citizens-theme.css` | YES | `--vc-ring` defined but not applied globally |
| `apps/VCSM/index.html` | YES | OneSignal no SRI (line 135), font preconnect ordering (lines 54-58) |
| `apps/VCSM/public/_headers` | YES | CSP in Report-Only mode (line 14), OneSignal missing from script-src |
| `apps/VCSM/src/features/auth/styles/authInputClasses.js` | YES | `outline-none` class (line 4), `focus:ring-2` compensating rule (line 5) |
| `apps/VCSM/src/features/auth/styles/authTheme.js` | YES | Static values only, no user input |
| `apps/VCSM/src/features/dashboard/vport/screens/styles/vportDashboardShellStyles.js` | YES | Pure layout function, no user-controlled values |
| `apps/VCSM/src/features/dashboard/flyerBuilder/styles/vportActorMenuFlyerEditorScreen.styles.js` | YES | Zero-parameter static function |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/styles/vportActorMenuConfirmDeleteModal.styles.js` | YES | `createConfirmBtnStyle(danger)` — boolean only |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageModals.jsx` | YES | `danger={true}` hardcoded at line 78 |
| `apps/VCSM/src/learning/utils/setLearningTheme.js` | YES | `style.setProperty()` with hardcoded values; latent injection surface |
| `apps/VCSM/src/learning/layout/LearningLayout.jsx` | YES | Confirms hardcoded literal theme values (lines 148-153) |
| `apps/VCSM/vite.config.js` | YES | CSP removed from dev server (line 8 comment) |

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| BW-STYLES-001 | HIGH | BEHAVIOR.md file read — status PLACEHOLDER confirmed |
| BW-STYLES-002 | HIGH | `global.css:88` + `citizens-theme.css:62` + absence of `:focus-visible` in `global.css` |
| BW-STYLES-003 | MEDIUM | `setLearningTheme.js` source read — function signature accepts external strings |
| BW-STYLES-004 | HIGH | `_headers:14` + `index.html:135` — OneSignal origin absent from CSP script-src |
| BW-STYLES-005 | HIGH | `index.html:54-58` — font link before preconnect hint |

All BYPASSED findings carry [SOURCE_VERIFIED] provenance with file:line citations.

---

## 10. §9 Invariant Attack Map

| Invariant Source | Invariant | Attack Attempted | Result |
|---|---|---|---|
| Source-inferred | Style functions must not accept user-controlled CSS strings | Parameter trace — all booleans/numbers | BLOCKED |
| Source-inferred | CSS custom property writes must not use unsanitized user input | `setLearningTheme()` caller trace | BLOCKED (current callers only) |
| Source-inferred | External CDN resources must have SRI | SRI attribute check on all CDN links | BYPASSED — BW-STYLES-004 cross-ref VEN-STYLES-002 |
| Source-inferred | CSP must be enforced before prod traffic | `_headers` inspection | BYPASSED — BW-STYLES-004 cross-ref VEN-STYLES-001 |
| UNANCHORED | No §9 contract exists | N/A | UNRESOLVED — BEHAVIOR.md PLACEHOLDER |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md status: **PLACEHOLDER**

All adversarial invariant attacks in this session are based on source-inferred invariants only. No contract-anchored §9 invariants exist. This means:
- Any BLOCKED finding in this report is contingent on current implementation only
- A future refactor could violate these implied invariants with no contract to catch it
- THOR eligibility for this feature is blocked pending BEHAVIOR.md authorship

The VENOM finding VEN-STYLES-004 ("BEHAVIOR.md is a placeholder") is confirmed and escalated by this review — the absence of a contract is itself a HIGH governance finding.

---

## 12. THOR Impact

### Release Blockers (OPEN findings)
| Finding | Severity | Blocker Reason |
|---|---|---|
| VEN-STYLES-001 (inherited) | HIGH | CSP in report-only — no XSS enforcement in production |
| BW-STYLES-001 | HIGH | BEHAVIOR.md PLACEHOLDER — governance contract missing |
| BW-STYLES-004 | MEDIUM | OneSignal absent from CSP script-src — promotion would break push |

### Non-blocking (must be tracked)
| Finding | Severity | Recommendation |
|---|---|---|
| VEN-STYLES-002 / BW cross-ref | MEDIUM | Add SRI to OneSignal and Google Fonts CDN loads |
| VEN-STYLES-003 / BW-STYLES-002 | MEDIUM | Add `:focus-visible` compensating rule to global.css |
| BW-STYLES-003 | MEDIUM | Add CSS value sanitization to `setLearningTheme()` or restrict callers |
| BW-STYLES-005 | INFO | Move GFS Didot preconnect before its stylesheet link |

---

## 13. SPIDER-MAN Test Requirements

| Test ID | Description | Priority |
|---|---|---|
| SPM-STYLES-001 | Render `authInputClass(true)` and `authInputClass(false)` — assert returned strings contain expected Tailwind classes | P2 |
| SPM-STYLES-002 | Render `authSelectClass(true)` — assert it extends `authInputClass` and adds `auth-register-select` | P2 |
| SPM-STYLES-003 | Render `createVportDashboardShellStyles({ isDesktop: true })` and `{ isDesktop: false }` — assert layout breakpoints | P2 |
| SPM-STYLES-004 | Render `createConfirmBtnStyle(true)` and `createConfirmBtnStyle(false)` — assert border/background differ | P2 |
| SPM-STYLES-005 | Integration: render a screen that calls `createVportDashboardShellStyles` — assert no crash when `isDesktop` is undefined | P3 |
| SPM-STYLES-006 | CSP header snapshot test — assert `_headers` file contains `cdn.onesignal.com` in `script-src` before any CSP enforcement promotion | P1 |
| SPM-STYLES-007 | `setLearningTheme()` — assert that passing `'); background: red; /*` as `primaryColor` does not result in CSS injection (i.e., `setProperty` sanitizes or throws) | P1 |

---

## Findings Summary

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-STYLES-001 | HIGH | BEHAVIOR.md is PLACEHOLDER — no §9 invariants, governance contract absent | BYPASSED | OPEN — DRAFT |
| BW-STYLES-002 | MEDIUM | `global.css:88` sets `outline: none` globally; no `:focus-visible` compensating rule in `global.css`; `--vc-ring` token defined but unused at global level | BYPASSED | OPEN — DRAFT |
| BW-STYLES-003 | MEDIUM | `setLearningTheme()` accepts external string parameters for CSS `setProperty()` calls — current callers hardcode values but the function signature is a latent CSS injection surface | PARTIAL | OPEN — DRAFT |
| BW-STYLES-004 | MEDIUM | OneSignal CDN origin (`cdn.onesignal.com`) absent from CSP `script-src` directive; CSP promotion to enforcement mode will block push notification SDK | BYPASSED | OPEN — DRAFT |
| BW-STYLES-005 | INFO | GFS Didot font stylesheet link appears before `<link rel="preconnect" href="https://fonts.googleapis.com">` — preconnect hint is ineffective for this font | BLOCKED (perf) | OPEN — DRAFT |

**Total: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 0 LOW, 1 INFO**

---

*Report generated by BLACKWIDOW V2 | BW2.5 V2 Protocol | 2026-06-04*
*Output path: ZZnotforproduction/APPS/VCSM/features/styles/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_styles-adversarial-review.md*
