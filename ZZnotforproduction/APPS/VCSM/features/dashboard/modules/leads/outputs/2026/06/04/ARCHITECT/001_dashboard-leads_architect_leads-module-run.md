# ARCHITECT V2 REPORT — Dashboard Leads Module

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard-leads |
| Feature / Scope | dashboard/modules/leads |
| Command | ARCHITECT |
| Ticket | TICKET-ZZ-ARCHITECT-LEADS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/2026/06/04/ARCHITECT/001_dashboard-leads_architect_leads-module-run.md |
| Timestamp | 2026-06-04T18:43:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Current Date: 2026-06-04T18:43:00Z

| Map             | Generated At             | Age   | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map     | 2026-06-03T00:22:42Z     | 42.3h | FRESH     | HIGH       | PASS   |
| dependency-map  | 2026-06-03T00:22:42Z     | 42.3h | FRESH     | HIGH       | PASS   |
| route-map       | 2026-06-03T00:22:42Z     | 42.3h | FRESH     | HIGH       | PASS   |
| graph           | 2026-06-03T00:22:42Z     | 42.3h | FRESH     | HIGH       | PASS   |
| callgraph       | 2026-06-03T00:22:42Z     | 42.3h | FRESH     | HIGH       | PASS   |
| engine-candidates | 2026-06-03T00:22:42Z   | 42.3h | FRESH     | MEDIUM     | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| feature-map | 2026-06-03T00:22:42Z | 42.3h | FRESH | HIGH | Scope discovery — leads under VCSM:dashboard |
| dependency-map | 2026-06-03T00:22:42Z | 42.3h | FRESH | HIGH | Cross-feature import detection |
| route-map | 2026-06-03T00:22:42Z | 42.3h | FRESH | HIGH | Route registration confirmation |
| write-surface-map | 2026-06-03T00:22:42Z | 42.3h | FRESH | HIGH | Write surface inventory (6 leads surfaces found) |
| callgraph | 2026-06-03T00:22:42Z | 42.3h | FRESH | HIGH | Layer count — leads rolls under VCSM:dashboard |
| engine-candidates | 2026-06-03T00:22:42Z | 42.3h | FRESH | MEDIUM | Engine dependency check |

Note: Callgraph categorizes all dashboard card modules under `VCSM:dashboard`. No dedicated `leads` callgraph scope exists — layer counts derived from direct source scan.

---

## 3. Scope Summary

```
Application: VCSM
Module: dashboard/modules/leads
Source root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/
Module type: Dashboard card module
Scanner owner: VCSM:dashboard

Files in scope: 14
  .js/.jsx: 14
  .ts/.tsx: 0
Layers identified: 6 (dal, model, controller, hook, screen, test)
Write surfaces in scope (module-owned): 2 (delete, update on business_card_leads)
Write surfaces found by scanner with "lead" in path: 6 (4 belong to public submission flow — out of scope)
Routes in scope: 2 (1 canonical + 1 legacy redirect)
```

---

## 4. Scanner Signals

| Signal | Source Map | Confidence | Verified Against Source | Provenance | Finding |
|---|---|---|---|---|---|
| delete surface on business_card_leads at vportLeads.write.dal.js | write-surface-map | HIGH | YES — line 37, .eq('vport_profile_id', profileId) scope ✓ | [SOURCE_VERIFIED] | CLEAR |
| update surface on business_card_leads at vportLeads.write.dal.js | write-surface-map | HIGH | YES — line 13, .eq('vport_profile_id', profileId) scope ✓ | [SOURCE_VERIFIED] | CLEAR |
| edge_function invokeProviderLeadConfirmation | write-surface-map | HIGH | Not in dashboard module source — belongs to public lead submission flow | [SCANNER_LEAD] | OUT_OF_SCOPE |
| rpc submitProviderLeadRow | write-surface-map | HIGH | Not in dashboard module source — belongs to public lead submission flow | [SCANNER_LEAD] | OUT_OF_SCOPE |
| rpc createVportBusinessCardLeadDAL | write-surface-map | HIGH | Not in dashboard module source — belongs to public lead submission flow | [SCANNER_LEAD] | OUT_OF_SCOPE |
| route /actor/:actorId/dashboard/leads | route-map | HIGH | YES — app.routes.jsx, access: protected | [SOURCE_VERIFIED] | CLEAR |
| route /vport/:actorId/dashboard/leads | route-map | HIGH | YES — legacy redirect to canonical route | [SOURCE_VERIFIED] | CLEAR |
| Cross-feature DAL import from dashboard/vport/dal/ | dependency-map | HIGH | YES — controller line 1, readVportProfileByActorIdDAL import | [SOURCE_VERIFIED] | ARC-LEADS-001 (accepted pattern) |

---

## 5. Architecture Findings

### ARC-LEADS-001 — Cross-Module DAL Import (Accepted Pattern) `[SOURCE_VERIFIED]`

- **Location:** `controller/vportLeads.controller.js:1`
- **Finding:** Controller imports `readVportProfileByActorIdDAL` from `@/features/dashboard/vport/dal/read/vportProfile.read.dal` — a sibling dashboard module's DAL.
- **Classification:** ACCEPTED PATTERN — profile resolution is a shared need across all dashboard card modules. No dedicated profile adapter exists at the card level; all cards resolve profiles through the parent dashboard/vport DAL layer.
- **Risk:** LOW — no write surface involved, no ownership bypass. If the vportProfile DAL contract changes, all card modules are affected simultaneously.
- **Recommendation:** If profile resolution is needed by 5+ card modules, extract `readVportProfileByActorIdDAL` to a shared adapter. Not a blocking concern.
- **Severity:** LOW

### ARC-LEADS-002 — 60-Second Polling on Ownership-Gated Count `[SOURCE_VERIFIED]`

- **Location:** `hooks/useVportNewLeadsCount.js:8-46`
- **Finding:** `useVportNewLeadsCount` polls every 60 seconds. Each poll calls `fastCountNewVportLeadsController` which calls `assertActorOwnsVportActorController` (a DB round trip to `vc.actor_owners`) followed by `readNewLeadsCountByProfileDAL` (a `COUNT(*)` query). Two DB calls per poll, every 60 seconds, for every active leads-capable VPORT profile visible to the viewer.
- **Classification:** PERFORMANCE CONCERN — not a correctness or security issue.
- **Risk:** MEDIUM — at scale (many concurrent dashboard sessions), this generates sustained DB load. The `fastCountNewVportLeadsController` fast-path caches `profileId` after first resolution, eliminating one profile lookup, but the ownership check still fires every poll cycle.
- **Recommendation:** Route to KRAVEN for polling cost analysis. Consider: (1) moving the ownership assertion upstream to the hook guard (`if (!actorId || !callerActorId) return`) and trusting the session auth for polling, or (2) using a Supabase realtime subscription instead of polling.
- **Severity:** MEDIUM (performance, not security)

---

## 6. Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Leads management for VPORT owners — PII contact data from business card scans | — |
| Owner defined | PASS | All ops require `assertActorOwnsVportActorController` — owner-only by design | — |
| Entry points mapped | PASS | `/actor/:actorId/dashboard/leads` (protected), lazy-loaded | — |
| Controllers present | PASS | 5 controllers: list, count, fastCount, markContacted, delete | — |
| DAL/repository present | PASS | 2 read DALs, 2 write DALs — all scoped by `profileId` | — |
| Models/transformers present | PASS | `vportLead.model.js` (domain), `vportLead.display.model.js` (display) | — |
| Hooks/view models present | PASS | `useVportLeads`, `useVportNewLeadsCount` (+ polling) | — |
| Screens/components present | PASS | VportDashboardLeadsScreen, VportDashboardLeadsFinalScreen, VportDashboardLeadsView | — |
| Services/adapters present | PARTIAL | No dedicated adapter; index.js barrel is the public surface | No cross-feature adapter layer |
| Database objects mapped | PASS | `vport.business_card_leads` — READ (list, count) + WRITE (update source, delete) | — |
| Authorization path mapped | PASS | `assertActorOwnsVportActorController` on every operation, before any DAL call | — |
| Cache/runtime behavior mapped | PARTIAL | `profileId` cached in ref after first count resolution; no TTL cache for leads list | Polling without ownership skip |
| Error/loading/empty states mapped | PASS | loading, error, actionError, busyLeadId tracked in useVportLeads | — |
| Documentation linked | FAIL | BEHAVIOR.md: MISSING. No governance docs in ZZnotforproduction yet | BEHAVIOR.md required |
| Tests/validation noted | PASS | Controller test (ownership gate all 5 ops), Rule 9 boundary test | No hook-level tests |
| Native parity noted | N/A | No native equivalent found in source | — |
| Engine dependencies mapped | PASS | No engine dependencies — module is self-contained with shared lib only | — |

---

## 7. Module Dependency Graph

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@/features/booking/adapters/booking.adapter` | feature | inbound | YES — through adapter | Ownership gate import |
| `@/features/dashboard/vport/dal/read/vportProfile.read.dal` | feature | inbound | PARTIAL — direct DAL (ARC-LEADS-001) | Accepted pattern; shared profile resolution |
| `@/state/identity/identityContext` | service | inbound | YES | Session identity for callerActorId |
| `@/shared/lib/text` | shared | inbound | YES | Utility |
| `vport.business_card_leads` | database | write | YES — scoped by profileId | Owner-only table |
| Route system | route | outbound | YES | /actor/:actorId/dashboard/leads |
| buildDashboardCards.model | feature | outbound | YES | Card registry references leads |
| dashboardViewByVportType.model | feature | outbound | YES | Per-VPORT-type card inclusion |

---

## 8. Module Data Contract

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.business_card_leads` | read/write | leads module | Dashboard leads screen | PII — name, phone, email, message |
| `vportLead` domain object | derived | vportLead.model.js | hooks, screens | Contains PII fields |
| `count` (new leads) | derived | useVportNewLeadsCount | Dashboard card registry, badge | Low risk — count only |
| `profileId` | cached (ref) | useVportNewLeadsCount | fastCountNewVportLeads | Session-scoped, not persisted |

**PII Note:** `business_card_leads` contains name, phone, email, message. All reads are owner-gated. No field is returned to non-owner callers.

---

## 9. Module Runtime Readiness

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `/actor/:actorId/dashboard/leads` registered, lazy-loaded | — |
| Loading state | PASS | `loading` in useVportLeads, `busyLeadId` per action | — |
| Empty state | PASS | `leads.length === 0` renders empty in screen | — |
| Error state | PASS | `error` (list), `actionError` (per action) tracked | — |
| Auth/owner gate | PASS | All 5 controller ops gated before DAL | — |
| Cache behavior | PARTIAL | profileId ref cached; leads list not cached; count polled | Polling cost (ARC-LEADS-002) |
| Runtime dependencies | PASS | No engine deps; supabase client via vportClient | — |
| Hot paths | MEDIUM | 60s count poll fires ownership check every cycle | Route to KRAVEN |
| Legacy redirect | PASS | /vport/:actorId/dashboard/leads → /actor/:actorId/dashboard/leads | — |

---

## 10. Module Governance Links

| Governance Type | Path | Status |
|---|---|---|
| BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md | MISSING |
| SECURITY.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/SECURITY.md | MISSING |
| ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/ARCHITECTURE.md | WRITTEN (this run) |
| CURRENT_STATUS.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/CURRENT_STATUS.md | WRITTEN (this run) |
| Ownership record | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/OWNERSHIP.md | MISSING |
| Performance audit | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/PERFORMANCE.md | MISSING |
| Security audit | — | NOT RUN |
| Runtime audit | — | NOT RUN |
| Migration audit | — | NOT RUN |
| Native transfer audit | — | N/A |
| Engine audit | — | N/A (no engine deps) |

---

## 11. Behavior Contract Consistency

```
Behavior Consistency Check — dashboard/modules/leads
======================================================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md
BEHAVIOR.md exists: NO
BEHAVIOR.md status: MISSING

Check A (Source without behavior): FINDING — BEHAVIOR_CONTRACT_ABSENT [leads]
  Controllers exist: YES (5)
  DALs exist: YES (4)
  Hooks exist: YES (2)
  BEHAVIOR.md: MISSING → Severity: P2 (dashboard module)
  Recommendation: WOLVERINE behavior intake before next implementation ticket

Check B (Behavior without source): N/A — no BEHAVIOR.md to check against
Check C (§13 engine consistency): N/A — no BEHAVIOR.md declared engines
Check D (§6 data change consistency): N/A — no BEHAVIOR.md declared tables
```

---

## 12. Module Missing Pieces

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | No declared §5 Security Rules or §9 Must Never Happen — VENOM cannot cross-check ownership gates; SPIDER-MAN has no anchored test requirements | Wolverine (intake) |
| SECURITY.md | HIGH | PII module with no VENOM/ELEKTRA/BLACKWIDOW audit on record | VENOM |
| Hook-level tests | MEDIUM | useVportLeads and useVportNewLeadsCount have no unit tests — polling behavior unverified | SPIDER-MAN |
| OWNERSHIP.md | MEDIUM | No formal IRONMAN ownership record | IRONMAN |
| Polling optimization | MEDIUM | 60s ownership-gated poll generates sustained DB load | KRAVEN |
| PERFORMANCE.md | LOW | No KRAVEN runtime audit on record | KRAVEN |

---

## 13. Module Build Priority

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | BEHAVIOR.md intake | PII module, 5 owner-gated ops, no declared invariants | Wolverine |
| P1 | VENOM security review | business_card_leads contains PII; no security audit on record | VENOM |
| P2 | Hook-level tests (useVportLeads, useVportNewLeadsCount) | Polling behavior and optimistic mutations are untested | SPIDER-MAN |
| P2 | Polling cost analysis | 2 DB calls per 60s per active dashboard session | KRAVEN |
| P3 | IRONMAN ownership record | Formal feature ownership not documented | IRONMAN |

---

## 14. Spaghetti Score

```
SPAGHETTI SCORE
Module: dashboard/modules/leads
Score: CLEAN
Reasons:
  - Clear layer separation: DAL → Model → Controller → Hook → Screen
  - No circular dependencies detected
  - Index barrel is Rule 9 compliant (no DAL/controller exports)
  - Cross-module DAL import is the only boundary note — accepted pattern, low risk
  - All write DALs scope by profileId
  - Ownership gate is consistent across all 5 operations
Release risk: NONE from architecture perspective
```

---

## 15. Source Verification Summary

Total source files read: 10
- controller/vportLeads.controller.js ✓
- dal/vportLeads.read.dal.js ✓
- dal/vportLeads.write.dal.js ✓
- model/vportLead.model.js ✓
- model/vportLead.display.model.js ✓
- hooks/useVportLeads.js ✓
- hooks/useVportNewLeadsCount.js ✓
- index.js ✓
- __tests__/vportLeads.controller.test.js ✓
- __tests__/leads.index.rule9.test.js ✓

CRITICAL findings: 0
All [SOURCE_VERIFIED]: YES

---

## 16. Confidence Summary

| Tag | Count |
|---|---|
| [SOURCE_VERIFIED] | 8 |
| [SCANNER_LEAD] | 3 (all marked OUT_OF_SCOPE — public submission flow) |

---

## 17. Handoff Recommendations

| Command | Reason |
|---|---|
| Wolverine | BEHAVIOR.md intake — P1, PII module, missing invariants |
| VENOM | Security review — business_card_leads PII, owner-only access policy, no prior audit |
| SPIDER-MAN | Hook-level test coverage — useVportLeads, useVportNewLeadsCount |
| KRAVEN | Polling cost analysis — 60s ownership-gated count poll |
| IRONMAN | Ownership record |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

Module has full layer stack, clean boundaries, strong ownership gates, and Rule 9 compliance. Missing: BEHAVIOR.md, SECURITY.md, hook tests, formal performance audit.

**RECOMMENDED NEXT:** `/Wolverine` → leads BEHAVIOR.md intake, then `/VENOM` → leads security review.
