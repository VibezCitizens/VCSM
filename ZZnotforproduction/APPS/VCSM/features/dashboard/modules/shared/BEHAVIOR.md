# Dashboard Module Behavior Contract — shared

Status: APPROVED

Module: shared

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-shared-WRITE-0002

Last Updated: 2026-06-04

Current Security Status:
- THOR: CLEAR
- Open Findings:
  - None
- Security Review Status:
  - VENOM: NOT_APPLICABLE
  - ELEKTRA: NOT_APPLICABLE
  - BLACKWIDOW: NOT_APPLICABLE

---

## 1. User Goal

Provide dashboard screens with a consistent, accessible back-navigation control that can be reused by dashboard cards and module screens without duplicating presentational button markup.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| Dashboard user | Use a rendered back button when a parent dashboard screen exposes it. | Shared component does not authorize access, verify ownership, or decide whether the actor may enter the parent screen. |
| Parent dashboard screen | Render `VportBackButton`, choose desktop/mobile display, and provide the `onClick` callback. | Parent screen owns navigation behavior and must enforce any route, auth, or ownership requirements outside this component. |

---

## 3. Module Architecture

### Routes

No route owned by this module.

### Screens

No screen owned by this module.

Known dashboard consumers import the shared back button into module screens including flyer builder, VPORT dashboard, reviews, calendar, settings, services, exchange, portfolio, leads, bookings, team, locksmith, and gas prices.

### Hooks

None.

### Controllers

None.

### DALs

None.

### RPCs

None.

### Edge Functions

None.

### Engine Dependencies

None.

### Ownership Gates

None inside the shared component. Ownership remains the responsibility of the parent screen, controller, or route gate that renders this component.

Source path:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/shared/components/BackButton.jsx`

---

## 4. Happy Paths

### HP-001

BEH-DASH-shared-001

Preconditions:
- A dashboard screen imports `VportBackButton`.
- The caller passes an `onClick` callback.
- The caller passes `isDesktop=false` or omits it.

Flow:
- Dashboard screen renders `VportBackButton`.
- Component renders a button with `aria-label="Back"`.
- Component renders the `ChevronLeft` icon.
- User activates the button.
- Component invokes the caller-provided `onClick` callback.

Expected Result:
- The parent dashboard screen performs its own back-navigation behavior.

Data Changes:
- None.

### HP-002

BEH-DASH-shared-002

Preconditions:
- A dashboard screen imports `VportBackButton`.
- The caller passes `isDesktop=true`.

Flow:
- Dashboard screen renders `VportBackButton`.
- Component renders the `ChevronLeft` icon.
- Component renders the visible text label `Back`.

Expected Result:
- Desktop users receive icon and text affordance for the back action.

Data Changes:
- None.

---

## 5. Failure Paths

### FP-001

BEH-DASH-shared-101

Trigger:
- Caller renders `VportBackButton` without an `onClick` callback.

Expected System Behavior:
- React renders the button without throwing.
- Activating the button has no module-owned navigation side effect.

Expected UI Behavior:
- The button remains visible and accessible as a button labeled `Back`.

Expected Logging:
- None observed in source.

### FP-002

BEH-DASH-shared-102

Trigger:
- Parent dashboard screen supplies an unsafe, incorrect, or unauthorized navigation callback.

Expected System Behavior:
- Shared component does not inspect or validate the callback.
- Parent screen remains responsible for route, auth, and ownership safety.

Expected UI Behavior:
- Shared component still renders the same button.

Expected Logging:
- None observed in source.

---

## 6. Security Rules

### SEC-001

BEH-DASH-shared-201

Rule:
- `VportBackButton` must remain presentational and must not perform auth, ownership checks, route-param interpretation, data fetching, or data mutation.

Enforcement Layer:
- Architecture governance and module review.

Current Status:
- CLEAR.

Finding Links:
- SHARED-SCOPE-001

### SEC-002

BEH-DASH-shared-202

Rule:
- Any future shared dashboard utility that adds a hook, controller, DAL, write path, ownership gate, engine dependency, adapter workflow, security finding, data mutation, or user workflow must be promoted from Tier 4 shared component coverage into a first-class governed dashboard module.

Enforcement Layer:
- Dashboard Module Rule.

Current Status:
- WATCH.

Finding Links:
- SHARED-SCOPE-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-shared-301

Invariant:
- A shared dashboard component must never bypass parent-screen authorization by performing its own direct navigation into protected owner workflows.

Current Status:
- CLEAR for current `BackButton.jsx` source.

Related Findings:
- SHARED-SCOPE-001

Required Tests:
- TESTREQ-DASH-shared-003

### MNH-002

BEH-DASH-shared-302

Invariant:
- A Tier 4 shared component must never add Supabase, RPC, controller, DAL, edge function, or engine access without updated ARCHITECTURE, SECURITY, triad, THOR, and BEHAVIOR coverage.

Current Status:
- CLEAR for current source.

Related Findings:
- SHARED-SCOPE-001

Required Tests:
- TESTREQ-DASH-shared-003

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `BackButton.jsx` | No | No | No | No |

---

## 9. Side Effects

Notifications:
- None.

Analytics:
- None observed in source.

Media:
- None.

Exports:
- None.

Jobs:
- None.

Cache:
- None.

Other:
- Invokes the caller-provided `onClick` callback when the button is activated. The callback side effects are owned by the parent screen, not this shared module.

---

## 10. UI Outputs

Loading States:
- None.

Success States:
- None.

Error States:
- None.

Empty States:
- None.

Owner States:
- None inside this module.

Public States:
- None inside this module.

Rendered Output:
- Button element with `aria-label="Back"`.
- `ChevronLeft` icon.
- Optional visible `Back` text when `isDesktop=true`.

---

## 11. Acceptance Criteria

### AC-DASH-shared-001

Requirement:
- `VportBackButton` renders as a button with accessible back labeling and a left-chevron icon.

Evidence:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/shared/components/BackButton.jsx`

Status:
- APPROVED.

### AC-DASH-shared-002

Requirement:
- Desktop mode renders visible `Back` text; non-desktop mode renders icon-only output while preserving `aria-label="Back"`.

Evidence:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/shared/components/BackButton.jsx`

Status:
- APPROVED.

### AC-DASH-shared-003

Requirement:
- Shared component remains free of hooks, controllers, DALs, RPCs, edge functions, direct database access, and ownership logic.

Evidence:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/shared/components/BackButton.jsx`
- `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/SECURITY.md`
- `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/ARCHITECTURE.md`

Status:
- APPROVED.

---

## 12. Test Requirements

### TESTREQ-DASH-shared-001

Validates:
- Back button renders accessible `aria-label="Back"`, `ChevronLeft`, and desktop text behavior.

Type:
- Component test.

Status:
- COMPLETE.

### TESTREQ-DASH-shared-002

Validates:
- Clicking the button invokes the caller-provided `onClick` callback exactly once per click.

Type:
- Component interaction test.

Status:
- COMPLETE.

### TESTREQ-DASH-shared-003

Validates:
- Dashboard-local shared components do not import hooks, controllers, DALs, Supabase clients, RPC helpers, edge-function clients, or engine write dependencies.

Type:
- Architecture/static guard.

Status:
- COMPLETE.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| SHARED-SPIDER-001 | LOW | CLOSED — SPIDER-MAN PASS | BEH-DASH-shared-001, BEH-DASH-shared-002 |
| SHARED-SCOPE-001 | LOW | CLOSED — STATIC GUARD PASS | BEH-DASH-shared-201, BEH-DASH-shared-202, BEH-DASH-shared-301, BEH-DASH-shared-302 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Module classification | CLEAR | No |
| Write surface review | CLEAR | No |
| Ownership/security gate review | NOT_APPLICABLE | No |
| VENOM coverage | NOT_APPLICABLE | No |
| ELEKTRA coverage | NOT_APPLICABLE | No |
| BLACKWIDOW coverage | NOT_APPLICABLE | No |
| SPIDER-MAN component tests | COMPLETE — 5 shared SPIDER-MAN tests passing | No |
| BEHAVIOR.md contract | APPROVED | No |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Back affordance | No native equivalent found in source. | NOT_APPLICABLE |
| Desktop icon plus label behavior | No native equivalent found in source. | NOT_APPLICABLE |
| Mobile icon-only behavior with accessible label | No native equivalent found in source. | NOT_APPLICABLE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None | No engine dependency in current source. | CLEAR |
| `lucide-react` | Provides `ChevronLeft` icon. | CLEAR |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-shared-001 | Should the dashboard shared module remain limited to dashboard-local shared components, excluding platform-wide `@/shared/*` utilities? | CLOSED — contract scope is dashboard-local shared components only. |
| OQ-DASH-shared-002 | Should SPIDER-MAN add a component-level smoke test for `VportBackButton` despite Tier 4 THOR CLEAR status? | CLOSED — focused component/static tests added. |
| OQ-DASH-shared-003 | Is there a native dashboard back-button equivalent that must be parity-mapped? | CLOSED — no native source found; parity is NOT_APPLICABLE for this release. |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | MEDIUM | Yes |
| Actors / Roles | MEDIUM | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | MEDIUM | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes: shared SPIDER-MAN tests now present and passing. |
| Security Findings Linked | MEDIUM | Yes |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | MEDIUM | Yes: no native equivalent found; marked NOT_APPLICABLE. |
| Engine Dependencies | HIGH | Yes |
| Open Questions | MEDIUM | Yes |

---

## 19. Command Sign-Off

ARCHITECT: COMPLETE - dashboard-local shared component source, scope, and static architecture guard verified.

VENOM: NOT_APPLICABLE - no write surface, data access, RPC, edge function, or trust-boundary transition in current shared source.

ELEKTRA: NOT_APPLICABLE - no controller, DAL, or source-to-sink path in current shared source.

BLACKWIDOW: NOT_APPLICABLE - no module-owned ownership invariant in current shared source.

SPIDER-MAN: COMPLETE - `shared.spiderman.test.js` passes 5 focused tests for accessible rendering, desktop label behavior, click callback dispatch, and presentational/static architecture guards.

PROFESSOR X: APPROVED - behavior contract source-verified and test-backed for Tier 4 release.

THOR: CLEAR - Tier 4 read-only/shared component module with no blocking security findings.

---

## 14. ARCHITECT Wave Reference (2026-06-05)

ARCHITECTURE.md created: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/shared/ARCHITECTURE.md

Key findings from ARCHITECT wave:
- Shared primitives module: layout shells, guard wrappers, navigation components
- No write surfaces — presentation layer only
- OwnerOnlyDashboardGuard lives here — confirmed source-verified in app.routes.jsx
- 22 callgraph nodes (UI primitives + guard wrappers)

Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_DASHBOARD_SHARED_APPROVED
