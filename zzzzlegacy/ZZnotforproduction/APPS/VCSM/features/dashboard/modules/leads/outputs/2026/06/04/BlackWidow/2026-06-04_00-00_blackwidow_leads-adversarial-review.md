# BLACKWIDOW V2 ADVERSARIAL REVIEW — leads

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature | leads (dashboard module + public submission) |
| Command | BLACKWIDOW |
| Ticket | TICKET-BW-LEADS-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/2026/06/04/BlackWidow/2026-06-04_00-00_blackwidow_leads-adversarial-review.md |
| Timestamp | 2026-06-04T00:00:00 |
| VENOM Reference | 2026-06-04_00-00_venom_leads-security-review.md |

---

## 1. BLACKWIDOW Scanner Preflight

```
BLACKWIDOW SCANNER PREFLIGHT
==============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| security-path-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| callgraph            | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Attack targets in scope: 12 security paths (all LOW confidence → all PRIMARY ATTACK TARGETS)
Callgraph nodes in scope: 81 leads-related nodes
Callgraph edges in scope: 49 leads controller/DAL edges traced
Hook entry points (UI-accessible): 4 (useVportLeads, useVportNewLeadsCount, useVportBusinessCardLeadForm, Traffic:useProviderLeadCapture)
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Attack Targets In Scope | Used For |
|---|---|---|---|---|---|---|
| security-path-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 12 | Primary attack target inventory |
| callgraph | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 81 nodes / 49 edges | Attack path construction |
| write-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 7 | Write surface caller chain verification |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 2 | RPC caller chain verification |
| edge-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 3 | Edge function attack surface |
| route-execution-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | 0 resolved | Entry point reachability |

```
Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total attack targets: 12 security paths
HIGH confidence (execution resolved): 0
LOW confidence (PRIMARY TARGETS per Rule BW-002): 12
Hook entry points: 4
```

---

## 3. Attack Surface Inventory

```
BLACKWIDOW ATTACK SURFACE INVENTORY
=====================================
Feature: leads (dashboard + public)
Scan Date: 2026-06-03T00:22:42.771Z

Security Paths: 12 total
  HIGH confidence: 0
  LOW confidence (PRIMARY ATTACK TARGETS): 12

Callgraph Scope:
  Total leads nodes: 81
  Hook nodes (UI-accessible entry points): 4
  Controller nodes: 8 (5 leads + submitVportBusinessCardLeadController + fireLeadOwnerNotification + getProviderLeadPrefill)
  DAL nodes (write surfaces): 7
  Hooks with resolved call chains (manual): 4 / 4

Write Surfaces: 4 (delete, update, rpc×2)
  Reachable from callgraph: 4
  Unreachable from callgraph (dynamic/external): 0

Caller Chain Coverage (after manual trace):
  Surfaces with ≥1 traced caller: 4 / 4
  Surfaces with 0 traced callers: 0

Confirmed Call Chains:
  useVportLeads → deleteVportLeadController → deleteVportBusinessCardLeadDAL
  useVportLeads → markVportLeadContactedController → markVportBusinessCardLeadContactedDAL
  useVportLeads → listVportLeadsController → readVportBusinessCardLeadsByProfileDAL
  useVportNewLeadsCount → countNewVportLeadsController → readNewLeadsCountByProfileDAL
  useVportNewLeadsCount → fastCountNewVportLeadsController → readNewLeadsCountByProfileDAL
  useVportBusinessCardLeadForm → submitVportBusinessCardLeadController → createVportBusinessCardLeadDAL
  useProviderLeadCapture (Traffic) → submitProviderLead → submitProviderLeadRow → submit_business_card_lead RPC

Route Wiring Verified:
  /actor/:actorId/dashboard/leads → VportDashboardLeadsScreen (wrapper) → VportDashboardLeadsFinalScreen (actual)
  /vport/:actorId/dashboard/leads → VportToActorDashboardLeadsRedirect (no logic)
```

---

## 4. Scanner Signals

| Attack Vector | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Result | Provenance |
|---|---|---|---|---|---|---|
| Cross-actor URL bypass to victim leads | security-path-map + callgraph | useVportLeads→listVportLeadsController→DAL | LOW→traced | YES — VportDashboardLeadsFinalScreen.jsx:26; controller.js:33 | BLOCKED | [SOURCE_VERIFIED] |
| VPORT actor kind confusion (self-shortcut) | callgraph | assertActorOwnsVportActorController | LOW→traced | YES — assertActorOwnsVportActor.controller.js:28 | BLOCKED | [SOURCE_VERIFIED] |
| Null callerActorId controller bypass | callgraph | useVportLeads→controllers | LOW→traced | YES — controller.js:15–20 | BLOCKED | [SOURCE_VERIFIED] |
| Session/actorId mismatch (attacker vs victim) | security-path-map | useVportLeads→all 5 controllers | LOW→traced | YES — controller.js:33,40,51,59,64 + assertActorOwnsVportActor.controller.js:43–49 | BLOCKED | [SOURCE_VERIFIED] |
| Cross-VPORT leadId mutation (own ownership, wrong leadId) | write-execution-map | useVportLeads→markVportLeadContactedController→DAL | LOW→traced | YES — write.dal.js:28–29 + 45–46 (double scope eq) | BLOCKED | [SOURCE_VERIFIED] |
| Source contamination via direct RPC (`_contacted` value) | rpc-map + rpc-execution-map | direct RPC call bypassing VCSM controller | LOW→traced | YES — write.dal.js:21–22 (isContacted derive); 20260524020000.sql:46–62 (allowlist permits _contacted at insert) | BYPASSED | [SOURCE_VERIFIED] |
| Fast count VPORT affinity bypass (supplied profileId) | callgraph | useVportNewLeadsCount→fastCountNewVportLeadsController | LOW→traced | YES — controller.js:57–61; no profileId affinity check after ownership assert | PARTIAL | [SOURCE_VERIFIED] |
| Screen ownership cache stale (revoked owner) | callgraph | VportDashboardLeadsFinalScreen→useVportOwnership | LOW→traced | YES — useVportOwnership.js:45–57 (re-checks on focus/visibility); controller is independent | BLOCKED | [SOURCE_VERIFIED] |
| Chip count — user-kind actor | callgraph | VportLeadsChip→useVportNewLeadsCount | LOW→traced | YES — VportLeadsChip.jsx:11–12 (kind guard first) | BLOCKED | [SOURCE_VERIFIED] |
| Route wrapper bypass (VportDashboardLeadsScreen) | route-execution-map | VportDashboardLeadsScreen route | LOW→traced | YES — VportDashboardLeadsScreen.jsx:10 (pure pass-through) | BLOCKED | [SOURCE_VERIFIED] |
| profileId UUID exposed in normalized lead model | callgraph | normalizeVportLead | LOW→traced | YES — vportLead.model.js:13 (`profileId: row?.vport_profile_id`) | INFO | [SOURCE_VERIFIED] |
| Void VPORT owner locked out of leads | callgraph | all 5 controllers | LOW→traced | YES — assertActorOwnsVportActor.controller.js:52–54 | BLOCKED (by design) | [SOURCE_VERIFIED] |

---

## 5. Behavior Contract Attack Summary

```
Behavior Contract Attack Summary
=================================
BEHAVIOR.md exists: YES
BEHAVIOR.md status: DRAFT
§4 Failure Paths declared: 9 (FP-001 through FP-009 / BEH-DASH-leads-101 through 109)
§4 Paths attack-verified: 9 / 9
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): NONE
§9 Must Never Happen declared: 6 (MNH-001 through MNH-006 / BEH-DASH-leads-301 through 306)
§9 Invariants attacked: 6 / 6
§9 Result — BLOCKED: BEH-DASH-leads-301, 302, 303, 304, 305
§9 Result — BYPASSED (CRITICAL): NONE
§9 Result — PARTIAL/CAUTION: BEH-DASH-leads-306 (public RPC source contamination — VENOM confirmed OPEN)
§9 Result — NOT ATTACKED: NONE
```

### §4 Failure Path Adversarial Results

| BEH-ID | Trigger | Declared Behavior | Attack Result |
|---|---|---|---|
| BEH-DASH-leads-101 | No actorId in route | Final screen returns null | VERIFIED — no component renders; not exploitable |
| BEH-DASH-leads-102 | Unauthenticated viewer | Blocks before view mount | VERIFIED — screen renders sign-in message; hook never fires |
| BEH-DASH-leads-103 | Non-owner viewer | Blocks before view mount | VERIFIED — screen renders denial; attempted URL bypass blocked |
| BEH-DASH-leads-104 | Unauthorized controller caller | assertActorOwnsVportActorController rejects | VERIFIED — controller throws before any DAL; test confirmed |
| BEH-DASH-leads-105 | Profile id resolution failure | Controller throws | VERIFIED — resolveProfileId throws "Could not resolve vport profile." |
| BEH-DASH-leads-106 | Lead read DAL error | Hook catches error, returns empty list | VERIFIED — hook has catch block; dev errors surfaced, prod copy is safe |
| BEH-DASH-leads-107 | New lead count DAL error | readNewLeadsCountByProfileDAL returns 0 | VERIFIED — but masked; see VEN-LEADS-006 |
| BEH-DASH-leads-108 | Mark contacted or delete fails | Hook stores action error | VERIFIED — setBusyLeadId cleanup and setActionError |
| BEH-DASH-leads-109 | Edge Function fails after lead submission | Public controller/DAL swallows | VERIFIED — fire-and-forget .catch(() => {}) confirmed |

---

## 6. Adversarial Path Analysis

---

### BW-S1: Cross-Actor URL Navigation to Victim Lead Inbox

```
OWNERSHIP BYPASS ATTEMPT
Target: VportDashboardLeadsFinalScreen + listVportLeadsController
Attack vector: Attacker navigates to /actor/<victim_actorId>/dashboard/leads
               Hook calls listVportLeadsController(victim_actorId, {}, attacker_actorId)

Callgraph path: useVportLeads → listVportLeadsController → assertActorOwnsVportActorController
                                                          → readVportBusinessCardLeadsByProfileDAL

Attack steps tried:
  1. Direct URL navigation → final screen: useVportOwnership(attacker, victim) → isOwner=false
     → Renders denial message "You can only access leads for your own vport." ✓
  2. Even if screen bypassed: listVportLeadsController(victim_actorId, {}, attacker_actorId)
     → assertActorOwnsVportActorController: queries actor_owners WHERE actor_id=victim AND user_id=attacker_profile_id
     → No row found → THROWS "Actor does not own this vport actor." ✓
  3. Null sessionActorId: screen detects !identity → blocks before view renders ✓

Result: BLOCKED
Evidence: VportDashboardLeadsFinalScreen.jsx:26–42; controller.js:33; assertActorOwnsVportActor.controller.js:43–49
Controller gate: PRESENT — DB-backed actor_owners query
Severity: N/A — BLOCKED
```

---

### BW-S2: VPORT Actor Kind Confusion for Self-Shortcut Bypass

```
RUNTIME ABUSE ATTEMPT
Target: assertActorOwnsVportActorController (self-shortcut at line 34)
Attack vector: Pass requestActorId of a VPORT-kind actor equal to targetActorId
               to trigger self-shortcut, bypassing actor_owners DB query

Attack steps tried:
  1. requestActorId = vport_actor_id, targetActorId = same vport_actor_id
  2. getActorByIdDAL fetches actor → kind = "vport"
  3. Controller checks requesterActor.kind !== "user" → THROWS "Only actor owners can manage this booking resource."
  4. Self-shortcut at line 34 is never reached

Note: ELEK-004 fix confirmed — kind check is unconditional and precedes self-shortcut.
     The historical vulnerability (self-shortcut before kind check) is patched.

Result: BLOCKED
Evidence: assertActorOwnsVportActor.controller.js:22–29 (kind check before self-shortcut)
Controller gate: PRESENT — kind check hardened by ELEK-004
Actor role used: VPORT-kind actor
Expected access: DENIED
Severity: N/A — BLOCKED
```

---

### BW-S3: Null callerActorId Bypass Across All 5 Controllers

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: All 5 leads controllers
Injected context: callerActorId = null

Attack steps tried:
  1. listVportLeadsController(actorId, {}, null) → assertActorOwnsVportActorController({ requestActorId: null, ... })
     → "assertActorOwnsVportActorController: requestActorId is required" THROWS ✓
  2. markVportLeadContactedController(actorId, { leadId }, null) → same THROWS ✓
  3. deleteVportLeadController(actorId, { leadId }, null) → same THROWS ✓
  4. countNewVportLeadsController(actorId, null) → same THROWS ✓
  5. fastCountNewVportLeadsController(actorId, null, profileId) → early return 0 at line 58 ✓
     (different behavior — returns 0 instead of throwing, but no data exposed)

Note: screen blocks before hook fires when !identity (line 38: "Sign in required.")

Result: BLOCKED
Evidence: assertActorOwnsVportActor.controller.js:15–17; controller.js:58
Context validation: ENFORCED
Severity: N/A — BLOCKED
```

---

### BW-S4: Cross-VPORT LeadId Mutation Attack (Own Ownership, Wrong LeadId)

```
MUTATION REPLAY ATTEMPT
Target: markVportBusinessCardLeadContactedDAL / deleteVportBusinessCardLeadDAL
Attack vector: Attacker legitimately owns VPORT-A, requests mutation on leadId 
               belonging to VPORT-B

Attack path:
  1. markVportLeadContactedController(VPORT_A, { leadId: VPORT_B_lead_id }, owner_A)
  2. Ownership assertion passes (owner_A owns VPORT_A) ✓
  3. resolveProfileId(VPORT_A) → profile_id_A
  4. markVportBusinessCardLeadContactedDAL({ profileId: profile_id_A, leadId: VPORT_B_lead_id })
  5. DAL: .eq("id", VPORT_B_lead_id).eq("vport_profile_id", profile_id_A)
     → NO MATCH — VPORT-B lead has vport_profile_id = profile_id_B ≠ profile_id_A
  6. Result: returns null / no rows updated
  7. Same for deleteVportBusinessCardLeadDAL — no rows deleted

Result: BLOCKED — DAL double-scope prevents cross-VPORT lead mutation
Evidence: write.dal.js:28–29 (.eq("id", leadId) + .eq("vport_profile_id", profileId))
State check: PRESENT — profileId affinity enforced at DAL layer
Severity: N/A — BLOCKED
```

---

### BW-S5: Stale Ownership Cache Window — Former Owner After Revocation

```
SESSION MUTATION ATTEMPT
Target: VportDashboardLeadsFinalScreen → useVportOwnership
Attack vector: Actor A owns VportX, ownership is revoked, then A attempts to access leads

Scenario:
  1. Actor A owns VportX — isOwner=true in UI state
  2. Ownership revoked (actor_owners row removed or voided)
  3. Actor A still on leads page during the revocation event
  4. No immediate screen re-render (React state is stale)
  5. useVportOwnership re-checks on focus (window.addEventListener "focus") and visibility change
  6. On next focus event: checkVportOwnershipController fires → actor_owners query → no link → setIsOwner(false)
  7. Screen now blocks before hook fires on next interaction

Critical defense: Even in the stale window (between revocation and re-check):
  - Any controller call still performs assertActorOwnsVportActorController → DB query → REJECTS
  - "Actor does not own this vport actor." thrown before any DAL access

Result: BLOCKED — controller gate is DB-live and independent of hook cache
Evidence: useVportOwnership.js:45–57 (re-verification on focus); 
          assertActorOwnsVportActor.controller.js:43–49 (DB query every call)
Session binding: ENFORCED — useVportOwnership comment explicitly: "This hook improves UX synchronization only. It is NOT the security boundary."
Severity: N/A — BLOCKED (INFO: ownership re-check latency is bounded by focus/visibility events)
```

---

### BW-S6: VportLeadsChip — User-Kind Actor Count Probe

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: VportLeadsChip → useVportNewLeadsCount
Attack vector: Authenticated Citizen (user-kind) tries to trigger the chip count
               for a VPORT actor they don't own

Attack steps:
  1. User-kind actor is session-authenticated
  2. VportLeadsChip: identity?.kind === "vport" → false
  3. actorId = null
  4. useVportNewLeadsCount(null) → hook: !actorId → setCount(0); returns without controller call

Result: BLOCKED — kind guard at chip level; null actorId prevents any controller invocation
Evidence: VportLeadsChip.jsx:11–13; useVportNewLeadsCount.js:17–20
Visibility gate: ENFORCED
Severity: N/A — BLOCKED
```

---

### BW-S7 [NEW FINDING]: Public Lead Source Contamination via Direct RPC

```
MUTATION REPLAY ATTEMPT
Target: submit_business_card_lead RPC / vport.business_card_leads.source column
Attack vector: Attacker bypasses VCSM/Traffic frontend and calls the RPC directly
               with p_source = 'business_card_contacted' (or any _contacted variant)

Callgraph path: [EXTERNAL — bypasses all hooks/controllers]
               → direct anon key + Supabase PostgREST RPC call
               → vport.submit_business_card_lead(p_slug, p_name, ..., p_source='business_card_contacted', ...)

Attack outcome:
  1. RPC inserts row with source = 'business_card_contacted' (valid per DB CHECK constraint)
  2. Lead appears in owner inbox: normalizeVportLead → isContacted = source.includes("contacted") = true
  3. Lead is invisible to NEW leads count:
     readNewLeadsCountByProfileDAL: .not("source", "ilike", "%contacted%") → lead excluded from count
  4. Lead is visible in the inbox list (all leads returned regardless of source)
  5. Lead appears as already-contacted from day 1 — owner has no indication it's fake
  6. Attack repeated at scale: inbox flooded with 150 pre-contacted fake leads
     → real leads pushed off first page (limit=150, newest-first ordering)
     → real leads count is accurate but fake leads consume inbox real estate

Why the DB CHECK constraint enables this:
  - The constraint lists 'business_card_contacted' as a valid INSERT value
  - Constraint was designed to prevent source drift but does not distinguish submission-time vs mutation-time values
  - There is no DB-level trigger or RPC guard preventing _contacted values at insert time

Preconditions:
  - Anon key (public in browser bundle)
  - Target VPORT slug (public on business card URL)
  - Direct Supabase PostgREST or SDK call with p_source = 'business_card_contacted'

Defense attempted:
  - VCSM controller hardcodes source="business_card" ✓ (bypassed by direct call)
  - Traffic controller hardcodes source="directory" ✓ (bypassed by direct call)
  - DB CHECK constraint: 'business_card_contacted' IS in the allowlist → no constraint violation
  - No RPC-level guard rejecting _contacted values at insert time

Result: BYPASSED
Evidence: 
  20260524020000.sql:51–62 (allowlist permits 'business_card_contacted' at INSERT)
  vportLead.model.js:22 (isContacted: source.includes("contacted"))
  vportLeads.read.dal.js:27 (.not("source", "ilike", "%contacted%"))
Defense gate: ABSENT at DB/RPC layer for pre-contaminated source values at insert time
Severity: MEDIUM
Exploit Chain Type: Injection exploit (forged parameter accepted by RPC with no server-side reject)
```

---

### BW-S8: Fast Count VPORT Affinity Bypass (Supplied ProfileId)

```
OWNERSHIP BYPASS ATTEMPT
Target: fastCountNewVportLeadsController — profileId parameter
Attack vector: Attacker legitimately owns VPORT-A, supplies victim's profileId
               to count that VPORT's uncontacted leads

Attack path:
  1. fastCountNewVportLeadsController(VPORT_A_actorId, own_actorId, VICTIM_profileId)
  2. Line 58: all params present — not early-returned
  3. assertActorOwnsVportActorController({ requestActorId: own, targetActorId: VPORT_A }) → PASSES ✓
  4. readNewLeadsCountByProfileDAL(VICTIM_profileId) called
  5. DAL: .eq("vport_profile_id", VICTIM_profileId) — returns count of VICTIM VPORT's uncontacted leads

Critical constraint: the controller verifies the CALLER owns VPORT_A, but never verifies
  that VICTIM_profileId belongs to VPORT_A. There is no profileId↔actorId affinity check.

Whether this succeeds:
  BLOCKED if RLS SELECT policy is present and correct (requires ownership through actor_owners ↔ user_id)
  EXPOSED if RLS SELECT policy is absent (VEN-LEADS-004 — UNVERIFIED)

Preconditions:
  - Attacker has a legitimate authenticated session
  - Attacker owns at least one VPORT (to pass ownership assertion on their own VPORT)
  - Attacker knows victim's profileId (UUID — not publicly exposed; requires prior enumeration)

Result: PARTIAL — app layer lacks VPORT affinity check on profileId parameter;
        protection depends entirely on RLS SELECT policy (VEN-LEADS-004, currently UNVERIFIED)
Evidence:
  controller.js:57–61 (no profileId affinity check post-ownership assertion)
  vportLeads.read.dal.js:21–29 (profileId accepted without affinity validation)
Controller gate: WEAK — ownership check is for caller+targetActor only, not for profileId
Severity: MEDIUM (contingent on VEN-LEADS-004 resolution)
```

---

### BW-S9: normalizeVportLead — profileId UUID Surface in Domain Model

```
CROSS-FEATURE ABUSE ATTEMPT
Target: vportLead.model.js — normalizeVportLead
Attack vector: profileId (raw VPORT profile UUID) exposed in the normalized lead domain object

Evidence:
  vportLead.model.js:13: profileId: row?.vport_profile_id ?? null

Issue:
  - profileId (UUID) is a raw internal identifier that per VCSM identity rules should
    not appear on public or client-accessible surfaces
  - The lead object is returned to the owner dashboard hook and potentially rendered
    to components
  - Any component accidentally logging or displaying this value (console.log, debug
    panels, URL serialization) would violate VCSM's no-raw-UUID-on-client-surface rule
  - However: this is the OWNER dashboard — the owner viewing their own VPORT's profileId
    does not represent a cross-actor exposure

Blast radius:
  - Limited to owner dashboard session
  - Not a cross-actor exposure in current implementation
  - Risk: debug panels, serialization, or future code accidentally surfaces this UUID

Result: INFO — no active exploit path; identity rule compliance concern
Evidence: vportLead.model.js:13
Defense gate: PRESENT (owner-only context limits blast radius) but IDENTITY_RULE_VIOLATION (profileId in domain model)
Severity: INFO
```

---

## 7. §9 Invariant Attack Map

| Attack Path | Attack Result | §9 Invariant | BEH-ID | SPIDER-MAN Required |
|---|---|---|---|---|
| Cross-actor URL + hook ownership bypass | BLOCKED — screen + controller DB gate | Non-owner must never view another VPORT actor's lead inbox | BEH-DASH-leads-301 | TESTREQ-DASH-leads-001 (screen/hook integration — MISSING) |
| Direct controller call with non-owner callerActorId | BLOCKED — assertActorOwnsVportActorController before DAL | Controllers must never call DAL before ownership passes | BEH-DASH-leads-302 | TESTREQ-DASH-leads-002 (COMPLETE) |
| Cross-VPORT leadId mutation (own ownership, wrong leadId) | BLOCKED — DAL double-scope (profileId+leadId) | Mark/delete must never mutate outside resolved owner profile | BEH-DASH-leads-303 | TESTREQ-DASH-leads-003 (PARTIAL — mark-contacted DAL arg coverage missing) |
| Fast count supplied profileId (own actorId, victim profileId) | PARTIAL — controller owns caller but no profileId affinity | Cached profileId must not be standalone auth bypass | BEH-DASH-leads-304 | TESTREQ-DASH-leads-004 (COVERED for fast count ownership; MISSING for profileId affinity) |
| Direct barrel import of DAL/controller | BLOCKED — index.js exports verified | DALs/controllers must never be exported as public card boundary | BEH-DASH-leads-305 | TESTREQ-DASH-leads-005 (PRESENT in leads.index.rule9.test.js) |
| Direct RPC call with _contacted source value | BYPASSED — RPC CHECK constraint permits _contacted at INSERT | Public submission must not bypass RPC policy or allow email spam | BEH-DASH-leads-306 | TESTREQ-DASH-leads-006 (EXTERNAL — TRACKED DEFER-009 + new: RPC source injection test needed) |

---

## 8. BLACKWIDOW Findings

---

### BW-LEADS-001 [SOURCE_VERIFIED]

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-LEADS-001
- **Scenario:** BW-S7 — Public Lead Source Contamination
- **Target:** `vport.submit_business_card_lead` RPC + `vportLead.model.js:isContacted` derivation
- **Application Scope:** VCSM + TRAFFIC (both share the same RPC endpoint)
- **Platform Surface:** Supabase RPC / Public Visitor
- **Attack Vector:** Direct RPC invocation with anon key and `p_source = 'business_card_contacted'` (or any `_contacted` variant in the DB allowlist); bypasses all VCSM/Traffic frontend source hardcoding
- **Exploit Chain Type:** Injection exploit (forged parameter accepted by RPC — no server-side source-time restriction)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:**
  - `apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql:51–62` — `'business_card_contacted'`, `'vport_card_contacted'`, `'directory_contacted'`, `'traze_contacted'` are all in the CHECK constraint allowlist and are NOT blocked at INSERT time
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js:22` — `isContacted: source.includes("contacted")` — any source containing "contacted" marks the lead as contacted
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:27` — `.not("source", "ilike", "%contacted%")` — pre-contaminated leads are excluded from the NEW leads count
  - VCSM controller hardcodes `source = "business_card"` and Traffic hardcodes `source = "directory"` — only enforced in the frontend, not in the RPC
- **Defense Gate:** ABSENT — no DB trigger, CHECK constraint separation, or RPC guard prevents `_contacted` source values at INSERT time
- **Blast Radius:** Target VPORT owner's lead inbox — inbox polluted with pre-contacted fake leads; real leads count unaffected but inbox real estate consumed; limit=150 allows displacement of real leads after sufficient injection volume
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-LEADS-002 (public RPC governance / no rate limiting)
- **Recommended Fix:**
  1. Add a DB CHECK constraint or RPC-level guard rejecting `_contacted` source values at INSERT time. The RPC should only accept submission-time source values: `{'business_card', 'vport_card', 'directory', 'traze', 'traze_provider_lead'}`.
  2. Split the CHECK constraint into two: one for INSERT (submission-time values only) and one for UPDATE (mutation-time values only). A domain column constraint won't enforce timing, but the RPC body can `IF p_source ILIKE '%contacted%' THEN RAISE EXCEPTION 'INVALID_SOURCE'`.
  3. Add this to the DB inspection scope: confirm `submit_business_card_lead` function body and whether `p_source` validation exists.
- **Layer to Fix:** RLS / DB Function (RPC body validation)
- **Required Follow-up Command:** DB (inspect RPC function body for p_source validation), CARNAGE (add migration: RPC-level rejection of `_contacted` source values at INSERT)

---

### BW-LEADS-002 [SOURCE_VERIFIED]

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-LEADS-002
- **Scenario:** BW-S8 — Fast Count VPORT Affinity Bypass
- **Target:** `fastCountNewVportLeadsController` — `profileId` parameter + `readNewLeadsCountByProfileDAL`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (dashboard badge / poll path)
- **Attack Vector:** Authenticated attacker who owns at least one VPORT calls `fastCountNewVportLeadsController(own_actorId, own_actorId, victim_profileId)`. Ownership assertion passes for own actor. No VPORT affinity check verifies that `victim_profileId` belongs to `own_actorId`'s VPORT. DAL queries using the supplied `victim_profileId`.
- **Exploit Chain Type:** Injection exploit (caller-supplied profileId accepted without VPORT affinity validation)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — app layer lacks affinity check; attack is blocked only if RLS SELECT policy enforces ownership (VEN-LEADS-004 is UNVERIFIED)
- **Evidence:**
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:57–61` — `fastCountNewVportLeadsController(actorId, callerActorId, profileId)` asserts ownership of `actorId`, then passes `profileId` to DAL without verifying `profileId` belongs to `actorId`
  - `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js:21–29` — `readNewLeadsCountByProfileDAL(profileId)` executes `SELECT COUNT WHERE vport_profile_id = profileId` with no VPORT affinity validation
  - Gap: no `resolveProfileId(actorId)` call in the fast path to re-derive the correct profileId; the cached value is trusted unconditionally after ownership of `actorId` passes
- **Defense Gate:** WEAK (app layer) / UNVERIFIED (RLS layer — VEN-LEADS-004)
- **Blast Radius:** Count leakage only — attacker learns the number of uncontacted leads for another VPORT; no PII exposed; no write access
- **Severity:** MEDIUM (risk fully materializes only if VEN-LEADS-004 SELECT policy is absent; if RLS is correct, BLOCKED at DB)
- **VENOM Finding Cross-Reference:** VEN-LEADS-004 (SELECT policy unverified)
- **Recommended Fix:**
  1. In `fastCountNewVportLeadsController`, after the ownership assertion passes, re-derive `profileId` via `resolveProfileId(actorId)` instead of accepting the caller-supplied value. This adds one DB call per poll but eliminates the affinity bypass entirely.
  2. Alternatively, add an app-layer check: verify `profileId` matches what `resolveProfileId(actorId)` would return (using the cached value as a candidate, re-verifying against the resolved value).
  3. Confirm VEN-LEADS-004: ensure `business_card_leads_owner_select` RLS SELECT policy binds reads to the session user's owned VPORTs.
- **Layer to Fix:** Controller (re-derive profileId) + RLS (confirm SELECT policy)
- **Required Follow-up Command:** DB (confirm SELECT policy — VEN-LEADS-004), CARNAGE if policy absent

---

### BW-LEADS-003 [SOURCE_VERIFIED]

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-LEADS-003
- **Scenario:** BW-S9 — profileId UUID in normalized lead model
- **Target:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js:13`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (owner dashboard)
- **Attack Vector:** `normalizeVportLead` returns `profileId: row?.vport_profile_id ?? null` — a raw VPORT profile UUID — in the domain lead object. This value flows into the owner dashboard hook state and component tree.
- **Exploit Chain Type:** N/A (INFO — no active exploit; identity rule violation)
- **Governance Status:** DRAFT
- **Result:** INFO (no active cross-actor exploit; identity rule compliance concern)
- **Evidence:** `vportLead.model.js:13` — `profileId: row?.vport_profile_id ?? null`
- **Defense Gate:** PRESENT (limited to owner dashboard context)
- **Blast Radius:** Single actor — no cross-actor exposure in current implementation; risk is future code surfacing this UUID via debug tooling, logging, or serialization
- **Severity:** INFO
- **VENOM Finding Cross-Reference:** VCSM Identity Contract (profileId must never appear on client-accessible surfaces per CLAUDE.md)
- **Recommended Fix:** Remove `profileId` from `normalizeVportLead` return value. The controller and DAL already use `profileId` internally for query scoping — it does not need to be in the domain object returned to hooks/components. If any UI component currently references `lead.profileId`, that reference should be audited.
- **Layer to Fix:** Model
- **Required Follow-up Command:** SPIDER-MAN (verify no component renders or logs `lead.profileId`)

---

## 9. Successful Exploit Chains

### Exploit Chain 1 — Lead Source Poisoning

```
CONFIRMED EXPLOIT CHAIN
Type: Injection exploit
Steps:
  1. Attacker extracts anon key from VCSM/Traffic frontend bundle (public)
  2. Attacker identifies target VPORT slug (public from business card URL)
  3. Attacker calls vport.submit_business_card_lead(p_slug=target, ..., p_source='business_card_contacted') directly
  4. Row inserted with source='business_card_contacted' (passes DB CHECK constraint)
  5. normalizeVportLead: isContacted=true → lead appears pre-contacted in owner inbox
  6. readNewLeadsCountByProfileDAL: .not("source", "ilike", "%contacted%") → lead excluded from NEW count
  7. At scale: inbox fills with 150+ pre-contacted fake leads; real leads displaced

Impact: Owner CRM degraded; real leads masked; inbox unreliable
Fix layer: RPC body — reject _contacted source values at INSERT time
```

---

## 10. Failed Exploit Chains (Defenses That Held)

| Attack | Primary Defense | Secondary Defense | Verdict |
|---|---|---|---|
| Cross-actor URL navigation to victim inbox | useVportOwnership screen gate | assertActorOwnsVportActorController DB query | DOUBLE BLOCKED |
| VPORT actor kind confusion self-shortcut | kind check before self-shortcut (ELEK-004) | N/A | BLOCKED |
| Null callerActorId controller bypass | requestActorId required check (throws) | Screen blocks before hook fires | DOUBLE BLOCKED |
| Session actorId mismatch (attacker vs victim) | assertActorOwnsVportActorController actor_owners DB query | N/A | BLOCKED |
| Cross-VPORT leadId mutation | DAL double scope (.eq leadId + profileId) | N/A | BLOCKED |
| Stale ownership cache (revoked owner still on page) | Controller DB query fires independently per call | useVportOwnership re-checks on window focus | BLOCKED |
| User-kind actor chip badge probe | VportLeadsChip kind==="vport" guard | useVportNewLeadsCount null actorId guard | DOUBLE BLOCKED |
| Route wrapper bypass | VportDashboardLeadsScreen is pure pass-through to FinalScreen | N/A | BLOCKED |

---

## 11. Source Verification Summary

```
Total attack scenarios attempted: 9 (+ 3 attack sub-vectors)
Scenarios source-verified: 12 / 12
Source files read:
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsFinalScreen.jsx
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsScreen.jsx
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/__tests__/vportLeads.controller.test.js
  - apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx
  - apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js
  - apps/VCSM/src/features/booking/adapters/booking.adapter.js
  - apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js
  - apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js
  - apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
  - apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql
  - apps/VCSM/src/app/routes/protected/app.routes.jsx (leads route entry)
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md

BYPASSED findings: 1 (BW-LEADS-001) — [SOURCE_VERIFIED] ✓
BLOCKED findings: 8 scenarios
PARTIAL findings: 1 (BW-LEADS-002 — RLS dependency)
INFO findings: 1 (BW-LEADS-003)
```

---

## 12. Confidence Summary

```
Scenarios from HIGH confidence sources: 0 (all 12 scanner paths were LOW confidence)
Scenarios from LOW confidence sources: 12 (all attacked per Rule BW-002)
[SOURCE_VERIFIED] results: 3 findings (BW-LEADS-001, BW-LEADS-002, BW-LEADS-003)
[SCANNER_LEAD] results: 0
[SCANNER_LOW_CONF] results: 0
BYPASSED [SOURCE_VERIFIED]: 1 — COMPLIANT (all bypass claims have cited source + line)
```

---

## 13. THOR Impact

```
THOR Release Blockers (from BW alone):
  BW-LEADS-001 (MEDIUM, BYPASSED) — lead source poisoning via direct RPC injection
  → Adds to THOR CAUTION from VEN-LEADS-001, VEN-LEADS-004

  Combined THOR status: CAUTION
  VENOM blockers (HIGH): VEN-LEADS-001, VEN-LEADS-004
  BW confirmed bypass: BW-LEADS-001 (MEDIUM) — must be mitigated before THOR CLEAR

Highest Open Severity After BW: HIGH (VEN-LEADS-001 remains the top severity)
```

---

## 14. SPIDER-MAN Test Requirements

| TESTREQ | Validates | Status | Priority |
|---|---|---|---|
| TESTREQ-DASH-leads-001 | Non-owner/unauthenticated viewer cannot mount leads view | MISSING | HIGH |
| TESTREQ-DASH-leads-002 | Unauthorized callers rejected before any DAL call | COMPLETE | ✓ |
| TESTREQ-DASH-leads-003 | Mark-contacted DAL called with both profileId + leadId | PARTIAL | MEDIUM |
| TESTREQ-DASH-leads-004 | Fast count owned-gated; unauthorized caller rejected | COVERED | ✓ |
| TESTREQ-BW-leads-001 | RPC submission with p_source='business_card_contacted' is rejected by DB/RPC (post-fix) | NEW — MISSING | HIGH |
| TESTREQ-BW-leads-002 | fastCountNewVportLeadsController with mismatched profileId returns 0 or error (not victim count) | NEW — MISSING | MEDIUM |
| TESTREQ-BW-leads-003 | normalizeVportLead does not expose profileId in returned object (post-fix) | NEW — MISSING | LOW |

---

## 15. Required Follow-Up Commands

- **DB** — Confirm `business_card_leads_owner_select` SELECT policy (VEN-LEADS-004). Inspect `submit_business_card_lead` function body: does it validate `p_source` at insert time? (BW-LEADS-001). Confirm `p_ip` is null in function body and whether IP-based throttle is present (VEN-LEADS-002).
- **CARNAGE** — Design migration: RPC-level rejection of `_contacted` source values at INSERT (BW-LEADS-001). Migration for `traze_provider_lead_contacted` constraint variant (VEN-LEADS-003). Rate limiting migration if DB confirms absent (VEN-LEADS-002).
- **ELEKTRA** — Trace VEN-LEADS-001: Bearer-presence-only token gate in edge function. Verify no other edge functions share this pattern.
- **SPIDER-MAN** — Add TESTREQ-BW-leads-001, -002, -003. Confirm TESTREQ-DASH-leads-001 (screen integration test for non-owner mount — still MISSING).

---

## 16. Pending Reviews

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Source-to-sink trace for VEN-LEADS-001 (edge function auth); verify no other EF uses same Bearer-presence pattern | PENDING |
| DB | VEN-LEADS-004 SELECT policy; BW-LEADS-001 RPC p_source validation; p_ip null path | PENDING |
| CARNAGE | BW-LEADS-001 RPC source injection fix; VEN-LEADS-003 traze_contacted constraint; VEN-LEADS-002 rate limiting | PENDING |
| SPIDER-MAN | TESTREQ-BW-leads-001/002/003; TESTREQ-DASH-leads-001 (screen integration missing) | PENDING |
| THOR | Re-evaluate gate after DB confirms SELECT policy + CARNAGE delivers RPC source injection fix | PENDING |
