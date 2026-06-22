---
name: vcsm.professional.architecture
description: ARCHITECT V2 module architecture report for VCSM:professional
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** professional
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/professional
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The professional module provides role-gated workspace experiences for verified professionals on the VCSM platform. It delivers two distinct sub-systems: a briefings inbox that reads from `vc.notifications` and surfaces domain-classified intelligence (operations, compliance, marketplace, intelligence) for actor-scoped professional users; and a nurse-specific workspace (NurseHomeScreen) that allows verified nurses to add housing and facility/hospital notes. An enterprise sub-module exists for seeded cross-profession workspace views. The module also contains a profession catalog config that defines supported profession types (nurse, chef, driver, teacher) gating feature enablement.

## OWNERSHIP

Owned by the VCSM platform feature team. Domain: professional identity/workspace. Primary responsibility: profession-gated UI surfaces and notification briefing reads. The module depends on the `identity` and `notification` engines for actor resolution and notification data respectively.

## ENTRY POINTS

- `ProfessionalAccessScreen` — screen-level entry point for the Nurse Notes Workspace; renders NurseHomeScreen under the "nurse" guard
- `ProfessionalBriefingsScreen` — entry point for the professional briefings inbox view, driven by `useProfessionalBriefings` hook
- No routes registered in the route-map scanner. Entry is via internal navigation from consuming screens (not a registered public route).

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 2 | professionalBriefings.read.dal.js (reads + marks vc.notifications) |
| Model | 12 | professionalBriefing.model.js (row transformer + summary aggregator), buildEnterpriseView.model.js |
| Controller | 5 | listProfessionalBriefings.controller.js (list + mark-seen) |
| Service | N/A | — |
| Adapter | 0 | No adapter file detected |
| Hook | 2 | useProfessionalBriefings.js, useEnterpriseWorkspace.js |
| Component | 27 | BriefingsList.jsx, BriefingsFilters.jsx, BriefingsSummaryCards.jsx, enterprise UI panels/rows, nurse housing UI components |
| Screen | 14 | ProfessionalAccessScreen.jsx, ProfessionalBriefingsScreen.jsx, NurseHomeScreen.jsx, NurseHomeScreenView.jsx, tab views |
| Barrel | 9 | (callgraph-detected, no explicit barrel index files found in static scan) |

Counts from callgraph (cg_layerCounts): component=27, controller=5, dal=2, hook=2, model=12, module=9, screen=14.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | BEHAVIOR.md is PLACEHOLDER — no formal contract written | BEHAVIOR.md needs full authoring |
| Owner defined | PARTIAL | Inferred from source; no ownership record exists | No OWNERSHIP.md or owner field |
| Entry points mapped | PASS | ProfessionalAccessScreen + ProfessionalBriefingsScreen confirmed in source | No routes in route-map |
| Controllers present/delegated | PASS | 5 controller nodes (cg); listProfessionalBriefings.controller.js read directly | — |
| DAL/repository present/delegated | PASS | 2 DAL functions in professionalBriefings.read.dal.js | Both read and write (mark-seen) in same DAL file |
| Models/transformers present | PASS | 12 model nodes; professionalBriefing.model.js, buildEnterpriseView.model.js confirmed | — |
| Hooks/view models present | PASS | 2 hooks: useProfessionalBriefings.js, useEnterpriseWorkspace.js | — |
| Screens/components present | PASS | 14 screens + 27 components (cg) | — |
| Services/adapters present | FAIL | No adapter file found in source tree | Cross-feature imports not gated by adapter |
| Database objects mapped | PARTIAL | vc.notifications is the only write surface (mark-seen update) | Read DAL targets vc.notifications with no schema declared on read |
| Authorization path mapped | FAIL | actorId is passed by caller but no ownership gate or role check found in controller/DAL | No verified professional role guard in source |
| Cache/runtime behavior mapped | FAIL | No cache layer; useEnterpriseWorkspace uses localStorage via professionalAccess.storage.js | localStorage prefs not documented |
| Error/loading/empty states mapped | PASS | useProfessionalBriefings manages loading/error/empty states explicitly | — |
| Documentation linked | FAIL | BEHAVIOR.md exists but is PLACEHOLDER — no contract content | Full BEHAVIOR.md required |
| Tests/validation noted | FAIL | 0 tests in scanner | No test coverage at all |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PARTIAL | identity + notification declared in scanner; source uses supabase directly for notification reads — does not consume notification engine | Engine dependency declaration may be aspirational, not actual |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES | Declared in scanner; identity resolves actorId passed to hooks/controllers |
| engines/notification | engine | inbound | PARTIAL | Declared in scanner; actual DAL reads vc.notifications table directly via supabase, not through engine |
| vc.notifications | DB table | read + write | YES | Read via dalListProfessionalBriefings; written via dalMarkProfessionalBriefingsSeen |
| features/settings styles | feature | inbound | WATCH | ProfessionalAccessScreen imports settings-modern.css directly from another feature |
| professionalAccess.storage | internal | internal | YES | localStorage wrapper for workspace prefs |
| enterpriseSeed.data | internal | internal | YES | Static seed data for enterprise workspace views |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.notifications (read) | SELECT (explicit columns) | notification domain | professionalBriefings.read.dal.js | Reads cross-domain notification table; recipient_actor_id filter is correct |
| vc.notifications (write) | UPDATE is_seen=true | notification domain | dalMarkProfessionalBriefingsSeen | Uses .in(id, [...]) + .eq(recipient_actor_id, ...) — recipient guard present |
| localStorage (workspace prefs) | read/write | professionalAccess.storage.js | useEnterpriseWorkspace.js | Not covered by any DB-level authorization |
| enterpriseSeed.data.js | static data | internal | useEnterpriseWorkspace.js | Seed data — not persisted to DB |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | WATCH | No registered route in route-map; navigation relies on internal routing | Module may be unreachable if not registered in app router |
| Loading state | PASS | useProfessionalBriefings has loading state; setLoading(true/false) pattern confirmed | — |
| Empty state | PASS | useProfessionalBriefings returns empty items=[]; NurseHomeScreen has explicit nurse-only guard state | — |
| Error state | PASS | useProfessionalBriefings catches and sets error string | — |
| Auth/owner gates | FAIL | actorId passed by caller — no controller-level guard verifying the caller is a verified professional | Any actorId can call ctrlListProfessionalBriefings |
| Cache behavior | WATCH | Enterprise workspace prefs persisted to localStorage via professionalAccess.storage.js | No briefings cache; full re-fetch on every filter change |
| Runtime dependencies | WATCH | supabase client imported directly in DAL — dependency on service layer is correct; no engine abstraction for notifications | Notification engine boundary not enforced |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/professional/BEHAVIOR.md | PRESENT (PLACEHOLDER only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No formal contract for the feature — behavior, happy paths, and engine dependencies are undocumented | LOGAN |
| No adapter file | MEDIUM | ProfessionalAccessScreen imports settings CSS from another feature; no adapter guards cross-feature access | IRONMAN |
| No authorization gate for professional role | HIGH | Any actor can call ctrlListProfessionalBriefings — no verification that the actor is a verified professional | VENOM |
| Zero test coverage | MEDIUM | No tests for controller filtering logic, model transforms, or mark-seen mutation | SPIDER-MAN |
| ARCHITECTURE.md was missing | LOW | Architecture map was absent before this run | ARCHITECT |
| CURRENT_STATUS.md was missing | LOW | No status tracking before this run | ARCHITECT |
| Route not registered in route-map | MEDIUM | Scanner found no routes; screens may be unreachable or accessed only via internal navigation | HAWKEYE |
| Engine boundary not enforced for notifications | LOW | DAL reads vc.notifications directly without going through notification engine | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature CSS import:** `ProfessionalAccessScreen.jsx` imports `@/features/settings/styles/settings-modern.css` directly. Shared styles should live in `shared/` or be accessed via a properly defined adapter. This is a layer boundary violation.
2. **Notification engine declared but not consumed:** The scanner lists `notification` as an engine dependency but the DAL bypasses the engine and queries `vc.notifications` directly via supabase. This creates a maintenance risk if the notification schema migrates.
3. **No adapter boundary:** The module has no `*.adapter.js` file. Any consuming feature must import internal hooks or components directly, breaking the adapter boundary contract.

---

## SPAGHETTI SCORE

**Module:** professional
**Score:** WATCH
**Reasons:** Module structure is well-layered (DAL → Model → Controller → Hook → Screen) within the briefings sub-module. However: no adapter gate, cross-feature CSS import, no auth gate on the professional role check, and the enterprise sub-module is entirely seed-data-driven with no DB persistence path. The nurse sub-module has a working screen+view pattern. The enterprise workspace is essentially a static prototype (seed data only).
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no contract content has been authored

**Check A (Source without behavior):** FAIL — source exists and is active but BEHAVIOR.md has no content beyond placeholder boilerplate
**Check B (Behavior without source):** N/A — BEHAVIOR.md declares no happy paths to verify
**Check C (§13 engine consistency):** PARTIAL — scanner declares `identity` and `notification` engines; identity is used implicitly (actorId injection by caller); notification engine is not consumed — DAL reads table directly
**Check D (§6 data change consistency):** PARTIAL — scanner write surface is `vc.notifications` UPDATE via `dalMarkProfessionalBriefingsSeen`; this matches the DAL source; no other write surfaces found

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md — full contract | PLACEHOLDER blocks governance and THOR eligibility | LOGAN |
| P1 | Add authorization gate for verified professional role | Any actor can call the briefings controller | VENOM |
| P2 | Create adapter file | No cross-feature access boundary enforced | IRONMAN |
| P3 | Add test coverage for controller filtering and model transforms | Zero tests; logic is non-trivial (domain classification, summary aggregation) | SPIDER-MAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — author full BEHAVIOR.md contract
- **VENOM** — review missing professional role authorization gate
- **IRONMAN** — create adapter file; enforce notification engine boundary; resolve cross-feature CSS import
- **SPIDER-MAN** — add test coverage for briefing controller and model layer
- **HAWKEYE** — confirm route registration and verify screen reachability

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
