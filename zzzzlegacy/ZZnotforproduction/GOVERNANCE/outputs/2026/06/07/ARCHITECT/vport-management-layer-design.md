# VPORT Management Layer — Architecture Design

**Date:** 2026-06-07
**Scope:** VCSM — vportDashboard app architecture only
**Status:** Design — no RLS changes, no migrations, no controller patches

---

## 1. Live DB Evidence — What It Changes

### actor_owners INSERT policy (P0 confirmed)

`actor_owners_insert_self` is the live policy. `with_check = (user_id = auth.uid())` only.
Migration 20260606000001 is NOT deployed. Any authenticated user can INSERT an actor_owners
row for any actor_id they know. This does not change the app-layer design below, but it is
a prerequisite migration before any management layer ships.

### actor_can_manage_profile(p_actor_id, p_profile_id) — ghost parameter

The two-arg form ignores `p_actor_id` entirely:
```sql
SELECT vport.actor_can_manage_profile(p_profile_id);  -- p_actor_id discarded
```
The single-arg form checks `vport.profile_actor_access JOIN vc.actor_owners WHERE auth.uid()`.
So the RLS policies using this function (content_pages, menu_categories, profile_actor_access)
are session-correct — they resolve to auth.uid() — but the interface is deceptive.
This is NOT a security bug. It is a dead parameter that creates future confusion.

---

## 2. The Broken Circuit (Source-Verified)

This is the core problem the management layer must solve.

### The flow when you switch to a VPORT actor

```
switchActorController validates actor link → identity.kind = "vport", identity.actorId = vportActorId
  ↓
OwnerOnlyDashboardGuard: String(identity.actorId) !== String(actorId)
  → Passes (identity.actorId === actorId from URL params) ✓
  ↓
VportDashboardScreen loads
useVportOwnership → isActiveVportActor() → fast path → isOwner = true ✓
Card grid renders ✓
  ↓
User clicks Team card → VportDashboardTeamScreen
useVportTeam(actorId)
  callerActorId = identity?.actorId   ← vportActorId, kind="vport"
  getTeamMembersController(actorId, callerActorId)
    assertActorOwnsVportActorController({
      requestActorId: vportActorId,  ← kind="vport"
      targetActorId:  vportActorId,
    })
    → getActorByIdDAL → actor.kind = "vport"
    → requesterActor.kind !== "user" → THROWS ✗
```

**The dashboard shell works. Every management operation is broken when acting as VPORT.**

### What OwnerOnlyDashboardGuard actually does

```javascript
if (!actorId || String(identity.actorId) !== String(actorId)) {
  return <Navigate to="/feed" replace />
}
```

This is a pure string comparison — no DB call, no actor_owners check, no kind check.
It trusts that switchActorController already validated the link before setting identity.
That trust is correct, but it means the route guard provides NO defense if identity state
is somehow wrong. The DB check happens at controller level, but controllers are broken for
vport-kind callers (as shown above). There is no working DB ownership verification
on the dashboard today for the vport-kind path.

### The two incompatible paths

| Path | Route Guard | Shell | Controllers |
|------|------------|-------|-------------|
| VPORT self (kind="vport") | Passes ✓ | Passes ✓ | Fails ✗ (kind gate) |
| User owner (kind="user") | Fails ✗ (actorId mismatch) | N/A | Works ✓ |

Neither path fully works end-to-end.

---

## 3. Architecture Design

### Principle

Ownership is one concept with two typed expressions:

- **Navigation Authority** — "can this session see this dashboard?" — route-level, resolved once
- **Management Authority** — "can this caller mutate this VPORT?" — controller-level, called per operation

These must share a single resolver that handles both VPORT self-mode and user-actor-owner mode.
The current system handles navigation (checkVportOwnershipController, isActiveVportActor) and
mutation (assertActorOwnsVportActorController) separately with no coordination layer between them.

### Layer Map

```
Route Layer:    VportManagementGuard      ← one DB check per route entry
Context Layer:  VportManagementContext    ← shared state, all card screens read this
Controller Layer: assertAuthority()       ← typed assertion, replaces callerActorId pattern
Card Catalog:   requiredRole per card     ← role declared at definition, not at render
```

---

## 4. Component Specifications

### 4.1 VportManagementState (type)

```
VportManagementState {
  vportActorId:   string           // the VPORT under management (from URL param)
  callerActorId:  string | null    // user-kind actor for delegation mode; null for session mode
  canManage:      boolean
  mode:           'session_vport'  // active identity IS the target VPORT
                | 'actor_owner'    // user-kind identity owns VPORT via actor_owners
                | 'none'
  role:           'owner' | null   // 'manager'/'staff' reserved for future
  assertAuthority: () => Promise<void>  // typed assertion for controllers — no callerActorId needed
  loading:        boolean
}
```

**`assertAuthority`** is the key export. It wraps the correct underlying assertion for the active mode:
- `session_vport` → `assertSessionOwnsVportActorController({ targetActorId: vportActorId })`
- `actor_owner` → `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })`
- `none` → throws immediately

Card controllers call `await state.assertAuthority()` instead of hardcoding which assertion to use.
This fixes the broken circuit: the correct assertion is selected based on which mode the user is in.

---

### 4.2 resolveVportManagement.controller.js

**File:** `features/vportDashboard/management/resolveVportManagement.controller.js`

**Inputs:** `{ targetActorId }` (from URL param), identity (from useIdentity)

**Resolution logic:**

```
Step 1 — VPORT self mode (fast path, no DB):
  IF identity.kind === "vport" AND identity.actorId === targetActorId
  THEN mode = 'session_vport', canManage = true, role = 'owner'
  → assertAuthority wraps assertSessionOwnsVportActorController

Step 2 — User-kind owner mode (DB check):
  IF identity.kind === "user"
  THEN assertActorOwnsVportActorController({ requestActorId: identity.actorId, targetActorId })
    → succeeds: mode = 'actor_owner', callerActorId = identity.actorId, canManage = true, role = 'owner'
    → throws:   mode = 'none', canManage = false

Step 3 — Default:
  mode = 'none', canManage = false
```

This controller returns a VportManagementState object. It does not render or redirect.

---

### 4.3 VportManagementGuard.jsx

**File:** `features/vportDashboard/management/VportManagementGuard.jsx`

**Replaces:** `OwnerOnlyDashboardGuard`

```
Responsibilities:
1. Read actorId from useParams()
2. Read identity from useIdentity()
3. Call resolveVportManagementController({ targetActorId: actorId })
4. While loading: return null (or skeleton)
5. If !canManage: <Navigate to="/feed" replace />
6. If canManage: <VportManagementContext.Provider value={state}><Outlet /></VportManagementContext.Provider>
```

The guard performs the DB ownership check (for actor_owner mode) exactly once per route entry.
All card screens receive the resolved state via context — no per-screen ownership resolution.

**Route tree change:**

```javascript
// app.routes.jsx — replace OwnerOnlyDashboardGuard with VportManagementGuard
{
  element: <BlockedVportGuard />,          // keep — handles blocked VPORT redirect
  children: [{
    element: <VportManagementGuard />,     // NEW — replaces OwnerOnlyDashboardGuard
    children: [
      { path: "/actor/:actorId/dashboard",                 element: <VportDashboardScreen /> },
      { path: "/actor/:actorId/dashboard/team",            element: <VportDashboardTeamScreen /> },
      { path: "/actor/:actorId/dashboard/leads",           element: <VportDashboardLeadsScreen /> },
      { path: "/actor/:actorId/dashboard/calendar",        element: <VportDashboardCalendarScreen /> },
      { path: "/actor/:actorId/dashboard/booking-history", element: <VportDashboardBookingHistoryScreen /> },
      { path: "/actor/:actorId/dashboard/gas",             element: <VportDashboardGasScreen /> },
      { path: "/actor/:actorId/dashboard/exchange",        element: <VportDashboardExchangeScreen /> },
      { path: "/actor/:actorId/dashboard/services",        element: <VportDashboardServicesScreen /> },
      { path: "/actor/:actorId/dashboard/reviews",         element: <VportDashboardReviewScreen /> },
      { path: "/actor/:actorId/dashboard/portfolio",       element: <VportDashboardPortfolioScreen /> },
      { path: "/actor/:actorId/dashboard/locksmith",       element: <VportDashboardLocksmithScreen /> },
      { path: "/actor/:actorId/dashboard/schedule",        element: <VportDashboardScheduleScreen /> },
      { path: "/actor/:actorId/dashboard/team-requests",   element: <BarberTeamRequestsScreen /> },
      { path: "/actor/:actorId/settings",                  element: <VportSettingsScreen /> },
    ],
  }],
}
```

---

### 4.4 useVportManagement.js

**File:** `features/vportDashboard/management/useVportManagement.js`

```javascript
export function useVportManagement() {
  const state = useContext(VportManagementContext);
  if (!state) throw new Error("useVportManagement must be used inside VportManagementGuard");
  return state;
}
```

Card hooks and screens replace:
```javascript
// BEFORE (broken circuit)
const { identity } = useIdentity();
const callerActorId = identity?.actorId;
getTeamMembersController(actorId, callerActorId);  // fails when kind="vport"

// AFTER
const { assertAuthority, vportActorId } = useVportManagement();
getTeamMembersController(vportActorId, assertAuthority);  // works for both modes
```

Controllers accept `assertAuthority` as the second parameter and call it at the start of each operation, instead of accepting `callerActorId` and calling `assertActorOwnsVportActorController` directly.

---

### 4.5 VportDashboardScreen — simplification

The `useVportOwnership` hook and its inner `checkVportOwnershipController` call become
redundant once VportManagementGuard handles route-level ownership.

```javascript
// BEFORE
const { isOwner, ownershipLoading } = useVportOwnership(identity?.actorId, actorId);
if (ownershipLoading) return <Skeleton />;
if (!isOwner) return <AccessDenied />;

// AFTER
const { canManage, loading } = useVportManagement();
// loading: guard handles this — by the time screen renders, canManage is already true
// canManage: always true here — guard redirected if false
// The isOwner check in the screen body is removed — the guard owns that responsibility
```

`useVportOwnership` is retained for non-dashboard uses (e.g., profile page "edit" button visibility) but is no longer the security gate for dashboard screens.

---

## 5. Card Gating Model

### Role declaration in CARD_CATALOG

Add `requiredRole` to each card definition in `buildDashboardCards.model.js`:

```javascript
const CARD_CATALOG = Object.freeze({
  leads:           { key: "leads",           requiredRole: "owner", ... },
  team:            { key: "team",            requiredRole: "owner", ... },
  calendar:        { key: "calendar",        requiredRole: "owner", ... },
  booking_history: { key: "booking_history", requiredRole: "owner", ... },
  gas:             { key: "gas",             requiredRole: "owner", ... },
  exchange:        { key: "exchange",        requiredRole: "owner", ... },
  settings:        { key: "settings",        requiredRole: "owner", ... },
  portfolio:       { key: "portfolio",       requiredRole: "owner", ... },
  services:        { key: "services",        requiredRole: "owner", ... },
  reviews:         { key: "reviews",         requiredRole: "owner", ... },
  locksmith:       { key: "locksmith",       requiredRole: "owner", ... },
  qr:              { key: "qr",              requiredRole: "owner", ... },
  flyer:           { key: "flyer",           requiredRole: "owner", ... },
  flyer_edit:      { key: "flyer_edit",      requiredRole: "owner", ... },
  menu_preview:    { key: "menu_preview",    requiredRole: "owner", ... },
  reviews_qr:      { key: "reviews_qr",      requiredRole: "owner", ... },
  ads:             { key: "ads",             requiredRole: "owner", ... },
});

const ROLE_ORDER = { owner: 10, manager: 5, staff: 1 };
```

`buildDashboardCards` receives `role` and filters:

```javascript
export function buildDashboardCards({ isDesktop, handlers, vportType, getTabsFn, role }) {
  const keys = getDashboardCardKeysByVportType(vportType, { getTabsFn });
  return keys
    .map(key => getDashboardCardMetaByKey(key))
    .filter(Boolean)
    .filter(meta => ROLE_ORDER[role] >= ROLE_ORDER[meta.requiredRole])
    .map(meta => { ... })
    .filter(Boolean);
}
```

The shell passes `role` from `useVportManagement()`:
```javascript
const { role } = useVportManagement();
const cards = useMemo(() => buildDashboardCards({ ..., role }), [..., role]);
```

All 17 cards are `requiredRole: "owner"` today. When manager/staff roles are introduced, only
`requiredRole` changes per card — the gating logic is already in place.

---

## 6. Book / Schedule — Management Access Model

### Current state

- `calendar` and `booking_history` cards appear for: barber, barbershop, locksmith vportTypes
- The booking engine has `assertActorCanManageResource` with 6-tier check (direct_owner → vport_owner → org_owner → org_member → location_member → resource_staff)
- Team members (barbers) have `member_actor_id` on their resource row in vport.resources
- There is no "team member dashboard" concept

### Design decision: Barbershop dashboard is OWNER-ONLY

The barbershop's `/actor/:barbershopActorId/dashboard/*` is owner access only.
A barber assigned to a barbershop cannot access the barbershop's dashboard — even as a team member.

**Why:** The booking_history card on the barbershop dashboard shows ALL appointments for
the barbershop (all resources, all staff). This is owner-level visibility.

### Barber's own schedule: SEPARATE dashboard path

A barber views their own schedule on THEIR dashboard:
```
/actor/:barberActorId/dashboard/calendar
/actor/:barberActorId/dashboard/booking-history
```

The barber switches to their own VPORT actor (barber actor, not barbershop). The management
resolver sees `identity.kind = "vport" AND identity.actorId = barberActorId` → session_vport mode.
The calendar controller queries bookings for their resource (WHERE member_actor_id = barberActorId
OR owner_actor_id = barberActorId).

### bookingScope field in VportManagementState

Add `bookingScope` to clarify what the calendar/booking controllers should return:

```
bookingScope: 'owner'   // all resources for this VPORT (barbershop sees everything)
            | 'member'  // only resources where member_actor_id = identity.actorId (barber sees their slot)
```

Resolution:
- If `identity.actorId === vportActorId` AND actor is a barbershop VPORT → `bookingScope = 'owner'`
- If `identity.actorId === vportActorId` AND actor is a barber VPORT → `bookingScope = 'member'`
  (A barber is assigned to a barbershop as member_actor_id, but owns their own VPORT separately.
   Their own calendar should show their slot, not their employer's full calendar.)
- If mode = 'actor_owner' (user-kind actor managing VPORT) → `bookingScope = 'owner'`

The schedule coordinator and booking history controller read `bookingScope` from the
management context to determine the WHERE clause:

```javascript
// In loadDayScheduleController or scheduleBookingCoordinator:
const { bookingScope, vportActorId } = managementState;

if (bookingScope === 'owner') {
  // load all resources for vportActorId
  const resources = await listVportResourcesByProfileIdDAL({ profileId });
} else if (bookingScope === 'member') {
  // load only this actor's assigned resource
  const resources = await listResourcesByMemberActorIdDAL({ memberActorId: vportActorId });
}
```

---

## 7. File Structure

```
apps/VCSM/src/features/vportDashboard/
  management/                                       (NEW directory)
    VportManagementContext.js                        context definition + defaults
    VportManagementGuard.jsx                         route-level provider (replaces OwnerOnlyDashboardGuard)
    resolveVportManagement.controller.js             resolver — returns VportManagementState
    useVportManagement.js                            consumer hook

  model/
    buildDashboardCards.model.js                    ADD requiredRole + role param to buildDashboardCards
    dashboardViewByVportType.model.js               unchanged

  hooks/
    useVportOwnership.js                            RETAINED for non-dashboard use only
    useOwnerQuickStats.js                           UPDATE to use assertAuthority instead of callerActorId

  dashboard/cards/team/
    controller/vportTeamAccess.controller.js        UPDATE: accept assertAuthority, drop callerActorId param
    controller/vportTeam.controller.js              UPDATE: accept assertAuthority
    hooks/useVportTeam.js                           UPDATE: read assertAuthority from useVportManagement()

  dashboard/cards/leads/
    controller/vportLeads.controller.js             UPDATE: accept assertAuthority

  screens/
    VportDashboardScreen.jsx                        UPDATE: read role from useVportManagement(), remove isOwner gate

app/routes/protected/
  appRoutes.redirects.jsx                           UPDATE: retire OwnerOnlyDashboardGuard
  app.routes.jsx                                    UPDATE: replace guard component
```

---

## 8. What Is NOT Changing

- `assertActorOwnsVportActorController` — unchanged, still the canonical mutation gate for actor_owner mode
- `assertSessionOwnsVportActorController` — unchanged, used by assertAuthority in session_vport mode
- `checkVportOwnershipController` — unchanged, retained for non-dashboard ownership checks
- `isActiveVportActor` — unchanged, retained as pure model helper
- All RLS policies — no changes (by design)
- All DAL files — no changes
- Card screen components — no changes (they read from hooks, hooks change)
- Route paths — no changes (same URLs)

---

## 9. Build Order

```
1. VportManagementContext.js               (no dependencies)
2. resolveVportManagement.controller.js    (depends on assertSessionOwns, assertActorOwns)
3. VportManagementGuard.jsx                (depends on resolver + context)
4. useVportManagement.js                   (depends on context)
5. buildDashboardCards.model.js            (add requiredRole + role param)
6. VportDashboardScreen.jsx                (read role from useVportManagement, remove isOwner gate)
7. Card controllers                        (replace callerActorId param with assertAuthority)
8. Card hooks                              (read assertAuthority from useVportManagement)
9. app.routes.jsx                          (swap guard component)
10. appRoutes.redirects.jsx                (retire OwnerOnlyDashboardGuard)
```

---

## 10. Open Questions (Pre-Implementation)

1. **callerActorId migration for settings controllers** — The settings feature (11 controllers) all call `assertActorOwnsVportActorController` with a `callerActorId`. Do they also need to be migrated to the `assertAuthority` pattern, or does the settings route have a separate guard that handles this differently?

2. **team-requests route** — `/actor/:actorId/dashboard/team-requests` is used by BARBER actors accepting invites from barbershops. The management resolver for a barber's own actor returns `session_vport`. The `acceptTeamRequestController` calls `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: resource.member_actor_id })`. Since team-requests is inside VportManagementGuard, the assertAuthority would target the barber's actorId — which is correct. Confirm the team-requests path works under the new guard before shipping.

3. **actor_owners P0** — The management layer design is correct and safe regardless of whether the INSERT policy is hardened. But shipping the management layer before P0 is closed means a fabricated actor_owners row could pass all management checks. Recommend: deploy 20260606000001 (after approval) before shipping the management layer.
