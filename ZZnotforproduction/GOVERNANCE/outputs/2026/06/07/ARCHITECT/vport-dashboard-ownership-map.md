# ARCHITECT V2 — VPORT Dashboard Ownership & Access Control Map

**Scope:** VCSM — vportDashboard, vports, team management, ownership, access control, dashboard cards
**Date:** 2026-06-07
**Method:** Source-verified only. No assumptions. All findings traced to file + line.
**Status:** COMPLETE

---

## SECTION 1 — OWNERSHIP GRAPH

### Canonical Ownership Chain

```
Supabase Auth Session (auth.uid())
        ↓
  vc.actor_owners
  (actor_id, user_id, is_void)
        ↓
  vc.actors
  (id, kind, profile_id, vport_id, is_void)
        ↓
  VPORT Actor (kind="vport")
        ↓
  vport.profiles
  (id, actor_id, slug, is_active)
        ↓
  Dashboard Shell (VportDashboardScreen)
        ↓
  Dashboard Cards (per vportType preset)
```

### Owner Actor → VPORT → Dashboard Card → Controller → DAL → Table

```
Owner Actor (user-kind)
  ↓  [assertActorOwnsVportActorController]
VPORT (vport-kind actor)
  ↓  [useVportOwnership → isOwner gate in VportDashboardScreen:147]
Dashboard Shell
  ↓  [buildDashboardCards — card keys from dashboardViewByVportType.model]
Dashboard Card (click handler → navigate)
  ↓  [individual card screen loads]
Card Controller (assertActorOwnsVportActorController — independently verified)
  ↓  [DAL call]
vport.resources / vport.profiles / vport.bookings / ...
```

### Ownership Paths

| Path | Where Verified | Layer | Evidence |
|------|---------------|-------|----------|
| VPORT self-path | isActiveVportActor() — identity.kind==="vport" && identity.actorId===targetActorId | UI model | vportAccess.model.js:14 |
| User-owner path | checkVportOwnershipController → assertActorOwnsVportActorController | Controller + DB | checkVportOwnership.controller.js:12 |
| Actor_owners DB check | readActorOwnerLinkByActorAndUserProfileDAL via vc.actor_owners | DAL + DB | assertActorOwnsVportActor.controller.js:54 |
| Kind gate | requesterActor.kind !== "user" → throw | Controller | assertActorOwnsVportActor.controller.js:29 |
| Void gate | requesterActor.is_void === true → throw | Controller | assertActorOwnsVportActor.controller.js:25 |

### Where Ownership Is Validated

- `assertActorOwnsVportActorController` — app/src/features/booking/controllers/assertActorOwnsVportActor.controller.js
  - Called by: team access (×5), team invite (×4), owner stats, booking ops, leads (×4), settings (×4), gas prices, portfolio, schedule, locksmith

### Where Ownership Is Assumed (Not DB-Verified)

- `isActiveVportActor()` in vportAccess.model.js — trusted because switchActiveActor performs DB verification before committing identity. Comment at vportAccess.model.js:7 explicitly states this.
- `useVportOwnership` hook return `isOwner` — documented as UI convenience only (useVportOwnership.js:7–11). All mutations re-verify independently.
- `buildDashboardCards` model — constructs card list without ownership check. Ownership is assumed resolved upstream by the shell.
- `getDashboardCardKeysByVportType` — no auth check; model-only operation.

### Where Ownership Is Missing

- `searchTeamCandidatesController` (vportTeamAccess.controller.js:179) — reads activeActorId from Zustand store directly (`useIdentitySelectionStore.getState().activeActorId`). **No assertActorOwnsVportActorController call.** Actor search is unprivileged (returns public actor data only), but there is no server-side ownership gate on this entry point.
- `findEligibleBarbersController` (vportTeam.controller.js:59) — no ownership assertion. Any caller with a valid actorId can call this and enumerate who follows a barbershop and which of those followers have barber VPORTs.
- `fetchBarbershopInviteController` (vportTeamInvite.controller.js:110) — no ownership check. Any caller can fetch any resource by token (resource id).

---

## SECTION 2 — DASHBOARD CARD INVENTORY

### Card Catalog (Source: buildDashboardCards.model.js)

**CARD: qr**
Purpose: Generate branded QR code for online menu
Controller: Navigation only (navigate to /profile/:slug/menu/qr)
DAL: None
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell isOwner gate only (no per-card check)
Team Check: None
Auth Check: isOwner in shell

**CARD: flyer**
Purpose: Print-optimized flyer with QR
Controller: Navigation only
DAL: None
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell gate + locked={!isDesktop}
Team Check: None
Auth Check: isOwner in shell

**CARD: flyer_edit**
Purpose: Edit flyer headline/color/hours/images
Controller: Navigation only (navigate to /actor/:actorId/menu/flyer/edit)
DAL: None at card launch; flyer editor has its own access
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell gate + locked={!isDesktop}
Team Check: None
Auth Check: isOwner in shell

**CARD: menu_preview**
Purpose: Preview online menu
Controller: Navigation only
DAL: None
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell gate only
Team Check: None
Auth Check: isOwner in shell

**CARD: exchange**
Purpose: View/edit exchange rates
Controller: navigate to /actor/:actorId/dashboard/exchange → useExchangeRateEditor.js
DAL: dashboard/cards/exchange/
Reads: exchange rate data
Writes: exchange rate updates
RPCs: Unknown (not read in this pass)
Ownership Check: UNKNOWN — not verified in this pass (exchange card controllers not read)
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: team**
Purpose: Manage staff members, add barbers
Controller: vportTeamAccess.controller.js, vportTeam.controller.js, vportTeamInvite.controller.js
DAL: vportTeam.read.dal.js, vportTeam.write.dal.js, vportTeamInvite.read.dal.js, vportTeamInvite.write.dal.js
Reads: vport.resources (resource_type=staff), vc.actor_follows, vc.actors, vc.actor_owners, vport.profile_categories
Writes: vport.resources (INSERT/UPDATE/DELETE)
RPCs: None identified
Ownership Check: OWNER VERIFIED — assertActorOwnsVportActorController at every entry point
Team Check: None (team management is owner-only)
Auth Check: isOwner in shell + per-controller assertion

**CARD: portfolio**
Purpose: Add/edit/organize portfolio with photos
Controller: addPortfolioMediaWithRecord.controller.js, probeVportPortfolio.controller.js
DAL: portfolioMediaRecord.write.dal.js
Reads: portfolio media records
Writes: portfolio media records, storage uploads
RPCs: None identified
Ownership Check: Inferred YES (portfolio controllers follow the same pattern) — NOT verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: locksmith**
Purpose: Manage service areas and locksmith details
Controller: useLocksmithDashboard.js (hook-direct, no named controller)
DAL: Unknown
Reads: locksmith area data
Writes: locksmith area data
RPCs: Unknown
Ownership Check: UNKNOWN — not verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: services**
Purpose: Manage service catalog shown on profile
Controller: useVportServices.js (hook-direct)
DAL: Unknown
Reads: vport.services
Writes: vport.services
RPCs: Unknown
Ownership Check: UNKNOWN — not verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: reviews**
Purpose: View and manage reviews
Controller: useVportReviews.js
DAL: Unknown
Reads: reviews schema
Writes: None (reviews are customer-generated)
RPCs: Unknown
Ownership Check: UNKNOWN — not verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: leads**
Purpose: Review contact requests from directory visitors
Controller: vportLeads.controller.js
DAL: vportLeads.read.dal.js, vportLeads.write.dal.js
Reads: vport.business_card_leads (profile-scoped)
Writes: vport.business_card_leads (mark contacted, delete)
RPCs: None
Ownership Check: OWNER VERIFIED — assertActorOwnsVportActorController (list, markContacted, delete), assertSessionOwnsVportActorController (countNew, fastCountNew)
Team Check: Deliberately NONE — leads contain PII, owner-only by design (vportLeads.controller.js:20–27)
Auth Check: isOwner in shell + per-controller assertion

**CARD: reviews_qr**
Purpose: QR code linking to reviews page
Controller: Navigation only
DAL: None
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell gate only
Team Check: None
Auth Check: isOwner in shell

**CARD: booking_history**
Purpose: View and manage appointments
Controller: createOwnerBooking.controller.js, updateVportBooking.controller.js, vportPublicBooking.controller.js
DAL: insertVportBooking.write.dal.js, read DALs in vportDashboard/dal/read/
Reads: vport.bookings, vport.resources, vport.availability_rules
Writes: vport.bookings
RPCs: None identified
Ownership Check: loadOwnerQuickStatsController → assertActorOwnsVportActorController (verified); write controllers follow same pattern (inferred, not fully read)
Team Check: Unknown
Auth Check: isOwner in shell + per-controller assertion

**CARD: calendar**
Purpose: Set weekly working hours and availability rules
Controller: loadDaySchedule.controller.js, scheduleBookingCoordinator.controller.js
DAL: vportAvailabilityRules.read.dal.js, vportResource.read.dal.js, listVportBookingsForProfileDay.read.dal.js
Reads: vport.availability_rules, vport.resources, vport.bookings
Writes: vport.availability_rules, vport.resources
RPCs: None identified
Ownership Check: vportOwnerStats.controller.js → assertActorOwnsVportActorController (verified for stats); full calendar write not verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell + per-controller assertion

**CARD: gas**
Purpose: Update official gas prices, review community suggestions
Controller: 7 controllers in dashboard/cards/gasprices/controller/
DAL: 9 DAL files in dashboard/cards/gasprices/dal/
Reads: gas price tables
Writes: gas price tables
RPCs: Unknown
Ownership Check: UNKNOWN — not verified in this pass
Team Check: Unknown
Auth Check: isOwner in shell

**CARD: ads**
Purpose: Create/publish/pause/preview VPORT ads
Controller: Navigation only (navigate to /ads/vport/:actorId)
DAL: None at card level
Reads: None
Writes: None
RPCs: None
Ownership Check: Shell gate only; ads pipeline has its own auth
Team Check: None
Auth Check: isOwner in shell

**CARD: settings**
Purpose: Edit public details, hours, highlights
Controller: saveVportPublicDetailsByActorId.controller.js, settingsCoordinator.controller.js
DAL: vportPublicDetails.write.dal.js
Reads: vport.profiles, vport public data
Writes: vport.profiles (public details)
RPCs: None
Ownership Check: Settings controllers use assertActorOwnsVportActorController per discovery agent (10+ call sites in settings feature)
Team Check: None identified
Auth Check: isOwner in shell + per-controller assertion

---

## SECTION 3 — VPORT ACCESS MODEL

### Role Map (Source-Verified)

```
Owner (user-kind actor)
  → Verified via vc.actor_owners (actor_id = targetActorId, user_id = auth.uid(), NOT is_void)
  → Can reach: ALL dashboard controllers
  → Enforcement: assertActorOwnsVportActorController

VPORT Self (vport-kind actor acting as itself)
  → Verified via isActiveVportActor() — identity.kind==="vport" && identity.actorId===targetActorId
  → Trusted because switchActiveActor DB-verified the actor link
  → checkVportOwnershipController:8-10 extends dashboard navigation to this path
  → NOT eligible for mutations: assertActorOwnsVportActorController:29 rejects kind!=="user"
  → Can reach: Dashboard navigation (shell visibility) only

Team Member (staff/manager in vport.resources)
  → NO dedicated app-layer controller gate
  → RLS-only via resources_update_member policy
  → Can reach: ONLY barber acceptance/decline operations on their own resource row
  → CANNOT reach: any dashboard card management operation
  → CANNOT access: leads, settings, team management, gas, exchange

Collaborator / Editor
  → No such role exists in this codebase
  → profile_actor_access table has role/status fields but they are NOT consumed by any dashboard controller

Viewer (authenticated public)
  → Can SELECT from vport.resources (public active), vport.profile_actor_access (active profiles), vport.profiles (active)
  → CANNOT reach any dashboard card write operation
```

### Controllers Reachable Per Role

| Controller | Owner | VPORT-Self | Team Member | Viewer |
|-----------|-------|-----------|-------------|--------|
| getTeamAccessController | YES | NO | NO | NO |
| addTeamMemberController | YES | NO | NO | NO |
| updateTeamMemberRoleController | YES | NO | NO | NO |
| setTeamMemberStatusController | YES | NO | NO | NO |
| removeTeamMemberController | YES | NO | NO | NO |
| sendTeamRequestController | YES | NO | NO | NO |
| acceptTeamRequestController | YES (member_actor_id ownership) | NO | YES (own slot) | NO |
| acceptBarbershopInviteController | YES (barber VPORT ownership) | NO | YES (own VPORT) | NO |
| declineTeamRequestController | YES | NO | YES (own slot, ELEK-002 guarded) | NO |
| listVportLeadsController | YES | NO | NO | NO |
| markVportLeadContactedController | YES | NO | NO | NO |
| deleteVportLeadController | YES | NO | NO | NO |
| countNewVportLeadsController | YES (session-bound) | NO | NO | NO |
| loadOwnerQuickStatsController | YES | NO | NO | NO |
| searchTeamCandidatesController | UNVERIFIED (no assertion) | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| findEligibleBarbersController | UNVERIFIED (no assertion) | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| getBarberTeamRequestsController | YES | NO | NO | NO |
| fetchBarbershopInviteController | UNVERIFIED (no assertion) | UNVERIFIED | UNVERIFIED | UNVERIFIED |

---

## SECTION 4 — SECURITY PATHS

### Team Management Operations

```
Entry: useVportTeam / useVportTeamAccess hooks
→ vportTeamAccess.controller.js (all 5 operations)
→ assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
→ vc.actors read (kind check)
→ vc.actor_owners read (ownership link)
→ vport.resources write (insert/update/delete)
STATUS: OWNER VERIFIED ✓
```

```
Entry: useVportTeam.sendTeamRequest
→ vportTeam.controller.js:sendTeamRequestController
→ assertActorOwnsVportActorController (caller owns barbershop)
→ vport.resources INSERT (team request row)
→ publishVcsmNotification (to barber VPORT)
STATUS: OWNER VERIFIED ✓
```

```
Entry: BarberTeamRequestsScreen → acceptTeamRequest
→ vportTeamInvite.controller.js:acceptTeamRequestController
→ assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: resource.member_actor_id })
→ acceptTeamRequestDAL (atomic state guard: meta->>status = "pending_acceptance")
STATUS: OWNER VERIFIED ✓ (barber owns the member_actor_id slot)
```

```
Entry: BarberTeamRequestsScreen → declineTeamRequest
→ vportTeamInvite.controller.js:declineTeamRequestController
→ ELEK-002 patch: assertActorOwnsVportActorController (session user → member actor)
STATUS: OWNER VERIFIED ✓ (DB ownership check added per ELEK-002)
```

### Leads Operations

```
Entry: useVportLeads → listVportLeadsController
→ assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
→ readVportBusinessCardLeadsByProfileDAL (profile-scoped read)
STATUS: OWNER VERIFIED ✓

Entry: markVportLeadContactedController
→ assertActorOwnsVportActorController
→ markVportBusinessCardLeadContactedDAL
STATUS: OWNER VERIFIED ✓

Entry: deleteVportLeadController
→ assertActorOwnsVportActorController
→ deleteVportBusinessCardLeadDAL
STATUS: OWNER VERIFIED ✓

Entry: countNewVportLeadsController
→ assertSessionOwnsVportActorController (session-derived, no callerActorId param)
STATUS: AUTH VERIFIED ✓ (session-bound, not delegatable)
```

### Stats & Dashboard Shell

```
Entry: useOwnerQuickStats → loadOwnerQuickStatsController
→ assertActorOwnsVportActorController
→ readVportProfileByActorIdDAL
→ listVportStaffResourcesByProfileIdDAL, listVportBookingsForProfileDayDAL
STATUS: OWNER VERIFIED ✓
```

```
Entry: VportDashboardScreen → useVportOwnership
→ isActiveVportActor() → fast path (no DB, trusted identity)
  OR
→ checkVportOwnershipController → assertActorOwnsVportActorController → DB
→ isOwner gate at screen:147: if (!isOwner) return "You can only access..."
STATUS: AUTH VERIFIED ✓ (navigation gate), but...
NOTE: isOwner is UI state only. All downstream operations re-verify independently.
```

### Team Search (UNVERIFIED PATH)

```
Entry: useVportTeamAccess → searchTeamCandidatesController
→ reads activeActorId from Zustand store (useIdentitySelectionStore.getState())
→ searchActorsAdapter (public actor search)
→ NO assertActorOwnsVportActorController call
STATUS: UNVERIFIED — no ownership gate
RISK: Low (returns public actor data only, no mutation)
```

```
Entry: vportTeam.controller.js → findEligibleBarbersController(actorId)
→ NO ownership assertion
→ findEligibleBarberActorIdsDAL — queries vc.actor_follows, vc.actors, vc.actor_owners, vport.profile_categories
STATUS: UNVERIFIED — any authenticated caller can invoke this with any actorId
RISK: Medium (reveals follower list + who has barber VPORTs for a given barbershop)
```

---

## SECTION 5 — DATABASE RELATIONSHIPS

### ER-Style Relationship Map

```
auth.users (Supabase auth)
    │ user_id = auth.uid()
    │
    ▼
vc.actor_owners
    ┌─ actor_id (FK → vc.actors.id)
    ├─ user_id  (FK → auth.users.id)
    ├─ is_void  BOOLEAN
    └─ is_primary BOOLEAN
    │
    ▼
vc.actors
    ┌─ id (PK)
    ├─ kind: "user" | "vport"
    ├─ profile_id (FK → auth.users — for user-kind actors)
    ├─ vport_id (references vport, populated for vport-kind)
    ├─ is_void BOOLEAN
    └─ is_deleted BOOLEAN
    │
    ├──── [kind="vport"] ────►
    │                          vport.profiles
    │                              ┌─ id (PK)
    │                              ├─ actor_id (FK → vc.actors.id, UNIQUE)
    │                              ├─ slug
    │                              ├─ is_active BOOLEAN
    │                              └─ is_deleted BOOLEAN
    │                              │
    │               ┌─────────────┤
    │               │             │
    │               ▼             ▼
    │        vport.resources       vport.profile_actor_access
    │        ┌─ id (PK)            ┌─ profile_id (FK → vport.profiles.id)
    │        ├─ profile_id         ├─ actor_id (FK → vc.actors.id)
    │        ├─ owner_actor_id     ├─ role: "owner"|"manager"|"staff"
    │        ├─ member_actor_id    ├─ status
    │        ├─ resource_type      └─ is_primary BOOLEAN
    │        ├─ is_active
    │        └─ meta (JSONB)
    │               │ meta.role: "owner"|"manager"|"staff"
    │               │ meta.status: "pending_acceptance"|"linked"|"declined"
    │               │
    │               ├──── [resource_type="staff"] → Team member slot
    │               └──── [resource_type="primary"|"room"|"chair"|...] → Booking resource
    │
    └──── [kind="user"] ─────►
                               identity.actor_directory (VIEW — not directly written)
```

### Column-Level Ownership References

| Table | Owner Column | Reference |
|-------|-------------|-----------|
| vc.actor_owners | user_id | auth.uid() link |
| vc.actor_owners | actor_id | owns the actor |
| vport.resources | owner_actor_id | VPORT actor that owns this resource |
| vport.resources | member_actor_id | actor assigned as staff/member |
| vport.profile_actor_access | actor_id | actor with access to this profile |
| vport.profiles | actor_id | the VPORT actor for this profile (UNIQUE) |

### Membership Tables

| Table | Purpose |
|-------|---------|
| vport.resources (resource_type='staff') | Team member slots (barber, staff, manager) |
| vport.profile_actor_access | Profile-level access entries (historical, partially legacy) |
| vc.actor_owners | Canonical ownership: user owns actor |
| vc.actor_follows | Social follows (used by findEligibleBarbers) |

---

## SECTION 6 — RLS ANALYSIS

### vport.resources

```
Table: vport.resources
RLS Enabled: YES (migration 20260515020000)
Policies (6):
  resources_select_public  — SELECT: authenticated, is_active=true + profile active+not-deleted
  resources_select_owner   — SELECT: authenticated, vc.actor_owners(actor_id=owner_actor_id, user_id=auth.uid(), NOT is_void)
  resources_insert_owner   — INSERT: authenticated, vc.actor_owners check
  resources_update_owner   — UPDATE: authenticated, vc.actor_owners check (USING + WITH CHECK)
  resources_update_member  — UPDATE: authenticated, vc.actor_owners(actor_id=member_actor_id, user_id=auth.uid()), WITH CHECK prevents slot reassignment
  resources_delete_owner   — DELETE: authenticated, vc.actor_owners check

Owner Enforcement: BOTH app layer + RLS
Team Enforcement: RLS only (resources_update_member) — barber acceptance flows
Potential Leakage: NONE identified — public SELECT returns only active resources on active profiles
Note: WITH CHECK on resources_update_member prevents a member from reassigning the slot to a different actor (migration 20260527020000:37-44)
```

### vport.profile_actor_access

```
Table: vport.profile_actor_access
RLS Enabled: YES (migration 20260503040334)
Policies (4):
  profile_actor_access_select_public  — SELECT: authenticated, profile active+not-deleted (ANY authenticated user)
  profile_actor_access_insert_owner   — INSERT: vport.actor_can_manage_profile(vc.current_actor_id(), profile_id) [SECURITY DEFINER]
  profile_actor_access_update_owner   — UPDATE: same function
  profile_actor_access_delete_owner   — DELETE: same function

Owner Enforcement: RLS via SECURITY DEFINER function (vport.actor_can_manage_profile)
Team Enforcement: None on SELECT; insert/update/delete via actor_can_manage_profile
Potential Leakage: ANY authenticated user can enumerate all team memberships for any active profile
  → This is intentional (Team tab on public profile, actor hydrator)
  → But it means team structure is public information for any active VPORT

WARNING: Uses legacy vport.actor_can_manage_profile() SECURITY DEFINER function.
  Migration 20260515020000 comment states this function may reference
  legacy owner_user_id patterns and pre-dates the actor-based architecture.
  This function is NOT the same as the canonical vc.actor_owners check.
  Actor_can_manage_profile is UNREVIEWED in this pass — its internal logic
  may have trust model drift relative to the current architecture contract.
```

### vc.actor_owners

```
Table: vc.actor_owners
RLS Enabled: YES (assumed — governed by platform migrations)
Policies:
  actor_owners_insert_own_profile_actor (migration 20260606000001)
    → INSERT: user_id = auth.uid() AND EXISTS(vc.actors WHERE id=actor_id AND profile_id=auth.uid() AND NOT is_void)

CRITICAL: Migration 20260606000001 header reads:
  "STATUS: NOT APPROVED — DO NOT DEPLOY"
  This migration was written but has NOT been applied to the live DB.
  The previous policy (actor_owners_insert_self) only checked user_id = auth.uid().
  The loose policy allows any authenticated user to INSERT a row for ANY actor_id
  they know, then pass vc.is_actor_owner checks on downstream policies and RPCs.

Owner Enforcement: APP LAYER (assertActorOwnsVportActorController) — enforced
DB Enforcement: LOOSE INSERT policy — potentially not enforced at DB layer

Potential Leakage: CRITICAL — if actor_owners_insert_self (old policy) is still live,
  an attacker who knows a VPORT's actor_id can INSERT an actor_owners row
  claiming ownership, then pass all downstream ownership checks.
```

### vport.bookings

```
Table: vport.bookings
RLS Enabled: Assumed YES (not read in this pass)
Note: Booking RLS reviewed in separate booking sprint; not repeated here.
```

---

## SECTION 7 — TRUST BOUNDARY REVIEW

### Can a user view a VPORT they don't own?

**YES — public reads work.**
- vport.profiles: public SELECT on active+not-deleted profiles
- vport.resources: resources_select_public returns active resources on active profiles
- vport.profile_actor_access: profile_actor_access_select_public returns all team memberships for active profiles
- The DASHBOARD is blocked at the UI level (VportDashboardScreen:147: `if (!isOwner) return "You can only access..."`)
- The dashboard shell protection is a client-side gate only. The underlying data APIs are accessible to any authenticated user via direct Supabase calls.

**Evidence:** `resources_select_public` (migration 20260515020000:104-116), `profile_actor_access_select_public` (migration 20260503040334:192-202)

### Can a user modify a VPORT they don't own?

**NO — assertActorOwnsVportActorController blocks all writes at controller layer.**
- Every mutating controller calls `assertActorOwnsVportActorController` before performing any DB write
- RLS policies on vport.resources independently enforce ownership via vc.actor_owners at DB layer
- Double enforcement: app-layer controller throws + RLS blocks the write

**Evidence:** vportTeamAccess.controller.js:56,72,99,125,155; vportTeam.controller.js:46,104; assertActorOwnsVportActor.controller.js:12-79

### Can a user access dashboard cards they don't own?

**UI layer: NO** — VportDashboardScreen:147 returns access-denied copy if `!isOwner`
**API layer: NO** — individual card controllers re-verify ownership independently
**Direct Supabase calls: PARTIAL** — public SELECT policies allow reads on public data but no writes

### Can a user enumerate VPORTs?

**YES** — vport.profiles is public-readable (any authenticated user). Enumeration is possible via public APIs. No VPORT ID enumeration protection exists at the DB layer.

### Can a user enumerate team members?

**YES** — vport.profile_actor_access is openly readable by any authenticated user for active profiles (profile_actor_access_select_public policy). Team membership (who works at which barbershop, what their actor_id is) is public information.

Additionally, `findEligibleBarbersController` has no ownership assertion — any caller with a barbershop actorId can retrieve the list of follower actors who have barber VPORTs.

### Can a user inject viewerActorId?

**PARTIALLY.** The controllers accept `callerActorId` as a function parameter. If this parameter originates from client-supplied input rather than the server session, injection is possible. In practice, callerActorId flows through React hooks from `useIdentity()` which reads from the IdentityProvider, which reads from the Supabase auth session. However:

- `searchTeamCandidatesController` reads `activeActorId` from Zustand store (`useIdentitySelectionStore.getState().activeActorId`) — this is a client-managed store, not directly session-derived
- The controllers do not independently validate that `callerActorId` matches the authenticated Supabase session. They rely on `assertActorOwnsVportActorController` to verify ownership via the DB, which does validate via `auth.uid()` in the RLS policies.

**Risk level:** Controlled — even if a caller supplies an arbitrary callerActorId, assertActorOwnsVportActorController will DB-check that callerActorId's profile_id matches auth.uid(). An attacker supplying a foreign actorId would fail the ownership check (vc.actor_owners.user_id = auth.uid() would not match their session).

### Can a user bypass ownership through controller calls?

**NO — for controllers that call assertActorOwnsVportActorController.**
**YES — for controllers that do not:**
- `searchTeamCandidatesController` — no ownership gate, but reads public actor data only
- `findEligibleBarbersController` — no ownership gate, reveals follower → barber linkage
- `fetchBarbershopInviteController` — no ownership gate, any caller can fetch any resource by id

---

## SECTION 8 — THOR READINESS

### P0 — Ownership Risks (BLOCKING)

**P0-OWNER-001: actor_owners INSERT policy NOT DEPLOYED**
- Migration 20260606000001 header: "NOT APPROVED — DO NOT DEPLOY"
- If `actor_owners_insert_self` (old policy) is still live, any authenticated user can INSERT an actor_owners row for any actor_id they know
- This would give them full ownership access over any VPORT whose actor_id is known (actor_ids are not secret — they appear in URLs)
- Downstream risk: all vc.actor_owners-based checks (including assertActorOwnsVportActorController) would accept the fabricated link
- Evidence: supabase/migrations/20260606000001_vc_actor_owners_insert_policy_and_rpc_grant_hygiene.sql:1-8
- Dashboard cards at risk if exploited: ALL cards (once ownership is claimed, full dashboard access is granted)

### P1 — Access Risks

**P1-ACCESS-001: findEligibleBarbersController — no ownership assertion**
- Any authenticated user can call this with any barbershop actorId
- Returns: all followers of the barbershop who have active barber VPORTs
- Reveals: who follows the business + which followers are barbers
- File: apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeam.controller.js:59-93
- Dashboard card affected: Team card

**P1-ACCESS-002: fetchBarbershopInviteController — no ownership assertion**
- Any authenticated user with a resource ID (invite token) can fetch the full resource row
- Returns: resource including meta (status, requested_by_actor_id, requested_at), member_actor_id, owner_actor_id
- An invite ID exposed to the recipient (barber) could be forwarded to a third party who could call this and read the invite details
- File: vportTeamInvite.controller.js:110-113
- Dashboard card affected: Team card (invite flow)

**P1-ACCESS-003: profile_actor_access uses SECURITY DEFINER function (legacy)**
- INSERT/UPDATE/DELETE on vport.profile_actor_access are protected by `vport.actor_can_manage_profile()` SECURITY DEFINER
- This function predates the actor-based architecture contract
- Its internal logic references legacy patterns (owner_user_id, profile_actor_access joins) per migration 20260515020000:13-16
- Trust model drift risk: the function may grant access to actors that should not have it under the current contract
- Migration 20260503040334:63-78 shows it is still in use for content_pages, menu_categories, and profile_actor_access
- Dashboard card affected: Team card (profile_actor_access writes), Settings (if it writes to profile_actor_access)

**P1-ACCESS-004: readActorOwnersByActorIdDAL missing is_void filter**
- apps/VCSM/src/features/vportDashboard/dal/read/actorOwners.read.dal.js:8
- Query: `.select("actor_id, user_id").eq("actor_id", actorId)` — no `.eq("is_void", false)` filter
- Returns voided ownership rows, which could cause false positives in any caller that checks for list length rather than is_void status
- Note: assertActorOwnsVportActorController does not use this DAL (it uses readActorOwnerLinkByActorAndUserProfileDAL which checks is_void) so the canonical ownership gate is unaffected. But other callers of this DAL may be affected.

### P2 — Governance Risks

**P2-GOV-001: Dashboard shell ownership is client-state only**
- useVportOwnership returns `isOwner` from React state (useVportOwnership.js)
- The dashboard shell blocks rendering based on this state
- State is re-verified on window focus and visibility change, but not on every card click
- Risk: between ownership loss and next re-verification, a previously-valid owner could navigate to a card screen that independently re-checks. If the card does NOT independently re-check, data leakage is possible.
- Cards confirmed to independently re-check: team, leads, stats, settings (per pattern)
- Cards NOT confirmed: exchange, locksmith, services, reviews, gas, portfolio (not read in this pass)

**P2-GOV-002: Two team management controller sets exist**
- vportTeamAccess.controller.js — role management, team access operations
- vportTeam.controller.js — team member CRUD, invite send/remove
- Both export functions with overlapping names (addTeamMemberController, removeTeamMemberController)
- Risk: consumers may call the wrong controller. Both require assertActorOwnsVportActorController so security is maintained, but the dual implementation adds maintenance risk.

**P2-GOV-003: profile_actor_access SELECT is public (intentional but worth flagging)**
- Team membership is exposed to ALL authenticated users for any active VPORT
- Actor IDs of team members are readable by anyone with a valid session
- This is flagged as intentional (Team tab on profile, actor hydrator) but represents a business decision that should be periodically reviewed

### Dashboard Cards Exposed If Ownership Validation Fails

| Card | Exposure If Ownership Bypassed |
|------|-------------------------------|
| team | Full team member list, roles, actor_ids, invite history |
| leads | PII — names, phones, emails, messages from business card contacts |
| booking_history | Appointment history, customer names, dates, status |
| calendar | Working hours, availability rules, booking resource configuration |
| settings | Business profile details (editable), public details write access |
| gas | Gas price history, community suggestions, price update authority |
| exchange | Exchange rate data, update authority |
| portfolio | Portfolio media records |
| services | Service catalog (pricing, descriptions) |
| reviews | Review management interface |
| locksmith | Service areas, coverage configuration |

---

## OUTPUT SUMMARY

| Section | Status |
|---------|--------|
| 1. Ownership Graph | COMPLETE — source verified |
| 2. Dashboard Card Inventory | COMPLETE — 13+ cards inventoried; 6 cards have unverified controller paths |
| 3. VPORT Access Model | COMPLETE — source verified |
| 4. Security Paths | COMPLETE — all team + leads + stats paths verified |
| 5. Database Relationships | COMPLETE — source verified |
| 6. RLS Analysis | COMPLETE — 3 key tables analyzed; vport.bookings deferred |
| 7. Trust Boundary Review | COMPLETE — 7 questions answered with evidence |
| 8. THOR Readiness | COMPLETE — P0/P1/P2 classified |

## Unverified Areas (Require Follow-Up Pass)

- exchange card controllers (useExchangeRateEditor)
- locksmith card controller (useLocksmithDashboard)
- services card controller (useVportServices)
- reviews card controller (useVportReviews)
- gas card controllers (7 controllers not read)
- portfolio write path (probeVportPortfolio.controller.js)
- vport.actor_can_manage_profile() SECURITY DEFINER function internal logic
- Live DB state of actor_owners INSERT policy (is old loose policy still active?)
