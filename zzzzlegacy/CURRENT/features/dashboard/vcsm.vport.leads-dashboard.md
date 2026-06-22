# VCSM VPORT Leads Dashboard

> **Version:** 1  
> **Created:** 2026-05-24  
> **Last Updated:** 2026-05-24  
> **Scope:** Owner inbox for `vport.business_card_leads` — dashboard screen, count chip, controller, model, DAL, RLS, RPC, and security posture

---

## 1. Purpose

The Leads Dashboard is the owner-facing inbox for business card leads. When a visitor submits a lead via the public business card page (`/vport/:slug/card`) or from the TRAZE directory (`apps/Traffic/`), the resulting `vport.business_card_leads` row becomes visible here. Owners can mark leads as contacted and permanently delete them.

A floating `VportLeadsChip` button in the global layout polls every 60 seconds and surfaces a live badge when uncontacted leads are present, navigating the owner directly to this screen on tap.

This document covers the **owner inbox side only**. The public submission side (card page, lead form, RPC) is documented in [`vcsm.vport.business-card.md`](vcsm.vport.business-card.md).

---

## 2. Scope

**In scope:**
- Dashboard route: `/actor/:actorId/dashboard/leads`
- Screen stack: `VportDashboardLeadsScreen` → `VportDashboardLeadsFinalScreen` → `VportDashboardLeadsView`
- Controller: `vportLeads.controller.js` (list, count, mark contacted, delete)
- Model: `vportLead.model.js` (domain shape) + `vportLead.display.model.js` (display formatters)
- DAL: `vportLeads.read.dal.js` + `vportLeads.write.dal.js`
- Hooks: `useVportLeads` + `useVportNewLeadsCount`
- Chip: `VportLeadsChip` (global layout badge/button)
- DB table: `vport.business_card_leads` — post-security-hardening state
- RPC (read path): none — owner reads via RLS-protected direct SELECT

**Out of scope:**
- Public lead submission (`submit_business_card_lead` RPC, `vportBusinessCardLead.write.dal.js`) — see `vcsm.vport.business-card.md`
- Lead confirmation email (`send-lead-confirmation` Edge Function) — see `vcsm.vport.business-card.md`
- Owner notification pipeline (`fireLeadOwnerNotification`) — see `vcsm.vport.business-card.md`
- Pagination (P2 — currently capped at 150 leads via `limit` param)

---

## 3. Ownership

```
Application Scope:   VCSM
Code Root:           apps/VCSM/src/features/dashboard/vport/
Schema:              vport.business_card_leads (vport schema, Supabase)
Related Engines:     None — all logic is app-layer
Identity Surface:    actorId + kind ('vport') — never vportId or profileId
Owner Verification:  assertActorOwnsVportActorController via actor_owners table (DB-verified)
```

---

## 4. Entry Points

### Route

| Path | Element | Notes |
|---|---|---|
| `/actor/:actorId/dashboard/leads` | `VportDashboardLeadsScreen` | Canonical route |
| `/vport/:actorId/dashboard/leads` | `VportToActorDashboardLeadsRedirect` | Legacy redirect → canonical |

### Screen Stack

```
VportDashboardLeadsScreen.jsx      — 10-line re-export wrapper (route compat)
  └── VportDashboardLeadsFinalScreen.jsx   — gate-only: params + identity + ownership
        └── VportDashboardLeadsView.jsx    — hooks + full render + desktop portal
```

### Global Chip Entry Point

```
RootLayout.jsx
  └── VportLeadsChip (via vport.adapter.js)
        └── useVportNewLeadsCount(actorId)
              └── countNewVportLeadsController → readNewLeadsCountByProfileDAL
```

---

## 5. Data Flow

### Load Flow

```
VportDashboardLeadsFinalScreen
  ├── useParams() → actorId
  ├── useIdentity() → identity, identityLoading
  ├── useVportOwnership(viewerActorId, actorId) → isOwner, ownershipLoading
  │
  └── [if owner] → VportDashboardLeadsView
        └── useVportLeads(actorId)
              └── listVportLeadsController(actorId, { limit: 150 }, sessionActorId)
                    ├── assertActorOwnsVportActorController(...)  ← ownership gate
                    ├── readVportProfileByActorIdDAL({ actorId }) ← actor → profileId
                    ├── readVportBusinessCardLeadsByProfileDAL(profileId, { limit })
                    │     └── vport.from('business_card_leads').select(...).eq('vport_profile_id', profileId)
                    └── rows.map(normalizeVportLead).filter(lead => lead.id)
```

### Mark Contacted Flow

```
[Owner taps "Mark Contacted"]
  └── markContacted(lead) in useVportLeads
        └── markVportLeadContactedController(actorId, { leadId, source }, sessionActorId)
              ├── assertActorOwnsVportActorController(...)
              ├── resolveProfileId(actorId)
              ├── markVportBusinessCardLeadContactedDAL({ profileId, leadId, source })
              │     └── .update({ source: normalizeContactedSource(source) })
              │           normalizeContactedSource: "directory" → "directory_contacted"
              └── normalizeVportLead(updated) → updated lead with isContacted: true
              
              [optimistic update] setLeads(prev => prev.map(item => item.id === updated.id ? updated : item))
```

### Delete Flow

```
[Owner taps "Delete"]
  └── deleteLead(leadId) in useVportLeads
        └── deleteVportLeadController(actorId, { leadId }, sessionActorId)
              ├── assertActorOwnsVportActorController(...)
              ├── resolveProfileId(actorId)
              └── deleteVportBusinessCardLeadDAL({ profileId, leadId })
                    └── .delete().eq('id', leadId).eq('vport_profile_id', profileId)
                    
              [local update] setLeads(prev => prev.filter(item => item.id !== leadId))
```

### Count Poll Flow

```
useVportNewLeadsCount(actorId)  — polls every 60 000ms
  └── countNewVportLeadsController(actorId, callerActorId)
        ├── assertActorOwnsVportActorController(...)
        ├── resolveProfileId(actorId)
        └── readNewLeadsCountByProfileDAL(profileId)
              └── .select('id', { count: 'exact', head: true })
                    .eq('vport_profile_id', profileId)
                    .not('source', 'ilike', '%contacted%')
```

---

## 6. Source of Truth

| Data | Source | Cache |
|---|---|---|
| Lead records | `vport.business_card_leads` via Supabase client (RLS-gated SELECT) | None — loaded on mount |
| New lead count | Same table — count query, `source NOT ILIKE '%contacted%'` | None — polled every 60s |
| Owner identity | `useIdentity()` → `identityContext` (Zustand) | Session-length via identity store |
| Ownership verification | `actor_owners` table via `assertActorOwnsVportActorController` | None — DB call per action |
| profileId resolution | `vport.profiles` via `readVportProfileByActorIdDAL` | None — resolved per controller call |

---

## 7. Domain Model — normalizeVportLead

Input: raw `vport.business_card_leads` row  
Output: normalized lead shape consumed by all hooks and views

```js
{
  id:          row.id          | null,
  profileId:   row.vport_profile_id | null,
  actorId:     row.actor_id    | null,    // VPORT's actor_id (set by slug RPC)
  name:        string,                    // fallback: "Lead"
  phone:       string,                    // "" if null
  email:       string,                    // "" if null
  message:     string,                    // "" if null
  source:      string (lowercase),
  createdAt:   ISO string | null,
  isContacted: boolean,                   // derived: source.includes("contacted")
}
```

**isContacted derivation:** `source.includes("contacted")` — the contacted state is encoded
in the `source` column by suffixing `_contacted`. Example: `"directory"` → `"directory_contacted"`.
Owner reads `isContacted` as a display flag — no separate state column exists.

**Source allowlist** (enforced by DB CHECK constraint as of 2026-05-24):

| Submission-time | Post-contact (owner mutation) |
|---|---|
| `business_card` | `business_card_contacted` |
| `vport_card` | `vport_card_contacted` |
| `directory` | `directory_contacted` |
| `traze` | `traze_contacted` |
| `traze_provider_lead` | — |

---

## 8. Display Model — vportLead.display.model.js

Pure display-layer transforms. No side effects. No DB access.

| Export | Input | Output | Notes |
|---|---|---|---|
| `formatLeadDate(value)` | ISO timestamp string | Human-readable date + time | Fallback: `"Unknown time"` |
| `formatSourceLabel(source)` | source string | Display label | Strips `_contacted` suffix, replaces `_`/`-` with space |
| `previewMessage(message)` | message string | Truncated preview | Max 220 chars, ellipsis at 217 |

---

## 9. DB Schema — vport.business_card_leads

**Post-security-hardening state (as of 2026-05-24)**

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `vport_profile_id` | UUID | NO | — | FK → vport.profiles ON DELETE CASCADE |
| `actor_id` | UUID | YES | — | FK → vc.actors ON DELETE SET NULL; VPORT's actor_id from slug lookup |
| `name` | TEXT | NO | — | Submitter name |
| `phone` | TEXT | YES | — | At least one of phone/email required (CHECK) |
| `email` | TEXT | YES | — | |
| `message` | TEXT | NO | — | |
| `source` | TEXT | NO | `'business_card'` | Allowlisted — see CHECK constraint |
| `user_agent` | TEXT | YES | — | Submitted by client; currently always null |
| `ip_address` | INET | YES | — | Currently always null (P2 — forensic gap) |
| `created_at` | TIMESTAMPTZ | NO | now() | |

**CHECK constraints:**

```sql
business_card_leads_contact_required:
  phone IS NOT NULL OR email IS NOT NULL  (after NULLIF trim)

business_card_leads_source_allowlist:
  source IN ('business_card', 'vport_card', 'directory', 'traze', 'traze_provider_lead',
             'business_card_contacted', 'vport_card_contacted', 'directory_contacted', 'traze_contacted')
```

**Indexes:**

| Index | Definition |
|---|---|
| `business_card_leads_pkey` | UNIQUE btree (id) |
| `business_card_leads_profile_created_idx` | btree (vport_profile_id, created_at DESC) |
| `business_card_leads_actor_created_idx` | btree (actor_id, created_at DESC) |

---

## 10. RLS Policies — vport.business_card_leads

| Policy | CMD | Roles | Condition |
|---|---|---|---|
| `business_card_leads_no_direct_insert` | INSERT | `anon, authenticated` | `WITH CHECK (false)` — all direct inserts blocked |
| `business_card_leads_owner_select` | SELECT | `authenticated` | Owner subquery via `vport.profiles + vc.actor_owners + auth.uid()` |
| `business_card_leads_owner_update` | UPDATE | `authenticated` | Same owner subquery — USING + WITH CHECK |
| `business_card_leads_owner_delete` | DELETE | `authenticated` | Same owner subquery |

**Table-level grants (post-hardening):**

| Role | Privileges |
|---|---|
| `anon` | *(none)* — INSERT revoked 2026-05-24 |
| `authenticated` | SELECT, UPDATE (source only), DELETE |
| `postgres` | ALL |

**INSERT path:** All writes go through `vport.submit_business_card_lead(p_slug, ...)` — a SECURITY DEFINER RPC that runs as `postgres`, enforces availability guard, resolves slug → actor_id, and inserts. Direct INSERT is blocked at both RLS (`WITH CHECK false`) and grant level.

---

## 11. RPC — submit_business_card_lead (current overload only)

```
Signature:     vport.submit_business_card_lead(
                 p_slug text, p_name text, p_phone text, p_email text,
                 p_message text, p_source text DEFAULT 'business_card',
                 p_user_agent text DEFAULT NULL, p_ip inet DEFAULT NULL
               )
Security:      SECURITY DEFINER — search_path: public, vport, vc
Callers:       anon + authenticated (GRANT EXECUTE TO PUBLIC)
Availability:  business_card_published = true AND is_active = true AND is_deleted = false
Returns:       jsonb { ok, lead_id, profile_id, actor_id }
Error codes:   CARD_UNAVAILABLE, INVALID_INPUT
```

**Note:** Legacy overload `(p_vport_profile_id uuid, ...)` was dropped 2026-05-24. Only the slug-based overload survives. Adding a new source channel requires updating BOTH the RPC's `p_source` default AND the `business_card_leads_source_allowlist` CHECK constraint in the same migration.

---

## 12. Ownership Gate

All four controller methods pass through `assertActorOwnsVportActorController`:

```js
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

// Called at the top of every controller method:
await assertActorOwnsVportActorController({
  requestActorId: callerActorId,  // from useIdentity() → identity.actorId
  targetActorId:  actorId,        // from route params
});
```

This is a cross-feature adapter exception (SENTRY §5.3 approved). The gate performs a live DB query against `actor_owners` — not a string comparison. There is no in-memory ownership cache; every controller call re-verifies ownership.

**VPD-V-016:** Prior to 2026-05-24, ownership was a naive `callerActorId === actorId` string compare with no DB verification. This was replaced with `assertActorOwnsVportActorController` in the WOLVERINE architecture refactor.

---

## 13. UI States

| State | Trigger | Render |
|---|---|---|
| No actorId | `params.actorId` missing | `null` (nothing) |
| Identity/ownership loading | `identityLoading \|\| ownershipLoading` | Skeleton card list (3 cards, no body) |
| Unauthenticated | `!identity` | "Sign in required." centered text |
| Non-owner | `!isOwner` | "You can only access leads for your own vport." centered text |
| Loading leads | `loading === true` | Skeleton cards |
| Empty state | `leads.length === 0 && !loading` | "No leads yet" message |
| Leads loaded | `leads.length > 0` | Lead card list |
| Error loading | `error !== ""` | Error banner (DEV: full message, PROD: generic) |
| Action error | `actionError !== ""` | Inline action error banner |
| Mark contacted busy | `busyLeadId === lead.id` | Button spinner on that card |
| Lead contacted | `lead.isContacted === true` | Green "Contacted" badge; mark-contacted button hidden |
| Desktop | `useDesktopBreakpoint()` | View rendered in `createPortal` to `document.body` (fixed overlay) |
| Mobile | (default) | View rendered inline in page flow |

**Desktop portal rationale:** `createPortal` to `document.body` avoids iOS stacking context issues caused by `backdrop-filter`, `transform`, or `overflow: hidden` on parent containers.

**DEV-only error exposure:** `import.meta.env.DEV ? error : "Unable to load leads right now."` — raw error messages never reach production UI.

---

## 14. VportLeadsChip

A floating action button rendered in `RootLayout` via the vport adapter boundary.

```
RootLayout.jsx
  → import { VportLeadsChip } from "@/features/dashboard/vport/adapters/vport.adapter"
        (not a direct component import — adapter boundary enforced)

VportLeadsChip:
  - Visible only when: kind === 'vport' AND actorId present AND count > 0 AND !isOnLeadsPage
  - Position: fixed, bottom-right, above bottom nav bar
  - Pulsing red dot + "LEADS" label + count badge (capped at "99+")
  - Taps: navigate to /actor/:actorId/dashboard/leads
  - Count source: useVportNewLeadsCount (60s poll)
```

**Adapter boundary note:** `RootLayout` must never import `VportLeadsChip` directly from `components/`. All cross-feature layout imports go through the adapter. This was corrected in the 2026-05-24 architecture refactor.

---

## 15. Dependencies

| Dependency | Type | Purpose |
|---|---|---|
| `useIdentity()` | Internal hook | Session actor + kind |
| `useVportOwnership()` | Internal hook | isOwner gate for Final Screen |
| `assertActorOwnsVportActorController` | Cross-feature via `booking.adapter` | DB-verified ownership gate (SENTRY §5.3 exception) |
| `readVportProfileByActorIdDAL` | Internal DAL | actorId → profileId resolution |
| `vport.business_card_leads` | Supabase table | Primary data source |
| `shared/lib/text.js` | Shared utility | `toText()` — single source of truth |
| `SkeletonCardList` | Shared component | Loading state |
| `createPortal` (React DOM) | React API | Desktop modal overlay (iOS safe) |
| `useDesktopBreakpoint` | Internal hook | Responsive layout switch |

---

## 16. Rules / Invariants

1. **Identity surface:** Controllers accept `actorId` (VPORT's actor) and `callerActorId` (session actor). `profileId` is internal — resolved inside the controller, never passed from hook or screen.

2. **Ownership gate is always DB-verified:** `assertActorOwnsVportActorController` queries `actor_owners` on every controller call. No string comparison, no cache, no client-trust.

3. **isContacted is derived, not stored:** The contacted flag is derived from `source.includes("contacted")` in `normalizeVportLead`. The DB stores the source string; the app derives the boolean. This means the source field is the single source of truth for contacted state.

4. **source is now allowlisted at the DB level:** `business_card_leads_source_allowlist` CHECK constraint (added 2026-05-24) prevents pre-poisoned source values. Any new source channel must be added to the allowlist in migration before use.

5. **UPDATE is column-scoped to source only:** The `authenticated` role has `GRANT UPDATE (source)` — not full-row. Owners cannot mutate PII fields (name, phone, email, message) via the app layer.

6. **Direct INSERT is blocked:** `WITH CHECK (false)` policy + revoked INSERT grants. All inserts go through the `submit_business_card_lead` SECURITY DEFINER RPC.

7. **Chip is adapter-gated:** `VportLeadsChip` must only be imported from `vport.adapter.js`. Direct layout→component imports are forbidden.

8. **Screen layers must not mix responsibilities:** Final Screen = params + gates only. View = hooks + render. Components = presentational.

9. **Limit cap:** `readVportBusinessCardLeadsByProfileDAL` enforces `Math.max(1, Math.min(500, limit))`. Default is 100; `useVportLeads` requests 150. Pagination is P2.

10. **Poll is silent:** `useVportNewLeadsCount` catches all errors silently — badge count must never surface errors to UI.

---

## 17. Failure Risks

| Risk | Severity | Notes |
|---|---|---|
| `resolveProfileId` returns null | HIGH | Controller throws "Could not resolve vport profile." — surfaces as load error |
| `assertActorOwnsVportActorController` throws | MEDIUM | Controller propagates; hook catches and sets `error` or `actionError` |
| Stale count badge | LOW | 60s poll — up to 60s delay before chip disappears after leads are cleared |
| profileId-based RLS mismatch | MEDIUM | Mark-contacted and delete use `.eq('vport_profile_id', profileId)`; RLS adds owner check independently |
| Source value outside allowlist | BLOCKED | DB CHECK constraint rejects; mark-contacted mutates to `_contacted` suffix which is in allowlist |
| ip_address always null | LOW | DB-004 open — no abuse forensics until addressed (P2) |
| No soft delete | LOW | DB-005 open — hard DELETE leaves no audit trail (P2) |

---

## 18. Debug Notes

- The count badge not showing: check `kind === 'vport'` on identity and `count > 0`. Poll runs every 60s — count may be stale.
- Mark-contacted not updating UI: check `updated.id` is truthy in `markVportLeadContactedController` return. If RLS blocks the update, the DAL returns `null`.
- "Could not resolve vport profile" error: `readVportProfileByActorIdDAL` returned null for the actorId — profile may not exist or actorId is wrong.
- Ownership gate failing: `assertActorOwnsVportActorController` requires `callerActorId` to be in `actor_owners` for `targetActorId`. If session identity is a user-kind actor (not vport), this will fail.
- Desktop portal not rendering: verify `useDesktopBreakpoint()` is returning `true` and `document.body` is available at render time.

---

## 19. Files Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsScreen.jsx` | Route wrapper (re-exports FinalScreen; route compat) |
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsFinalScreen.jsx` | Gate-only: params + identity + ownership |
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsView.jsx` | Hooks + full render + desktop portal |
| `apps/VCSM/src/features/dashboard/vport/screens/vportDashboardLeadsScreen.model.js` | Re-export shim (delete after deploy confirmation) |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportLeads.js` | Loads leads + exposes markContacted/deleteLead |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportNewLeadsCount.js` | 60s poll count for chip badge |
| `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js` | Business logic: list, count, mark contacted, delete |
| `apps/VCSM/src/features/dashboard/vport/model/vportLead.model.js` | `normalizeVportLead` — canonical domain shape |
| `apps/VCSM/src/features/dashboard/vport/model/vportLead.display.model.js` | `formatLeadDate`, `formatSourceLabel`, `previewMessage` |
| `apps/VCSM/src/features/dashboard/vport/dal/read/vportLeads.read.dal.js` | `readVportBusinessCardLeadsByProfileDAL`, `readNewLeadsCountByProfileDAL` |
| `apps/VCSM/src/features/dashboard/vport/dal/write/vportLeads.write.dal.js` | `markVportBusinessCardLeadContactedDAL`, `deleteVportBusinessCardLeadDAL` |
| `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx` | Floating badge/button component |
| `apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js` | Adapter boundary — exports VportLeadsChip to layout |
| `apps/VCSM/src/app/layout/RootLayout.jsx` | Consumes VportLeadsChip via adapter |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | Route: `/actor/:actorId/dashboard/leads` |
| `apps/VCSM/src/shared/lib/text.js` | Shared `toText()` utility |
| `apps/VCSM/supabase/migrations/20260524010000_business_card_leads_p0_security.sql` | P0: Block direct INSERT + drop legacy RPC |
| `apps/VCSM/supabase/migrations/20260524020000_business_card_leads_p1_hardening.sql` | P1: Source allowlist + column-scoped UPDATE |

---

## Native Parity Notes

```
Native Relevance:      YES
Falcon Review:         OPTIONAL
Related Native Module: vport-leads-dashboard (not yet mapped)
Native Transfer Status: NOT STARTED
Known Native Gaps:
  - VportLeadsChip (fixed-position chip) requires native equivalent (push notification or tab badge)
  - Desktop portal pattern (createPortal) must be replaced with native modal/sheet
  - 60s interval poll must be replaced with Supabase Realtime subscription or push notification in native
  - isContacted derived from source field — same derivation logic required in native
Winter Soldier Handoff: Not applicable until Falcon parity pass is complete
```

---

## Command Evidence Registry

| Command | Report Path | Relevance |
|---|---|---|
| ARCHITECT | `marvel/architect/modules/vcsm.vport-dashboard-leads.architecture.md` | Module completeness matrix, dependency graph |
| VENOM | `audits/security/2026-05-24_venom_vport-dashboard-leads.md` | Security findings VL-001–VL-005 |
| SENTRY | `audits/tasks/2026-05-24_vport-leads-arch-refactor.audit.md` | Architecture ALIGNED post-refactor |
| DB | `_HISTORY/db/snapshots/2026-05-24_db_vport-business-card-leads.md` | Live schema + grant verification |
| CARNAGE | `audits/migrations/2026-05-24_carnage_vport-business-card-leads-security-hardening.md` | Migration plan |

---

## Audit References

```
Latest Engine Audit:   N/A — no engine involved
Previous Engine Audit: N/A
Related Logan Docs:
  - vcsm.vport.business-card.md (public submission side — same table, different feature half)
```

---

## 20. Change Log

### 2026-05-24 14:00 — v1 (initial)

```
Task:                  Create missing Logan documentation for vport.business_card_leads owner dashboard
Application Scope:     VCSM
Prompt Registry:       Session 2026-05-24 — "continue" (after Carnage deployment confirmed)
Code Status Before:    DOC MISSING — no Logan doc existed for the owner dashboard side
Code Status After:     VERIFIED — all files inspected and mapped

Files Changed:
  CREATED: zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.leads-dashboard.md

Command Evidence:
  ARCHITECT report:  vcsm.vport-dashboard-leads.architecture.md
  VENOM report:      2026-05-24_venom_vport-dashboard-leads.md
  SENTRY report:     2026-05-24_vport-leads-arch-refactor.audit.md
  DB report:         2026-05-24_db_vport-business-card-leads.md
  CARNAGE report:    2026-05-24_carnage_vport-business-card-leads-security-hardening.md

Architecture Contracts Checked:
  - PROJECT_BOUNDARY_ISOLATION_CONTRACT (VCSM scope only — confirmed)
  - ARCHITECTURE.md (actor-based identity, layer responsibilities, adapter boundaries)

Security / Runtime / DB Notes:
  - P0 migrations deployed and verified 2026-05-24: INSERT blocked, legacy RPC dropped
  - P1 migrations deployed and verified 2026-05-24: source allowlist, UPDATE column-scoped
  - P2 open: DB-004 (ip_address null), DB-005 (no soft delete)
  - Ownership gate upgraded from string compare to DB-verified actor_owners query (VPD-V-016)

Validation:
  - All file paths in Files Map verified to exist
  - Domain model, display model, controller, hooks, DAL all read directly
  - Screen stack verified via route inspection
  - DB schema verified against live database (post-migration)
  - No README files introduced

Documentation Truth Status: VERIFIED
```
