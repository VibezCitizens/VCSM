# ARCHITECT DEPENDENCY MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Cross-App Isolation Status

**RESULT: CLEAN**

Scanner detected 0 cross-app imports between VCSM, wentrex, and Traffic.
Boundary isolation contract is satisfied at the static import level.

| Boundary | Violations | Status |
|---|---|---|
| VCSM → wentrex | 0 | CLEAN |
| VCSM → Traffic | 0 | CLEAN |
| wentrex → VCSM | 0 | CLEAN |
| wentrex → Traffic | 0 | CLEAN |
| Traffic → VCSM | 0 | CLEAN |
| Traffic → wentrex | 0 | CLEAN |

---

## Engine Consumer Map — VCSM

| VCSM Feature | Engine Consumed | Dependency Direction | Status |
|---|---|---|---|
| VCSM:block | engine:hydration | VCSM → engine | VALID |
| VCSM:booking | engine:booking | VCSM → engine | VALID |
| VCSM:booking | engine:hydration | VCSM → engine | VALID |
| VCSM:chat | engine:hydration | VCSM → engine | VALID |
| VCSM:chat | engine:reviews | VCSM → engine | VALID |
| VCSM:dev | engine:notifications | VCSM → engine | DEV_ONLY |
| VCSM:dev | engine:reviews | VCSM → engine | DEV_ONLY |
| VCSM:explore | engine:hydration | VCSM → engine | VALID |
| VCSM:feed | engine:hydration | VCSM → engine | VALID |
| VCSM:hydration | engine:hydration | VCSM → engine | VALID |
| VCSM:i18n | engine:i18n | VCSM → engine | VALID |
| VCSM:identity | engine:hydration | VCSM → engine | VALID |
| VCSM:notifications | engine:booking | VCSM → engine | VALID |
| VCSM:notifications | engine:hydration | VCSM → engine | VALID |
| VCSM:notifications | engine:notifications | VCSM → engine | VALID |

Total VCSM→engine dependencies: 26 (all valid forward direction)

---

## Circular Dependency Detection

**RESULT: NO CIRCULAR DEPENDENCIES DETECTED**

Dependency map traversal found no cycles in the 390-edge dependency graph.

---

## Cross-Feature DAL Import Violations

**RESULT: NONE DETECTED**

No feature-to-feature direct DAL imports detected via static analysis.
Cross-feature data access appears to flow through engine boundaries.

---

## Dependency Direction Compliance

| Rule | Status | Notes |
|---|---|---|
| DAL → MODEL → CONTROLLER → HOOK → COMPONENT | REQUIRES_VERIFICATION | Scanner traces exist but ownership checks unresolved |
| Engine never imports from app | REQUIRES_VERIFICATION | Static traces did not detect violations but engine reverse-import requires source verification |
| Features never import from other features' DAL | CLEAN | 0 detected |
| Apps never import from other apps | CLEAN | 0 detected |

---

## Known Dependency Risks

| Risk | Location | Severity | Action |
|---|---|---|---|
| VCSM:dev depends on engines | VCSM:dev | MEDIUM | Ensure dev feature excluded from production bundle |
| Engine candidate names unresolved | engine-candidates | LOW | 17 engine candidates have name=? — scanner metadata gap |
