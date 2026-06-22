---
name: vcsm.bottom-nav.review-contract.2026-06-06
description: Architecture contract compliance audit of the VCSM bottom navigation bar shell layer — 2026-06-06
metadata:
  type: contract-review
  owner: CONTRACT REVIEWER
  run-date: 2026-06-06
  scope: VCSM
  target: bottom navigation bar shell layer
---

# CONTRACT REVIEW REPORT

**Target:** Bottom navigation bar shell layer — all files read during this governance chain session
**Application Scope:** VCSM
**Run Date:** 2026-06-06
**Reviewer:** CONTRACT REVIEWER

**Contracts Reviewed:**
- Architecture Contract §5.2 — Cross-Feature Boundary Rule (`Architecture/05-feature-boundaries.md`)
- Architecture Contract §5.3–5.5 — Adapter Contract (`Architecture/07-adapter-contract.md`)
- Architecture Contract §9 — Styling Ownership Rule (`Architecture/14-styling-ownership-rule.md`)
- Architecture Contract §8 — UI Purity Rule (`Architecture/13-ui-purity-rule.md`)
- Architecture Contract §4.5 — File Naming Rule (`Architecture/INDEX.md`)
- Single-Source Actor Architecture — Actor Core Rule (`System/04-actor-core-rule.md`)

**Files Reviewed:**
1. `apps/VCSM/src/shared/components/BottomNavBar.jsx` (173 lines)
2. `apps/VCSM/src/app/layout/RootLayout.jsx` (105 lines)
3. `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx` (89 lines)
4. `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js` (51 lines)
5. `apps/VCSM/src/shared/hooks/useOneSignalPush.js` (93 lines)
6. `apps/VCSM/src/services/onesignal/onesignalClient.js` (87 lines)
7. `apps/VCSM/src/services/onesignal/initOneSignal.js` (48 lines)
8. `apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js` (52 lines)
9. `apps/VCSM/src/features/profiles/adapters/profiles.adapter.js` (3 lines — reference only)

---

## Critical Violations: 4
## High Violations: 1
## Medium Violations: 1
## Warnings: 2

**Overall Status: PARTIALLY COMPLIANT**

---

## Critical Violations

---

### VIOLATION

**Rule:** Cross-Feature Boundary Rule (§5.2) + Adapter Import Rule (§5.4)
**Rule Source:** `ZZnotforproduction/CONTRACTS/Architecture/05-feature-boundaries.md`, `07-adapter-contract.md`
**Severity:** CRITICAL

**File:** `apps/VCSM/src/shared/components/BottomNavBar.jsx`
**Line:** 9

**Issue:**
`BottomNavBar.jsx` imports `getCachedActorCanonicalSlug` directly from the profiles feature's internal controller file:
```js
import { getCachedActorCanonicalSlug } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'
```

**Why This Violates The Contract:**
§5.2 states: "A feature may not import another feature's internal files, including... controllers." §5.4 states: "Any code outside a feature must import the feature through its adapter." `BottomNavBar.jsx` lives in `shared/components/` — outside the profiles feature. Importing directly from `profiles/controller/` bypasses the profiles adapter boundary entirely.

Additionally, §5.3 (Adapter Contract) states: "Adapters must never export... controllers." This means `getCachedActorCanonicalSlug` cannot simply be added to the profiles adapter as-is — it must first be wrapped in a hook before being exposed as an adapter surface. (The existing `useActorCanonicalSlug` hook is the correct entry point.)

**Required Change:**
Replace the direct controller import with the hook-based path through the profiles adapter:
```js
// Remove:
import { getCachedActorCanonicalSlug } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'

// Replace with (use the async hook in ProfileNavTab render):
import { useActorCanonicalSlug } from '@/features/profiles/adapters/profiles.adapter'
```
The `ProfileNavTab` component must call `useActorCanonicalSlug(actorId)` reactively rather than calling `getCachedActorCanonicalSlug(actorId)` synchronously. This is a behaviour-preserving change — the hook uses the same underlying controller and cache.

---

### VIOLATION

**Rule:** Cross-Feature Boundary Rule (§5.2) + Adapter Import Rule (§5.4) + Single-Source Actor Rule
**Rule Source:** `Architecture/05-feature-boundaries.md`, `07-adapter-contract.md`, `System/04-actor-core-rule.md`
**Severity:** CRITICAL

**File:** `apps/VCSM/src/app/layout/RootLayout.jsx`
**Line:** 10

**Issue:**
`RootLayout.jsx` imports `useIdentity` directly from the identity context store, bypassing the identity adapter:
```js
import { useIdentity } from "@/state/identity/identityContext"
```

**Why This Violates The Contract:**
The identity adapter (`@/features/identity/adapters/identity.adapter`) is the declared public surface for the identity feature. `@/state/identity/identityContext` is the underlying implementation context — not the adapter. §5.4 requires all code outside a feature to import through the feature's adapter. The adapter already exports `useIdentity` as a re-export, making this a zero-behaviour-change fix.

The Single-Source Actor contract reinforces this: "All consumers must read from `useIdentity()`" — through the adapter, not the raw context.

**Required Change:**
```js
// Remove:
import { useIdentity } from "@/state/identity/identityContext"

// Replace with:
import { useIdentity } from "@/features/identity/adapters/identity.adapter"
```

---

### VIOLATION

**Rule:** Cross-Feature Boundary Rule (§5.2) + Adapter Import Rule (§5.4)
**Rule Source:** `Architecture/05-feature-boundaries.md`, `07-adapter-contract.md`
**Severity:** CRITICAL

**File:** `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx`
**Line:** 3

**Issue:**
`VportLeadsChip.jsx` imports `useIdentity` directly from the identity context, bypassing the identity adapter:
```js
import { useIdentity } from "@/state/identity/identityContext";
```

**Why This Violates The Contract:**
Same contract violation as RootLayout — the identity adapter is the correct cross-feature import surface. `VportLeadsChip` is inside the `dashboard/vport` feature, which is a different feature from `identity`. Cross-feature access must go through adapters.

**Required Change:**
```js
// Remove:
import { useIdentity } from "@/state/identity/identityContext";

// Replace with:
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```

---

### VIOLATION

**Rule:** Cross-Feature Boundary Rule (§5.2) + Adapter Import Rule (§5.4)
**Rule Source:** `Architecture/05-feature-boundaries.md`, `07-adapter-contract.md`
**Severity:** CRITICAL

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js`
**Line:** 2

**Issue:**
`useVportNewLeadsCount.js` imports `useIdentity` directly from the identity context store:
```js
import { useIdentity } from "@/state/identity/identityContext";
```

**Why This Violates The Contract:**
`useVportNewLeadsCount.js` is a hook inside the `dashboard/vport/dashboard/cards/leads/` sub-feature. Importing `useIdentity` from the underlying identity context bypasses the identity adapter boundary. Same fix as the other three violations.

**Required Change:**
```js
// Remove:
import { useIdentity } from "@/state/identity/identityContext";

// Replace with:
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```

---

## High Violations

---

### VIOLATION

**Rule:** Styling Ownership Rule (§9)
**Rule Source:** `ZZnotforproduction/CONTRACTS/Architecture/14-styling-ownership-rule.md`
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx`
**Lines:** 22–85

**Issue:**
`VportLeadsChip.jsx` contains an extensive inline `style={{}}` block and an embedded `<style>` tag with hardcoded hex, rgba, and integer values that have no corresponding CSS design tokens:

```jsx
// Lines 22–45 — hardcoded design values:
style={{
  position: "fixed",
  bottom: "calc(var(--vc-bottom-nav-height, 80px) + 10px)",  // fallback 80px hardcoded
  right: 16,
  zIndex: 8500,                                               // hardcoded z-index
  border: "1px solid rgba(239,68,68,0.40)",                  // hardcoded color
  background: "rgba(15,13,26,0.94)",                         // hardcoded color
  backdropFilter: "blur(12px)",
  boxShadow: "0 4px 20px rgba(239,68,68,0.28), 0 0 0 1px rgba(239,68,68,0.18)",  // hardcoded
  color: "#fff",                                             // hardcoded color
  fontSize: 13,                                              // hardcoded typography
  fontWeight: 700,                                           // hardcoded typography
  letterSpacing: 0.3,                                        // hardcoded typography
}}

// Lines 48–57 — inner pulse dot:
style={{
  background: "#ef4444",                                     // hardcoded color
  boxShadow: "0 0 6px rgba(239,68,68,0.80)",                 // hardcoded color
}}

// Lines 79–84 — embedded <style> tag:
<style>{`
  @keyframes leads-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
`}</style>
```

**Why This Violates The Contract:**
§9 states: "Styling must originate from approved styling layers. Visual values must not be invented inside random feature files." It explicitly forbids: `style={{ color: '#6C4DF6' }}` and raw hex values. Shared UI components must never hardcode colors, spacing systems, typography scales, or z-index systems.

Specific violations per the contract:
- `#ef4444`, `rgba(239,68,68,...)`, `rgba(15,13,26,...)`, `#fff` — hardcoded color values (forbidden)
- `fontSize: 13`, `fontWeight: 700`, `letterSpacing: 0.3` — hardcoded typography scale (forbidden)
- `zIndex: 8500` — hardcoded z-index (forbidden)
- `right: 16`, `"80px"` fallback — hardcoded spacing (forbidden)
- `<style>` tag injection of `@keyframes` — CSS injected from a component file instead of a feature CSS file

**Required Change:**
Extract all design values to CSS custom properties in a feature CSS file (e.g., `dashboard/vport/styles/vport-leads-chip.css`), then reference them via `var(--vc-*)` tokens. The `@keyframes` animation must move to the feature CSS file. The component must reference only `className` or `var()` tokens.

Example direction:
```css
/* vport-leads-chip.css */
.leads-chip {
  background: var(--vc-surface-dark, rgba(15,13,26,0.94));
  border-color: var(--vc-danger-border, rgba(239,68,68,0.40));
  color: var(--vc-text-primary);
  z-index: var(--vc-z-chip);
  /* ... */
}

@keyframes leads-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
```

```jsx
/* VportLeadsChip.jsx */
import './styles/vport-leads-chip.css'
<button className="leads-chip" ...>
```

---

## Medium Violations

---

### VIOLATION

**Rule:** File Naming Convention Rule (§4.5) + Controller Layer Contract (§2)
**Rule Source:** `ZZnotforproduction/CONTRACTS/Architecture/INDEX.md` (§4.5), `03-layer-contracts.md` (§2)
**Severity:** MEDIUM

**File:** `apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js`
**Lines:** 8, 25

**Issue:**
The file is named `bootstrap.hydrate.controller.js` (`.controller.js` suffix), but it imports React hooks and uses the React effect lifecycle:

```js
// Line 8 — React hook imports in a file named .controller.js
import { useEffect, useRef } from 'react'

// Line 25 — exported function is a React hook
export function useBootstrapHydration(actorId) {
  // ...
  useEffect(() => { ... }, [actorId, store])
}
```

**Why This Violates The Contract:**
The architecture contract defines the controller layer as follows: "Controllers may not... import React or UI; hold component or UI state." The file is named `.controller.js` but is implemented as a React hook — it uses `useEffect`, `useRef`, and exports a function with the `use` prefix naming convention.

The `.controller.js` naming encodes layer role per §4.5. Using it for a hook creates a naming lie — this file answers "When should this use-case run, and how should the UI respond?" (the hook layer question), not "Is this action allowed, and what is the correct domain result?" (the controller layer question).

**Required Change:**
Rename to `bootstrap.hydrate.hook.js` (or `useBootstrapHydration.js` following the `use*.js` hook convention) to accurately reflect the layer role.

The underlying `store.getState().setHydrated(actorId)` call is business logic in the hook — this is a layer concern to monitor but does not independently constitute a violation if the hook's orchestration role is acknowledged.

Rename: `bootstrap.hydrate.controller.js` → `useBootstrapHydration.js`

---

## Warnings

---

### WARNING

**Rule:** Single Responsibility File Rule (§4.2)
**File:** `apps/VCSM/src/shared/components/BottomNavBar.jsx`

**Observation:**
`BottomNavBar.jsx` is responsible for: navigation tab rendering, bootstrap hydration host (`useBootstrapHydration`), OneSignal push initialization host (`useOneSignalPush`), badge count polling activation, and canonical slug resolution. This is a 5-role component in a single file, approaching the single-responsibility limit.

**Why it may become a problem:**
As the platform adds more session-level concerns (e.g., realtime presence, feature flags refresh), they will land here. The component will grow and its responsibilities will blur. ARCHITECT flagged this as FINDING-BOTNAV-001 (dual responsibility — nav UI + platform bootstrap host).

**Suggested Improvement:**
Extract bootstrap hosting into a dedicated `<PlatformBootstrapShell>` component rendered above BottomNavBar in RootLayout. BottomNavBar then owns only navigation UI. This is a P3 refactor — not an immediate violation, but worth planning before the component grows past 200 lines.

---

### WARNING

**Rule:** UI Purity Rule (§8)
**File:** `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx`
**Line:** 11

**Observation:**
```js
const isVport = identity?.kind === 'vport'
```
The component evaluates `identity.kind` to determine whether to render. This is a domain kind-check inside a UI component. It is not permission enforcement (it doesn't block mutations), but it is the component making a domain-aware rendering decision without going through a hook.

**Why it may become a problem:**
If the VPORT kind-check logic ever changes (e.g., distinguishing between VPORT sub-types), the component would need to be updated. Domain logic in components is hard to test in isolation.

**Suggested Improvement:**
The kind-check could be moved to `useVportNewLeadsCount` or a dedicated `useIsVportActor()` hook, and the component accepts an `isVport: bool` prop instead. Not a hard violation given the simplicity of the check, but noted as a smell.

---

## Compliant Files

The following reviewed files comply with all applicable architecture contracts:

| File | Check | Status |
|---|---|---|
| `useOneSignalPush.js` | Import paths, naming, layer responsibility, adapter boundary | COMPLIANT |
| `onesignalClient.js` | Import paths, naming, file size, no domain logic | COMPLIANT |
| `initOneSignal.js` | Import paths, naming, file size, single responsibility | COMPLIANT |
| `profiles.adapter.js` | Adapter contract — correctly excludes `getCachedActorCanonicalSlug` (a controller function — not adapter-exportable per §5.3) | COMPLIANT |

**Note on profiles.adapter.js:** The adapter correctly does NOT export `getCachedActorCanonicalSlug`. Per §5.3, adapters must never export controllers. Any patch to BottomNavBar's profile slug access must use the `useActorCanonicalSlug` hook (already exported) — not expose the raw controller through the adapter.

---

## Contract-Level Note: ELEKTRA Patch ELEK-002 Advisory Alignment

ELEKTRA-2026-06-06-002 proposed adding `useActorCanonicalSlug` from the profiles adapter to replace the raw actorId in VportLeadsChip's navigation URL. That patch path is **architecturally correct** — `useActorCanonicalSlug` is a hook and is already exported through `profiles.adapter.js`. CONTRACT REVIEWER confirms this is the right adapter surface to use.

The alternative path of exporting `getCachedActorCanonicalSlug` from the adapter would be a §5.3 violation — adapters must never export controllers. Do not pursue that path.

---

## Summary Table

| # | File | Rule | Severity | Line | Status |
|---|---|---|---|---|---|
| 1 | `BottomNavBar.jsx` | §5.2 / §5.4 Cross-Feature + Adapter Import | CRITICAL | 9 | RESOLVED — TICKET-C4-BOTTOMBAR-PROFILE-ADAPTER-001 (2026-06-06) |
| 2 | `RootLayout.jsx` | §5.2 / §5.4 Cross-Feature + Adapter Import | CRITICAL | 10 | RESOLVED — Batch 1 C-1 (2026-06-06) |
| 3 | `VportLeadsChip.jsx` | §5.2 / §5.4 Cross-Feature + Adapter Import | CRITICAL | 3 | RESOLVED — Batch 1 C-2 (2026-06-06) |
| 4 | `useVportNewLeadsCount.js` | §5.2 / §5.4 Cross-Feature + Adapter Import | CRITICAL | 2 | RESOLVED — Batch 1 C-3 (2026-06-06) |
| 5 | `VportLeadsChip.jsx` | §9 Styling Ownership Rule | HIGH | 22–85 | RESOLVED — TICKET-H1-BOTTOMBAR-LEADS-CHIP-STYLES-001 (2026-06-06) |
| 6 | `bootstrap.hydrate.controller.js` | §4.5 Naming + §2 Controller Contract | MEDIUM | 8, 25 | OPEN — L-1, deferred |

---

## Overall Status

**RESOLVED (5/6)**

4 CRITICAL violations — all resolved (2026-06-06)
1 HIGH violation — resolved (2026-06-06)
1 MEDIUM violation — OPEN (L-1, bootstrap.hydrate.controller.js rename, deferred)

No violations requiring database changes, RLS updates, or logic rewrites.
