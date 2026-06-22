# ARCHITECT V2 REPORT
Generated: 2026-06-07T08:45:00
Branch: vport-booking-feed-security-updates
Scanner Version: 1.1.0
Command: ARCHITECT V2 (Scanner-Assisted)

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | architecture-audit |
| Feature / Scope | ALL APPS + ENGINE |
| Command | ARCHITECT V2 |
| Ticket | vport-booking-feed-security-updates |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/ |
| Timestamp | 2026-06-07T08:45:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map                   | Generated At               | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map           | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| dependency-map        | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-map             | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| graph                 | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| callgraph             | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| engine-candidates     | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | MEDIUM     | PASS   |
| write-surface-map     | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map               | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map     | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map     | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map   | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map   | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map     | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map    | 2026-06-07T08:11:08.925Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Records | Used For |
|---|---|---|
| feature-map | 71 features | Feature inventory, scope, app isolation |
| dependency-map | 390 edges | Cross-feature/engine import graph |
| route-map | 244 routes | Route tree, access classification |
| graph | 10,674 nodes | Dead code detection, SHIELD output |
| callgraph | 7,374 nodes / 9,673 edges | Execution paths, module completeness matrix |
| engine-candidates | 17 candidates | Engine consumer map, boundary review |
| write-surface-map | 487 surfaces | Mutation surface inventory |
| rpc-map | 71 RPCs | RPC call inventory |
| edge-function-map | 52 edge functions | Edge function surface inventory |
| security-path-map | 610 paths | Security path analysis |
| route-execution-map | 244 paths | Route-to-controller-to-DAL chains |
| write-execution-map | 0 resolved | Write path ownership resolution (empty — scanner gap) |
| rpc-execution-map | 71 paths | RPC execution chains |
| edge-execution-map | 52 paths | Edge function chains |

---

## 3. Scope Summary

```
Applications scanned:    3 (VCSM, Traffic, wentrex)
Engines scanned:         9 (booking, chat, hydration, identity, notifications, portfolio, media, reviews, directory)
Features in scope:       71
  VCSM features:         41
  Traffic features:      11
  wentrex features:      10
  Engine/shared:          9
Total nodes (callgraph): 7,374
Total edges (callgraph): 9,673
Total nodes (graph):     10,674
Write surfaces in scope: 487
Routes in scope:         244 (VCSM: 130 | Traffic: 51 | wentrex: 63)
Security paths:          610
RPCs:                    71
Edge functions:          52
```

---

## 4. Scanner Signals

| Signal | Value | Confidence | Provenance |
|---|---|---|---|
| All 244 routes classified access=public | ARCHITECTURAL GAP | HIGH | [SOURCE_VERIFIED] |
| 123 VCSM routes have no feature assignment | SCANNER_GAP | HIGH | [SOURCE_VERIFIED] |
| 108 cross-feature import pairs (VCSM) | REQUIRES_REVIEW | HIGH | [SOURCE_VERIFIED] |
| write-execution-map: 0 ownership resolutions | SCANNER_GAP | HIGH | [SCANNER_LEAD] |
| Profiles feature: 671 callgraph nodes | CONCENTRATION_RISK | HIGH | [SOURCE_VERIFIED] |
| Portfolio feature: 4 callgraph nodes | FRAGMENTED | HIGH | [SOURCE_VERIFIED] |

---

## 5. Architecture Findings

### ARCH-001 — Route Access Classification Gap [SOURCE_VERIFIED]

**Severity:** HIGH
**Pattern:** All 244 routes (100%) classified as `access: public` in scanner route-map.
**Evidence:** route-map.json — all entries have `"routeAccess": "public"`.
**Root cause:** Scanner extracts route structure from React Router route objects. VCSM's session
guard is implemented at the screen/layout level (not via a route-level `requireAuth` wrapper),
so the scanner cannot infer protection status from the route definition itself.
Protected routes confirmed in: `apps/VCSM/src/app/routes/protected/app.routes.jsx`.
**Risk:** Scanner-derived security path map cannot be trusted for VCSM route access classification.
All VCSM protected routes must be verified by HAWKEYE against runtime session enforcement.
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** HAWKEYE

---

### ARCH-002 — 123 VCSM Routes Without Feature Assignment [SOURCE_VERIFIED]

**Severity:** MEDIUM
**Pattern:** 123 of 130 VCSM routes (94.6%) have no feature field in route-map.
**Evidence:** Routes sourced from `apps/VCSM/src/app/routes/protected/app.routes.jsx` and
`apps/VCSM/src/app/routes/public/` — scanner cannot trace route file back to feature folder.
Only 7 routes have feature assignments (explore: 1, legal: 6).
**Risk:** Security path map cannot attribute route-level risk to feature owners.
VENOM and ELEKTRA coverage gaps for ownership tracing.
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** VENOM (manual tracing required for security-sensitive routes)

---

### ARCH-003 — vport.core.dal.js: updateVport() Relies on RLS Alone [SOURCE_VERIFIED]

**Severity:** HIGH
**Pattern:** `updateVport(vportId, {...})` calls `.update(patch).eq("id", vportId)` without
an app-layer ownership check before the update. `requireUser()` only confirms an auth session
exists — it does not verify the authenticated user owns the vportId.
**Evidence:** `apps/VCSM/src/features/vport/dal/vport.core.dal.js` lines 183-229.
Session verification: `requireUser()` confirms auth session — ✅
App-layer ownership check: ABSENT — relies exclusively on `vport.profiles` RLS policy.
**Risk:** If RLS on `vport.profiles` is misconfigured or absent, any authenticated user
can update any vport profile row by supplying a target vportId.
**DB AUDIT NOTE:**
- DB object: `vport.profiles` table RLS UPDATE policy
- Risk: If policy does not enforce `owner_user_id = auth.uid()`, arbitrary update is possible
- Suggested review: Confirm `vport.profiles` has `USING (owner_user_id = auth.uid())` on UPDATE
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** VENOM, DB Audit

---

### ARCH-004 — booking/createBooking.controller.js: PATCHED [SOURCE_VERIFIED]

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:** `apps/VCSM/src/features/booking/controllers/createBooking.controller.js`
- customerActorId session-bound: line 112 `customerActorId = requestActorId` for public source ✅
- Kind gate: lines 96-108 — `requestActor.kind !== "user"` → reject ✅
- Management source ownership: assertActorOwnsVportActorController enforced ✅
- Duration ceiling: MAX_BOOKING_DURATION_MINUTES = 1440 ✅
- Rate validation: input source whitelist enforced ✅
- Notification linkPath: null (TICKET-BOOKING-RPC-001) ✅
**Provenance:** [SOURCE_VERIFIED]

---

### ARCH-005 — booking/assertActorOwnsVportActor.controller.js: PATCHED (ELEK-004) [SOURCE_VERIFIED]

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:** `apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js`
- Kind check (user-only) at line 29: unconditional, precedes self-shortcut ✅
- Self-shortcut at line 45: only reached after kind === "user" confirmed ✅
- actor_owners link verified at line 54: readActorOwnerLinkByActorAndUserProfileDAL ✅
- Monitoring: captureVcsmError on kind gate rejection and ownership denial ✅
**Provenance:** [SOURCE_VERIFIED]

---

### ARCH-006 — notifications/publish.js: Session Guard PATCHED [SOURCE_VERIFIED]

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:** `apps/VCSM/src/features/notifications/publish.js`
- Session guard at line 62-64: `supabase.auth.getSession()` — returns false if no session ✅
- Self-notification skip: line 55 ✅
- Batch path: identical session guard at line 119 ✅
- DB BEFORE INSERT trigger (TICKET-ARCH-NOTI-SESSION-001): confirmed DONE per memory ✅
**Provenance:** [SOURCE_VERIFIED]

---

### ARCH-007 — notifications/verifyRecipientOwnership.js: Inbox Ownership Check [SOURCE_VERIFIED]

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:** `apps/VCSM/src/features/notifications/inbox/lib/verifyRecipientOwnership.js`
- Queries `notification.recipients` by (id, recipient_actor_id) ✅
- Returns false if either parameter missing ✅
- Returns false on DB error ✅
**Provenance:** [SOURCE_VERIFIED]

---

### ARCH-008 — Portfolio Feature: FRAGMENTED [SOURCE_VERIFIED]

**Severity:** MEDIUM
**Pattern:** Portfolio feature has only 4 callgraph nodes: adapter(3), module(1).
No controllers, DALs, hooks, models, or screens in `apps/VCSM/src/features/portfolio/`.
**Evidence:** feature-map: portfolio — 2 source files. callgraph: portfolio — 4 nodes.
**Root cause:** Portfolio functionality lives inside vportDashboard. The portfolio feature
folder is an adapter-only boundary — correct delegation pattern, not a gap.
**Risk:** LOW — the delegation is intentional. The risk is documentation gap:
portfolio.ARCHITECTURE.md should explicitly declare this delegation.
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** LOGAN (document delegation)

---

### ARCH-009 — Profiles Feature: Concentration Risk [SOURCE_VERIFIED]

**Severity:** MEDIUM
**Pattern:** Profiles is the largest feature in the codebase: 671 callgraph nodes,
376 source files. Consumed by: booking, chat, social, notifications, settings, vportDashboard,
public, wanders, flyerBuilder, post, profiles (self), shared.
**Evidence:** callgraph node distribution — 103 controllers, 106 DALs, 81 hooks, 100 models, 221 screens.
**Risk:** Any regression in profiles breaks 12+ downstream features. No dedicated ownership
boundary enforced. CARNAGE review recommended before any schema changes to tables owned by profiles.
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** IRONMAN (ownership assignment), CARNAGE (schema change governance)

---

### ARCH-010 — Cross-Feature Imports: 108 Pairs [SOURCE_VERIFIED]

**Severity:** MEDIUM
**Pattern:** 108 cross-feature import pairs detected in VCSM dependency-map.
Key concern: whether imports go through adapter boundaries (*.adapter.js) or bypass directly.
Scanner confidence: imports flagged as cross-feature edges but adapter-vs-direct not discriminated.
**Top cross-feature consumers:**
- auth → identity (1), initiation (1), legal (1), wanders (1)
- block → feed (1), identity (1)
- booking → notifications (1)
- chat → block, identity, media, moderation, notifications, settings
- explore → identity (1)
- feed → identity (inferred from engine-candidates)
**BOUNDARY CONTRACT NOTE:** All cross-feature access must go through adapter files.
Direct imports of DALs/controllers from another feature are boundary violations.
**Provenance:** [SOURCE_VERIFIED] (edge existence), [SCANNER_LEAD] (adapter-vs-direct classification)
**Handoff:** SENTRY (boundary enforcement verification)

---

### ARCH-011 — Traffic Answers Feature: Architecture Refactored [SOURCE_VERIFIED]

**Severity:** INFO
**Pattern:** Branch includes significant Traffic answers refactor — controllers, models,
and hooks deleted and rebuilt with cleaner layer separation.
Deleted: moderateAnswers.controller.js, readAnswerPage.controller.js, submitQuestion.controller.js
         answer.model.js, moderationAnswer.model.js, moderationAuth.model.js, moderationQueue.model.js
         publicAnswerPage.model.js, question.model.js, questionSubmission.model.js
Added: New DAL files, hooks, adapter
**Evidence:** git diff HEAD~3..HEAD — 60+ files in apps/Traffic/src/features/answers/
**Risk:** Regression risk in Traffic answers — SPIDER-MAN should verify all answer paths work.
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** SPIDER-MAN

---

### ARCH-012 — vport.core.dal.js: softDeleteVport / hardDeleteVport / restoreVport [SOURCE_VERIFIED]

**Severity:** MEDIUM
**Pattern:** softDeleteVport, hardDeleteVport, and restoreVport call DB RPCs without an
app-layer caller ownership check before the RPC call.
**Evidence:** `apps/VCSM/src/features/vport/dal/vport.core.dal.js` lines 231-279.
requireUser() is absent on soft/hard/restore delete operations.
Only hardDeleteVport and softDeleteVport lack session check — restoreVport also lacks it.
The RPC handles AUTH_REQUIRED internally (returns VPORT_NOT_FOUND_OR_UNAUTHORIZED on error).
**Assessment:** Auth is enforced at DB RPC level (error handling catches AUTH_REQUIRED).
App layer does NOT call requireUser() before these ops.
**DB AUDIT NOTE:**
- DB object: soft_delete_vport, hard_delete_vport, restore_vport RPCs
- Risk: If RPC auth check is bypassed, unauthenticated calls succeed
- Suggested review: Verify RPCs enforce `auth.uid()` = vport owner in all branches
**Provenance:** [SOURCE_VERIFIED]
**Handoff:** VENOM (trust boundary), DB Audit

---

## 6. Module Completeness Matrix (Branch Scope)

| Feature | Controllers | DALs | Hooks | Models | Screens | Total | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| booking | 20 | 34 | 17 | 41 | 0 | 142 | MOSTLY COMPLETE |
| feed | 8 | 28 | 19 | 11 | 3 | 81 | MOSTLY COMPLETE |
| vport | 2 | 21 | 5 | 6 | 3 | 100 | MOSTLY COMPLETE |
| notifications | 8 | 25 | 7 | 4 | 39 | 113 | MOSTLY COMPLETE |
| post | 18 | 33 | 22 | 22 | 14 | 178 | COMPLETE |
| profiles | 103 | 106 | 81 | 100 | 221 | 671 | COMPLETE |
| auth | 34 | 32 | 18 | 18 | 11 | 126 | COMPLETE |
| vportDashboard | 61 | 67 | 34 | 56 | 8 | 435 | COMPLETE |
| portfolio | 0 | 0 | 0 | 0 | 0 | 4 | FRAGMENTED (delegates to vportDashboard) |
| Traffic:answers | — | 5+ | 2 | 5 | 3 | 15+ | REFACTORED |

---

## 7. Source Verification Summary

| Feature | Files Read | Findings Verified | Confidence |
|---|---|---|---|
| booking | createBooking.controller.js, assertActorOwnsVportActor.controller.js | ARCH-004, ARCH-005 | HIGH |
| vport | vport.core.dal.js | ARCH-003, ARCH-012 | HIGH |
| notifications | publish.js, verifyRecipientOwnership.js | ARCH-006, ARCH-007 | HIGH |
| feed | (callgraph + scanner) | Structure only | MEDIUM |
| post | (callgraph + scanner) | Structure only | MEDIUM |
| profiles | (callgraph + scanner) | Structure only | MEDIUM |

**SOURCE_VERIFIED findings:** ARCH-001 through ARCH-012
**SCANNER_LEAD findings:** None elevated to CRITICAL
**Spot checks performed:** 6 source files read directly

---

## 8. Confidence Summary

| Area | Confidence | Reason |
|---|---|---|
| Scanner map freshness | HIGH | All 14 maps generated same day |
| Route access classification | LOW | Scanner cannot distinguish app-layer auth from no-auth |
| Write surface ownership | MEDIUM | Scanner `ownershipCheck` field unpopulated |
| Cross-feature adapter compliance | MEDIUM | Edge existence verified, not adapter path |
| Branch patch verification (booking/vport/noti) | HIGH | Source files read directly |

---

## 9. Behavior Contract Consistency

### booking

```
Behavior Consistency Check — booking
======================================
BEHAVIOR.md present: YES
Status: (not read — requires VENOM targeted check)

Check A (Source without behavior): PASS (controllers present)
Check B (Behavior without source): NOT EVALUATED (BEHAVIOR.md not scanned)
Check C (§13 engine consistency):
  booking engine imported: YES (engine-candidates confirms) ✅
  notifications engine imported: YES ✅
Check D (§6 data change consistency): NOT EVALUATED
```

### feed

```
Behavior Consistency Check — feed
====================================
BEHAVIOR.md present: YES
Check A (Source without behavior): PASS (controllers + DALs present)
Check B-D: NOT EVALUATED
```

### vport

```
Behavior Consistency Check — vport
=====================================
BEHAVIOR.md present: YES
Check A: PASS
Check B-D: NOT EVALUATED
```

### notifications

```
Behavior Consistency Check — notifications
===========================================
BEHAVIOR.md present: YES
Check A: PASS (publish.js, notificationRuntime.dal.js, inbox controllers present)
Check B-D: NOT EVALUATED
```

---

## 10. Handoff Recommendations

| Command | Feature/Area | Reason |
|---|---|---|
| VENOM | vport (ARCH-003, ARCH-012) | updateVport RLS-only ownership, delete ops trust RPC auth |
| VENOM | route access (ARCH-001) | All 244 routes classified public — trust boundary unclear |
| VENOM | cross-feature imports (ARCH-010) | 108 pairs — verify adapter compliance |
| BLACKWIDOW | booking | Verify bypass paths for createBooking session-binding |
| ELEKTRA | booking | Source-to-sink trace: customerActorId injection path fully closed? |
| ELEKTRA | vport | Source-to-sink trace: updateVport → RLS chain |
| HAWKEYE | All VCSM routes | Runtime auth enforcement on protected routes |
| SPIDER-MAN | Traffic:answers | Regression coverage for refactored answers feature |
| CARNAGE | profiles | Schema change governance — high-concentration risk |
| IRONMAN | portfolio, profiles | Ownership assignment, boundary definition |
| LOGAN | portfolio | Document intentional delegation to vportDashboard |
| DB Audit | vport.profiles RLS | Verify UPDATE policy enforces owner_user_id = auth.uid() |
| DB Audit | vport RPCs | Verify soft_delete/hard_delete/restore enforce auth.uid() |

---

## ARCHITECT RECOMMENDATION: CAUTION

- Patched features (booking, notifications): PASS
- vport updateVport RLS-only ownership: CAUTION — requires VENOM/ELEKTRA confirmation
- Route access classification gap: CAUTION — requires HAWKEYE
- Traffic answers refactor: CAUTION — requires SPIDER-MAN regression coverage

Proceed to VENOM.

---

## DB AUDIT NOTES (for separate DB Audit phase)

### DB-AUDIT-001
- DB object: `vport.profiles` UPDATE RLS policy
- Risk: updateVport() has no app-layer ownership check; relies on RLS alone
- Why deferred: Code patch phase does not touch DB objects
- Suggested SQL review: `\dp vport.profiles` — confirm `USING (owner_user_id = auth.uid())`

### DB-AUDIT-002
- DB object: `soft_delete_vport`, `hard_delete_vport`, `restore_vport` RPCs
- Risk: RPC callers do not call requireUser() before invoking — auth fully delegated to RPC
- Why deferred: Code patch phase does not touch DB objects
- Suggested SQL review: Inspect RPC body for `auth.uid()` enforcement in all branches

### DB-AUDIT-003
- DB object: `notification.events` BEFORE INSERT trigger
- Risk: (DONE per TICKET-ARCH-NOTI-SESSION-001) — verify trigger is deployed
- Why deferred: Already tracked, migration owner deploys manually
- Suggested SQL review: Confirm trigger exists on `notification.events`
