# THOR RELEASE REPORT — leads

**Application Scope:** VCSM
**Release reason:** Feature governance audit — determine release readiness of the leads dashboard module
**Areas changed:** dashboard/modules/leads (owner-side) + public/vportBusinessCard (submission + Edge Function)
**Release readiness:** BLOCKED
**Decision rationale:** Two confirmed HIGH security findings (VEN-LEADS-001 / ELEK-2026-06-04-001 — Edge Function JWT absent); one unverified RLS policy (VEN-LEADS-004); SECURITY.md output routing contract violated (ELEKTRA + BLACKWIDOW ran without updating domain file); BEHAVIOR.md DRAFT not APPROVED; Acceptance Criterion AC-DASH-leads-001 has no passing test; DR. STRANGE THOR Eligibility = BLOCKED.

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | PRESENT | 2026-06-04 — venom_leads-security-review.md | COMPLETE; 6 open findings; 2 THOR BLOCKERS |
| ELEKTRA | PRESENT | 2026-06-04 — elektra_leads-source-to-sink.md | 5 findings (1 HIGH, 3 MEDIUM, 1 INFO); SECURITY.md NOT updated — contract violation |
| BLACKWIDOW | PRESENT | 2026-06-04 — blackwidow_leads-adversarial-review.md | 11/12 attack paths BLOCKED; 1 PARTIAL (BEH-306 source contamination); SECURITY.md NOT updated — contract violation |
| LOKI | PRESENT | 2026-06-04 — loki_leads-runtime-trace.md | WATCH; 8 findings; observability maturity MINIMAL |
| HAWKEYE | PRESENT | 2026-06-04 — hawkeye_leads-endpoint-verification.md | DEGRADED; 1 FAIL (Edge Function auth), 3 PARTIAL |
| ARCHITECT | PRESENT | 2026-06-04 — in ARCHITECTURE.md | STABLE; 2 open findings (LOW + MEDIUM) |
| IRONMAN | PRESENT | 2026-06-04 — ironman_leads-ownership.md | PARTIAL; 4 findings; OWNERSHIP.md created |
| KRAVEN | MISSING | — | Performance audit never run; ARC-LEADS-002 routed here |
| CARNAGE | MISSING | — | Migration plan pending for VEN-LEADS-003 (source constraint) |
| FALCON | MISSING | — | Native parity entirely unassessed |
| DB | MISSING | — | RLS SELECT policy confirmation pending (VEN-LEADS-004) |
| SPIDER-MAN | MISSING | — | Formal test documentation never produced |
| DR. STRANGE | PRESENT | 2026-06-04 — 001_dr-strange_leads_status-oracle.md | BLOCKED; 21% coverage; THOR Eligibility = 🔴 BLOCKED |
| FEATURE_DOCUMENTATION_INDEX | STALE | 2026-06-02 scan date (estimated) | 2-day-old scan; within 7-day window |

---

## GOVERNANCE SYNC STATUS

| Check | Status | Details |
|---|---|---|
| FEATURE_STATUS.md current | PASS | leads registered — ACTIVE / HIGH tier |
| CURRENT folders present (CRITICAL/HIGH) | PASS | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/ exists |
| FEATURE_DOCUMENTATION_INDEX fresh | PASS | Scan date within 7-day window |
| DR. STRANGE freshness | PASS | Run 2026-06-04 (same day) |
| DR. STRANGE THOR eligibility | **BLOCKED** | 🔴 BLOCKED — leads; Coverage 21% |
| Coverage thresholds met | **FAIL** | leads at 21% — below 30% HIGH tier minimum; above 15% hard floor |
| SECURITY.md output routing contract | **FAIL** | ELEKTRA + BLACKWIDOW primary outputs written; SECURITY.md NOT updated. Both commands report NOT RUN in SECURITY.md despite output files existing. Contract violation per §10.4. |
| Open P0 blockers resolved | FAIL | VEN-LEADS-001 (HIGH THOR BLOCKER) and VEN-LEADS-004 (MEDIUM THOR BLOCKER) open with no DEFERRED.md acceptance |

**Governance Sync result: FAIL on 3 checks → maps to §13.2 hard blockers.**

---

## BEHAVIOR RELEASE GATE

**Feature tier:** HIGH → P1

**Gate 1 — Contract Presence**
P0/P1 features scanned: 1
BEHAVIOR.md present: YES
BEHAVIOR.md status: DRAFT (not APPROVED)
BLOCKED features: leads — UNAPPROVED_BEHAVIOR_CONTRACT

**Gate 2 — §9 Invariants Verified (Must Never Happen)**
Total §9 entries: 6 (BEH-DASH-leads-301 through 306)
SPIDER-MAN not run since BEHAVIOR.md last updated → Gate 2 = STALE
STALE for P1 = CAUTION (not hard block)

| BEH-ID | Invariant | BlackWidow Result | Test Coverage | Status |
|---|---|---|---|---|
| BEH-DASH-leads-301 | Non-owner cannot view inbox | BLOCKED (source verified) | TESTREQ-001 MISSING | ⚠️ CAUTION |
| BEH-DASH-leads-302 | Controller ops reject before DAL | BLOCKED (test confirmed) | TESTREQ-002 COMPLETE | ✅ PASS |
| BEH-DASH-leads-303 | Writes scope by profileId + leadId | BLOCKED (source verified) | TESTREQ-003 PARTIAL | ⚠️ CAUTION |
| BEH-DASH-leads-304 | Fast-count cannot bypass auth | BLOCKED (patched + tested) | TESTREQ-004 COVERED | ✅ PASS |
| BEH-DASH-leads-305 | DAL/controllers not exported public | BLOCKED (rule9 test) | TESTREQ-005 PRESENT | ✅ PASS |
| BEH-DASH-leads-306 | Public submission bypass RPC | PARTIAL — source contamination active | TESTREQ-006 EXTERNAL | ⚠️ CAUTION |

**Gate 3 — Acceptance Criteria Tested**
Total AC entries: 8
ACs with passing TESTREQs: 5/8

| AC-ID | Status | TESTREQ | Result |
|---|---|---|---|
| AC-DASH-leads-001 | SOURCE VERIFIED | TESTREQ-001 **MISSING** | **BLOCKED: UNTESTED_ACCEPTANCE_CRITERION** |
| AC-DASH-leads-002 | SOURCE + TEST VERIFIED | TESTREQ-002 COMPLETE | ✅ PASS |
| AC-DASH-leads-003 | SOURCE VERIFIED | TESTREQ-003 PARTIAL | ⚠️ CAUTION |
| AC-DASH-leads-004 | COMPLETE | TESTREQ-004 COVERED | ✅ PASS |
| AC-DASH-leads-005 | PASS | TESTREQ-005 PRESENT | ✅ PASS |
| AC-DASH-leads-006 | CAUTION | TESTREQ-006 EXTERNAL | ⚠️ CAUTION |
| AC-DASH-leads-007 | DOCUMENTED | TESTREQ-007 MISSING | ⚠️ CAUTION |
| AC-DASH-leads-008 | OPEN | TESTREQ-008 EXTERNAL | ⚠️ CAUTION |

**BLOCKED entries:** AC-DASH-leads-001 — no passing test for non-owner inbox access denial at screen level.

**Gate 4 — §5 Security Rules VENOM Reviewed**
Total §5 entries: 6 (BEH-DASH-leads-201 through 206)
VENOM ran and reviewed all 6. BEH-DASH-leads-206 = CAUTION / EXTERNAL GOVERNANCE (Edge Function).
Gate 4 = PARTIAL — VENOM reviewed all rules; BEH-206 remains open.

**Gate 5 — No Orphaned Contracts**
Superseded contracts without replacement: NONE

**Gate 6 — P2/P3 Debt (non-blocking)**
Not applicable — leads is P1.

**BEHAVIOR RELEASE GATE RESULT: BLOCKED**
Reasons: Gate 1 (DRAFT not APPROVED) + Gate 3 (AC-DASH-leads-001 untested)

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|---|---|---|---|
| apps/VCSM | YES | YES (leads + public/vportBusinessCard) | NO — within VCSM scope | ✅ PASS |
| apps/wentrex | NO | NO | — | ✅ PASS |
| apps/Traffic | PARTIAL | ELEKTRA confirmed Traffic DAL (submitProviderLead) also calls submit_business_card_lead RPC with p_ip=null | NOTED — Traffic consumes VCSM RPC; no Traffic source modification in this review | ⚠️ NOTE |
| engines | NO | NO | — | ✅ PASS |

No cross-root violation. Traffic is a consumer of the VCSM RPC — IRON-LEADS-001 documents the missing cross-root data contract. Not a blocker here but a governance gap.

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| VEN-LEADS-001 — Edge Function JWT absent | **BLOCKED** | VENOM + ELEKTRA (ELEK-2026-06-04-001) + HAWKEYE (HAWK-F-001) — source verified in send-lead-confirmation/index.ts:355–358; Bearer presence-only check; anon key public | **HARD BLOCKER** — email spam/phishing vector |
| VEN-LEADS-004 — RLS SELECT policy unverified | **BLOCKED** | SECURITY.md: "defining migration not recovered. DB must confirm policy exists." | **HARD BLOCKER** — data exposure risk cannot be assessed without confirmation |
| SECURITY.md output routing violation | **BLOCKED** | ELEKTRA + BLACKWIDOW both have primary outputs dated 2026-06-04; SECURITY.md still shows ELEKTRA: NOT RUN, BLACKWIDOW: NOT RUN. Write 2 never completed. | **HARD BLOCKER** — per §10.4 contract violation; security posture record is inaccurate |
| DR. STRANGE THOR Eligibility = BLOCKED | **BLOCKED** | INDEX.md: THOR Status = 🔴 BLOCKED; Score 35%; Coverage 21% | **HARD BLOCKER** — per §13.2 Governance Freshness Blockers |
| BEHAVIOR.md DRAFT | **BLOCKED** | BEHAVIOR.md status = DRAFT; Gate 1 failure | **HARD BLOCKER** — per Behavior Release Gate |
| AC-DASH-leads-001 untested | **BLOCKED** | TESTREQ-DASH-leads-001 MISSING — no test for non-owner screen mount rejection | **HARD BLOCKER** — per Behavior Release Gate Gate 3 |
| BEH-DASH-leads-306 — source contamination | CAUTION | BLACKWIDOW PARTIAL; attacker can insert lead with _contacted source → lead hidden from new-count and appears pre-contacted in owner inbox | CAUTION — trust boundary degradation on public submission path |
| CARNAGE PENDING | CAUTION | VEN-LEADS-003 traze_provider_lead_contacted constraint migration not executed | CAUTION — source contamination vector (ELEK-002) partially exploitable without constraint fix |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced | ✅ PASS | assertActorOwnsVportActorController on all 5 controller ops; source verified; test covered | No blocker |
| Public identity surface clean | ✅ PASS | No raw IDs in public routes; slugs used for public business card; actorId in dashboard is route-param, not surface-exposed PII | No blocker |
| VPORT lifecycle respected | ✅ PASS | is_void checked in assertActorOwnsVportActorController; void VPORT owner locked out by design | No blocker |
| Feed attribution protected | ✅ N/A | Leads module does not publish to feed | No blocker |
| Booking trust protected | ✅ N/A | Leads module is not a booking flow | No blocker |
| External API surface safe | ⚠️ PARTIAL | Edge Function reachable by external callers with anon key → VEN-LEADS-001 | CAUTION (same as critical gate above) |
| SEO indexing safe | ✅ N/A | Leads is owner-only; no public indexing surface | No blocker |

---

## NATIVE PARITY RELEASE GATE

| Native Area | PWA Blueprint | Native Status | Release Impact |
|---|---|---|---|
| Owner lead inbox | Implemented in PWA | OPEN QUESTION | CAUTION — IRON-LEADS-004 |
| New leads badge | Implemented in PWA (60s poll) | OPEN QUESTION | CAUTION |
| Mark-contacted / delete | Implemented in PWA | OPEN QUESTION | CAUTION |
| Public lead form | Implemented in PWA | OPEN QUESTION | CAUTION |

FALCON has never run. All 4 native surfaces are OPEN QUESTION in BEHAVIOR.md §15. Native parity is unknown. If this is a PWA-only release, native is N/A. If native is in scope, this is a CAUTION (not a BLOCKER for PWA release).

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| traze_provider_lead_contacted constraint (VEN-LEADS-003) | PENDING — CARNAGE not executed | N/A — not yet authored | N/A | CAUTION — source contamination attack partially effective without this |
| business_card_leads_owner_select RLS policy (VEN-LEADS-004) | UNVERIFIED — defining migration not recovered | UNKNOWN | NO — pending DB confirmation | BLOCKER — cannot confirm RLS without DB review |
| 20260524010000 (INSERT block, grant revoke) | SOURCE VERIFIED | Reversible | YES — confirmed in SECURITY.md | ✅ PASS |
| 20260524020000 (source allowlist, column-scoped grant) | SOURCE VERIFIED | Reversible | YES — confirmed in SECURITY.md | ✅ PASS |

---

## DOCUMENTATION RELEASE GATE

| Documentation Area | Status | Drift | Release Impact |
|---|---|---|---|
| SECURITY.md | STALE | ELEKTRA + BLACKWIDOW ran but never updated SECURITY.md — shows NOT RUN for both | BLOCKER — inaccurate security posture record |
| ARCHITECTURE.md | CURRENT | 2026-06-04 — STABLE | No blocker |
| OWNERSHIP.md | CURRENT | Created 2026-06-04 — PARTIAL clarity | No blocker |
| BEHAVIOR.md | DRAFT | Not APPROVED — DRAFT status | BLOCKER (Behavior Gate 1) |
| TESTS.md | MISSING | SPIDER-MAN never ran | CAUTION |
| PERFORMANCE.md | MISSING | KRAVEN never ran | CAUTION |
| HISTORY_INDEX.md | MISSING | — | LOW |

---

## Architecture Findings

ARCHITECT (2026-06-04): STABLE
- ARC-LEADS-001 LOW: Cross-module DAL import from parent vport DAL — accepted dashboard card pattern. No blocker.
- ARC-LEADS-002 MEDIUM: 60s polling fires ownership-gated DB call every cycle. Route to KRAVEN. CAUTION.
- Rule 9 compliant: index.js exports only models, hooks, screens. Confirmed by BLACKWIDOW call graph.
- Spaghetti score: CLEAN. No circular dependencies.

## Performance Findings

LOKI (2026-06-04): WATCH
- 8 serial DB reads per page load (user→vport ownership case). 3 are duplicates.
- 2–4 DB reads every 60 seconds per open session (ownership assertion not cached).
- Undebounced focus/visibilitychange ownership re-check.
- Controller chain at edge of 300ms budget (~250–320ms observed).
- KRAVEN has not run — no formal bottleneck analysis.

## Security Findings

VENOM (2026-06-04): COMPLETE — 6 open findings
- VEN-LEADS-001 HIGH OPEN THOR BLOCKER: Edge Function Bearer presence-only, no JWT validation
- VEN-LEADS-002 MEDIUM OPEN: RPC no rate limiting
- VEN-LEADS-003 MEDIUM OPEN: traze_provider_lead_contacted missing from CHECK constraint
- VEN-LEADS-004 MEDIUM OPEN THOR BLOCKER: RLS SELECT policy existence unconfirmed
- VEN-LEADS-005 LOW OPEN: CORS browser-only (fix inherited from VEN-LEADS-001)
- VEN-LEADS-006 LOW OPEN: Count DAL silently returns 0 on error

ELEKTRA (2026-06-04): 5 valid findings
- ELEK-2026-06-04-001 HIGH: Edge Function JWT — source traced to index.ts:355–358 (same as VEN-LEADS-001)
- ELEK-2026-06-04-002 MEDIUM: p_source contamination → _contacted value insertable directly via RPC
- ELEK-2026-06-04-003 MEDIUM: caller-supplied profileId to fastCountNewVportLeadsController (LOW enforcement concern)
- ELEK-2026-06-04-004 MEDIUM: p_ip hardcoded null; IP throttle permanently disabled
- ELEK-2026-06-04-005 INFO: profileId exposed in normalized lead domain object (internal field)
- **CONTRACT VIOLATION: SECURITY.md not updated after ELEKTRA run**

BLACKWIDOW (2026-06-04): 11/12 attack paths BLOCKED; 1 PARTIAL
- All ownership bypass attempts on dashboard owner layer: BLOCKED
- BEH-DASH-leads-306 PARTIAL: source contamination via direct RPC — attacker can insert lead with _contacted source, making it invisible to new-lead count and appearing pre-contacted in owner inbox
- **CONTRACT VIOLATION: SECURITY.md not updated after BLACKWIDOW run**

HAWKEYE (2026-06-04): DEGRADED — 1 FAIL, 3 PARTIAL
- HAWK-F-001 HIGH FAIL: Edge Function auth absent (VEN-LEADS-001 confirmed from contract side)
- HAWK-P-001 MEDIUM: source enum not client-validated; p_ip hardcoded null
- HAWK-P-002 MEDIUM: PII hard DELETE no audit trail
- HAWK-P-003 LOW: Redirect outside BlockedVportGuard wrapper (low severity)

## Migration Findings

CARNAGE has not run. One pending migration identified: traze_provider_lead_contacted source variant missing from DB CHECK constraint (VEN-LEADS-003). Without this, attackers can insert leads with source values that make them invisible to the owner's new-lead count and pre-marked as contacted.

## Documentation Findings

SECURITY.md output routing violation: ELEKTRA and BLACKWIDOW produced primary outputs on 2026-06-04 but never updated `SECURITY.md`. The domain file shows ELEKTRA: NOT RUN and BLACKWIDOW: NOT RUN, which is factually incorrect. This is a §10.4 contract violation. The security posture record is inaccurate. LOGAN must resolve before any release evaluation is considered clean.

BEHAVIOR.md is DRAFT. APPROVED status requires: all §9 invariants have passing tests, all critical ACs have passing TESTREQs, VENOM has reviewed §5 security rules.

## Ownership Findings

IRONMAN (2026-06-04): PARTIAL
- IRON-LEADS-001 MEDIUM: No cross-root data contract for Traffic consuming the RPC + Edge Function
- IRON-LEADS-002 HIGH: PII hard DELETE has no audit trail, no retention policy, no assigned owner
- IRON-LEADS-003 MEDIUM: ELEK-001 fix (Edge Function JWT) has no assigned owner — spans 4 files
- IRON-LEADS-004 LOW: Native parity ownership entirely unassigned

## Native Parity Findings

FALCON has never run. All native surfaces OPEN QUESTION. PWA-only release is unaffected. Native release would be BLOCKED pending FALCON.

---

## RISK ACCEPTANCE REGISTER

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| CRITICAL BLOCKERS above cannot be accepted | — | — | — | Must be resolved before THOR re-evaluates |
| LOKI observability gaps (LOKI-005, 006, 007) | MEDIUM | UNKNOWN | Background badge failures and action errors are UX-contained | Sentry instrumentation tickets must be opened |
| Native parity unknown | LOW | UNKNOWN | No native scope declared for this release | FALCON must run before native release |
| IRON-LEADS-001 cross-root data contract missing | MEDIUM | UNKNOWN | Traffic:conversion consumes VCSM RPC — behavioral contract unwritten | ARCHITECT + LOGAN must document before any Traffic/VCSM cross-dependency change |
| TESTREQ-003 PARTIAL (mark-contacted DAL arg) | LOW | UNKNOWN | Mark-contacted scope verified in source; DAL test partial | SPIDER-MAN must close in next sprint |
| TESTREQ-007 MISSING (route map assertion) | LOW | UNKNOWN | Routes source-verified; test is documentation correctness | SPIDER-MAN must close in next sprint |

---

## Recommended Actions Before Release

**Must resolve (hard blockers — no release until closed):**

1. **VEN-LEADS-001 / ELEK-001 / HAWK-F-001** — Patch `send-lead-confirmation` Edge Function to validate JWT signature against Supabase project signing secret. Remove Bearer-presence-only check.

2. **VEN-LEADS-004** — Run DB against live DB to confirm `business_card_leads_owner_select` RLS SELECT policy exists in `vport.business_card_leads`. If missing, CARNAGE must write the migration before release.

3. **SECURITY.md contract violation** — LOGAN must update SECURITY.md with ELEKTRA and BLACKWIDOW findings and change both statuses from NOT RUN to PARTIAL/COMPLETE as appropriate. DR. STRANGE must re-run after the update.

4. **BEHAVIOR.md** — Advance from DRAFT to REVIEWED (PROFESSOR X review) and then APPROVED after all §9 invariants have passing tests and VENOM confirms §5 coverage.

5. **AC-DASH-leads-001 / TESTREQ-001** — SPIDER-MAN must write the screen/hook integration test confirming non-owner callers cannot mount the leads view.

6. **DR. STRANGE re-run** — After the above items are resolved, DR. STRANGE must re-run to recalculate coverage and produce a new THOR Eligibility assessment.

**Should resolve before release (CAUTION items):**

7. **CARNAGE** — Execute traze_provider_lead_contacted source constraint migration (VEN-LEADS-003) to close the source contamination attack path identified by ELEKTRA + BLACKWIDOW.

8. **LOKI Sentry instrumentation** — Add `captureMonitoringError` to leads list load catch block (LOKI-005) and lead delete path (LOKI-008/HAWK-P-002).

9. **IRON-LEADS-002 / HAWK-P-002 / LOKI-008** — Assign an owner for the PII deletion audit trail gap. Decision needed: soft-delete vs audit log vs accepted risk. CARNAGE must design if migration is required.

---

## FINAL DECISION: BLOCKED

Six hard blockers prevent release:

1. **VEN-LEADS-001** — Edge Function auth is absent. Branded phishing emails can be sent to arbitrary addresses using the public anon key. (Security Blocker)
2. **VEN-LEADS-004** — RLS SELECT policy existence unconfirmed. Data exposure risk cannot be scoped without DB verification. (Migration/Security Blocker)
3. **SECURITY.md contract violation** — ELEKTRA and BLACKWIDOW output files exist but the domain file was never updated. The security posture record is factually incorrect. (Documentation Blocker)
4. **BEHAVIOR.md DRAFT** — Behavior contract not approved. Required before any P1 feature release. (Behavior Gate 1)
5. **AC-DASH-leads-001 untested** — Non-owner inbox denial at screen level has no passing test. (Behavior Gate 3)
6. **DR. STRANGE THOR Eligibility = BLOCKED** — Governance record independently confirms the release block. (Governance Freshness Blocker)

The leads module's owner-layer security posture is strong — all 5 controller operations are ownership-gated, source-verified, and adversarially tested by BLACKWIDOW with no bypasses. The hard blockers are concentrated at the public boundary (Edge Function) and governance completeness (SECURITY.md drift, BEHAVIOR.md approval). These are resolvable in a focused sprint.
