# MODULE ARCHITECTURE REPORT

**Module:** engines/i18n
**Application Scope:** VCSM + ENGINE (platform-level; both apps may consume)
**Module Type:** Shared Domain Engine — Internationalization
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/i18n/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The i18n engine provides platform-level translation infrastructure. It owns:
- Translation lookup runtime (`createTranslator`) with dot-path key resolution and `{{param}}` interpolation
- A generic React context provider (`I18nProvider`) and consumer hook (`useTranslation`)
- Platform-level locale data for English (`en/`) and Spanish (`es/`)

It is a **pure utility engine** — no database access, no DI configuration, no global state. It is architecturally distinct from all other engines in the sprint.

Translation lookup pipeline:
```
1. App assembles app-specific dictionary (app/src/i18n/setup.js)
2. App wraps component tree with <I18nProvider dictionary={...}>
3. Components call useTranslation() → { t }
4. t(key, params?) → resolve(dict, key) → interpolate(value, params)
5. Missing key → returns key string (visible in DEV, silent in PROD)
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM confirmed (53 consumer files); Wentrex eligible (platform-level)
**CLAUDE.md:** PRESENT — explicit scope rules; bilingual data (EN/ES)
**Infrastructure:** None — no DB, no network, no external transport

---

## ENTRY POINTS

**Primary:** `engines/i18n/index.js` → `src/index.js`
**Code Alias:** `@i18n` (engine code imports: createTranslator, I18nProvider, useTranslation)
**Data Alias:** `@i18n/*` (locale file imports: `@i18n/en/common.json`, `@i18n/es/auth.json`)

**Exported surface (5 symbols):**
- `createTranslator(dictionary)` — factory: returns `t(key, params?)` bound to a dictionary
- `interpolate(template, params)` — `{{param}}` substitution utility
- `I18nProvider` — React context provider (dictionary → t function via useMemo)
- `I18nContext` — React context (used for advanced consumer patterns)
- `useTranslation()` — React hook; returns `{ t }`; fallback to empty dict if no provider

**Note:** React components are **intentionally part of this engine's contract** per CLAUDE.md — not an anomaly (unlike chat/hydration/media).

---

## LAYER MAP

```
engines/i18n/
├── CLAUDE.md                          — scope rules (PRESENT)
├── index.js                           — entry point → src/index.js
├── en/                                — 8 platform-level English locale files
│   ├── common.json                    — universal primitives (yes/no, with/from/at etc)
│   ├── actions.json                   — verbs (save, cancel, delete, edit, etc)
│   ├── errors.json                    — error messages
│   ├── auth.json                      — authentication copy
│   ├── notifications.json             — notification templates
│   ├── state.json                     — state labels (loading, empty, etc)
│   ├── status.json                    — status labels
│   └── time.json                      — time expressions
├── es/                                — 8 Spanish locale files (ANOM-I18N-001: placeholder values)
│   └── [same 8 files]
└── src/
    ├── index.js                       — 5 exports
    ├── createTranslator.js            — dot-path resolver + fallback (key string on miss)
    ├── interpolate.js                 — {{param}} template substitution
    └── react/
        ├── I18nProvider.jsx           — React context provider (INTENTIONAL per CLAUDE.md)
        └── useTranslation.js          — useContext hook with empty-dict fallback
```

Total: 23 files (16 are locale JSON data)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md; scope rules explicit | — |
| Owner defined | PASS | VCSM setup.js; 53 consumers | — |
| Entry points mapped | PASS | @i18n + @i18n/* aliases; 5 exports | — |
| Translation runtime | PASS | createTranslator + interpolate | — |
| React layer | PASS (INTENTIONAL) | I18nProvider, useTranslation — listed in CLAUDE.md | — |
| Locale data — English | PASS | 8 namespaces | App-specific namespaces live in app |
| Locale data — Spanish | PARTIAL | 8 files exist; values are English placeholders | ANOM-I18N-001 |
| No DB access | PASS | No supabase, no queries, no DI | Expected for this engine |
| DI / config | NONE | No configureI18nEngine(); stateless by design | Expected |
| Documentation linked | PARTIAL | CLAUDE.md PRESENT; BEHAVIOR.md, SECURITY.md MISSING | — |
| Tests | NONE | No test files | ANOM-I18N-002: interpolate + createTranslator untested |

---

## NO DEPENDENCY INJECTION

This engine has no DI configuration layer. It is stateless — `createTranslator` takes a dictionary and returns a pure function. There is no `configureI18nEngine()`, no global config store, and no freeze guard concern. The app assembles the dictionary and hands it to I18nProvider.

---

## LOCALE NAMESPACES

**Platform-level (engines/i18n/):**
| Namespace | Description |
|-----------|-------------|
| common | Universal primitives (yes/no, all, from, with, at...) |
| actions | Action verbs (save, cancel, delete, edit, back, next...) |
| errors | Error messages |
| auth | Authentication copy |
| notifications | Notification templates |
| state | State labels (loading, empty, error, success...) |
| status | Status labels |
| time | Time expressions |

**App-specific (apps/VCSM/src/i18n/ — not in this engine):**
CLAUDE.md explicitly excludes: booking.json, feed.json, and all feature-specific namespaces.

---

## APP CONSUMERS (VCSM)

| File | Symbols/Data Used |
|------|------------------|
| apps/VCSM/src/i18n/setup.js | @i18n/en/[all 8 namespaces] — assembles app dictionary |
| 53 component/hook files | useTranslation() — consume t() function |

The VCSM app assembles its own dictionary in `apps/VCSM/src/i18n/setup.js` by merging platform-level namespaces from `@i18n/en/` with VCSM-specific feature namespaces. This assembly is app-side (correct per CLAUDE.md).

---

## SECURITY SURFACE

No security surface. The engine is:
- Read-only (locale data)
- No user input reaches the runtime (keys are code-time strings; params are typed at call site)
- No DB queries
- No network calls
- No authentication context

The only surface is `interpolate`'s regex substitution — it uses Object.prototype.hasOwnProperty check to prevent prototype pollution on param lookup. PASS.

---

## ARCHITECTURE ANOMALIES

### ANOM-I18N-001: Spanish Files Are English Placeholders

**Location:** `engines/i18n/es/*.json`
**Finding:** All 8 Spanish locale files contain English text values (mirroring en/). CLAUDE.md explicitly states: "Spanish files currently contain English placeholder values — awaiting human translation." No machine translation. The es/ files exist structurally but are not functional Spanish translations.
**Risk:** MEDIUM — VCSM ships with non-functional Spanish locale. Any component calling `t(key)` under a Spanish locale will display English text. Silent (no error).

### ANOM-I18N-002: No Tests for Core Runtime Functions

**Finding:** `createTranslator` (dot-path resolution, fallback behavior) and `interpolate` ({{param}} substitution, prototype pollution guard) are untested. These are the lowest-level functions in the platform translation stack — a bug here affects every translated string.
**Risk:** LOW-MEDIUM — logic is simple; but edge cases (nested key resolution, missing param, non-string value) are unverifiable without tests.

---

## BEHAVIOR CONSISTENCY CHECK — engines/i18n

```
Behavior Consistency Check — engines/i18n
==========================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 23 files: pure utility runtime; no DB, no DI
  → CLAUDE.md present; explicit scope rules
  → No BEHAVIOR.md — undocumented: fallback key semantics (key string returned),
    missing param behavior, locale switching expectations, es/ placeholder status
  → Severity: P3 (utility engine; low operational risk)

Check B, C, D: SKIPPED — no BEHAVIOR.md
```

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/i18n
Classification: FULLY INDEPENDENT
Reason: Pure utility. No DB queries. No DI configuration. No global mutable state.
  React components are intentionally part of the engine contract (per CLAUDE.md).
  Both EN and ES data are present structurally; ES is placeholder (ANOM-I18N-001).
  Highest consumer count in the sprint (53 VCSM files).
Blocking anomalies:
  - Spanish locale is placeholder, not functional (ANOM-I18N-001)
  - Core runtime (createTranslator, interpolate) has zero tests (ANOM-I18N-002)
  - No BEHAVIOR.md → governance gap (low risk for utility engine)
  - No SECURITY.md → not applicable (no trust boundary)
```

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — Spanish translation sourcing decision (ANOM-I18N-001); locale switching architecture (is locale switch in scope?)
- **LOGAN** — Write BEHAVIOR.md documenting fallback semantics and locale assembly contract
- **SPIDER-MAN** — createTranslator unit tests (nested key, missing key, non-string value); interpolate tests ({{param}}, missing param, prototype pollution attempt)
- **IRONMAN** — Confirm Wentrex eligibility; app-specific namespace governance (which namespaces belong in engine vs app)
