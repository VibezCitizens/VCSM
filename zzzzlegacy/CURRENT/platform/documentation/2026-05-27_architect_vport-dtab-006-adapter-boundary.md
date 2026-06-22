# ARCHITECT Report — DTAB-006: Tab Container Adapter Boundary Violation
**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Application Scope:** VCSM
**Trigger:** DTAB-006 — VportProfileTabContent.jsx has no adapter boundary for tab view imports

---

## Summary

`VportProfileTabContent.jsx` imports all tab view components via direct `@/features/...` paths with no consistent adapter boundary layer. While this is within the same protected root (`apps/VCSM/`) and therefore not a cross-root violation, it crosses sub-feature boundaries and creates a fragile coupling pattern that makes refactoring difficult and is inconsistent with the adapter discipline applied elsewhere in the codebase.

---

## File Inspected

`apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx`

### Direct Import Pattern (lines 9–30)

```js
// Direct — crosses booking sub-feature boundary
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";
// Direct — crosses barbershop sub-feature boundary (no wrapper)
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";
// Direct — gas sub-feature
import VportGasPricesView from "@/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView";
// ... 12+ more direct imports
```

---

## Boundary Type Classification

| Boundary Type | Violated? | Notes |
|---|---|---|
| Cross-root (apps/VCSM → apps/wentrex etc.) | NO | All files within apps/VCSM |
| Cross-protected-root (engines → app) | NO | No engine imports involved |
| Cross-feature (profiles → booking feature) | NO | All within profiles feature |
| Sub-feature boundary (components → booking/) | YES | Tab container imports from booking sub-directory directly |
| Sub-feature boundary (components → barbershop/) | YES | Direct import bypasses any wrapper layer |
| Sub-feature boundary (components → gas/) | YES | Direct import |

---

## Inconsistency Found

There IS a thin wrapper at `screens/views/tabs/VportBookingView.jsx`:

```js
// screens/views/tabs/VportBookingView.jsx
import VportBookingViewScreen from "@/features/profiles/kinds/vport/screens/booking/view/VportBookingView";
export default function VportBookingView({ profile, isOwner = false }) {
  return <VportBookingViewScreen profile={profile} isOwner={isOwner} />;
}
```

This acts as an informal tab-view adapter for the booking flow. However:
- `VportBarberShopBookingView` has NO such wrapper — imported directly from the barbershop sub-directory
- The `screens/views/tabs/` pattern exists for booking only, not applied consistently to gas, gas-prices, menu, content, vibes, subscribers, portfolio, about, services, reviews

**The `views/tabs/` directory is the right pattern — it's just not applied consistently.**

---

## Drift Classification

**Drift Level:** MODERATE DRIFT
**Severity:** MEDIUM
**Contract:** Architecture layer order (DAL → Model → Controller → Hook → Components → View Screen → Final Screen)
- This is an intra-feature boundary issue, not a layer order violation
- The appropriate fix is consistent use of the `views/tabs/` wrapper pattern

---

## Risk Assessment

| Risk | Likelihood | Impact |
|---|---|---|
| Refactoring booking sub-feature paths breaks tab container | HIGH | Medium — requires updating tab container |
| Developer confusion about which import path to use | MEDIUM | Low — clear pattern exists in views/tabs/ |
| Cross-feature coupling creeping in via this pattern | LOW | The direct paths are all within profiles feature |

---

## Recommendations

### Option A — Extend views/tabs/ wrappers (preferred)

Create thin wrapper files in `screens/views/tabs/` for each tab that currently imports directly:
- `VportGasPricesView` → `screens/views/tabs/VportGasTabView.jsx` (passthrough wrapper)
- `VportBarberShopBookingView` → `screens/views/tabs/VportBarberShopBookingTabView.jsx`
- etc.

Then `VportProfileTabContent.jsx` imports ONLY from `screens/views/tabs/` — a single controlled surface.

**Benefit:** Refactoring any sub-feature only requires updating one wrapper file, not the tab container.

### Option B — Barrel index (simpler)

Create `screens/views/tabs/index.js` that re-exports all tab view components. `VportProfileTabContent.jsx` imports from this index.

**Benefit:** Single import surface with minimal new files.

---

## ARCHITECT Status

**FINDING — MODERATE DRIFT**
**Release Gate:** NOT BLOCKING — intra-feature pattern issue, not a security or data risk
**Priority:** P2 — address before significant booking/menu tab refactoring work begins
**Handoff:** DTAB-006 updated in governance matrix; recommend Option A or B before next tab architecture change
