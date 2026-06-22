# CONTRACT REVIEW REPORT

**Target:** auth / modules / onboarding — /onboarding screen (Complete Your Profile)
**Application Scope:** VCSM
**Date:** 2026-06-06
**Reviewer:** CONTRACT REVIEWER

---

## Contracts Reviewed

| Contract | Source |
|---|---|
| Layer Contracts (§2) | ZZnotforproduction/CONTRACTS/Architecture/03-layer-contracts.md |
| Identity Contract (§1.3–1.4) | ZZnotforproduction/CONTRACTS/Architecture/02-identity-contract.md |
| Adapter Contract (§5.3–5.5) | ZZnotforproduction/CONTRACTS/Architecture/07-adapter-contract.md |
| Dependency Rules (§6) | ZZnotforproduction/CONTRACTS/Architecture/08-dependency-rules.md |
| Styling Ownership Rule (§14) | ZZnotforproduction/CONTRACTS/Architecture/14-styling-ownership-rule.md |
| Rules Verification Checklist | .claude/commands/review-contract/05-rules-verification.md |

---

## Files Reviewed

| File | Layer | Lines | Status |
|---|---|---|---|
| apps/VCSM/src/features/auth/screens/Onboarding.jsx | View Screen | 172 | Reviewed |
| apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js | Hook | 184 | Reviewed |
| apps/VCSM/src/features/auth/controllers/onboarding.controller.js | Controller | 200 | Reviewed |
| apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js | Controller | 25 | Reviewed |
| apps/VCSM/src/features/auth/controllers/createUserActor.controller.js | Controller | 54 | Reviewed |
| apps/VCSM/src/features/auth/controllers/completeProfileGate.controller.js | Controller | 15 | Reviewed |
| apps/VCSM/src/features/auth/dal/onboarding.dal.js | DAL | 85 | Reviewed |
| apps/VCSM/src/features/auth/model/onboarding.model.js | Model | 88 | Reviewed |
| apps/VCSM/src/features/auth/model/actor.model.js | Model | 10 | Reviewed |
| apps/VCSM/src/features/auth/model/authInputValidation.model.js | Model | 79 | Reviewed |
| apps/VCSM/src/features/auth/styles/authInputClasses.js | Style utility | 13 | Reviewed |

---

## Critical Violations

---

```
VIOLATION

Rule:            Adapter Import Rule — §5.4
Rule Source:     ZZnotforproduction/CONTRACTS/Architecture/07-adapter-contract.md
Severity:        CRITICAL

File:            apps/VCSM/src/features/auth/controllers/onboarding.controller.js
Line:            13

Issue:
The auth controller directly imports a DAL function from the initiation feature,
bypassing the adapter boundary entirely:

  import { acceptVibeInviteByCodeDAL } from '@/features/initiation/dal/vibeInvites.dal'

Why This Violates The Contract:
§5.4 Adapter Import Rule states: "Any code outside a feature must import the feature
through its adapter." The auth feature is not the initiation feature. This import
reaches directly into initiation's internal DAL layer — a layer that adapters
explicitly prohibit from being exported (§5.3: "Adapters must never export: DAL").

This creates a direct structural coupling between auth's controller and initiation's
database layer, bypassing every boundary the initiation feature is supposed to enforce.
If initiation refactors its DAL, this import silently breaks.

Required Change:
1. Create or locate the initiation adapter:
   apps/VCSM/src/features/initiation/adapters/initiation.adapter.js
2. Export a controller-level or hook-level function from that adapter that wraps
   the invite attribution logic (e.g., acceptVibeInviteAdapter)
3. Replace the direct DAL import in onboarding.controller.js:
   import { acceptVibeInviteAdapter } from '@/features/initiation/adapters/initiation.adapter'
4. Remove: import { acceptVibeInviteByCodeDAL } from '@/features/initiation/dal/vibeInvites.dal'

Note: The adapter contract (§5.3) also prohibits adapters from exporting DAL functions —
so the adapter must wrap the DAL in a controller or service function before re-exporting.
```

---

## High Violations

---

```
VIOLATION

Rule:            Controller Fan-Out Rule — maximum 5 external collaborators
Rule Source:     .claude/commands/review-contract/05-rules-verification.md
Severity:        HIGH

File:            apps/VCSM/src/features/auth/controllers/onboarding.controller.js
Line:            61–155 (completeOnboardingController)

Issue:
completeOnboardingController calls 8 external collaborators, exceeding the 5-collaborator limit:

  1. dalGetAuthSession()                   — auth session DAL
  2. normalizeOnboardingFormModel()         — onboarding model
  3. generateUsernameDAL()                  — onboarding DAL
  4. computeAgeFromBirthdateModel()         — onboarding model
  5. upsertCompletedOnboardingProfileDAL()  — onboarding DAL
  6. createUserActorForProfile()            — another controller
  7. acceptVibeInviteByCodeDAL()            — cross-feature DAL (CRITICAL violation above)
  8. ensureVcsmPlatformBootstrap()          — injectable platform adapter function

Why This Violates The Contract:
The controller fan-out rule limits each controller to at most 5 external collaborators.
The intent is to enforce single responsibility — if a controller requires more than 5
collaborators, it is doing too much and should be split.

Required Change:
Extract the invite attribution logic (collaborator 7) into a separate controller or
adapter function in the initiation feature. This both resolves the boundary violation
(CRITICAL above) and reduces the fan-out to 7. Further reduction requires evaluating
whether the platform bootstrap call (collaborator 8) should be extracted to the hook
layer (it is injectable and could be called there instead).
```

---

## Medium Violations

---

```
VIOLATION

Rule:            DAL Single Responsibility — DAL answers one question: "What does the database say?"
Rule Source:     ZZnotforproduction/CONTRACTS/Architecture/03-layer-contracts.md §2.1
Severity:        MEDIUM

File:            apps/VCSM/src/features/auth/dal/onboarding.dal.js
Line:            3–7

Issue:
readCurrentAuthUserDAL() calls supabase.auth.getUser() — a Supabase Auth SDK call, not a
database query. This auth operation is co-located with DB table operations (profiles SELECT,
profiles upsert, generate_username RPC) in the same DAL file.

  export async function readCurrentAuthUserDAL() {
    const { data, error } = await supabase.auth.getUser()   // auth SDK, not DB query
    if (error) throw error
    return data?.user ?? null
  }

Why This Violates The Contract:
The DAL contract states DAL files may "call select, insert, update, delete, or rpc".
supabase.auth.getUser() is an auth session call — it verifies the JWT with the Supabase
server and returns the authenticated user object. It is not a database query. Mixing auth
session reads with profile table operations in a single DAL file violates single responsibility.

The correct home for this function is apps/VCSM/src/features/auth/dal/authSession.read.dal.js,
which already contains dalGetAuthSession() and dalHydrateAuthSession() — the correct module
for all Supabase auth session operations.

Required Change:
Move readCurrentAuthUserDAL() from onboarding.dal.js to authSession.read.dal.js.
Update the import in completeProfileGate.controller.js accordingly:
  import { readCurrentAuthUserDAL } from '@/features/auth/dal/authSession.read.dal'
```

---

```
VIOLATION

Rule:            Hook Contract — Hooks must not apply business rules (§2.4)
Rule Source:     ZZnotforproduction/CONTRACTS/Architecture/03-layer-contracts.md §2.4
Severity:        MEDIUM

File:            apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js
Line:            8, 34

Issue:
The hook directly imports and applies isSafeAuthReturnPath — a security validation function
from the model layer — to compute the post-save redirect destination:

  import { isSafeAuthReturnPath } from '@/features/auth/model/authInputValidation.model'

  // line 34 — applied in useMemo:
  redirectTo: typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : '/'

Why This Violates The Contract:
The hook contract states hooks must not "apply business rules". Redirect path validation
is a security-business rule: it determines which return paths are safe for the system
to navigate to. This rule belongs in the controller layer, which is the sole owner of
business logic and security decisions. Moving it to the hook bypasses the controller
boundary and places a security gate where it does not belong.

The controller (getOnboardingBootstrapController or completeOnboardingController) should
accept the raw redirect path as an input and return a validated, safe redirectTo value
in its result payload. The hook should treat the controller's result as authoritative
and navigate to whatever safe path the controller returns — not apply the validation itself.

Required Change:
1. Accept raw state.from as a parameter passed into the controller call
2. In getOnboardingBootstrapController, validate and return safe redirectTo in data:
   data: { userId, form, redirectTo: isSafeAuthReturnPath(rawFrom) ? rawFrom : '/' }
3. In useAuthOnboarding: read navState.redirectTo from controller result, not from
   a useMemo applying the model function directly
```

---

```
VIOLATION

Rule:            Styling Ownership Rule — hardcoded hex colors forbidden (§14)
Rule Source:     ZZnotforproduction/CONTRACTS/Architecture/14-styling-ownership-rule.md
Severity:        MEDIUM

File:            apps/VCSM/src/features/auth/styles/authInputClasses.js
Line:            4–5

Issue:
The authInputClasses utility contains hardcoded hex color values in Tailwind arbitrary
class syntax — the exact pattern the styling contract explicitly names as forbidden:

  'placeholder:text-[#9ca3af] outline-none transition duration-200',
  'focus:border-[#6C4DF6]/80 focus:ring-2 focus:ring-[#6C4DF6]/40',

Why This Violates The Contract:
The styling contract §14 states: "colors must use CSS tokens (e.g. var(--vc-primary)) —
raw hex values in style={}, className Tailwind arbitrary values (e.g. text-[#6C4DF6],
bg-[#ef4444]) are forbidden."

The contract names `text-[#6C4DF6]` as the exact forbidden pattern. The file uses
`focus:border-[#6C4DF6]/80` and `focus:ring-[#6C4DF6]/40` — the same hex in the same
arbitrary class format. Additionally `placeholder:text-[#9ca3af]` hardcodes a gray
value that should come from the CSS token system.

The consequence is that a brand color change requires editing this source file instead
of the single CSS token source of truth.

Required Change:
Replace hardcoded hex values with CSS custom property tokens from citizens-theme.css:
  'placeholder:text-white/30'          instead of placeholder:text-[#9ca3af]
  'focus:border-vc-primary/80'         or use CSS var() in module.css
  'focus:ring-vc-primary/40'

If the --vc-primary token does not exist in citizens-theme.css for focus states,
add it there as the source of truth, then reference it here via CSS variable.
```

---

## Low Violations

---

```
VIOLATION

Rule:            Single Responsibility Rule — each file answers one focused question
Rule Source:     .claude/commands/review-contract/05-rules-verification.md
Severity:        LOW

File:            apps/VCSM/src/features/auth/controllers/onboarding.controller.js
Line:            42–58, 61–155, 162–200+ (3 exported functions)

Issue:
The file exports three distinct controllers covering two separate flows:
  - getOnboardingBootstrapController()    — standard onboarding bootstrap
  - completeOnboardingController()         — standard onboarding save
  - bootstrapJoinOnboardingController()    — join/barbershop invite flow bootstrap

The join flow (bootstrapJoinOnboardingController) is architecturally separate: it handles
a different entry path (invite-based join), skips birthdate/age/sex collection, and has
different post-bootstrap behavior. It is co-located with the standard onboarding flow
for historical convenience, not structural correctness.

The file is currently 200 lines — within the 300-line limit — but the combination of
fan-out violations and three distinct concerns in one file signals the boundary is under pressure.

Why This Violates The Contract:
The single responsibility rule requires each file to answer one focused question.
This file answers three: "how do I bootstrap standard onboarding?", "how do I save
standard onboarding?", and "how do I bootstrap join onboarding?" The join path is a
different use-case with different rules.

Required Change:
Extract bootstrapJoinOnboardingController into a dedicated file:
  apps/VCSM/src/features/auth/controllers/joinOnboarding.controller.js
This is LOW priority — 200 lines is well within the limit and the coupling is not harmful.
Consider as part of the next refactor cycle for this module.
```

---

## Warnings

---

```
WARNING

Rule:            Styling Ownership Rule — verify CSS class composition chain
Rule Source:     ZZnotforproduction/CONTRACTS/Architecture/14-styling-ownership-rule.md
Severity:        WARNING

File:            apps/VCSM/src/features/auth/screens/Onboarding.jsx
Line:            11

Issue:
Onboarding.jsx imports authInputClass and authSelectClass from authInputClasses.js.
The styling violation in that file (MEDIUM — hardcoded hex colors) propagates to
every screen that consumes these helpers, including Onboarding.jsx.

Action Required:
Once authInputClasses.js is patched to use CSS tokens (see MEDIUM violation above),
no changes are needed in Onboarding.jsx itself. The screen import chain is correct —
the violation origin is the style utility, not the screen.
```

---

## Compliant Patterns Confirmed

| Rule | File | Evidence |
|---|---|---|
| @/ imports only; no ../../ | All files | All imports use @/ path aliases ✓ |
| Module build order | All files | DAL → Model → Controller → Hook → Screen ✓ |
| DAL does not enforce permissions | onboarding.dal.js | No auth logic, no ownership checks ✓ |
| Models are pure | onboarding.model.js, actor.model.js | No I/O, no side effects ✓ |
| Controllers own business logic | onboarding.controller.js | Session pin, age compute, write orchestration ✓ |
| Controllers do not import React | onboarding.controller.js | React-free ✓ |
| Controllers return domain results, not raw rows | onboarding.controller.js | Returns { ok, action, error, data } ✓ |
| Hooks call controllers only | useAuthOnboarding.js | Calls controller + injectable ops ✓ |
| Hooks do not import Supabase | useAuthOnboarding.js | Supabase-free ✓ |
| Hooks do not call DAL functions | useAuthOnboarding.js | DAL-free ✓ |
| View Screen calls hooks only | Onboarding.jsx | No DAL, no Supabase, no controllers ✓ |
| Cross-feature via adapter | useAuthOnboarding.js:7 | `useIdentityOps` imported from identity.adapter ✓ |
| Identity surface rule | actor.model.js | Returns { id, kind, isVoid } — profileId OMITTED ✓ |
| Actor ownership guard | createUserActor.controller.js:26 | profileId === userId guard confirmed ✓ |
| File size ≤ 300 lines | All files | Max 200 lines (onboarding.controller.js) ✓ |
| DAL uses explicit column projections | onboarding.dal.js | select('id,username,birthdate') ✓ |
| No select('*') | onboarding.dal.js | Not present ✓ |

---

## Summary

```
CONTRACT REVIEW REPORT SUMMARY

Target:              auth / modules / onboarding — /onboarding screen
Application Scope:   VCSM
Files Reviewed:      11

Critical Violations: 1
  ARCH-CONTRACT-001 — Cross-feature DAL import bypassing adapter
                       onboarding.controller.js:13

High Violations:     1
  ARCH-CONTRACT-002 — Controller fan-out: 8 collaborators (limit: 5)
                       onboarding.controller.js (completeOnboardingController)

Medium Violations:   3
  ARCH-CONTRACT-003 — DAL single responsibility: auth op in DB DAL file
                       onboarding.dal.js:3-7
  ARCH-CONTRACT-004 — Hook applies security validation (business rule)
                       useAuthOnboarding.js:8, 34
  ARCH-CONTRACT-005 — Hardcoded hex colors in style utility
                       authInputClasses.js:4-5

Low Violations:      1
  ARCH-CONTRACT-006 — Three controllers in one file (single responsibility)
                       onboarding.controller.js

Warnings:            1
  authInputClasses violation propagates to Onboarding.jsx — resolves when utility is patched

Overall Status: NON-COMPLIANT
```

**Primary driver of NON-COMPLIANT status:** ARCH-CONTRACT-001 — the direct cross-feature DAL import is the same finding already flagged as ARCH-ONBOARD-001 in the ARCHITECT report and VEN-ONBOARD-001 in VENOM. This review confirms it as a CRITICAL contract violation. Route to WOLVERINE for a fix ticket.

---

## Recommended Fix Priority

| Priority | Finding | Complexity | Action |
|---|---|---|---|
| 1 | ARCH-CONTRACT-001 | MODERATE | Create/update initiation adapter; replace direct DAL import |
| 2 | ARCH-CONTRACT-002 | LOW (follows from #1) | Fan-out reduces to 7 after #1; evaluate extracting platform bootstrap to hook |
| 3 | ARCH-CONTRACT-005 | SIMPLE | Replace hardcoded hex with CSS tokens in authInputClasses.js |
| 4 | ARCH-CONTRACT-003 | SIMPLE | Move readCurrentAuthUserDAL to authSession.read.dal.js |
| 5 | ARCH-CONTRACT-004 | MODERATE | Move redirect validation into controller result payload |
| 6 | ARCH-CONTRACT-006 | LOW | Extract bootstrapJoinOnboardingController — next refactor cycle |
