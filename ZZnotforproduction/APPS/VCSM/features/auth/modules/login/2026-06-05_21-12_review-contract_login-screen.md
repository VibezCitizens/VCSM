---
command: review-contract
date: 2026-06-05
time: 21:12
topic: login-screen
status: PARTIALLY COMPLIANT
---

# CONTRACT REVIEW REPORT

## Target
Login screen — `apps/VCSM/src/features/auth/`

## Application Scope
VCSM — `apps/VCSM/`

## Contracts Reviewed
- `apps/VCSM/CLAUDE.md` — App-level execution contract
- `.claude/commands/review-contract/05-rules-verification.md` — Rules matrix

## Files Reviewed
| File | Lines |
|---|---|
| `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | 284 |
| `apps/VCSM/src/features/auth/hooks/useLogin.js` | 84 |
| `apps/VCSM/src/features/auth/controllers/login.controller.js` | 32 |
| `apps/VCSM/src/features/auth/dal/login.dal.js` | 13 |
| `apps/VCSM/src/features/auth/adapters/auth.adapter.js` | 7 |
| `apps/VCSM/src/features/auth/controllers/authSession.controller.js` | 5 |
| `apps/VCSM/src/features/auth/controllers/profile.controller.js` | 27 |
| `apps/VCSM/src/features/auth/index.js` | 2 |

---

## Critical Violations

None.

---

## High Violations

---

### VIOLATION

**Rule:** Adapter rule — adapters must not export DAL, models, or controllers
**Rule Source:** `apps/VCSM/CLAUDE.md` → Adapter Boundaries
**Severity:** HIGH

**File:** `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
**Line:** 7

**Issue:**
`auth.adapter.js` directly exports `bootstrapJoinOnboardingController` from
`@/features/auth/controllers/onboarding.controller`. This is a raw controller
export through an adapter boundary.

**Why This Violates The Contract:**
The adapter boundary contract states: "Adapters expose only: hooks, components,
view screens. Adapters never export DAL functions, models, or controllers."
Exporting a controller through an adapter collapses the abstraction layer —
callers outside the feature now have direct access to internal business logic
that should be coordinated through a hook.

**Required Change:**
Wrap `bootstrapJoinOnboardingController` in a hook (e.g. `useJoinOnboarding.js`)
and export that hook from the adapter instead. The controller remains internal.

---

## Medium Violations

---

### VIOLATION

**Rule:** Import path rule — `@/` imports only, no non-standard aliases
**Rule Source:** `.claude/commands/review-contract/05-rules-verification.md`
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/hooks/useLogin.js`
**Line:** 5

**Issue:**
`import { debugLoginEvent, debugLoginError, debugLoginSessionSnapshot } from '@debuggers/identity'`

The path alias `@debuggers` is not a `@/`-prefixed alias. It resolves outside
the standard `@/` import contract.

**Why This Violates The Contract:**
The import path rule states "use `@/` imports only." Non-`@/` aliases create
implicit coupling to vite alias configuration that is not visible from the
source path alone and cannot be traced without reading vite.config.

**Required Change:**
Resolve to an explicit `@/` path (e.g. `@/debuggers/identity`) or move the
debugger module under the standard alias tree. The alias must match the `@/`
convention or the import must be registered as an approved exception in the
architecture contract.

---

### VIOLATION

**Rule:** Import path rule — `@/` imports only, no non-standard aliases
**Rule Source:** `.claude/commands/review-contract/05-rules-verification.md`
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/screens/LoginScreen.jsx`
**Line:** 13

**Issue:**
`import { useTranslation } from '@i18n'`

The alias `@i18n` is not a `@/`-prefixed alias.

**Why This Violates The Contract:**
Same rule as above. `@i18n` resolves outside the `@/` convention and requires
knowledge of vite alias configuration to trace.

**Required Change:**
Register `@i18n` as an approved alias exception in the architecture contract,
or remap it to `@/i18n` or `@/shared/i18n`.

---

### VIOLATION

**Rule:** Theme contract — all colors via `--vc-*` CSS custom properties
**Rule Source:** `apps/VCSM/CLAUDE.md` → Theme
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/screens/LoginScreen.jsx`
**Lines:** 131, 147, 175, 189, 194, 225, 235, 240 (multiple instances)

**Issue:**
The LoginScreen uses hardcoded hex color values in Tailwind arbitrary value
syntax throughout:

- `bg-[#6C4DF6]` / `ring-[#6C4DF6]` / `border-[#6C4DF6]/80`
- `text-[#fecaca]` / `border-[#ef4444]`
- `text-[#86efac]` / `border-[#22c55e]`
- `text-[#c4b5fd]` / `text-[#ddd6fe]`
- `text-[#d1d5db]` / `text-[#9ca3af]`

**Why This Violates The Contract:**
CLAUDE.md states: "All colors via `--vc-*` CSS custom properties. Do not
hardcode Tailwind blue/slate/indigo/neutral classes — use `white/*` opacity
or `purple-*`." Hardcoded hex values bypass the theme system, making
theming, seasonal overrides, and dark-mode transitions impossible to manage
centrally.

**Required Change:**
Map each hex value to a `--vc-*` token in `apps/VCSM/src/styles/citizens-theme.css`
and reference via CSS custom property (e.g. `bg-[var(--vc-primary)]`). The
`authTheme.js` object already mediates some colors (cardBackground, cardShadow,
pageBackground) — the inline hex values should be routed through that same
pattern or directly via CSS tokens.

---

## Warnings

---

### WARNING

**Rule:** File size rule — maximum 300 lines per file
**File:** `apps/VCSM/src/features/auth/screens/LoginScreen.jsx`

**Observation:**
LoginScreen.jsx is 284 lines — 16 lines from the hard limit.
The iOS install prompt block (lines 219–256, ~37 lines) is self-contained and
growing. Adding one more conditional section (e.g. a social login row or a
banner) will breach the 300-line ceiling.

**Suggested Improvement:**
Extract the iOS install prompt block into `IosInstallBanner.jsx` (it already
imports `IosInstallPrompt` — the local button UI wrapping it can move there
too). This recovers ~35 lines of buffer.

---

### WARNING

**Rule:** Controller fan-out / hook orchestration boundary
**File:** `apps/VCSM/src/features/auth/hooks/useLogin.js`

**Observation:**
`useLogin` imports and directly calls three separate controllers:
`signInWithPassword` (login.controller), `ensureProfileDiscoverable`
(profile.controller), and `hydrateAuthSession` (authSession.controller).

The hook is orchestrating a multi-step auth flow that spans 3 controllers.
This pushes business-logic sequencing up into the hook layer.

**Suggested Improvement:**
Consider a single `loginFlow.controller.js` that owns the
signIn → hydrateSession → ensureDiscoverable sequence. The hook then calls
one controller and receives a result. This keeps orchestration at the
controller layer and simplifies the hook.

---

## Compliant Areas

| Check | Result |
|---|---|
| Module build order (DAL → Controller → Hook → Screen) | PASS |
| DAL does not enforce permissions | PASS |
| Controller is pure business logic — no DB calls | PASS |
| Models are pure (ProfileModel, no side effects) | PASS |
| No relative `../../` imports | PASS |
| File sizes (except LoginScreen near limit) | PASS |
| Single responsibility per file | PASS |
| Dependency direction (app → feature internals only) | PASS |
| DAL uses no `select('*')` | PASS |
| No `profileId` or `vportId` on identity surface | PASS* |
| Adapter does not export DAL or models | PASS |

*`profile.controller.js` uses `userId` at login-phase before actor resolution;
the comment in the file documents this as intentional (profiles.id === auth.users.id).
Flagged for awareness, not a violation.

---

## Overall Status

**PARTIALLY COMPLIANT**

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 3 |
| LOW (warnings) | 2 |

The login screen module is structurally sound — layering, dependency direction,
DAL isolation, and model purity all pass. Three items require action before this
module can be marked fully compliant: the controller export through the adapter
boundary (HIGH), the two non-standard import aliases (MEDIUM), and the theme
token drift (MEDIUM).
