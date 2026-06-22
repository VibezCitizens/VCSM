# CONTRACT REVIEW REPORT

**Date:** 2026-06-06
**Reviewer:** CONTRACT REVIEWER
**Role:** Blue Team — architecture compliance auditor

---

## Review Target

**Target:** `apps/VCSM/src/features/legal/`
**Application Scope:** VCSM
**Contracts Reviewed:**
- Area 5: Rules Verification (module layering, import paths, file size, adapter rule, UI purity §8, styling §9)
- Area 4: Workspace Boundaries (protected root: apps/VCSM)

**Files Reviewed:** 27

| File | Lines |
|---|---|
| adapters/legal.adapter.js | 6 |
| config/vportLandingContent.js | 254 |
| controllers/legalConsent.controller.js | 206 |
| controllers/legalDocument.controller.js | 5 |
| dal/getPublicIp.dal.js | — (dead) |
| dal/legalDocuments.read.dal.js | 56 |
| dal/userConsents.read.dal.js | 32 |
| dal/userConsents.write.dal.js | 50 |
| docs/AgeVerificationContent.jsx | 129 |
| docs/PrivacyPolicyContent.jsx | **379** |
| docs/TermsOfServiceContent.jsx | **510** |
| engine/legalCompliance.engine.js | 96 |
| hooks/useLegalConsent.js | 93 |
| hooks/useLegalDocument.js | 39 |
| hooks/useSignupConsent.js | 5 |
| screens/AboutScreen.jsx | 34 |
| screens/AboutView.jsx | **476** |
| screens/ConsentGateScreen.jsx | 169 |
| screens/ContactScreen.jsx | 43 |
| screens/ContactView.jsx | **351** |
| screens/HowToCreateProfileScreen.jsx | 175 |
| screens/HowToCreateVportScreen.jsx | 247 |
| screens/LegalDocumentScreen.jsx | 107 |
| screens/VportCategoryLandingScreen.jsx | 222 |
| screens/components/ProfilePhonePreview.jsx | 92 |
| screens/components/howToProfileContent.js | 40 |
| styles/legalDocument.css | — |

---

## Overall Status

**NON-COMPLIANT**

```
Critical Violations:  0
High Violations:      1
Medium Violations:    9
Low Violations:       4
Warnings:             2
```

---

## High Violations

---

```
VIOLATION

Rule:             Adapter Rule
Rule Source:      Area 5 — Rules Verification / VCSM CLAUDE.md Adapter Boundaries
Severity:         HIGH

File:             apps/VCSM/src/features/legal/adapters/legal.adapter.js
Line:             6

Issue:
  legal.adapter.js exports `recordSignupConsent`, which is a controller function
  defined in `legalConsent.controller.js`. The adapter also has a misleading
  comment trying to justify this: "Controller function exported for cross-feature
  callers that cannot use React hooks."

Why This Violates The Contract:
  The adapter rule is unambiguous: "Adapters expose only: hooks, components,
  view screens. Adapters never export DAL functions, models, or controllers."
  Exporting a controller function from an adapter collapses the layering boundary
  that the adapter is designed to enforce. Cross-feature callers should access
  this capability through a hook wrapper, not a raw controller call.
  This violation also has a confirmed security implication: the exported function
  accepts { userId } from the caller with no session cross-check (ELEK-2026-06-06-006).

Required Change:
  Remove `recordSignupConsent` from legal.adapter.js exports.
  Create a hook (e.g. useSignupConsent — which already exists but is hollow)
  that wraps the controller call and binds userId from the session internally.
  Cross-feature callers import and invoke the hook instead.
```

---

## Medium Violations

---

```
VIOLATION

Rule:             Styling Ownership Rule §9
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

File:             apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx
Lines:            31, 36, 44, 82, 95, 100, 104, 107, 125, 130, 137, 142, 149, 160

Issue:
  ConsentGateScreen.jsx contains 14+ instances of hardcoded hex color values
  expressed as Tailwind arbitrary value classes and inline style objects. Examples:

    Line 31:  text-[#9ca3af]
    Line 36:  border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]
    Line 44:  bg-[#6C4DF6] shadow-[...rgba(108,77,246,0.35)] hover:bg-[#7657ff]
    Line 95:  style={{ background: 'rgba(255,255,255,0.02)' }}
    Line 100: text-[#c4b5fd] decoration-[#c4b5fd]/40 hover:text-[#ddd6fe]
    Line 107: text-[#ef4444]/60
    Line 149: border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]
    Line 160: bg-[#6C4DF6] shadow-[...rgba(108,77,246,0.35)] hover:bg-[#7657ff]

Why This Violates The Contract:
  §9 explicitly states: "raw hex values in style={}, className Tailwind arbitrary
  values (e.g. text-[#6C4DF6], bg-[#ef4444]) are forbidden."
  "Colors must use CSS tokens (e.g. var(--vc-primary))."
  "A brand color change must require editing one source of truth, never multiple screens."
  This screen currently requires editing 14+ lines across 2 render paths to change a
  single brand color.

Required Change:
  Replace all raw hex arbitrary values with CSS token equivalents from
  src/styles/citizens-theme.css. For error red (#ef4444), use var(--vc-error) or
  equivalent. For brand purple (#6C4DF6, #c4b5fd), use var(--vc-primary) or
  var(--vc-purple-light). For muted gray (#9ca3af), use var(--vc-text-muted).
  Do not use Tailwind arbitrary bracket notation for colors — use named tokens.
```

---

```
VIOLATION

Rule:             Styling Ownership Rule §9
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

File:             apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx
Lines:            37-46, 76-222 (extensive — throughout all style={} blocks)

Issue:
  VportCategoryLandingScreen.jsx defines all visual design entirely through inline
  style objects with hardcoded raw values. Examples:

    Line 76:   background: '#060609'
    Line 37:   color: '#fff'
    Line 41:   color: 'rgba(255,255,255,0.52)'
    Line 92:   color: '#c4b5fd'
    Line 99:   background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.80) 100%)'
    Line 114:  background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)'
    Line 201:  color: 'rgba(196,181,253,0.70)'

  Additionally, two font family constants are hardcoded at the module level:
    const SERIF = "'DM Serif Display', serif"
    const SANS  = "'Inter', sans-serif"
  Typography scales must not be defined inside screens.

Why This Violates The Contract:
  §9 states: "Design values must not be hardcoded inside components or screens."
  "Styling must originate from src/shared/styles/, src/shared/theme/,
  src/shared/tokens/, feature CSS/module.css files, or theme configuration files."
  This screen defines its entire design system internally — every color, spacing
  value, font, and gradient is hardcoded in the JSX. A brand update would require
  editing this file directly.

Required Change:
  Move all visual constants to a CSS module file or to src/styles/citizens-theme.css.
  Typography constants (SERIF, SANS) must come from a shared theme token.
  Inline style objects should reference CSS custom properties via var(--vc-*).
  Consider extracting the sub-components (SectionHeading, benefit cards, CTA block)
  to a shared component that reads from theme tokens.
```

---

```
VIOLATION

Rule:             Import Path Rule
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

Files and Lines:
  controllers/legalConsent.controller.js:1-4  (4 relative imports)
  controllers/legalDocument.controller.js:1   (1 relative import)
  hooks/useLegalConsent.js:6                  (1 relative import)
  hooks/useLegalDocument.js:2                 (1 relative import)
  screens/LegalDocumentScreen.jsx:4           (1 relative import)

Issue:
  8 files use relative `../` imports instead of the required `@/` alias. Examples:
    from '../dal/legalDocuments.read.dal'
    from '../dal/userConsents.read.dal'
    from '../controllers/legalConsent.controller'
    from '../hooks/useLegalDocument'

Why This Violates The Contract:
  Area 5 states: "use `@/` imports only — no relative imports such as `../../`."
  While these are all single-level `../` intra-feature imports (not `../../` chains),
  the rule requires `@/` for all cross-folder imports. Mixed usage creates
  inconsistency — some files use `@/features/legal/...` while others use `../`.

Required Change:
  Replace all relative `../` imports with `@/features/legal/...` equivalents.
  Examples:
    '../dal/legalDocuments.read.dal'   →  '@/features/legal/dal/legalDocuments.read.dal'
    '../controllers/legalConsent.controller' →  '@/features/legal/controllers/legalConsent.controller'
    '../hooks/useLegalDocument'        →  '@/features/legal/hooks/useLegalDocument'
```

---

```
VIOLATION

Rule:             File Size Rule
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

Files:
  docs/TermsOfServiceContent.jsx    510 lines  (+210 over limit)
  screens/AboutView.jsx             476 lines  (+176 over limit)
  docs/PrivacyPolicyContent.jsx     379 lines  (+79 over limit)
  screens/ContactView.jsx           351 lines  (+51 over limit)

Issue:
  Four files exceed the 300-line maximum. Three of these are in the `docs/`
  folder (legal document content rendered as JSX). One is a screen view (AboutView).

Why This Violates The Contract:
  Area 5 states: "files over 300 lines must be split before adding more code."
  The contract applies regardless of whether the file contains business logic or
  rendered content.

Required Change:
  docs/TermsOfServiceContent.jsx:
    Split into section components (e.g. ToS_IntroSection, ToS_UseSection, etc.)
    assembled by a thin TermsOfServiceContent parent.
  docs/PrivacyPolicyContent.jsx:
    Same pattern — split into section components.
  screens/AboutView.jsx:
    Extract distinct sections into sub-components or a dedicated
    AboutView/components/ folder.
  screens/ContactView.jsx:
    Extract card groups (ContactCard, SupportSection, etc.) into sub-components.
```

---

```
VIOLATION

Rule:             UI Purity Rule §8
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

File:             apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx
Lines:            16-28 (setMeta), 53-68 (useEffect), 67 (setFunnelSource)

Issue:
  VportCategoryLandingScreen.jsx contains workflow orchestration logic directly
  in the screen component:

  1. setMeta() — a utility function that directly mutates document.head elements
     (creates/replaces meta tags, manages cleanup). This is a DOM-manipulation
     utility defined inline in a screen.

  2. setFunnelSource() — writes analytics tracking state from within the screen.
     Funnel source attribution is a domain concern, not a rendering concern.

  Both are inside a useEffect block, but the screen owns and defines the
  orchestration logic rather than delegating it to a hook.

Why This Violates The Contract:
  §8 states: "screens and components must not contain workflow orchestration."
  Analytics writes and SEO meta management are domain-level side effects.
  The screen should invoke a hook (e.g. useVportLandingSeo, useFunnelSource)
  that encapsulates these concerns.

Required Change:
  Extract setMeta logic and document.title management to a useSeoMeta() hook
  (or a shared SEO hook in shared/hooks/).
  The setFunnelSource call should live in a useFunnelSource() hook or be
  invoked through an analytics controller, not directly from the screen's
  useEffect.
```

---

```
VIOLATION

Rule:             UI Purity Rule §8 / Single Responsibility Rule
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

File:             apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx
Lines:            34-47 (SectionHeading component)

Issue:
  VportCategoryLandingScreen.jsx defines a sub-component (SectionHeading) inline
  at the module level. This component has its own props interface and renders
  independently. It is not a rendering-only local closure — it is a reusable
  component living inside a screen file.

Why This Violates The Contract:
  §8 and single-responsibility: screens must not contain reusable component
  definitions. A named, props-accepting component defined inside a screen file
  belongs in components/ or shared/components/, not inside the screen itself.
  Co-locating components and screens in the same file tightly couples layout
  decisions to the screen's render tree and prevents reuse.

Required Change:
  Move SectionHeading to screens/components/SectionHeading.jsx (or
  shared/components/ if it is reusable across features) and import it into
  VportCategoryLandingScreen.
```

---

```
VIOLATION

Rule:             Feature Boundary / Single Responsibility Rule
Rule Source:      Area 5 / VCSM CLAUDE.md module architecture
Severity:         MEDIUM

Files:
  screens/AboutScreen.jsx
  screens/AboutView.jsx
  screens/ContactScreen.jsx
  screens/ContactView.jsx
  screens/HowToCreateProfileScreen.jsx
  screens/HowToCreateVportScreen.jsx
  screens/VportCategoryLandingScreen.jsx
  config/vportLandingContent.js

Issue:
  7 of 9 screens in features/legal/ have no relationship to legal compliance,
  consent gates, or legal documents. They are public-facing marketing/informational
  pages (About, Contact, How-To guides, VPORT category landing pages). The legal
  feature has become a catch-all for public routes.

Why This Violates The Contract:
  Each feature should answer one focused question. The legal feature's domain is
  legal compliance — consent gate management, document versioning, and user consent
  recording. Marketing pages, contact forms, how-to guides, and VPORT landing pages
  are not legal compliance concerns. Mixing them creates an unfocused module that
  grows indefinitely.

Required Change:
  Create a dedicated feature (e.g. features/public/ or features/marketing/) to
  house About, Contact, HowTo, and VPORT landing screens. legal/ should retain
  only: ConsentGateScreen, LegalDocumentScreen, docs/, dal/, controllers/,
  hooks/, engine/, and adapters/.
  Note: this is a scoped refactor — coordinate with WOLVERINE for routing updates.
```

---

```
VIOLATION

Rule:             Adapter Rule
Rule Source:      Area 5 — Rules Verification
Severity:         MEDIUM

File:             apps/VCSM/src/features/legal/hooks/useSignupConsent.js

Issue:
  useSignupConsent.js is named as a React hook (use* prefix) but contains no
  React APIs whatsoever (no useState, useEffect, useCallback, useContext, etc.).
  It is a plain function that returns an object containing a controller reference:

    export function useSignupConsent() {
      return { recordSignupConsent }
    }

  This means it imports directly from the controller and re-exports it inside
  a function call. It is not a hook — it is a re-export wrapper with a misleading
  name that bypasses the adapter boundary.

Why This Violates The Contract:
  The use* naming convention signals React hook semantics to all consumers.
  A function named useSignupConsent that has no React lifecycle behavior will
  confuse future developers and violate the principle that use* functions depend
  on React's rules of hooks (cannot be called conditionally, must be inside
  components, etc.). Additionally, the function directly exposes a controller
  reference — the same adapter rule concern as HIGH finding 1.

Required Change:
  Either:
  A. Convert to a real hook: import userId from useAuth() and return a wrapped
     recordSignupConsent function that binds the session userId internally.
  B. Rename to a non-hook name (e.g. getSignupConsentActions) if no React
     lifecycle is needed — but this should come from the adapter, not a file
     in hooks/.
  Option A is preferred: it closes the security gap and respects the use* contract.
```

---

## Low Violations

---

```
VIOLATION

Rule:             Controller Responsibility Rule (Layer Responsibility)
Rule Source:      Area 5 — Rules Verification
Severity:         LOW

File:             apps/VCSM/src/features/legal/controllers/legalDocument.controller.js
Lines:            1-5

Issue:
  legalDocument.controller.js is a 5-line file that does nothing but call the DAL:

    export async function getLegalDocumentController({ appKey, documentType, version }) {
      return dalGetLegalDocument({ appKey, documentType, version })
    }

  It has zero business logic. It performs no validation, no transformation,
  no authorization, and no error wrapping beyond what the DAL already does.

Why This Violates The Contract:
  "Controllers own business logic." A controller that is a direct DAL passthrough
  adds a layer with no purpose. Consumers importing getLegalDocumentController
  get no additional value over calling the DAL directly.

Required Change:
  Either add meaningful controller logic (input validation, appKey allowlist check,
  error normalization), or remove this controller and have the hook call the DAL
  directly through the adapter if the feature is simple enough to not need a
  controller layer for this path.
```

---

```
VIOLATION

Rule:             Dependency Direction Rule / Engine Isolation
Rule Source:      Area 5 — Rules Verification
Severity:         LOW

File:             apps/VCSM/src/features/legal/engine/legalCompliance.engine.js

Issue:
  legalCompliance.engine.js is a pure comparison engine located inside the
  features/legal/ module at legal/engine/. The VCSM architecture specifies
  that engines belong in the root engines/ directory, not inside feature folders.

Why This Violates The Contract:
  "Shared logic belongs in engines/ or shared/." An engine inside a feature
  folder cannot be consumed by other features without violating the cross-feature
  import rule. If this compliance logic is ever needed by another feature (e.g.
  a join flow or an admin panel), they cannot import it without going through
  the legal adapter, which must not export engines.

Required Change:
  If legalCompliance.engine.js is truly legal-specific and will never be shared,
  rename it to legalCompliance.util.js or legalCompliance.service.js and keep it
  inside the feature (but acknowledge it is feature-private).
  If there is any possibility of reuse, move it to engines/legal/ or
  engines/compliance/ and update the import in legalConsent.controller.js.
```

---

```
VIOLATION

Rule:             Single Responsibility Rule
Rule Source:      Area 5 — Rules Verification
Severity:         LOW

File:             apps/VCSM/src/features/legal/dal/getPublicIp.dal.js

Issue:
  getPublicIp.dal.js is a dead file. It has zero importers (confirmed by static
  scan). Its own comment reads "NOT CALLED". It calls an external API
  (https://api.ipify.org) in a security-sensitive feature module.

Why This Violates The Contract:
  Dead code in a security module is a contract violation: the single-responsibility
  rule requires that each file answers one focused question. A file that answers
  no question and is never executed adds cognitive overhead and risk of
  accidental reintroduction.

Required Change:
  Delete getPublicIp.dal.js. If server-side IP capture is ever needed, implement
  it in a Cloudflare Worker or Edge Function as a proper server-side operation
  (not a client-side fetch), and create a new DAL that calls the worker endpoint.
```

---

```
VIOLATION

Rule:             File Naming Convention
Rule Source:      Area 5 — Rules Verification
Severity:         LOW

File:             apps/VCSM/src/features/legal/screens/components/howToProfileContent.js

Issue:
  howToProfileContent.js is a content/config file living inside screens/components/.
  The file does not follow a recognized layer naming convention (.dal.js, .model.js,
  .controller.js, use*.js, .adapter.js) and its folder placement (under screens/)
  is non-standard for config/content data.

Why This Violates The Contract:
  Config and content data files belong in a config/ or content/ folder at the
  feature level, not nested under screens/components/. The screens/components/
  folder should contain only React component files.

Required Change:
  Move howToProfileContent.js to features/legal/config/howToProfileContent.js
  and update the import in HowToCreateProfileScreen.jsx.
```

---

## Warnings

---

```
WARNING

Rule:             File Size Rule
File:             apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx

Observation:      247 lines — 53 lines from the 300-line limit.
Why it may become a problem: Any non-trivial addition (new section, new how-to step,
  responsive layout variant) will breach the limit.
Suggested Improvement: Pre-emptively extract how-to content data to config/ and
  extract step/section components to screens/components/.
```

---

```
WARNING

Rule:             Controller Fan-out Rule
File:             apps/VCSM/src/features/legal/controllers/legalConsent.controller.js

Observation:      5 external collaborators — exactly at the contract limit.
  1. dalGetActiveLegalDocuments (legalDocuments.read.dal)
  2. dalGetUserConsents (userConsents.read.dal)
  3. dalRecordLegalAcceptance (userConsents.write.dal)
  4. buildConsentComplianceStatus (legalCompliance.engine)
  5. createTTLCache (shared/lib/ttlCache)

Why it may become a problem: Any new capability (e.g. server-side IP capture via
  Edge Function, audit logging) will push this controller over the fan-out limit.
Suggested Improvement: If IP capture is added (Carnage task), route it through a
  dedicated sub-controller or extract cache management to a separate cache module
  to free a fan-out slot.
```

---

## Compliant Areas

The following areas passed review with no violations:

| Area | Status | Notes |
|---|---|---|
| Module build order (DAL → Controller → Hook → Screen) | PASS | Layering respected throughout |
| Cross-feature imports (adapter boundary) | PASS | All cross-feature imports use adapters or @/ |
| Workspace isolation (no cross-app imports) | PASS | No imports from wentrex/ or Traffic/ |
| DAL column selection (no select('*')) | PASS | All DAL files use explicit column lists |
| Identity surface (actorId/kind) | PASS | Legal feature does not expose profileId/vportId |
| Folder depth | PASS | Max depth is 3 (screens/components/) — within limit |
| LegalDocumentScreen.jsx styling | PASS | Uses var(--vc-text-muted) CSS tokens correctly |
| legalCompliance.engine.js | PASS | Pure — no side effects, no DB calls |
| legalConsent.controller.js | PASS | Business logic present; fail-closed patterns correct |

---

## Violation Summary Table

| # | File | Rule | Severity |
|---|---|---|---|
| 1 | adapters/legal.adapter.js:6 | Adapter rule — exports controller | HIGH |
| 2 | screens/ConsentGateScreen.jsx (14 lines) | §9 styling — hardcoded hex values | MEDIUM |
| 3 | screens/VportCategoryLandingScreen.jsx (throughout) | §9 styling — raw hex + SERIF/SANS constants | MEDIUM |
| 4 | 5 files / 8 import lines | Import path — `../` instead of `@/` | MEDIUM |
| 5 | docs/TermsOfServiceContent.jsx (510L), AboutView.jsx (476L), docs/PrivacyPolicyContent.jsx (379L), ContactView.jsx (351L) | File size — exceeds 300 lines | MEDIUM |
| 6 | screens/VportCategoryLandingScreen.jsx:53-68 | §8 UI purity — orchestration in screen | MEDIUM |
| 7 | screens/VportCategoryLandingScreen.jsx:34-47 | §8 / single-responsibility — SectionHeading defined in screen | MEDIUM |
| 8 | 7 screens + config/vportLandingContent.js | Feature boundary drift — non-legal screens in legal/ | MEDIUM |
| 9 | hooks/useSignupConsent.js | Adapter/naming — fake hook re-exports controller | MEDIUM |
| 10 | controllers/legalDocument.controller.js | Controller responsibility — DAL passthrough, no logic | LOW |
| 11 | engine/legalCompliance.engine.js | Dependency direction — engine inside feature folder | LOW |
| 12 | dal/getPublicIp.dal.js | Single responsibility — dead file | LOW |
| 13 | screens/components/howToProfileContent.js | File naming / folder placement — config in screens/ | LOW |
