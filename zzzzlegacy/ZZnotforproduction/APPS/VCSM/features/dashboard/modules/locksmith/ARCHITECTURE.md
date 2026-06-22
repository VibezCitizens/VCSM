# ARCHITECTURE — Dashboard Module: locksmith

**Last ARCHITECT Run:** 2026-06-05 (V2 — full source verification)
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0
**Correction:** Previous wave-report classification was inaccurate — see ## ARCHITECT CORRECTION below

---

## MODULE ARCHITECTURE REPORT

Module: locksmith
Application Scope: VCSM
Module Type: dashboard card module (VPORT type-specific — locksmith only)
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Renders the owner dashboard screen for locksmith-type VPORTs. Manages service areas (add/edit/delete with feed publishing) and displays service details and gap services. All data access is delegated through `@/features/profiles/adapters/kinds/vport/vportProfiles.adapter` — the module has no local DAL or controllers; three hooks are consumed from the profiles adapter boundary. Feed publishing (service area updates posted to feed) is a secondary write path via the same adapter. The screen is VPORT-owner-gated with explicit isOwner check.

---

## ARCHITECT CORRECTION — Previous Run Inaccurate

**[SOURCE_VERIFIED] CORRECTION:**
The wave-report run (same ticket) classified locksmith as DEPENDENT / INCOMPLETE / "thin shell with no data access." This was wrong. Source verification of VportDashboardLocksmithScreen.jsx confirms three substantive hooks from the profiles adapter, full loading/empty/error state coverage, explicit ownership gate, and working CRUD (add/update/delete service areas). Corrected to MOSTLY INDEPENDENT / MOSTLY COMPLETE.

---

## OWNERSHIP

[SOURCE_VERIFIED]
Owner: VCSM:dashboard (card display) / VCSM:profiles (data authority)
Write authority: delegated to profiles adapter (useLocksmithOwner.addArea/updateArea/deleteArea)
Ownership enforcement:
- Route guard: OwnerOnlyDashboardGuard (route-level)
- App-level: `if (!isOwner) return <div>Owner access only.</div>` via useVportOwnership [SOURCE_VERIFIED line 74]
- Data-level: enforced inside profiles feature locksmith DAL (not visible in this module)

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/locksmith` → VportDashboardLocksmithScreen.jsx
- Exported via: `index.js`

---

## LAYER MAP

DAL: NONE in module [SOURCE_VERIFIED] — delegated to profiles feature via adapter
Model: NONE in module [SOURCE_VERIFIED] — area shape built inline in AreaForm
Controller: NONE as separate file [SOURCE_VERIFIED] — coordination via hooks in screen

Hook (consumed via profiles adapter — not local files):
- `useLocksmithProfile(targetActorId, "locksmith")` → { serviceAreas, serviceDetails, gapServices, loading, reload }
- `useLocksmithOwner(targetActorId, { onSuccess: reload })` → { addArea, updateArea, deleteArea, saving, error }
- `usePublishLocksmithPost({ actorId })` → { publishServiceAreaPost }
All three: `@/features/profiles/adapters/kinds/vport/vportProfiles.adapter` [SOURCE_VERIFIED line 12]

Supporting hooks (local context):
- `useVportOwnership(viewerActorId, targetActorId)` → { isOwner } [SOURCE_VERIFIED] — direct hook import (boundary note below)
- `useIdentity()` → { identity } via `@/state/identity/identityContext` [SOURCE_VERIFIED]
- `useDesktopBreakpoint()` → { isDesktop } [SOURCE_VERIFIED]

Component:
- `components/locksmithScreenComponents.jsx` — exports AreaForm, AreaCard, ServiceDetailRow, GapServiceRow [SOURCE_VERIFIED]

Screen:
- `VportDashboardLocksmithScreen.jsx` [SOURCE_VERIFIED]
- `index.js` — exports screen + all components [SOURCE_VERIFIED]

Adapter (consumed): `@/features/auth/adapters/auth.adapter` → ConsentCheckbox (used in AreaForm) [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Service area CRUD + details display — confirmed in source | — |
| Owner defined | PASS | VCSM:dashboard (card) / profiles (data) | — |
| Entry points mapped | PASS | /actor/:actorId/dashboard/locksmith in app.routes.jsx | — |
| Controllers present/delegated | PASS | Delegated: useLocksmithOwner via profiles adapter | — |
| DAL/repository present/delegated | PASS | Delegated: locksmith DAL inside profiles feature | — |
| Models/transformers present | PARTIAL | Area shape built inline in AreaForm.handleSubmit | No model file |
| Hooks/view models present | PASS | 3 adapter hooks + 3 context hooks | — |
| Screens/components present | PASS | Screen + 4 components (AreaForm, AreaCard, ServiceDetailRow, GapServiceRow) | — |
| Services/adapters present | PASS | Consumes profiles adapter at approved boundary | — |
| Database objects mapped | PARTIAL | locksmith_service_areas / locksmith_service_details (write-surface-map) — owned by profiles | Profiles feature owns write; this module delegates |
| Authorization path mapped | PASS | Route guard + `if (!isOwner) return null` [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | FAIL | reload() called on mutation; cache TTL undocumented | — |
| Error/loading/empty states mapped | PASS | Loading: 3-item skeleton; Empty: "No service areas"; Error: owner.error div [SOURCE_VERIFIED] | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | FAIL | No tests in this module | MISSING |
| Native parity noted | FAIL | Not documented | — |
| Engine dependencies mapped | PARTIAL | No engines; all data via profiles adapter | Delegation chain inside profiles undocumented |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| profiles adapter | feature-adapter | locksmith → profiles | YES — via adapter | useLocksmithProfile, useLocksmithOwner, usePublishLocksmithPost |
| vport/hooks/useVportOwnership | feature-hook | locksmith → vport | RISK — direct hook import (not via adapter) | isOwner check |
| vport/screens/styles/vportDashboardShellStyles | feature-style | locksmith → vport | LOW RISK — style utility only | shell layout |
| dashboard/shared/components/BackButton | shared | locksmith → shared | YES — shared component | VportBackButton |
| auth/adapters/auth.adapter | feature-adapter | locksmith (AreaForm) → auth | YES — via adapter | ConsentCheckbox |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |
| @/state/identity/identityContext | state | locksmith → state | LOW RISK | useIdentity() — NOTE: inconsistent with team (identity.adapter) |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| serviceAreas | read | profiles feature (locksmith DAL) | useLocksmithProfile → screen | Delegated — source invisible to this module |
| serviceDetails | read | profiles feature (locksmith DAL) | useLocksmithProfile → screen | Delegated |
| gapServices | derived | profiles feature | useLocksmithProfile → screen | Services without locksmith details |
| area shape | write (delegated) | profiles feature | owner.addArea/updateArea/deleteArea | { label, areaType, city, stateCode, zipCode, radiusMiles, minEtaMinutes, maxEtaMinutes, travelFeeCents, isEmergencyCovered } |
| locksmith feed post | write | profiles adapter | publishServiceAreaPost | Optional — only on shareToFeed=true |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/locksmith [SOURCE_VERIFIED] | — |
| Loading state | PASS | 3-item skeleton (animate-pulse) while loading=true [SOURCE_VERIFIED line 95-106] | — |
| Empty state | PASS | "No service areas configured yet." shown when !serviceAreas.length [SOURCE_VERIFIED line 117-120] | — |
| Error state | PASS | owner.error displayed in red/border div [SOURCE_VERIFIED line 175-178] | — |
| Auth/owner gates | PASS | Route guard + `if (!isOwner)` at screen level [SOURCE_VERIFIED line 74] | — |
| Cache behavior | UNKNOWN | reload() on mutation; no TTL/SWR documented | LOW |
| Runtime dependencies | PASS | profiles adapter (data), auth adapter (ConsentCheckbox) | — |
| Hot paths | PARTIAL | useLocksmithProfile on mount; per-mutation owner.addArea/updateArea/deleteArea | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | Service area CRUD + feed publish flow undocumented | LOGAN |
| Cross-module hook import (useVportOwnership) | MEDIUM | Direct hook import from vport — should go through vport adapter | SENTRY |
| Area shape model | MEDIUM | Area object built inline in AreaForm.handleSubmit — no model file | IRONMAN |
| Tests | MEDIUM | Zero test coverage in this module | SPIDER-MAN |
| Identity hook inconsistency | LOW | Uses useIdentity() from state/; team/vport use identity.adapter | SENTRY |
| Cache behavior documentation | LOW | reload() pattern undocumented | LOKI |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/VportDashboardLocksmithScreen.jsx:8
Module: locksmith
Current dependency: `import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership"`
Expected boundary: Access through vport adapter
Risk: LOW — hook not a DAL; no data leak
Suggested correction: Expose useVportOwnership from vport dashboard adapter

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Service area CRUD + feed publish undocumented | LOGAN |
| P2 | Fix useVportOwnership import boundary | Cross-module hook import (not critical but violates adapter pattern) | SENTRY |
| P2 | Add area shape model | AreaForm builds inline; no model file | IRONMAN |
| P2 | Add tests | Zero coverage in module | SPIDER-MAN |
| P3 | Standardize identity hook | state/ vs identity.adapter inconsistency | SENTRY |

## RECOMMENDED HANDOFFS: LOGAN, SENTRY, IRONMAN, SPIDER-MAN
