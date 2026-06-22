# IRONMAN Ownership Report — leads

**Date:** 2026-06-04
**Reviewer:** IRONMAN
**Application Scope:** VCSM + TRAFFIC (cross-root shared infrastructure)
**Ownership Clarity:** PARTIAL
**Boundary Risk:** MEDIUM

---

## IRONMAN TARGET

```
Feature / Engine:  leads — dashboard owner inbox + public submission + shared DB/Edge infrastructure
Application Scope: VCSM (primary) + TRAFFIC (independent consumer of shared RPC + Edge Function)
Reason for review: Post-security-sprint ownership formalization following VENOM + BLACKWIDOW + ELEKTRA audit
```

---

## 1. Code Roots

```
CODE ROOTS

VCSM — Dashboard Owner Inbox (Primary System):
  Primary path:   apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/
  Entry files:    VportDashboardLeadsFinalScreen.jsx (route entry)
                  VportDashboardLeadsScreen.jsx (route compat wrapper → delegates to FinalScreen)
  Adapter surface: apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js
                   exports: VportLeadsChip

VCSM — Public Submission (Consumer/Creator System):
  Primary path:   apps/VCSM/src/features/public/vportBusinessCard/
  Lead-relevant:  dal/vportBusinessCardLead.write.dal.js
                  dal/sendLeadConfirmationEmail.edge.dal.js
                  controller/vportBusinessCard.controller.js
                  hooks/useVportBusinessCardLeadForm.js
                  view/BusinessCardLeadForm.jsx

VCSM — Edge Function:
  Primary path:   apps/VCSM/supabase/functions/send-lead-confirmation/
  Entry file:     index.ts

TRAFFIC — Conversion (Independent Consumer):
  Primary path:   apps/Traffic/src/features/conversion/
  Lead-relevant:  dal/submitProviderLead.write.dal.js
                  controller/submitProviderLead.controller.js
                  hooks/useProviderLeadCapture.js
                  model/providerLead.model.js
                  components/ProviderLeadCaptureCard.jsx
  Adapter:        adapters/conversion.adapter.js

VCSM — Cross-Feature Support:
  Ownership gate: apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js
  Ownership hook: apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js
  Ownership UI:   apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js
  Notification:   apps/VCSM/src/features/notifications/adapters/notifications.adapter.js (publishVcsmNotification)
  Component:      apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx

VCSM — Routes:
  Protected:      /actor/:actorId/dashboard/leads → VportDashboardLeadsScreen
  Redirect:       /vport/:actorId/dashboard/leads → VportToActorDashboardLeadsRedirect

VCSM — Migrations:
  apps/VCSM/supabase/migrations/20260427060000_grant_vport_write_permissions.sql
  apps/VCSM/supabase/migrations/20260427070000_sync_business_card_published_for_listed_providers.sql
  apps/VCSM/supabase/migrations/20260427080000_grant_business_card_leads_owner_write.sql
  apps/VCSM/supabase/migrations/20260524010000_business_card_leads_p0_security.sql
  apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql
```

---

## 2. Layer Map

```
LAYER MAP — VCSM Dashboard Owner Inbox

DAL (Read):
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js
    readVportBusinessCardLeadsByProfileDAL — returns paginated lead list for profileId
    readNewLeadsCountByProfileDAL — counts uncontacted leads for profileId

DAL (Write):
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js
    markVportBusinessCardLeadContactedDAL — UPDATE source WHERE id+profileId
    deleteVportBusinessCardLeadDAL — DELETE WHERE id+profileId

Model:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.model.js
    normalizeVportLead — raw DB row → domain lead object (owns isContacted derivation)
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportLead.display.model.js
    formatLeadDate, formatSourceLabel, previewMessage — display formatting
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/model/vportDashboardLeadsScreen.model.js
    re-exports display models for screen consumption

Controller:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js
    listVportLeadsController
    countNewVportLeadsController
    fastCountNewVportLeadsController
    markVportLeadContactedController
    deleteVportLeadController
    (private) resolveProfileId

Hook:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js
    useVportLeads — list, mark-contacted, delete operations
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js
    useVportNewLeadsCount — background polling badge count

Screen:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsFinalScreen.jsx
    Route entry + identity gate + ownership gate. Delegates to View.
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsScreen.jsx
    Route compatibility wrapper — pure pass-through to FinalScreen.

View:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsView.jsx
    Owner inbox list + action surface

Barrel:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/index.js
    Exports: models, hooks, screens only. NO DALs or controllers (Rule 9 compliant).

Tests:
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/__tests__/vportLeads.controller.test.js
    Ownership gate regression + DAL call verification
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/__tests__/leads.index.rule9.test.js
    Barrel export compliance test

LAYER MAP — VCSM Public Submission

DAL:
  apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
    createVportBusinessCardLeadDAL — calls submit_business_card_lead RPC
  apps/VCSM/src/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js
    sendLeadConfirmationEmailDAL — fire-and-forget edge function invocation

Model:
  apps/VCSM/src/features/public/vportBusinessCard/model/vportBusinessCard.model.js
    validateVportBusinessCardLeadInput — name/phone/email/message validation

Controller:
  apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js
    submitVportBusinessCardLeadController — validate → RPC → fire email → fire notification
    fireLeadConfirmationEmail — private helper
    fireLeadOwnerNotification — private helper

Hook:
  apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js
    useVportBusinessCardLeadForm — form state + submission

View:
  apps/VCSM/src/features/public/vportBusinessCard/view/BusinessCardLeadForm.jsx

LAYER MAP — Edge Function

Edge Function:
  apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
    Deno-based. AWS SES email sender. Bearer-only auth (open finding ELEK-001).

LAYER MAP — Traffic Conversion

DAL:
  apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
    submitProviderLeadRow — calls same submit_business_card_lead RPC
    invokeProviderLeadConfirmation — calls same send-lead-confirmation edge function

Model:
  apps/Traffic/src/features/conversion/model/providerLead.model.js

Controller:
  apps/Traffic/src/features/conversion/controller/submitProviderLead.controller.js
    submitProviderLead — validate → RPC + confirmation (fire-and-forget)
    getProviderLeadPrefill — optional session prefill

Hook:
  apps/Traffic/src/features/conversion/hooks/useProviderLeadCapture.js

Component:
  apps/Traffic/src/features/conversion/components/ProviderLeadCaptureCard.jsx
```

---

## 3. Dependency Ownership

```
DEPENDENCY OWNERSHIP

Engines / Cross-Feature Used by VCSM Dashboard Owner Inbox:
  booking.adapter → assertActorOwnsVportActorController
    Owner:   VCSM:booking feature
    Purpose: Canonical DB-backed actor ownership gate (9 call sites platform-wide)
    Boundary: Approved §5.3 cross-feature adapter exception (documented in adapter comment)

  dashboard/vport/controller → checkVportOwnership.controller.js
    Owner:   VCSM:dashboard vport sub-system
    Purpose: Boolean ownership check for UI hook (useVportOwnership)
    Note:    This is NOT the security boundary — the controller gate is.

  dashboard/vport/hooks → useVportOwnership
    Owner:   VCSM:dashboard vport sub-system
    Purpose: UX synchronization for screen rendering (fail-closed on error)

  state/identity → identityContext / useIdentity
    Owner:   VCSM shared identity state (app-level)
    Purpose: Session actor resolution for callerActorId

  dashboard/vport/dal → readVportProfileByActorIdDAL (via resolveProfileId)
    Owner:   VCSM:dashboard vport profile sub-system
    Purpose: actor_id → vport_profile_id resolution

  notifications.adapter → publishVcsmNotification
    Owner:   VCSM:notifications feature
    Purpose: lead_received notification to VPORT owner after lead submission
    Note:    Only the public submission path (VCSM:public) uses this; the dashboard module does not.

External Services Used:
  Supabase (vport schema client) — all DAL reads/writes
  AWS SES (via send-lead-confirmation edge function) — confirmation emails
  Supabase Functions runtime — edge function hosting
```

---

## 4. Data Ownership Registry

```
DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| vport.business_card_leads (table) | VCSM:dashboard (manage) | VCSM:dashboard owner inbox | VCSM:public (INSERT via RPC) + VCSM:dashboard (UPDATE source, DELETE) + Traffic:conversion (INSERT via same RPC) | VCSM DB / Security | VCSM DB / Security | VCSM:leads BEHAVIOR.md |
| vport.profiles (read-only for leads) | VCSM:vport profile | VCSM:dashboard leads (profile resolution) | VCSM:vport profile | VCSM DB | VCSM DB | VCSM:dashboard |
| vc.actor_owners (read-only) | VCSM:identity | VCSM:booking (ownership gate) | VCSM:identity | VCSM DB | VCSM DB | VCSM:identity |
| vc.actors (read-only) | VCSM:identity | VCSM:booking (assertActorOwns) | VCSM:identity | VCSM DB | VCSM DB | VCSM:identity |
| submit_business_card_lead (RPC) | VCSM DB / Security | VCSM:public + Traffic:conversion | VCSM DB (SECURITY DEFINER) | VCSM DB (anon role grant) | VCSM DB / Security | VCSM:leads BEHAVIOR.md |
| send-lead-confirmation (Edge Function) | VCSM (apps/VCSM/supabase) | VCSM:public + Traffic:conversion | N/A (email sender) | Bearer check (weak — see ELEK-001) | VCSM (Deno deploy) | VCSM:leads SECURITY.md |
| vport.business_card_published (column flag) | VCSM:vport profile | submit_business_card_lead RPC (availability guard) | VCSM:vport profile/settings | VCSM DB | VCSM DB | VCSM:vport profile |

RLS POLICIES (vport.business_card_leads):
  SELECT: business_card_leads_owner_select (UNVERIFIED — VEN-LEADS-004)
  INSERT: business_card_leads_no_direct_insert WITH CHECK (false) — anon+authenticated
  UPDATE: business_card_leads_owner_update — owner via actor_owners + user_id
  DELETE: business_card_leads_owner_delete — owner via actor_owners + user_id
```

---

## 5. Rule Ownership Registry

```
RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Only the VPORT actor owner may view, manage, and delete their own leads | VCSM:dashboard leads controller | Controller (assertActorOwnsVportActorController) + Screen (useVportOwnership) | BEHAVIOR.md §5 SEC-001 through SEC-004 | LOW — dual-layered, source-verified |
| Lead write DALs must scope mutations by BOTH leadId AND profileId | VCSM:dashboard leads DAL | DAL (vportLeads.write.dal.js:28–29, 45–46) | BEHAVIOR.md §5 SEC-003 | LOW — source-verified |
| Public lead submission must go through submit_business_card_lead RPC only (no direct INSERT) | VCSM DB / Security | DB (WITH CHECK false + REVOKE INSERT + RPC SECURITY DEFINER) | BEHAVIOR.md §5 SEC-006 / migration 20260524010000 | LOW — DB-enforced |
| Dashboard module must not export DALs or controllers as public barrel | VCSM:dashboard leads (Rule 9) | Architecture / index.js + test | BEHAVIOR.md §5 SEC-007 / leads.index.rule9.test.js | LOW — test-covered |
| Fast count poll must not become standalone unauthenticated count API | VCSM:dashboard leads controller | Controller (fastCountNewVportLeadsController asserts ownership) | BEHAVIOR.md §5 SEC-005 | MEDIUM — profileId affinity gap (ELEK-003) |
| Public lead source must be a submission-time value (not a mutation-time _contacted value) | UNOWNED — open gap | None at RPC/DAL layer (ELEK-002) | BEHAVIOR.md §5 SEC-006 (partially) | MEDIUM — ELEK-002 open |
| Confirmation email may only be triggered by a real lead submission | UNOWNED — open gap | None (fire-and-forget, no lead_id binding) | ELEK-001 / SECURITY.md | HIGH — ELEK-001 open |
| Hard DELETE of PII must produce an audit trail | UNOWNED — open gap | None (LOKI-LEADS-008) | LOKI report | HIGH — no owner assigned |
| VPORT actor must not be voided/deactivated and still receive leads | VCSM:booking (assertActorOwns) | assertActorOwnsVportActorController:52–54 | BEHAVIOR.md §5 | LOW — controller enforced |
| Leads from Traffic directory must use RPC via conversion.adapter only | Traffic:conversion | Traffic:conversion adapter boundary | Traffic conversion adapter | MEDIUM — no formal cross-boundary contract with VCSM |
```

---

## 6. Runtime Ownership Map (from LOKI evidence)

```
RUNTIME OWNERSHIP MAP (LOKI 2026-06-04)

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Known Issues |
|---|---|---|---|---|---|
| Owner inbox page load | /actor/:actorId/dashboard/leads | VCSM:dashboard leads | listVportLeadsController | readVportBusinessCardLeadsByProfileDAL | LOKI-001: 3 duplicate DB reads (ownership checked twice) |
| New leads badge (chip) | VportLeadsChip → useVportNewLeadsCount | VCSM:dashboard leads | countNewVportLeadsController (initial) | readNewLeadsCountByProfileDAL | LOKI-003: ownership check on every 60s poll |
| Fast count poll (60s) | useVportNewLeadsCount.pollRefresh | VCSM:dashboard leads | fastCountNewVportLeadsController | readNewLeadsCountByProfileDAL | LOKI-003: 2–4 DB reads/min per open session |
| Mark lead contacted | useVportLeads.markContacted | VCSM:dashboard leads | markVportLeadContactedController | markVportBusinessCardLeadContactedDAL | LOKI-007: re-throw may produce unhandled rejection |
| Delete lead | useVportLeads.deleteLead | VCSM:dashboard leads | deleteVportLeadController | deleteVportBusinessCardLeadDAL | LOKI-008: hard DELETE, no audit trail |
| Public lead submission (VCSM) | useVportBusinessCardLeadForm.submit | VCSM:public | submitVportBusinessCardLeadController | createVportBusinessCardLeadDAL + sendLeadConfirmationEmailDAL | LOKI-N/A (fire-and-forget errors swallowed) |
| Public lead submission (Traffic) | useProviderLeadCapture | Traffic:conversion | submitProviderLead | submitProviderLeadRow + invokeProviderLeadConfirmation | No observability in Traffic flow |
| Confirmation email | send-lead-confirmation Edge Function | VCSM (supabase/functions) | N/A | N/A (SES direct) | ELEK-001: Bearer-only auth |
| Window focus ownership re-check | useVportOwnership onFocus | VCSM:dashboard vport | checkVportOwnershipController | LOKI-004: no debounce on focus events | LOKI-004 |

Runtime Ownership Status: INFERRED (no live LOKI trace in this session — evidence from prior LOKI run recorded in CURRENT_STATUS.md)
```

---

## 7. Cross-Root Ownership Review

```
CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| vport.business_card_leads table | VCSM (created, governed, migrated) | apps/VCSM | CLEAR within VCSM | Traffic reads/writes same table via RPC — no cross-root code sharing |
| submit_business_card_lead RPC | VCSM (schema vport, migrations owned by VCSM) | apps/VCSM/supabase | PARTIAL — Traffic is an independent consumer with no formal data contract | Traffic uses the RPC directly; no boundary doc governs this |
| send-lead-confirmation Edge Function | VCSM (apps/VCSM/supabase/functions) | apps/VCSM | PARTIAL — Traffic invokes it | Traffic calls same EF; no interface contract; EF governance gap (ELEK-001) |
| Traffic conversion feature | Traffic:conversion | apps/Traffic | CLEAR — Traffic is boundary-isolated | No code shared from VCSM app into Traffic; both call the same Supabase backend independently |
| Leads notification (lead_received) | VCSM:public (publishes) | apps/VCSM | CLEAR within VCSM | Notification links to /actor/:actorId/dashboard/leads (VCSM route) |
```

**Cross-Root Boundary Finding:** Traffic uses two VCSM-owned backend resources (RPC + Edge Function) without a formal cross-root data ownership contract. This is architecturally intentional (both apps write to the same Supabase project), but the absence of a contract means governance changes to the RPC or EF may silently break Traffic without notice. This is the most significant ownership gap identified.

---

## 8. Ownership Boundary Risks

```
OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| vport.business_card_leads written by two app roots without data contract | MEDIUM | VCSM:public + Traffic:conversion both INSERT via same RPC; no formal contract governs what Traffic may pass (p_source, rate behavior) | Create a Cross-Root Data Contract for vport.business_card_leads stating Traffic is an approved consumer, what p_source values it may use, and that governance changes to the RPC require Traffic-owner notification |
| send-lead-confirmation Edge Function used by Traffic without interface contract | MEDIUM | Traffic invokes EF directly with no version or governance protection; EF auth is weak (ELEK-001); if VCSM changes the EF body or adds auth, Traffic breaks silently | Document EF as a shared interface; version the body schema; add Traffic as a listed consumer |
| Hard DELETE of PII (business_card_leads rows) has no owner for audit/retention | HIGH | LOKI-LEADS-008: deleteVportLeadController issues hard DELETE with no audit log, no soft-delete, no retention policy. Nobody currently owns the audit trail responsibility. | Assign audit ownership explicitly; define whether a soft-delete or separate audit log is required; route to CARNAGE for schema consideration |
| send-lead-confirmation auth gap has no assigned owner for the fix | MEDIUM | ELEK-2026-06-04-001 is an open HIGH finding; the patch requires changes across VCSM:public controller, two DALs, and the edge function. No owner assigned to drive remediation. | Assign ELEK-001 to a named ticket with an owner; the fix spans VCSM:public + VCSM supabase — both are VCSM scope |
| fastCountNewVportLeadsController profileId affinity gap (ELEK-003) | LOW | A SIMPLE one-line fix with no DB change. But without an assigned owner, it may sit open indefinitely. | Assign ELEK-003 to sprint backlog; it is the lowest-effort of the open findings |
| normalizeVportLead exposes profileId (ELEK-005) | LOW | Identity rule violation but INFO severity. No owner assigned to verify whether any component currently consumes lead.profileId before removing it. | Assign ELEK-005; grep for lead.profileId in component tree; 10-minute fix |
```

---

## 9. Responsibility Classification

```
RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---:|---|
| Feature ownership — owner inbox | VCSM:dashboard leads card | HIGH | Clear code boundary, dedicated directory |
| Feature ownership — public submission | VCSM:public vportBusinessCard | HIGH | Separate feature directory |
| Feature ownership — Traffic conversion | Traffic:conversion | HIGH | Independent app root, full isolation |
| Engine ownership — actor ownership gate | VCSM:booking (assertActorOwnsVportActor) | HIGH | Shared across 9 call sites, adapter-exported |
| Engine ownership — notifications | VCSM:notifications | HIGH | publishVcsmNotification via adapter |
| DAL ownership — read (dashboard) | VCSM:dashboard leads | HIGH | vportLeads.read.dal.js |
| DAL ownership — write (dashboard) | VCSM:dashboard leads | HIGH | vportLeads.write.dal.js |
| DAL ownership — write (public VCSM) | VCSM:public | HIGH | vportBusinessCardLead.write.dal.js |
| DAL ownership — write (Traffic) | Traffic:conversion | HIGH | submitProviderLead.write.dal.js |
| Controller ownership | VCSM:dashboard leads | HIGH | vportLeads.controller.js |
| UI ownership — owner inbox | VCSM:dashboard leads | HIGH | FinalScreen, View, hooks |
| UI ownership — public form | VCSM:public | HIGH | BusinessCardLeadForm.jsx, useVportBusinessCardLeadForm |
| Runtime ownership — badge chip | VCSM:dashboard leads (chip component) | HIGH | VportLeadsChip in vport.adapter.js |
| Data ownership — business_card_leads | VCSM DB / Security (governance) | HIGH | Multiple consumers; VCSM owns schema + migrations |
| Data ownership — audit/retention | UNOWNED | LOW | LOKI-LEADS-008: no owner for PII deletion audit |
| Contract ownership — RPC governance | VCSM DB / Security | MEDIUM | submit_business_card_lead; Traffic consumer not formally contracted |
| Contract ownership — EF governance | VCSM (supabase/functions) | MEDIUM | send-lead-confirmation; Traffic consumer not formally contracted |
| Security ownership — ELEK-001 fix | UNASSIGNED | LOW | Bearer auth + lead_id binding spans VCSM:public + supabase functions |
| Documentation ownership | VCSM:dashboard leads (BEHAVIOR.md) | HIGH | BEHAVIOR.md, SECURITY.md, LOKI, ARCHITECT output all present |
| Migration ownership | VCSM DB / Security | HIGH | 5 migrations tracked |
| Native parity ownership | UNOWNED / OPEN QUESTION | UNKNOWN | BEHAVIOR.md §15 lists all native surfaces as OPEN QUESTION |
```

---

## 10. Ownership Findings

---

```
IRONMAN OWNERSHIP FINDING
- Finding ID:              IRON-LEADS-001
- Feature / Engine:        vport.business_card_leads — cross-root data consumer contract
- Application Scope:       VCSM + TRAFFIC
- Responsibility Type:     Data ownership / External API ownership / Contract ownership
- Ownership Clarity:       PARTIAL
- Boundary Risk:           MEDIUM
- Severity:                MEDIUM
- Primary code roots:
    VCSM: apps/VCSM/supabase/migrations/20260524010000 + 20260524020000
    Traffic: apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
- Core layers:             DAL (both apps), DB migration (VCSM-owned)
- Engines used:            N/A — shared Supabase backend
- Tables / Objects touched: vport.business_card_leads, submit_business_card_lead RPC
- Rule ownership:          VCSM owns the RPC and schema; Traffic is an undocumented consumer
- Contracts touched:       Boundary Isolation Contract (cross-root without formal data contract)
- Docs touched:            BEHAVIOR.md §9 MNH-006 (mentions Traffic submission); no cross-root contract doc
- Runtime ownership:       VCSM:public → RPC | Traffic:conversion → same RPC
- Current ambiguity:
    Traffic calls submit_business_card_lead with p_source="directory" and p_ip=null.
    If VCSM changes the RPC signature, source allowlist, or auth requirements, Traffic
    breaks without notice. No document names Traffic as an approved consumer or governs
    what parameters it may pass.
- Risk:
    Source allowlist changes (e.g., removing "directory") or new required parameters
    would silently break Traffic lead submission. The EF Bearer auth fix (ELEK-001)
    requires coordinated changes in both VCSM and Traffic.
- Recommended ownership clarification:
    Create CROSS_ROOT_LEADS_DATA_CONTRACT.md documenting:
    (1) Traffic:conversion is an approved consumer of submit_business_card_lead
    (2) Approved Traffic p_source values: "directory"
    (3) Governance change notification requirement before altering the RPC signature
    (4) Traffic is an approved caller of send-lead-confirmation EF with approved body fields
- Recommended handoff:     ARCHITECT (add to cross-root surface map), LOGAN (doc creation)
- Rationale:
    Boundary Isolation Contract §4 identifies Traffic as an independent project boundary.
    A shared backend (Supabase) is the one permissible cross-root surface, but it requires
    a formal data contract to govern the relationship.
```

---

```
IRONMAN OWNERSHIP FINDING
- Finding ID:              IRON-LEADS-002
- Feature / Engine:        Hard DELETE of PII — audit/retention ownership
- Application Scope:       VCSM
- Responsibility Type:     Data ownership / Security ownership / Documentation ownership
- Ownership Clarity:       MISSING
- Boundary Risk:           HIGH
- Severity:                HIGH
- Primary code roots:
    apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js:37–52
    apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:63–70
- Core layers:             DAL (hard DELETE), Controller (delete operation)
- Engines used:            N/A
- Tables / Objects touched: vport.business_card_leads (irreversible deletion of PII rows)
- Rule ownership:          NO OWNER — no retention policy, no audit log, no soft-delete
- Contracts touched:       Asset Security (CISSP Domain 2), Actor Ownership Contract
- Docs touched:            BEHAVIOR.md §17 OQ-DASH-leads-004 (open question: should delete be soft-delete/audit tracked?)
- Runtime ownership:       VCSM:dashboard leads controller + DAL
- Current ambiguity:
    deleteVportLeadController calls deleteVportBusinessCardLeadDAL which issues a hard
    DELETE with no audit trail, no soft-delete column, no deleted_at timestamp, and no
    record of who deleted what when. The VPORT owner's contact/message PII is permanently
    removed with no recovery path and no compliance record.
    BEHAVIOR.md §17 OQ-DASH-leads-004 acknowledges this is an open question.
    LOKI-LEADS-008 flagged this as HIGH.
    No owner has been assigned to resolve it.
- Risk:
    Depending on jurisdiction: GDPR right-to-erasure compliance may require provable
    deletion records. Conversely, retention requirements may require proof of deletion.
    Without an audit trail, neither can be demonstrated. The hard DELETE also means
    support cannot recover accidentally deleted leads.
- Recommended ownership clarification:
    Assign an owner to decide: (a) retain hard DELETE + add audit log table, OR
    (b) soft-delete with deleted_at + deleted_by_actor_id + retention sweep job.
    Route to CARNAGE for schema design, to VENOM for compliance review.
- Recommended handoff:     CARNAGE (migration design for audit/soft-delete), VENOM (compliance review)
- Rationale:
    PII deletion at request of one party (the VPORT owner) without audit trail creates
    compliance ambiguity. The lead submitter's personal data is being deleted by a third
    party — this warrants at minimum a documented deletion event.
```

---

```
IRONMAN OWNERSHIP FINDING
- Finding ID:              IRON-LEADS-003
- Feature / Engine:        send-lead-confirmation Edge Function — security fix ownership
- Application Scope:       VCSM + TRAFFIC
- Responsibility Type:     Security ownership / Feature ownership
- Ownership Clarity:       PARTIAL
- Boundary Risk:           MEDIUM
- Severity:                MEDIUM
- Primary code roots:
    apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
    apps/VCSM/src/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js
    apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js
    apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
- Core layers:             Edge Function, DAL (two apps), Controller (VCSM:public)
- Engines used:            N/A
- Tables / Objects touched: N/A (email-only)
- Rule ownership:          UNASSIGNED for ELEK-2026-06-04-001 remediation
- Contracts touched:       Communication and Network Security
- Docs touched:            SECURITY.md (ELEK-001 open)
- Runtime ownership:       VCSM owns the EF; VCSM:public and Traffic:conversion both invoke it
- Current ambiguity:
    ELEK-2026-06-04-001 (HIGH) has been identified but no owner is assigned to close it.
    The fix requires changes in three places:
    (1) apps/VCSM/supabase/functions/send-lead-confirmation/index.ts — add auth.getUser() + lead_id bind
    (2) apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js — return lead_id
    (3) apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js — pass lead_id
    (4) apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js — same lead_id threading
    Without a single owner spanning all four files, the fix will not happen cohesively.
- Risk:
    ELEK-001 remains a THOR release blocker. Without ownership assignment,
    it will block release indefinitely.
- Recommended ownership clarification:
    Assign a single owner (VCSM:public feature team + supabase functions) to drive ELEK-001.
    The Traffic side of the fix is a coordinated change notification — Traffic maintainer
    must also update their DAL once the EF interface is updated.
- Recommended handoff:     Wolverine (ticket assignment), SPIDER-MAN (test coverage)
- Rationale:
    A security fix spanning multiple files across two app roots and an edge function
    requires explicit ownership or it will be indefinitely deferred.
```

---

```
IRONMAN OWNERSHIP FINDING
- Finding ID:              IRON-LEADS-004
- Feature / Engine:        Native parity — owner inbox + public submission
- Application Scope:       VCSM
- Responsibility Type:     Native parity ownership
- Ownership Clarity:       MISSING
- Boundary Risk:           LOW
- Severity:                LOW
- Primary code roots:      N/A — no native leads implementation found
- Core layers:             N/A
- Engines used:            N/A
- Tables / Objects touched: N/A
- Rule ownership:          UNOWNED — no native parity doc, no native implementation identified
- Contracts touched:       Native Transfer Contract
- Docs touched:            BEHAVIOR.md §15 (all 4 native parity items marked OPEN QUESTION)
- Runtime ownership:       N/A
- Current ambiguity:
    BEHAVIOR.md §15 lists all four native parity surfaces (owner inbox list, new leads
    badge count, mark contacted/delete actions, public lead submission) as "OPEN QUESTION —
    not source-verified in this pass." No native implementation has been located, no
    parity gap document exists, and no owner is assigned.
- Risk:
    If native leads are implemented without a parity owner, security properties of the
    PWA (ownership gate, controller DB verification, source field validation) may not
    carry over. LOW risk currently because no native implementation is active.
- Recommended ownership clarification:
    When native leads inbox is planned: assign FALCON as parity governance owner.
    Before native implementation: require parity doc against this BEHAVIOR.md.
- Recommended handoff:     FALCON (when native scope is planned)
- Rationale:
    The owner inbox contains PII. Native implementations that miss the controller-level
    ownership gate would be a security regression. Pre-assignment of FALCON governance
    prevents this class of drift.
```

---

## 11. Ownership Clarity Summary

| System | Ownership Clarity | Evidence |
|---|---|---|
| VCSM:dashboard leads — owner inbox | CLEAR | Dedicated directory, controller, hooks, screens. Rule 9 compliant. Tests cover ownership gate. |
| VCSM:public — lead submission | CLEAR | Dedicated directory, hardcoded source values, adapter boundary respected. |
| Traffic:conversion — lead submission | CLEAR (within Traffic root) | Independent app boundary maintained; no cross-root code import. |
| vport.business_card_leads — data governance | PARTIAL | Table ownership is clear within VCSM; Traffic's consumer role is undocumented (IRON-LEADS-001). |
| submit_business_card_lead RPC | PARTIAL | VCSM schema ownership clear; cross-root consumer contract missing. |
| send-lead-confirmation Edge Function | PARTIAL | VCSM owns it; Traffic uses it; security fix ownership unassigned (IRON-LEADS-003). |
| PII deletion audit/retention | MISSING | No owner, no policy, no audit table (IRON-LEADS-002). |
| Native parity | MISSING | No native implementation found, no parity doc, no FALCON assignment (IRON-LEADS-004). |

**Overall Feature Ownership Clarity: PARTIAL**

---

## 12. Release Gate Notes (THOR)

THOR blockers from ownership perspective:

| Gate | Status | Blocker Type |
|---|---|---|
| ELEK-2026-06-04-001 (HIGH) — EF auth fix | UNASSIGNED OWNER | Security fix requires explicit ownership before it can be driven to completion |
| IRON-LEADS-002 (HIGH) — PII hard DELETE audit | MISSING OWNER | Compliance risk; no owner to decide soft-delete vs audit log |
| IRON-LEADS-001 (MEDIUM) — Cross-root data contract | PARTIAL | Does not block release but should be documented before next Traffic schema change |

THOR CAUTION conditions remain from prior security sprint. IRON-LEADS-002 and IRON-LEADS-003 add ownership accountability gaps to the existing severity-based blockers.

---

## 13. Change Impact Rules

When any file in `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/` changes:
- Update BEHAVIOR.md (owning feature contract)
- Run controller tests (`vportLeads.controller.test.js`)
- Run barrel export test (`leads.index.rule9.test.js`)
- Notify VENOM / re-run security review if controller or DAL ownership changes
- Update SECURITY.md findings status if a finding is resolved

When `vportBusinessCardLead.write.dal.js` or `submitVportBusinessCardLeadController` changes:
- Coordinate with Traffic:conversion maintainer if RPC signature or source allowlist changes
- Update or re-validate CROSS_ROOT_LEADS_DATA_CONTRACT.md (once created)
- Notify ELEK-001 owner if send-lead-confirmation invocation changes

When `send-lead-confirmation/index.ts` changes:
- Coordinate with Traffic:conversion maintainer
- Re-run ELEKTRA security review
- Update SECURITY.md ELEKTRA STATUS section

When `submit_business_card_lead` RPC migrations change:
- Coordinate with Traffic:conversion maintainer
- Notify VENOM and CARNAGE
- Update BEHAVIOR.md §6 (data changes) and §12 (test requirements)
- Regression test: Traffic submission flow end-to-end

When `assertActorOwnsVportActorController` changes:
- ALL features depending on this adapter (9 call sites platform-wide) must be regression-tested
- VENOM re-review of all ownership-gated paths

---

## 14. Open Ownership Questions

| ID | Question | Status | Recommended Owner |
|---|---|---|---|
| OQ-IRON-leads-001 | Should delete be soft-delete with audit log, or hard DELETE with separate audit table? | OPEN | CARNAGE + VENOM (compliance) |
| OQ-IRON-leads-002 | Who owns the cross-root data contract for Traffic using VCSM's lead RPC and EF? | OPEN | ARCHITECT + LOGAN |
| OQ-IRON-leads-003 | Who drives ELEK-001 remediation (EF auth + lead_id threading)? | OPEN | Wolverine (ticket assignment) |
| OQ-IRON-leads-004 | When is native leads inbox planned? Who owns FALCON parity governance? | OPEN | FALCON (when scoped) |
