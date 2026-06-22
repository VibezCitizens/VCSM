---
name: vcsm.styles.architecture
description: ARCHITECT V2 module architecture report for VCSM:styles
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** styles
**Application Scope:** VCSM
**Module Type:** styles
**Primary Root:** apps/VCSM/src/styles
**Independence Status:** INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `styles` module is the global CSS foundation for the VCSM application. It owns two files: `citizens-theme.css` — the single source of truth for all design tokens (colors, surfaces, accents, shadows, gradients) expressed as `--vc-*` CSS custom properties — and `global.css` — the application-wide reset, root layout, typography rules, safe-area utilities, scrollbar suppression, and keyframe animation library. All feature-level UI across the platform references these design tokens via `var(--vc-*)` with no inline color or shadow definitions permitted.

## OWNERSHIP

Platform foundation. Owned by the VCSM core UI team. No feature team owns this module — it is a platform primitive consumed by every feature. Changes here are global in blast radius and require a THOR gate review before shipping.

## ENTRY POINTS

This module has no runtime entry points (no routes, screens, or hooks). It is loaded unconditionally at application boot via two static imports in `apps/VCSM/src/main.jsx`:

- `import '@/styles/global.css'` — loaded first (reset/layout)
- `import '@/styles/citizens-theme.css'` — loaded second (design tokens)

The `App.jsx` root applies `className="citizens-theme"` to activate the token scope across the component tree.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A — CSS module, no data access |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 0 | N/A |
| Adapter | 0 | N/A |
| Hook | 0 | N/A |
| Component | 0 | N/A |
| Screen | 0 | N/A |
| Barrel | 0 | N/A |
| CSS Source | 2 | citizens-theme.css, global.css |

Note: The scanner reports `sourceFileCount: 0` and all `cg_layerCounts` as empty because the scanner only counts JS/JSX source files. The actual source consists of 2 CSS files discovered by filesystem scan. This is expected for a `styles` module kind.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | citizens-theme.css header comment is explicit | — |
| Owner defined | PARTIAL | No explicit owner file; purpose is clear from CLAUDE.md | Ownership record missing from docs |
| Entry points mapped | PASS | main.jsx imports both files in correct order | — |
| Controllers present/delegated | N/A | CSS module — no controllers | — |
| DAL/repository present/delegated | N/A | CSS module — no data layer | — |
| Models/transformers present | N/A | CSS module — no models | — |
| Hooks/view models present | N/A | CSS module — no hooks | — |
| Screens/components present | N/A | CSS module — no screens | — |
| Services/adapters present | N/A | CSS module — no adapters | — |
| Database objects mapped | N/A | No write surfaces | — |
| Authorization path mapped | N/A | No auth surfaces | — |
| Cache/runtime behavior mapped | PASS | CSS is statically loaded at boot; no runtime caching needed | — |
| Error/loading/empty states mapped | N/A | CSS module — not applicable | — |
| Documentation linked | PARTIAL | BEHAVIOR.md present but is a placeholder (Status: PLACEHOLDER) | BEHAVIOR.md needs real content |
| Tests/validation noted | N/A | 0 tests; CSS modules do not require unit tests | Visual regression tooling absent |
| Native parity noted | N/A | CSS is web-native; no native transfer concern | — |
| Engine dependencies mapped | N/A | No engine dependencies | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| apps/VCSM/src/main.jsx | Consumer | INBOUND | YES — correct entry point | Imports both CSS files at app boot |
| apps/VCSM/src/App.jsx | Consumer | INBOUND | YES | Applies `citizens-theme` className to root div |
| All feature CSS / Tailwind | Consumer | INBOUND | YES | Reference `--vc-*` tokens via var() |
| auth/styles/authTheme.js | Consumer | INBOUND | REVIEW | Imports from src/styles — verify it only reads tokens, does not override them |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `--vc-*` CSS custom properties | Read (var()) | styles module | All VCSM features | HIGH — any rename breaks all consumers silently |
| `--cit-*` legacy aliases | Read (var()) | styles module | Legacy feature files | MEDIUM — legacy compat layer; track usage before removing |
| `.vc-dynamic-gradient` | Class | styles module | Feature screens | LOW — utility class, explicit usage only |
| `.animate-slideUp`, `.animate-fogSlow`, `.animate-fogFast`, `.animate-fade-in` | Class | styles module | Feature animations | LOW |
| `.safe-top`, `.touch-pan-y` | Class | styles module | iOS-aware components | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | CSS loaded at boot via main.jsx import | — |
| Loading state | N/A | Synchronous CSS import — no async loading | — |
| Empty state | N/A | Not applicable | — |
| Error state | LOW RISK | If CSS fails to load, entire app loses all theming | No fallback defined |
| Auth/owner gates | N/A | No auth surfaces | — |
| Cache behavior | PASS | Static asset; Vite/CDN handles cache headers | — |
| Runtime dependencies | PASS | Zero JS runtime dependencies; pure CSS | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/styles/BEHAVIOR.md | PRESENT — PLACEHOLDER only |
| Ownership record | — | MISSING |
| Security audit | — | N/A (no data surfaces) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING (CSS bundle size not tracked) |
| Migration audit | — | MISSING (--cit-* legacy alias cleanup not tracked) |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | No engine dependencies |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | MEDIUM | No documented contract for token naming conventions, theming rules, or change governance | LOGAN |
| Legacy `--cit-*` alias usage not tracked | MEDIUM | The `--cit-*` compat layer in citizens-theme.css cannot be safely removed without knowing all consumers; no audit exists | IRONMAN |
| Visual regression coverage absent | LOW | CSS changes are globally breaking with no automated detection | SENTRY |
| CSS bundle size not monitored | LOW | As tokens grow, no tracking exists for style payload impact | KRAVEN |
| ARCHITECTURE.md was missing | RESOLVED | Now present (this run) | — |
| CURRENT_STATUS.md was missing | RESOLVED | Now present (this run) | — |

---

## MODULE BOUNDARY WARNINGS

The file `apps/VCSM/src/features/auth/styles/authTheme.js` imports from `src/styles`. This is inbound (correct direction — a feature consuming platform styles), but it is a JS file referencing CSS-adjacent style logic. This should be verified to confirm it only reads `--vc-*` token values and does not duplicate or override tokens defined in `citizens-theme.css`. No cross-feature CSS overrides were found in the static scan.

No other boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** styles
**Score:** CLEAN
**Reasons:** Two flat CSS files with no cross-dependencies, clear hierarchy (tokens then globals), consistent naming convention (`--vc-*`), explicit legacy alias layer. Single import point at main.jsx.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no real contract content

**Check A (Source without behavior):** PARTIAL — source files exist (2 CSS files) but BEHAVIOR.md is a placeholder, not a real contract
**Check B (Behavior without source):** PASS — no behavior claims made that contradict source (placeholder makes no claims)
**Check C (§13 engine consistency):** N/A — no engines declared; none used in source
**Check D (§6 data change consistency):** N/A — no write surfaces declared; none exist in source

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

The source implementation is stable and functionally complete. The gap is documentation: BEHAVIOR.md is a placeholder and governance records are absent. The `--cit-*` legacy alias layer needs an audit to determine when it can be safely removed.

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P2 | Replace BEHAVIOR.md placeholder with real token naming contract and change governance rules | Platform-wide blast radius; changes to this module break all features silently | LOGAN |
| P2 | Audit all `--cit-*` alias usage across codebase and produce removal plan | Tech debt — dual naming convention creates confusion and bloat | IRONMAN |
| P3 | Add CSS bundle size monitoring | Style payload grows silently without tracking | KRAVEN |
| P3 | Add visual regression test harness | No automated safety net for global CSS changes | SENTRY |

## RECOMMENDED HANDOFFS

- **LOGAN** — Rebuild BEHAVIOR.md with real token naming contract, theming governance rules, and change-approval process
- **IRONMAN** — Audit and enumerate all `--cit-*` legacy alias consumers; produce a sunset plan
- **KRAVEN** — Measure CSS bundle size contribution; set a size budget alert

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

**Scanner note:** sourceFileCount=0 is expected for this module kind. The scanner counts JS/JSX files only. Filesystem scan confirms 2 CSS source files: `global.css` and `citizens-theme.css`.
