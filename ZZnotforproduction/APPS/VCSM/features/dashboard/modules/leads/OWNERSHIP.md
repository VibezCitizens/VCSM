# leads — Ownership Record

Last Updated: 2026-06-04
Ownership Clarity: PARTIAL
Maintained By: IRONMAN

---

## 1. Purpose

The `leads` system covers two coupled responsibilities:

**Dashboard Owner Inbox** — the VPORT owner's management surface for incoming business-card leads. Lets an authenticated owner view, mark-contacted, and delete leads submitted through their public VPORT business card.

**Public Lead Submission** — the anonymous public flow where a visitor submits a contact request through a VPORT's public business card page. Creates the rows that the owner inbox then manages.

A third, independent system — **Traffic Conversion** — submits leads to the same backend infrastructure from the TRAZE directory without any code coupling to VCSM.

---

## 2. Application Scope

Primary: VCSM
Secondary (consumer): TRAFFIC (independent, shares Supabase backend only)

---

## 3. Code Roots

### VCSM — Dashboard Owner Inbox
```
apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/
apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx
apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js (exports VportLeadsChip)
```

### VCSM — Public Submission
```
apps/VCSM/src/features/public/vportBusinessCard/
  dal/vportBusinessCardLead.write.dal.js
  dal/sendLeadConfirmationEmail.edge.dal.js
  controller/vportBusinessCard.controller.js
  hooks/useVportBusinessCardLeadForm.js
  view/BusinessCardLeadForm.jsx
```

### VCSM — Edge Function
```
apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
```

### VCSM — Routes
```
/actor/:actorId/dashboard/leads → VportDashboardLeadsScreen (wrapper → FinalScreen)
/vport/:actorId/dashboard/leads → VportToActorDashboardLeadsRedirect
```

### Traffic — Conversion (Independent)
```
apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js
apps/Traffic/src/features/conversion/controller/submitProviderLead.controller.js
apps/Traffic/src/features/conversion/hooks/useProviderLeadCapture.js
apps/Traffic/src/features/conversion/adapters/conversion.adapter.js
```

---

## 4. Core Layers

### Dashboard Owner Inbox

DAL:
- `dal/vportLeads.read.dal.js` — readVportBusinessCardLeadsByProfileDAL, readNewLeadsCountByProfileDAL
- `dal/vportLeads.write.dal.js` — markVportBusinessCardLeadContactedDAL, deleteVportBusinessCardLeadDAL

Model:
- `model/vportLead.model.js` — normalizeVportLead (owns isContacted derivation logic)
- `model/vportLead.display.model.js` — display formatting helpers
- `model/vportDashboardLeadsScreen.model.js` — screen-level re-exports

Controller:
- `controller/vportLeads.controller.js` — listVportLeadsController, countNewVportLeadsController, fastCountNewVportLeadsController, markVportLeadContactedController, deleteVportLeadController

Hook:
- `hooks/useVportLeads.js` — list + mark-contacted + delete operations
- `hooks/useVportNewLeadsCount.js` — background badge count polling (60s interval)

Screen:
- `VportDashboardLeadsFinalScreen.jsx` — route entry, identity gate, ownership gate
- `VportDashboardLeadsScreen.jsx` — route compatibility wrapper (pass-through only)
- `VportDashboardLeadsView.jsx` — owner inbox list view

Barrel:
- `index.js` — exports models, hooks, screens only (Rule 9 compliant — no DALs, no controllers)

Tests:
- `__tests__/vportLeads.controller.test.js` — ownership gate regression
- `__tests__/leads.index.rule9.test.js` — barrel export compliance

### Public Submission

DAL: `vportBusinessCardLead.write.dal.js`, `sendLeadConfirmationEmail.edge.dal.js`
Model: `vportBusinessCard.model.js` (validateVportBusinessCardLeadInput)
Controller: `vportBusinessCard.controller.js` (submitVportBusinessCardLeadController)
Hook: `useVportBusinessCardLeadForm.js`
View: `BusinessCardLeadForm.jsx`

### Edge Function
- `send-lead-confirmation/index.ts` — Deno, AWS SES, Bearer auth (open: ELEK-001)

---

## 5. Engines Used

| Engine / Shared System | What It Provides | Import Path |
|---|---|---|
| booking.adapter → assertActorOwnsVportActorController | DB-backed actor ownership assertion (9 call sites platform-wide) | `@/features/booking/adapters/booking.adapter` |
| dashboard/vport → checkVportOwnershipController + useVportOwnership | UX-layer ownership state (NOT the security boundary) | `@/features/dashboard/vport/controller/checkVportOwnership.controller` |
| state/identity → useIdentity | Session actor resolution | `@/state/identity/identityContext` |
| dashboard/vport → readVportProfileByActorIdDAL | actor_id → vport_profile_id resolution | `@/features/dashboard/vport/dal/read/vportProfile.read.dal` |
| notifications.adapter → publishVcsmNotification | lead_received notification to owner | `@/features/notifications/adapters/notifications.adapter` |

---

## 6. Database / Schema Ownership

Tables read:
- `vport.business_card_leads` — owner inbox reads
- `vport.profiles` — actor → profile ID resolution
- `vc.actor_owners` — ownership verification
- `vc.actors` — actor kind + void check

Tables written:
- `vport.business_card_leads` — INSERT (via RPC), UPDATE source, DELETE

RPCs:
- `vport.submit_business_card_lead` — SECURITY DEFINER, anon-accessible, slug-based availability guard

Edge Functions:
- `send-lead-confirmation` — AWS SES email; fire-and-forget from both VCSM and Traffic

RLS policies:
- `business_card_leads_owner_select` — SELECT gate (UNVERIFIED — VEN-LEADS-004)
- `business_card_leads_no_direct_insert` — blocks direct INSERT for anon+authenticated
- `business_card_leads_owner_update` — UPDATE allowed for owner via actor_owners
- `business_card_leads_owner_delete` — DELETE allowed for owner via actor_owners

Migration owner: VCSM DB / Security team
- `20260427060000_grant_vport_write_permissions.sql`
- `20260427070000_sync_business_card_published_for_listed_providers.sql`
- `20260427080000_grant_business_card_leads_owner_write.sql`
- `20260524010000_business_card_leads_p0_security.sql`
- `20260524020000_business_card_leads_p1_hardening.sql`

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Status |
|---|---|---|---|
| Only VPORT owner may manage their own leads | VCSM:dashboard leads controller | Controller (assertActorOwnsVportActorController) + Screen (useVportOwnership) | SOURCE VERIFIED |
| Write DALs scope mutations by leadId + profileId | VCSM:dashboard leads DAL | DAL | SOURCE VERIFIED |
| Dashboard barrel must not export DALs or controllers | VCSM:dashboard leads (Rule 9) | Architecture + barrel test | SOURCE VERIFIED |
| Public submission must go through RPC only (no direct INSERT) | VCSM DB / Security | DB (WITH CHECK false + REVOKE) | SOURCE VERIFIED |
| Source field at INSERT must be a submission-time value (not _contacted) | UNOWNED — OPEN | None at RPC/DAL layer | ELEK-002 OPEN |
| Confirmation email tied to a real lead row | UNOWNED — OPEN | None | ELEK-001 OPEN |
| Deleted lead PII must produce audit trail | UNOWNED — OPEN | None | IRON-LEADS-002 / LOKI-008 |
| Traffic:conversion approved consumer of submit_business_card_lead RPC | UNOWNED — OPEN | No formal contract | IRON-LEADS-001 |

---

## 8. Contracts Touched

- Boundary Isolation Contract — Traffic cross-root consumer relationship
- Actor Ownership Contract — all 5 owner operations
- Asset Security — PII (name, phone, email, message) in business_card_leads
- Communication and Network Security — send-lead-confirmation EF auth
- Software Development Security — source allowlist, profileId in model

---

## 9. Documentation Links

| Document | Location | Status |
|---|---|---|
| Behavior Contract | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md | DRAFT |
| Security Posture | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/SECURITY.md | CURRENT |
| VENOM Report | outputs/2026/06/04/Venom/2026-06-04_00-00_venom_leads-security-review.md | COMPLETE |
| BLACKWIDOW Report | outputs/2026/06/04/BlackWidow/2026-06-04_00-00_blackwidow_leads-adversarial-review.md | COMPLETE |
| ELEKTRA Report | outputs/2026/06/04/ELEKTRA/2026-06-04_00-00_elektra_leads-source-to-sink.md | COMPLETE |
| LOKI Report | outputs/2026/06/04/Loki/2026-06-04_00-00_loki_leads-runtime-trace.md | COMPLETE |
| ARCHITECT Report | outputs/2026/06/04/ARCHITECT/ (referenced in CURRENT_STATUS.md) | COMPLETE |
| IRONMAN Report | outputs/2026/06/04/IRONMAN/2026-06-04_00-00_ironman_leads-ownership.md | CURRENT |

Cross-Root Contract (MISSING — needed):
- `ZZnotforproduction/CROSS_ROOT/leads/CROSS_ROOT_LEADS_DATA_CONTRACT.md` — not yet created

---

## 10. Runtime Ownership

Entry points: `/actor/:actorId/dashboard/leads` (protected route)
Controllers: vportLeads.controller.js (all 5 operations)
Hot paths: 60s poll (ownership DB query per tick — LOKI-003)
Known issues: LOKI-001 (duplicate ownership reads), LOKI-004 (focus debounce missing), LOKI-008 (hard DELETE no audit)

---

## 11. Responsibilities

VCSM:dashboard leads owns:
- Owner inbox read, mark-contacted, delete operations
- Badge count display and polling
- Route entry, identity gate, ownership gate rendering

VCSM:public owns:
- Anonymous lead submission flow
- Confirmation email trigger
- Lead-received notification trigger

VCSM DB/Security owns:
- vport.business_card_leads schema and migrations
- submit_business_card_lead RPC
- RLS policy governance

Traffic:conversion owns:
- Traffic-side lead capture form and submission
- NOT responsible for VCSM dashboard behavior

---

## 12. Boundaries

- Dashboard leads module must NEVER export DALs or controllers through index.js (Rule 9)
- Dashboard leads must NEVER handle public lead submission (owned by VCSM:public)
- Traffic:conversion must NEVER import from VCSM app source (boundary isolation)
- Traffic:conversion must NEVER bypass the submit_business_card_lead RPC to write directly to business_card_leads
- send-lead-confirmation edge function must NEVER be moved into an app feature directory
- profileId (raw UUID) must NEVER appear in public URL surfaces or be exposed beyond the owner inbox

---

## 13. Change Impact Rules

| Change | Must Update | Must Notify |
|---|---|---|
| Any file in leads/dashboard/cards/leads/ | BEHAVIOR.md, SECURITY.md, run controller tests + Rule 9 test | VENOM if controller/DAL changes |
| vportBusinessCardLead.write.dal.js or submitVportBusinessCardLeadController | CROSS_ROOT_LEADS_DATA_CONTRACT.md (once created) | Traffic:conversion maintainer |
| send-lead-confirmation/index.ts | SECURITY.md ELEKTRA STATUS, VENOM | Traffic:conversion maintainer |
| submit_business_card_lead RPC migration | BEHAVIOR.md §6, §12, SECURITY.md | Traffic:conversion maintainer + VENOM |
| assertActorOwnsVportActorController | All 9 call sites need regression testing | VENOM platform-wide review |

---

## 14. Release Gate Notes

| Gate | Status |
|---|---|
| ELEK-2026-06-04-001 (HIGH) — EF auth fix | THOR BLOCKER — no owner assigned |
| IRON-LEADS-002 (HIGH) — PII deletion audit | THOR CAUTION — compliance risk, no owner |
| VEN-LEADS-004 (MEDIUM) — SELECT RLS unverified | THOR BLOCKER — pending DB confirmation |
| ELEK-2026-06-04-002 (MEDIUM) — RPC source injection | THOR CAUTION — pending CARNAGE migration |
| ELEK-2026-06-04-003 (MEDIUM) — fast count profileId | THOR CAUTION — simple controller fix, unassigned |

---

## 15. Open Ownership Questions

| ID | Question | Status |
|---|---|---|
| OQ-IRON-leads-001 | Soft-delete with audit log or hard DELETE with audit table? | OPEN — route to CARNAGE |
| OQ-IRON-leads-002 | Who owns the cross-root data contract for Traffic? | OPEN — route to ARCHITECT + LOGAN |
| OQ-IRON-leads-003 | Who drives ELEK-001 remediation across VCSM + Traffic? | OPEN — route to Wolverine |
| OQ-IRON-leads-004 | When is native leads inbox planned, and who owns FALCON parity? | OPEN — route to FALCON when scoped |
