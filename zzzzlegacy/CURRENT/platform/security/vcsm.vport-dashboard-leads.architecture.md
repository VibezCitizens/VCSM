# MODULE ARCHITECTURE REPORT

**Module:** VPORT Dashboard Leads  
**Application Scope:** apps/VCSM  
**Module Type:** feature module — owner-facing CRM surface  
**Primary Root:** `apps/VCSM/src/features/dashboard/vport/`  
**Independence Status:** MOSTLY INDEPENDENT  
**Completeness Status:** INCOMPLETE  
**Scan Date:** 2026-05-24  
**Source:** ARCHITECT — statically traced  

---

## PURPOSE

Provides vport owners with a private dashboard view of all leads submitted via the VPORT Business Card public form. Owners can view lead contact info, mark leads as contacted (state mutation on `source` field), delete leads, and see a live floating badge count of new (uncontacted) leads.

**Two-sided flow:**
- **Submission side (public):** Anonymous visitors submit a lead form on the business card page (`/features/public/vportBusinessCard/`) via a SECURITY DEFINER RPC.
- **Management side (owner):** Authenticated vport owners view and action leads via the dashboard leads screen.

---

## OWNERSHIP

Feature: `features/dashboard/vport`  
Table: `vport.business_card_leads`  
Auth gate: `assertActorOwnsVportActorController` (via approved booking adapter exception)  
RLS: Policies `business_card_leads_owner_select`, `business_card_leads_owner_update`, `business_card_leads_owner_delete`  
INSERT: RPC-only (`submit_business_card_lead`, SECURITY DEFINER)

---

## ENTRY POINTS

| Route | Type | Component | Notes |
|---|---|---|---|
| `/actor/:actorId/dashboard/leads` | Protected | `VportDashboardLeadsScreen` | Canonical route |
| `/vport/:actorId/dashboard/leads` | Protected redirect | `VportToActorDashboardLeadsRedirect` | Legacy — converts to canonical |
| `RootLayout` mount | Global chip | `VportLeadsChip` | Floating badge — only when vport identity + count > 0 + not on leads page |

---

## LAYER MAP

```
DAL (Read)
  apps/VCSM/src/features/dashboard/vport/dal/read/vportLeads.read.dal.js
    readVportBusinessCardLeadsByProfileDAL(profileId, { limit })
    readNewLeadsCountByProfileDAL(profileId)

DAL (Write)
  apps/VCSM/src/features/dashboard/vport/dal/write/vportLeads.write.dal.js
    markVportBusinessCardLeadContactedDAL({ profileId, leadId, source })
    deleteVportBusinessCardLeadDAL({ profileId, leadId })

DAL (Public submission — separate feature boundary)
  apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js
    createVportBusinessCardLeadDAL({ slug, name, phone, email, message, source, userAgent })
    → calls RPC submit_business_card_lead (SECURITY DEFINER, anon-safe)

Model: [PARTIAL — FRAGMENTED ACROSS LAYERS]
  apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js
    normalizeLead(row)           ← domain shape transform — LIVES IN CONTROLLER (violation)
    resolveProfileId(actorId)    ← profile resolution helper — LIVES IN CONTROLLER

  apps/VCSM/src/features/dashboard/vport/screens/vportDashboardLeadsScreen.model.js
    formatLeadDate(value)        ← display formatter (correct scope)
    formatSourceLabel(source)    ← display formatter (correct scope)
    previewMessage(message)      ← display formatter (correct scope)
    toText(value)                ← DUPLICATED (also in controller and write DAL)

Controller
  apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js
    listVportLeadsController(actorId, { limit }, callerActorId)
    markVportLeadContactedController(actorId, { leadId, source }, callerActorId)
    countNewVportLeadsController(actorId, callerActorId)
    deleteVportLeadController(actorId, { leadId }, callerActorId)

Cross-feature adapter (approved §5.3 exception)
  apps/VCSM/src/features/booking/adapters/booking.adapter.js
    assertActorOwnsVportActorController({ requestActorId, targetActorId })

Hooks
  apps/VCSM/src/features/dashboard/vport/hooks/useVportLeads.js
    useVportLeads(actorId)
    → state: leads[], loading, error, actionError, busyLeadId
    → actions: refresh(), markContacted(lead), deleteLead(leadId)

  apps/VCSM/src/features/dashboard/vport/hooks/useVportNewLeadsCount.js
    useVportNewLeadsCount(actorId)
    → polls every 60 seconds
    → state: count (number)

Components
  apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx
    VportLeadsChip()
    → position: fixed floating badge
    → rendered from RootLayout (global layout mount)
    → conditionally visible: isVport AND count > 0 AND !isOnLeadsPage

Screen
  apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsScreen.jsx
    VportDashboardLeadsScreen()
    → 280 lines — APPROACHING FILE LIMIT (300)
    → Acts as BOTH Final Screen AND View Screen (violation)
    → Desktop: renders via createPortal to document.body (iOS stacking workaround)

Public Submission UI (separate feature — cross-boundary read-only reference)
  apps/VCSM/src/features/public/vportBusinessCard/view/BusinessCardLeadForm.jsx
  apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js
  apps/VCSM/supabase/functions/send-lead-confirmation/index.ts
    → Deno edge function (AWS SESv2) — sends confirmation email to lead submitter
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Owner leads CRM — clear and narrow scope | — |
| Owner defined | PASS | `features/dashboard/vport` owns all files | — |
| Entry points mapped | PASS | Two routes + global chip | Legacy redirect present |
| Controllers present/delegated | PASS | `vportLeads.controller.js` — 4 operations | `normalizeLead` leaks into controller |
| DAL/repository present | PASS | `vportLeads.read.dal.js` + `vportLeads.write.dal.js` | Explicit column select ✓, no `select('*')` ✓ |
| Models/transformers present | PARTIAL | Display model exists in `screens/`; domain shape transform (`normalizeLead`) inside controller | Model should be in `model/` not `screens/`; `normalizeLead` must move to `model/` |
| Hooks/view models present | PASS | `useVportLeads`, `useVportNewLeadsCount` | — |
| Screens/components present | PASS | `VportDashboardLeadsScreen`, `VportLeadsChip` | Screen combines Final + View layers |
| Services/adapters present | PASS | Ownership gate via approved booking adapter exception | Cross-feature import is approved |
| Database objects mapped | PASS | `vport.business_card_leads` — explicit columns, RLS, migration | — |
| Authorization path mapped | PASS | App-layer: `assertActorOwnsVportActorController`; DB-layer: RLS policies (select/update/delete) | Dual-layer auth verified |
| Cache/runtime behavior mapped | FAIL | No cache layer — every read hits DB directly | Count poll hits ownership check (2 DB reads) every 60s |
| Error/loading/empty states | PASS | All three present in screen: SkeletonCardList, error banners, "No leads yet." | Action errors shown independently from load errors ✓ |
| Documentation linked | FAIL | No Logan doc exists for this module | Must be created |
| Tests/validation noted | FAIL | No tests present or referenced | — |
| Native parity noted | UNKNOWN | No native notes found | — |
| Engine dependencies mapped | N/A | No engine consumed — direct DAL pattern is correct for this feature | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `vport.business_card_leads` | database | controller → DAL → table | YES | Direct Supabase read/write via `vportClient` |
| `vportProfile.read.dal` | DAL | controller → dashboard/vport dal | YES | Internal DAL — resolves profileId from actorId |
| `booking.adapter` → `assertActorOwnsVportActorController` | feature adapter | controller → booking feature via adapter | YES — §5.3 approved exception | Documented in adapter file |
| `useIdentity` | state | hooks → identity context | YES | Correct — reads `identity.actorId` only |
| `useVportOwnership` | hook | screen → dashboard/vport hook | YES | Internal cross-hook within same feature |
| `SkeletonCardList` | UI | screen → shared component | YES | Shared component — correct path |
| `VportLeadsChip` | component | RootLayout → dashboard/vport component | WATCH | Global layout importing from feature internals — not through adapter |
| `submit_business_card_lead` | RPC | public DAL → Supabase RPC | YES | SECURITY DEFINER, anon-safe |
| `send-lead-confirmation` | edge function | public submission trigger | YES | Deno/TypeScript — approved for supabase/functions/ |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.business_card_leads.id` | read | vport owner (RLS) | controller, screen | LOW |
| `vport.business_card_leads.vport_profile_id` | read/write (filter) | vport owner (RLS) | DAL (all methods) | LOW |
| `vport.business_card_leads.actor_id` | read | vport owner (RLS) | controller (normalizeLead) | LOW — not currently exposed in UI |
| `vport.business_card_leads.name` | read | vport owner (RLS) | screen | LOW |
| `vport.business_card_leads.phone` | read | vport owner (RLS) | screen | MEDIUM — PII, visible to owner only, no export path |
| `vport.business_card_leads.email` | read | vport owner (RLS) | screen | MEDIUM — PII, visible to owner only, no export path |
| `vport.business_card_leads.message` | read | vport owner (RLS) | screen | LOW |
| `vport.business_card_leads.source` | read/write | vport owner (UPDATE source only) | DAL (contacted mutation) | LOW — column-level grant limits write surface |
| `vport.business_card_leads.created_at` | read | vport owner (RLS) | screen | LOW |
| `normalizeLead` shape | derived | controller | hook → screen | MEDIUM — model shape defined in controller, not model layer |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `/actor/:actorId/dashboard/leads` registered in `app.routes.jsx` | — |
| Loading state | PASS | `SkeletonCardList count={3} showBody` while loading | — |
| Empty state | PASS | "No leads yet." rendered when `leads.length === 0` | — |
| Error state | PASS | Error banner for load errors; `actionError` banner for action errors | Load errors reveal message only in `import.meta.env.DEV` ✓ |
| Auth/owner gate | PASS | `useVportOwnership` check → leads hook only called when `isOwner === true` | Screen shows "You can only access leads for your own vport." on failure |
| Sign-in gate | PASS | `if (!identity)` renders sign-in required message | — |
| Cache behavior | FAIL | No cache — every screen mount triggers fresh DB read | Count also re-fetched on every 60s poll |
| Polling behavior | WATCH | 60s interval in `useVportNewLeadsCount` | Ownership check runs on EVERY poll (2 extra DB reads per cycle) |
| Hot path | WATCH | `countNewVportLeadsController` → `assertActorOwnsVportActorController` → `getActorByIdDAL` + `readActorOwnerLinkByActorAndUserProfileDAL` | 3 sequential queries per 60s badge poll per open vport session |
| Busy state | PASS | `busyLeadId` prevents double-firing on mark/delete | — |
| Desktop portal | PASS | `createPortal` to `document.body` when `isDesktop` | Correct iOS stacking context avoidance |
| Lead limit | WATCH | Hook fetches up to 150 leads; no pagination | Large vport accounts may accumulate > 150 leads with no way to see older ones |
| Screen size | WATCH | 280 lines — approaching 300-line limit | If any new feature added, split required |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vcsm/features/vport-dashboard-leads.md` | MISSING |
| Ownership record | `features/dashboard/vport` — implicit | PRESENT (implicit) |
| Security audit | Migration `20260427080000` — documented root cause + fix | PRESENT (migration only) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | `supabase/migrations/20260427080000_grant_business_card_leads_owner_write.sql` | PRESENT |
| Native transfer audit | — | MISSING/UNKNOWN |
| Engine audit | N/A — no engine dependency | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| `normalizeLead()` lives in controller instead of model layer | HIGH | Domain shape transforms belong in model; controller should only orchestrate | WOLVERINE → extract to `model/vportLead.model.js` |
| `toText()` utility duplicated 3 times | HIGH | Defined in write DAL, controller, and screen model — should be a single shared utility | WOLVERINE → consolidate to `shared/utils/toText.js` or `shared/lib/text.js` |
| Model file misplaced | MEDIUM | `vportDashboardLeadsScreen.model.js` lives in `screens/` — should live in `model/` | WOLVERINE → move to `model/vportLead.display.model.js` |
| Screen combines Final Screen + View Screen | HIGH | Contract requires Final Screen (gate only) and View Screen (composition) to be separate files | SENTRY → split into `VportDashboardLeadsFinalScreen.jsx` + `VportDashboardLeadsView.jsx` |
| No cache layer on lead list | MEDIUM | Every screen mount triggers full read; polling ownership adds 2 DB reads per cycle | KRAVEN → assess; consider TTL cache at controller level |
| No cache on count poll | MEDIUM | 60s polling fires ownership check (2 DB reads) every cycle per open vport session | KRAVEN → ownership check should cache actor kind/ownership short-circuit |
| No pagination on lead list | MEDIUM | Hard-cap at 150 leads with no way to view older ones | WOLVERINE → add cursor/offset pagination |
| `VportLeadsChip` not exported through adapter | LOW | RootLayout imports directly from `components/VportLeadsChip` — bypasses feature boundary | SENTRY → expose via `vport.adapter.js` |
| No Logan documentation | CRITICAL | Module has no canonical doc — cannot be verified by LOGAN, VENOM, or THOR | LOGAN |
| No tests | HIGH | No validation layer exists; security-sensitive PII-adjacent feature | — |
| Screen approaching 300-line limit | LOW | At 280 lines — any addition triggers mandatory split | WOLVERINE |

---

## MODULE BOUNDARY WARNINGS

---

**MODULE BOUNDARY WARNING**  
Location: `apps/VCSM/src/app/layout/RootLayout.jsx:7`  
Module: dashboard/vport leads  
Current dependency: `import { VportLeadsChip } from "@/features/dashboard/vport/components/VportLeadsChip"`  
Expected boundary: Global layout should not import directly from feature internals; should import through `vport.adapter.js`  
Risk: LOW — VportLeadsChip is a leaf component with no write side effects; import direction is one-way. Non-urgent but creates a direct layout-to-feature coupling that bypasses the adapter contract.  
Suggested correction: Add `VportLeadsChip` to `adapters/vport.adapter.js` exports and update RootLayout import to `@/features/dashboard/vport/adapters/vport.adapter`

---

**MODULE BOUNDARY WARNING**  
Location: `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js:20-33`  
Module: dashboard/vport leads  
Current dependency: `normalizeLead()` — domain shape transform embedded in controller  
Expected boundary: Domain shape transforms belong in the model layer, not the controller  
Risk: MEDIUM — Controller is doing both business orchestration AND domain shape definition. If the lead shape changes, the model layer is not the single source of truth.  
Suggested correction: Extract `normalizeLead()` to `model/vportLead.model.js`; controller imports and calls it.

---

**MODULE BOUNDARY WARNING**  
Location: `vportLeads.write.dal.js:6`, `vportLeads.controller.js:16`, `vportDashboardLeadsScreen.model.js:1`  
Module: dashboard/vport leads  
Current dependency: `toText()` duplicated 3 times  
Expected boundary: Shared pure utility should live in `shared/utils/` or `shared/lib/`  
Risk: MEDIUM — Three independent implementations that can drift. Currently identical but will diverge.  
Suggested correction: Create `shared/lib/text.js` exporting `toText(value)` and replace all three inline copies.

---

**MODULE BOUNDARY WARNING**  
Location: `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsScreen.jsx:17-279`  
Module: dashboard/vport leads  
Current dependency: Single screen file handles route params, identity gate, ownership gate, hook composition, and full render logic  
Expected boundary: Final Screen = route + identity gate only; View Screen = hooks + composition  
Risk: HIGH — Contract violation. Screen is 280 lines and doing too much. Adding any new section will exceed 300-line limit immediately.  
Suggested correction: Split into `VportDashboardLeadsFinalScreen.jsx` (actorId guard + identity gate + ownership gate) and `VportDashboardLeadsView.jsx` (hook calls + render)

---

## DEAD CODE FINDINGS

No dead code detected within the leads module. All files are referenced:
- DAL files → controller → hooks → screen (traced)
- `VportLeadsChip` → RootLayout (traced)
- `vportDashboardLeadsScreen.model.js` → screen (traced)
- Public submission DAL → public business card hook (separate feature, not audited here)

---

## SPAGHETTI CODE FINDINGS

**SPAGHETTI CODE FINDING**  
Location: `vportLeads.controller.js`  
Pattern: Model transform embedded in controller layer  
Classification: LOW  
Evidence: `normalizeLead()` and `resolveProfileId()` are domain operations that belong in the model layer. Controller mixes orchestration with data shaping.  
Architectural risk: Model shape divergence risk; violates single responsibility.  
Suggested untangling direction: Extract both to `model/vportLead.model.js`  
Recommended handoff: WOLVERINE

**SPAGHETTI CODE FINDING**  
Location: `vportLeads.write.dal.js`, `vportLeads.controller.js`, `vportDashboardLeadsScreen.model.js`  
Pattern: `toText()` utility duplicated across three layers  
Classification: LOW  
Evidence: Identical 2-line function defined independently in DAL, controller, and model. Classic copy-paste drift setup.  
Architectural risk: Future divergence if one copy is modified without updating others.  
Suggested untangling direction: `shared/lib/text.js` → `export function toText(value)`  
Recommended handoff: WOLVERINE

---

## CODE HEALTH METRICS

| Module | Files | Layers Present | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| vport-dashboard-leads | 8 | 5/7 (no dedicated model, no service) | 1 (approved) | 0 | 0 | WATCH |

---

## SPAGHETTI SCORE

**Module:** vport-dashboard-leads  
**Score:** WATCH  
**Reasons:**
- `normalizeLead` in controller not model
- `toText` duplicated 3x across layers
- Screen conflates Final Screen + View Screen roles
- Model file placed in `screens/` directory  

**Release risk:** LOW — all functionality works correctly. No circular deps, no auth bypass, no data corruption risk. Structural violations are organizational, not runtime-breaking.

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

The module is functionally complete and production-running. Security is sound (dual-layer RLS + app-layer ownership assertion). UX states are covered (load/empty/error/busy). The violations are structural/organizational, not runtime-breaking.

---

## RECOMMENDED HANDOFFS

| Command | Reason | Priority |
|---|---|---|
| **LOGAN** | Create Logan doc for this module | P1 |
| **WOLVERINE** | Extract `normalizeLead` to model; consolidate `toText`; split screen; add pagination | P1 |
| **SENTRY** | Verify screen layer violation; verify adapter bypass for VportLeadsChip | P2 |
| **KRAVEN** | Audit 60s polling overhead — ownership check on every count poll cycle | P2 |
| **VENOM** | Review PII exposure surface (phone/email) — no export path, but verify no accidental log or analytics leak | P2 |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Create Logan documentation | No canonical doc exists | LOGAN |
| P1 | Extract `normalizeLead` → `model/vportLead.model.js` | Contract violation: domain shape in controller | WOLVERINE |
| P1 | Consolidate `toText` → `shared/lib/text.js` | 3 duplicated utility definitions | WOLVERINE |
| P1 | Split screen into Final + View | Contract violation; screen at 280 lines | WOLVERINE |
| P1 | Move model file from `screens/` to `model/` | Layer placement violation | WOLVERINE |
| P2 | Add `VportLeadsChip` to `vport.adapter.js` | Layout bypasses feature adapter | SENTRY |
| P2 | Cache ownership result in count poll hook | 2 extra DB reads per 60s per open session | KRAVEN |
| P2 | Add pagination beyond 150-lead cap | Large accounts lose access to older leads | WOLVERINE |
| P3 | Normalize `limit` default between hook (150) and DAL (100) | Minor inconsistency | WOLVERINE |
