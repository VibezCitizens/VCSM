# Dashboard Module Behavior Contract — leads

Status: DRAFT

Module: leads

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - DEFER-009
  - LEADS-ROUTE-001
  - LEADS-PUBLIC-RPC-001
- Patched Findings:
  - LEADS-FASTCOUNT-001
  - RULE9-DASH-LEADS-001
- Security Review Status:
  - VENOM: COMPLETE
  - ELEKTRA: COMPLETE
  - BLACKWIDOW: COMPLETE

Reason:
`leads` has source-verified owner gates for the primary list, count, fast-count poll, mark-contacted, and delete controller paths, with tests confirming unauthorized callers are rejected before DAL access. The prior public barrel Rule 9 issue is patched: `leads/index.js` no longer exports DALs or controllers. It remains THOR CAUTION because public lead submission currently depends on the anonymous-safe `submit_business_card_lead` SECURITY DEFINER RPC plus `send-lead-confirmation` Edge Function governance, and broader screen/hook SPIDER-MAN coverage is still missing.

---

## 1. User Goal

The `leads` dashboard module lets a VPORT owner review incoming public business-card leads, see new lead counts, mark leads as contacted, and delete leads from the owner inbox. It is the owner-side management surface for leads submitted through the public VPORT business-card flow.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | View lead inbox, count new leads, mark leads contacted, delete leads. | Must pass `useVportOwnership` at screen level and `assertActorOwnsVportActorController` at controller level for primary operations. |
| Non-owner actor | No owner lead access. | Final screen blocks render; controllers reject before DAL calls. |
| Unauthenticated viewer | No owner lead access. | Final screen renders sign-in requirement. |
| Public lead submitter | Can submit a lead through public business-card flow outside this dashboard module. | Cannot access owner inbox or management operations. |
| Public business-card module | Creates `vport.business_card_leads` via `submit_business_card_lead` RPC and sends confirmation/owner notification side effects. | Must not use dashboard leads internals for submission. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/leads`
- `/vport/:actorId/dashboard/leads` redirects through `VportToActorDashboardLeadsRedirect` to `/actor/:actorId/dashboard/leads`.
- No current source route for `/vport/dashboard/leads` without `:actorId` was found.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsFinalScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsView.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js`

### Controllers

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js`

Controller exports:

- `listVportLeadsController`
- `countNewVportLeadsController`
- `fastCountNewVportLeadsController`
- `markVportLeadContactedController`
- `deleteVportLeadController`

### DALs

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/dal/vportLeads.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal`

### RPCs

- Dashboard leads owner inbox does not call RPCs.
- Public lead creation uses `vport.submit_business_card_lead` through `apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js`.
- Current source comments describe this as an anonymous-safe SECURITY DEFINER RPC; DB-side policy/function governance remains outside dashboard owner source.

### Edge Functions

- Public lead confirmation email uses `send-lead-confirmation` through `apps/VCSM/src/features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js`.
- `send-lead-confirmation` governance is tracked separately by external-site/public lead submission findings.

### Engine Dependencies

- Booking ownership adapter: `assertActorOwnsVportActorController`.
- Public business-card lead submission flow: creates rows consumed by dashboard leads.
- Notifications adapter: public business-card controller publishes `lead_received` owner notification.

### Ownership Gates

- Final screen uses `useVportOwnership(viewerActorId, actorId)` before rendering the owner inbox.
- `listVportLeadsController`, `countNewVportLeadsController`, `fastCountNewVportLeadsController`, `markVportLeadContactedController`, and `deleteVportLeadController` assert actor ownership before calling lead DALs.
- `fastCountNewVportLeadsController(actorId, callerActorId, profileId)` reuses the cached profile id only after asserting `callerActorId` owns `actorId`.

---

## 4. Happy Paths

### HP-001

BEH-DASH-leads-001

Preconditions:

- Viewer is signed in.
- Viewer owns the target VPORT actor.

Flow:

Owner opens `/actor/:actorId/dashboard/leads`.
`VportDashboardLeadsFinalScreen` reads route `actorId`.
Final screen verifies identity and ownership.
Final screen renders `VportDashboardLeadsView`.
View calls `useVportLeads`.
Hook calls `listVportLeadsController(actorId, { limit: 150 }, sessionActorId)`.
Controller asserts ownership, resolves profile id, reads leads by profile id, normalizes rows, and returns visible leads.

Expected Result:

Owner sees lead count and lead cards ordered newest first.

Data Changes:

None.

---

### HP-002

BEH-DASH-leads-002

Preconditions:

- Owner has loaded leads.
- Lead exists and is not already contacted.

Flow:

Owner clicks `Mark as contacted`.
`useVportLeads.markContacted` calls `markVportLeadContactedController`.
Controller asserts ownership, resolves profile id, and calls `markVportBusinessCardLeadContactedDAL`.
DAL updates the lead `source` to include `contacted` while scoping by lead id and VPORT profile id.
Hook replaces the local row with the normalized updated lead.

Expected Result:

Lead appears as contacted and the action becomes disabled.

Data Changes:

- Update `vport.business_card_leads.source`.

---

### HP-003

BEH-DASH-leads-003

Preconditions:

- Owner has loaded leads.
- Lead exists.

Flow:

Owner clicks `Delete`.
`useVportLeads.deleteLead` calls `deleteVportLeadController`.
Controller asserts ownership, resolves profile id, and calls `deleteVportBusinessCardLeadDAL`.
DAL deletes by lead id and VPORT profile id.
Hook removes the lead from local state.

Expected Result:

Lead disappears from the inbox.

Data Changes:

- Delete from `vport.business_card_leads`.

---

### HP-004

BEH-DASH-leads-004

Preconditions:

- `useVportNewLeadsCount` receives actor id and session actor id.

Flow:

Hook calls `countNewVportLeadsController`.
Controller asserts ownership, resolves profile id, reads count of leads whose `source` does not contain `contacted`, and returns `{ count, resolvedProfileId }`.
Hook caches `resolvedProfileId`.

Expected Result:

Dashboard badge/new-leads count shows the current number of uncontacted leads.

Data Changes:

None.

---

### HP-005

BEH-DASH-leads-005

Preconditions:

- Initial count path has cached `resolvedProfileId`.
- Poll interval fires every 60 seconds.

Flow:

`useVportNewLeadsCount.pollRefresh` reads cached profile id.
Hook calls `fastCountNewVportLeadsController(actorId, callerActorId, profileId)`.
Controller asserts actor ownership, then reads count by cached profile id without resolving actor/profile again.
Hook updates count silently.

Expected Result:

New-leads badge refreshes in the background.

Data Changes:

None.

---

### HP-006

BEH-DASH-leads-006

Preconditions:

- Public VPORT business card is available.
- Public lead form passes validation.

Flow:

Public business-card controller validates lead input.
Controller calls `createVportBusinessCardLeadDAL`.
DAL calls `submit_business_card_lead` RPC.
Controller fires confirmation email through `send-lead-confirmation`.
Controller publishes `lead_received` notification linking owner to `/actor/{actorId}/dashboard/leads`.
Dashboard leads module later reads the created row.

Expected Result:

Lead appears in owner inbox and owner can manage it.

Data Changes:

- Insert into `vport.business_card_leads` through RPC outside dashboard leads module.

---

## 5. Failure Paths

### FP-001

BEH-DASH-leads-101

Trigger:

Route has no `actorId`.

Expected System Behavior:

Final screen returns null.

Expected UI Behavior:

No leads UI renders.

Expected Logging:

No required logging found in source.

---

### FP-002

BEH-DASH-leads-102

Trigger:

Viewer is unauthenticated.

Expected System Behavior:

Final screen blocks before view mount.

Expected UI Behavior:

Displays `Sign in required.`

Expected Logging:

No required logging found in source.

---

### FP-003

BEH-DASH-leads-103

Trigger:

Viewer is not owner of target VPORT actor.

Expected System Behavior:

Final screen blocks before view mount.

Expected UI Behavior:

Displays `You can only access leads for your own vport.`

Expected Logging:

No required logging found in source.

---

### FP-004

BEH-DASH-leads-104

Trigger:

Unauthorized caller invokes list/count/mark/delete controller paths directly.

Expected System Behavior:

`assertActorOwnsVportActorController` rejects before profile resolution and before DAL reads/writes.

Expected UI Behavior:

Hook captures load/action error where applicable.

Expected Logging:

No required logging found in source.

---

### FP-005

BEH-DASH-leads-105

Trigger:

Controller cannot resolve VPORT profile id for actor.

Expected System Behavior:

Controller throws `Could not resolve vport profile.`

Expected UI Behavior:

Load/action error is shown by owner inbox view.

Expected Logging:

No required logging found in source.

---

### FP-006

BEH-DASH-leads-106

Trigger:

Lead read DAL errors during main inbox load.

Expected System Behavior:

Hook catches error and returns empty list.

Expected UI Behavior:

In DEV, detailed error may render. In production, view renders `Unable to load leads right now.`

Expected Logging:

No required logging found in source.

---

### FP-007

BEH-DASH-leads-107

Trigger:

New lead count DAL errors.

Expected System Behavior:

`readNewLeadsCountByProfileDAL` returns `0` instead of throwing.

Expected UI Behavior:

Badge count silently falls back to `0`.

Expected Logging:

No required logging found in source.

---

### FP-008

BEH-DASH-leads-108

Trigger:

Mark contacted or delete fails.

Expected System Behavior:

Hook stores action error and clears busy state.

Expected UI Behavior:

Action error appears above the list.

Expected Logging:

No required logging found in source.

---

### FP-009

BEH-DASH-leads-109

Trigger:

Public lead confirmation email Edge Function fails after lead submission.

Expected System Behavior:

Public lead controller/DAL swallows confirmation email failure because it is fire-and-forget.

Expected UI Behavior:

Public lead submission is not blocked by email failure.

Expected Logging:

Edge Function may log its own SES errors; frontend DAL swallows invoke failure.

---

## 6. Security Rules

### SEC-001

BEH-DASH-leads-201

Rule:

Only owners may mount dashboard leads view for a VPORT actor.

Enforcement Layer:

Final screen: `VportDashboardLeadsFinalScreen`.

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-002

BEH-DASH-leads-202

Rule:

Lead list/count/mark/delete operations must assert actor ownership before profile resolution and DAL access.

Enforcement Layer:

Controller: `vportLeads.controller.js`.

Current Status:

SOURCE VERIFIED and TEST COVERED for primary controller paths.

Finding Links:

Past weak local assertion finding appears patched by canonical `assertActorOwnsVportActorController`.

---

### SEC-003

BEH-DASH-leads-203

Rule:

Lead update/delete DALs must scope writes by both lead id and VPORT profile id.

Enforcement Layer:

DAL: `vportLeads.write.dal.js`.

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-004

BEH-DASH-leads-204

Rule:

Lead inbox data contains PII and must remain owner-only; team/staff delegation is intentionally unsupported.

Enforcement Layer:

Controller policy comments and owner-only gate.

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-005

BEH-DASH-leads-205

Rule:

Fast poll count must not become an unauthenticated profile-id enumeration path.

Enforcement Layer:

Controller: `fastCountNewVportLeadsController`.

Current Status:

PATCHED / SOURCE VERIFIED.

Finding Links:

LEADS-FASTCOUNT-001 patched by requiring `actorId + callerActorId + profileId` and asserting ownership before the count DAL.

---

### SEC-006

BEH-DASH-leads-206

Rule:

Public card module must own lead submission; dashboard leads must not expose submission writes.

Enforcement Layer:

Module boundary and public business-card RPC path.

Current Status:

SOURCE VERIFIED.

Finding Links:

Public lead submission and `send-lead-confirmation` external governance tracked separately.

---

### SEC-007

BEH-DASH-leads-207

Rule:

Dashboard card public index must not export DALs/controllers as public API.

Enforcement Layer:

Architecture/SENTRY Rule 9.

Current Status:

RESOLVED / SOURCE-VERIFIED. `leads/index.js` no longer exports `./dal/*` or `./controller/*`.

Finding Links:

RULE9-DASH-LEADS-001.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-leads-301

Invariant:

A non-owner must never view another VPORT actor's lead inbox.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-leads-001.

---

### MNH-002

BEH-DASH-leads-302

Invariant:

Controller list/count/mark/delete operations must never call profile/DAL functions before ownership assertion passes.

Current Status:

SOURCE VERIFIED and TEST COVERED.

Related Findings:

Past BW-VPD-003 weak assertion appears patched.

Required Tests:

Existing controller tests plus TESTREQ-DASH-leads-002.

---

### MNH-003

BEH-DASH-leads-303

Invariant:

Mark-contacted and delete must never mutate a lead outside the resolved owner profile.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-leads-003.

---

### MNH-004

BEH-DASH-leads-304

Invariant:

Cached profile-id fast count must never be usable as a standalone caller-supplied authorization bypass.

Current Status:

PATCHED / SOURCE VERIFIED / TEST COVERED.

Related Findings:

LEADS-FASTCOUNT-001.

Required Tests:

TESTREQ-DASH-leads-004.

---

### MNH-005

BEH-DASH-leads-305

Invariant:

Lead DALs and controllers must never be exported as the public card boundary.

Current Status:

RESOLVED / SOURCE-VERIFIED.

Related Findings:

RULE9-DASH-LEADS-001.

Required Tests:

TESTREQ-DASH-leads-005.

---

### MNH-006

BEH-DASH-leads-306

Invariant:

Public lead submission must never bypass `submit_business_card_lead` RPC policy or allow unaudited email spam via `send-lead-confirmation`.

Current Status:

CAUTION / EXTERNAL GOVERNANCE. Current public source uses the `submit_business_card_lead` SECURITY DEFINER RPC and fire-and-forget `send-lead-confirmation` Edge Function.

Related Findings:

DEFER-009.

Required Tests:

TESTREQ-DASH-leads-006.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.business_card_leads` | Yes: owner inbox list and new-count reads. | No from dashboard leads; public business-card RPC inserts. | Yes: `source` updated to contacted state. | Yes: owner deletes lead by id/profile id. |
| `vport.profiles` | Yes: actor id to profile id resolution. | No. | No from dashboard leads. | No. |
| `vc.actor_owners` | Yes: ownership assertion. | No. | No. | No. |
| `submit_business_card_lead` RPC | No dashboard owner read. | Yes from public business-card module. | No. | No. |
| `send-lead-confirmation` Edge Function | Invoked by public lead submission flow. | No table write directly in dashboard source. | Email send side effect. | No. |

---

## 9. Side Effects

Notifications:

- Public business-card controller publishes `lead_received` notification to the VPORT actor owner after successful lead insert.

Analytics:

- No analytics side effect found in dashboard leads source.

Media:

- No media mutation found in dashboard leads source.

Exports:

- No export/download side effect found in source.

Jobs:

- No background job enqueue found in dashboard leads source.

Cache:

- `useVportLeads` keeps local list state and updates/removes rows after successful mutations.
- `useVportNewLeadsCount` caches `resolvedProfileId` in a ref for fast polling.

Other:

- Public lead confirmation email is fire-and-forget and does not block lead submission.
- New lead count polls every 60 seconds.

---

## 10. UI Outputs

Loading States:

- Final screen shows skeleton while identity/ownership loads.
- Leads view shows skeleton while inbox loads.
- Busy lead id drives `Updating...` and `Deleting...` button labels.

Success States:

- Lead count card displays current list length.
- Mark-contacted updates a lead badge from `New` to `Contacted`.
- Delete removes lead card.

Error States:

- Sign-in required.
- Owner-only access denial.
- Load error card; production copy hides raw details.
- Action error card for mark/delete failures.

Empty States:

- `No leads yet.`
- Contact line falls back to `No phone or email`.
- Message preview falls back to `No message provided.`

Owner States:

- Owner can mark uncontacted leads and delete leads.
- Contacted leads disable the mark-contacted action.

Public States:

- Public submitter uses public business-card lead form outside this module.

---

## 11. Acceptance Criteria

### AC-DASH-leads-001

Requirement:

Lead inbox renders only for target VPORT owners.

Evidence:

`VportDashboardLeadsFinalScreen.jsx`

Status:

SOURCE VERIFIED.

---

### AC-DASH-leads-002

Requirement:

Primary lead operations assert ownership before profile resolution and DAL access.

Evidence:

`vportLeads.controller.js`, `vportLeads.controller.test.js`

Status:

SOURCE VERIFIED and TEST COVERED.

---

### AC-DASH-leads-003

Requirement:

Lead update/delete writes are scoped by resolved profile id and lead id.

Evidence:

`vportLeads.write.dal.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-leads-004

Requirement:

Fast count poll path cannot stand alone as an unauthenticated profile-id count API.

Evidence:

`useVportNewLeadsCount.js`, `fastCountNewVportLeadsController`

Status:

COMPLETE - fast-count poll now requires `actorId`, `callerActorId`, and cached `profileId`, and asserts ownership before count DAL access.

---

### AC-DASH-leads-005

Requirement:

Lead card public index exports only safe module boundary surfaces.

Evidence:

`leads/index.js`; regression coverage in `leads.index.rule9.test.js`.

Status:

PASS / SOURCE-VERIFIED.

---

### AC-DASH-leads-006

Requirement:

Public lead insertion stays owned by public business-card RPC flow, not dashboard leads internals.

Evidence:

`public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js`

Status:

SOURCE VERIFIED / CAUTION. Public insertion uses `submit_business_card_lead` RPC; DB function governance remains tracked externally.

---

### AC-DASH-leads-007

Requirement:

Lead dashboard route documentation matches the current route table.

Evidence:

`protected/app.routes.jsx`, `appRoutes.redirects.jsx`, `VportDashboardScreen.jsx`, `VportLeadsChip.jsx`.

Status:

SOURCE VERIFIED / DOCUMENTED.

---

### AC-DASH-leads-008

Requirement:

Public lead submission RPC and confirmation Edge Function are explicitly tracked outside dashboard owner source.

Evidence:

`vportBusinessCardLead.write.dal.js`, `sendLeadConfirmationEmail.edge.dal.js`, `vportBusinessCard.controller.js`.

Status:

OPEN / TRACKED BY DEFER-009 and LEADS-PUBLIC-RPC-001.

---

## 12. Test Requirements

### TESTREQ-DASH-leads-001

Validates:

Unauthenticated and non-owner viewers cannot mount leads view.

Type:

Screen/hook integration.

Status:

MISSING.

---

### TESTREQ-DASH-leads-002

Validates:

List/count/mark/delete reject unauthorized callers before any profile/DAL calls.

Type:

Controller unit test.

Status:

COMPLETE.

---

### TESTREQ-DASH-leads-003

Validates:

Mark-contacted and delete DAL calls include both lead id and resolved profile id.

Type:

Controller/DAL unit test.

Status:

PARTIAL — delete controller test verifies `{ profileId, leadId }`; mark-contacted owner-path DAL argument coverage is still missing.

---

### TESTREQ-DASH-leads-004

Validates:

Fast-count polling either reuses only an owner-verified cached profile id or is replaced by an actor-gated count path.

Type:

Hook/controller unit test.

Status:

COVERED - focused controller tests verify owner-gated fast count and unauthorized caller rejection before DAL access.

---

### TESTREQ-DASH-leads-005

Validates:

`leads/index.js` does not export DALs or controllers and no consumers rely on direct DAL/controller imports through the card boundary.

Type:

Architecture/import test or scanner assertion.

Status:

PRESENT in `leads.index.rule9.test.js`.

---

### TESTREQ-DASH-leads-006

Validates:

Public lead submission RPC and `send-lead-confirmation` Edge Function governance remain intact.

Type:

Public module security/Edge Function test.

Status:

EXTERNAL / TRACKED BY DEFER-009.

---

### TESTREQ-DASH-leads-007

Validates:

Route map contains `/actor/:actorId/dashboard/leads` plus `/vport/:actorId/dashboard/leads` redirect, and no stale `/vport/dashboard/leads` route is assumed.

Type:

Route/source assertion.

Status:

MISSING / TRACKED BY LEADS-ROUTE-001.

---

### TESTREQ-DASH-leads-008

Validates:

Public lead submission RPC permissions/function body and `send-lead-confirmation` Edge Function spam/abuse controls are reviewed.

Type:

DB/Edge governance verification.

Status:

EXTERNAL / TRACKED BY DEFER-009 and LEADS-PUBLIC-RPC-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| RULE9-DASH-LEADS-001 | P1 architecture/security | RESOLVED / SOURCE-VERIFIED | BEH-DASH-leads-207, BEH-DASH-leads-305, AC-DASH-leads-005, TESTREQ-DASH-leads-005 |
| LEADS-FASTCOUNT-001 | MEDIUM / caution | PATCHED / SOURCE VERIFIED | BEH-DASH-leads-205, BEH-DASH-leads-304, AC-DASH-leads-004, TESTREQ-DASH-leads-004 |
| DEFER-009 | External/public Edge Function | OPEN | BEH-DASH-leads-306, AC-DASH-leads-008, TESTREQ-DASH-leads-006, TESTREQ-DASH-leads-008 |
| LEADS-ROUTE-001 | LOW / documentation drift | OPEN | AC-DASH-leads-007, TESTREQ-DASH-leads-007 |
| LEADS-PUBLIC-RPC-001 | MEDIUM / public RPC governance | OPEN | BEH-DASH-leads-306, AC-DASH-leads-008, TESTREQ-DASH-leads-008 |
| BW-VPD-003 | MEDIUM historical | SOURCE APPEARS PATCHED | BEH-DASH-leads-202, BEH-DASH-leads-302 |
| SPIDER-MAN lead controller gate tests | Regression coverage | COMPLETE | TESTREQ-DASH-leads-002 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Final-screen owner gate. | SOURCE VERIFIED | No |
| Primary lead controller ownership gates. | TEST COVERED | No |
| Lead write DALs scope by lead id and profile id. | SOURCE VERIFIED | No |
| Rule 9 public index exports remediated. | RESOLVED / SOURCE-VERIFIED | No |
| Fast-count poll path re-gated or formally accepted. | COMPLETE | No |
| Public lead submission/confirmation Edge Function governance verified. | EXTERNAL OPEN | Yes for dashboard-wide CLEAR |
| Public lead submission SECURITY DEFINER RPC governance verified. | EXTERNAL OPEN | Yes for dashboard-wide CLEAR |
| Leads route documentation matches active route table. | DOCUMENTED | No |
| Screen/hook integration tests for non-owner mounting. | MISSING | Yes for SPIDER-MAN COMPLETE |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner lead inbox list | Not source-verified in this pass. | OPEN QUESTION |
| New leads badge count | Not source-verified in this pass. | OPEN QUESTION |
| Mark contacted/delete actions | Not source-verified in this pass. | OPEN QUESTION |
| Public lead submission | Native parity tracked under public business-card flow. | OPEN QUESTION |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking ownership adapter | Canonical actor-owner gate for owner operations. | ACTIVE |
| Public business-card lead flow | Creates leads consumed by dashboard owner inbox. | ACTIVE |
| Notifications adapter | Owner notification after public lead creation. | ACTIVE |
| Edge Function `send-lead-confirmation` | Confirmation email to submitter. | EXTERNAL GOVERNANCE |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-leads-001 | Should `fastCountNewVportLeadsController` be removed or changed to require `actorId + callerActorId`? | RESOLVED — changed to require `actorId + callerActorId + profileId` and assert ownership before DAL access. |
| OQ-DASH-leads-002 | Should `leads/index.js` export only hooks/screens/models and stop exporting DAL/controllers? | ANSWERED — yes; source patched. |
| OQ-DASH-leads-003 | Should mark-contacted use a dedicated `contacted_at` column instead of encoding contacted state in `source`? | OPEN |
| OQ-DASH-leads-004 | Should delete be soft-delete/audit tracked instead of hard delete? | OPEN |
| OQ-DASH-leads-005 | What native/alternate lead inbox must match this behavior? | OPEN |
| OQ-DASH-leads-006 | Should public lead creation continue using `submit_business_card_lead` SECURITY DEFINER RPC, or move to an RLS/Edge governance model? | OPEN / TRACKED BY LEADS-PUBLIC-RPC-001 |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | MEDIUM | Yes for dashboard/public lead side effects; Edge Function internals not audited in this pass |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes |
| Security Findings Linked | MEDIUM | Current source verified; some finding ids are synthesized from governance wording |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | Missing source |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |
| Command Sign-Off | MEDIUM | Derived from dashboard matrix, source, scanner, and governance docs |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED - routes, final/view split, hooks, controllers, DALs, public submission dependency, and Rule 9 boundary mapped; public barrel now patched.

VENOM: COMPLETE WITH CAUTION - primary owner operations and fast count are gated; Rule 9 public barrel is patched; Edge Function governance remains a caution item.

ELEKTRA: COMPLETE WITH CAUTION - source-to-sink paths traced; fast count path is patched; public RPC/Edge governance remains open.

BLACKWIDOW: COMPLETE WITH CAUTION - historical weak assertion and profile-id fast count are patched; adversarial residual risk remains in public RPC/Edge submission governance.

SPIDER-MAN: PARTIAL - controller ownership, fast-count, and import-boundary tests exist; broader screen/hook tests are missing.

PROFESSOR X: DRAFT READY FOR REVIEW.

THOR: CAUTION - not eligible for CLEAR until Edge Function governance and missing broader tests are resolved or accepted.

---

Final Verdict:

BEHAVIOR_DRAFT_READY_FOR_REVIEW
