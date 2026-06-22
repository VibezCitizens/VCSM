---
name: vcsm.ui.architecture
description: ARCHITECT V2 module architecture report for VCSM:ui
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** ui
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/ui
**Independence Status:** INDEPENDENT
**Completeness Status:** FRAGMENTED

---

## PURPOSE

The `ui` module provides a small set of shared, theme-aligned primitive layout and control components for use within the VCSM application. It exposes `ModernPrimitives` (page wrapper, container, shell, top bar, and button) as well as a corresponding CSS module that binds those patterns to the platform's `--vc-*` custom property tokens. The module is a presentational-only layer — it has no data access, no controllers, no state, and no domain logic.

## OWNERSHIP

Platform / Design System. This module sits below any individual feature — it is meant to supply cross-cutting visual primitives that maintain visual consistency with the VCSM dark theme. No single feature team owns it; it is infrastructure-level shared UI.

## ENTRY POINTS

This module has no route-level entry points. It is consumed by importing directly from its components:

- `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx` — named exports: `ModernPage`, `ModernContainer`, `ModernShell`, `ModernTopBar`, `ModernButton`
- `apps/VCSM/src/features/ui/modern/module-modern.css` — CSS utility classes: `.module-modern-page`, `.module-modern-shell`, `.module-modern-search-shell`, `.module-modern-card`, `.module-modern-input`, `.module-modern-btn`

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 0 | N/A |
| Adapter | 0 | N/A |
| Hook | 0 | N/A |
| Component | 5 | ModernPrimitives.jsx (ModernPage, ModernContainer, ModernShell, ModernTopBar, ModernButton) |
| Screen | 0 | N/A |
| Barrel | 0 | No index barrel detected |

Note: scanner `fm_layerCounts` reports 1 component (single file); callgraph `cg_layerCounts` reports 5 components (5 named exports resolved individually). CSS module counted as 1 source file alongside the JSX file for a total of 2 physical files — scanner reported sourceFileCount: 1 (likely counting only .jsx).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source readable; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md has no real content |
| Owner defined | FAIL | No ownership record exists | Module is infrastructure-level but unclaimed |
| Entry points mapped | PASS | Two physical files; named export API is clear | No barrel/index.js — no canonical import path |
| Controllers present/delegated | N/A | 0 controllers — module is pure UI | None needed |
| DAL/repository present/delegated | N/A | 0 DAL — no data access | None needed |
| Models/transformers present | N/A | 0 models — props-only interface | None needed |
| Hooks/view models present | N/A | 0 hooks — stateless primitives | None needed |
| Screens/components present | PARTIAL | 5 component exports present; no screen | No barrel, no adapter boundary |
| Services/adapters present | FAIL | No adapter file | Consumers must import internal path directly — violates adapter boundary rule |
| Database objects mapped | N/A | No write surfaces | None needed |
| Authorization path mapped | N/A | Pure presentational layer | None needed |
| Cache/runtime behavior mapped | N/A | No state or cache | None needed |
| Error/loading/empty states mapped | N/A | Primitives are layout wrappers | Not applicable for layout primitives |
| Documentation linked | FAIL | BEHAVIOR.md is a PLACEHOLDER with no real content | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests | No snapshot or render tests for primitives |
| Native parity noted | N/A | Web-only primitives | No native counterpart expected |
| Engine dependencies mapped | N/A | No engine imports detected | None needed |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| React | external library | inbound | YES — platform standard | Single import in ModernPrimitives.jsx |
| --vc-* CSS tokens | platform theme | inbound | YES — correct pattern | module-modern.css consumes citizens-theme.css custom properties |
| No feature cross-deps | — | — | — | No imports from other features detected |
| No engines used | — | — | — | Confirmed by scanner engines: [] |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| No write surfaces | — | — | — | None — pure read/render |

No write surfaces detected by scanner. This module produces no DB operations.

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes — library module | None |
| Loading state | N/A | No async in primitives | None |
| Empty state | N/A | Layout wrappers, not data-driven | None |
| Error state | N/A | No data fetching | None |
| Auth/owner gates | N/A | No access control in primitives | None |
| Cache behavior | N/A | No state | None |
| Runtime dependencies | WATCH | ModernPrimitives.jsx hardcodes inline gradient values instead of using --vc-* tokens | Inline styles in JSX diverge from module-modern.css which correctly uses CSS vars — inconsistency risk |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/ui/BEHAVIOR.md | PLACEHOLDER — no real content |
| Ownership record | — | MISSING |
| Security audit | — | N/A (no auth/data surfaces) |
| Runtime audit | — | MISSING |
| Performance audit | — | N/A |
| Migration audit | — | N/A |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | No engine dependencies |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No contract for what these primitives are, when to use them, and what variants exist | LOGAN |
| No adapter/barrel (index.js) | MEDIUM | Consumers must import from internal paths (`/modern/ModernPrimitives.jsx`), violating the adapter boundary rule from CLAUDE.md | ARCHITECT / IRONMAN |
| Inline style vs CSS token inconsistency | MEDIUM | ModernPrimitives.jsx hardcodes gradient and color values inline; module-modern.css correctly uses `--vc-*` tokens — these are out of sync | IRONMAN |
| No render tests | LOW | Visual regressions in layout primitives go undetected | SPIDER-MAN |
| Ownership unclaimed | LOW | No team or domain owns this module; governance gap for any changes | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

1. **No adapter file present.** The VCSM CLAUDE.md states all cross-feature access must go through a feature adapter. The `ui` module has no `ui.adapter.js` — any consumer importing `ModernPrimitives.jsx` directly reaches into the feature internals, violating the boundary rule.

2. **Hardcoded inline styles in ModernPrimitives.jsx.** The JSX file uses inline `style={{}}` objects with hardcoded hex values and rgba gradients (`#05060b`, `rgba(0,255,240,0.07)`, etc.) rather than the `--vc-*` custom properties defined in `citizens-theme.css`. The companion `module-modern.css` correctly uses CSS vars. This dual-approach creates a maintenance inconsistency — theme changes to the CSS vars will not propagate to the inline JSX styles.

---

## SPAGHETTI SCORE

**Module:** ui
**Score:** CLEAN
**Reasons:** Two physical files, zero cross-feature imports, zero data layer, zero state. The only issues are governance gaps (missing adapter, inline style inconsistency) rather than structural complexity.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — field reads "Status: PLACEHOLDER" with no real content

**Check A (Source without behavior):** FAIL — source exists (2 files) but BEHAVIOR.md is a stub with no documented behaviors, happy paths, or error states.

**Check B (Behavior without source):** N/A — BEHAVIOR.md has no §3 happy paths to compare against source.

**Check C (§13 engine consistency):** PASS — scanner declares engines: [] and source confirms zero engine imports.

**Check D (§6 data change consistency):** PASS — scanner declares writeSurfaces: [] and source confirms zero DB operations.

---

## FINAL MODULE STATUS

FRAGMENTED

The module's source layer is minimal and structurally clean (2 files, 5 exported primitives), but it is functionally incomplete as a governed module: the BEHAVIOR.md is a placeholder, no adapter boundary exists, inline styles diverge from the CSS token system, and ownership is undefined.

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md — document what primitives exist, usage rules, variant API | Without it LOGAN has no contract to enforce and consumers have no reference | LOGAN |
| P2 | Add `index.js` barrel and `ui.adapter.js` to expose named exports through a proper boundary | Enforces adapter rule from CLAUDE.md; prevents direct internal imports | IRONMAN |
| P3 | Reconcile inline styles in ModernPrimitives.jsx to use `--vc-*` tokens | Aligns JSX with module-modern.css; makes theme changes propagate correctly | IRONMAN |
| P4 | Add render snapshot tests for all 5 exported components | Catches visual regressions in platform primitives | SPIDER-MAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md is a placeholder; full contract authoring needed
- **IRONMAN** — Ownership assignment, adapter boundary, inline style token reconciliation
- **SPIDER-MAN** — Render test coverage for exported primitives

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
