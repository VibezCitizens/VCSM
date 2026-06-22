# VPORT Profile Tabs — Boundary Authorization Review

**Ticket:** VPORT-TABS-BOUNDARY-AUTH-001  
**Type:** SEC / ARCH  
**App:** VCSM  
**Status:** COMPLETE — READ-ONLY  
**Date:** 2026-06-08  
**Scope:** apps/VCSM/src/features/profiles/kinds/vport/

---

## A. VERDICT

**PARTIAL**

Ownership is resolved once at the profile boundary (VportProfileViewScreen) using a pure derivation function. Most tabs receive `isOwner` as a prop and trust it. Two tabs (menu, reviews) re-derive ownership independently. All mutations re-verify authorization in their controllers before writing. There is no scoped vportProfileContext shape — ownership is passed via explicit prop drilling, not a React Context.

---

## B. CURRENT FLOW MAP

```
URL Route: /profile/:slug
    ↓
ActorProfileScreen.jsx
  ├─ Resolves slug → profileActorId
  ├─ Gets viewerActorId from identity.actorId (useIdentity)
  └─ Dispatches to kind registry → VportProfileKindScreen
      ↓
VportProfileKindScreen.jsx
  └─ Fetches vportType
      ↓
VportProfileViewScreen.jsx  ← ⭐ OWNERSHIP BOUNDARY
  ├─ Computes: isOwner = deriveVportIsOwner({ viewerActorId, profileActorId })
  │   └─ Pure fn: String(viewerActorId) === String(profileActorId)
  ├─ Renders VportProfileTabs (active tab indicator only)
  └─ Renders VportTabRouter({ isOwner, profile, viewerActorId, identity, ... })
      ↓
VportTabRouter.jsx  ← Routes to per-tab components
  ├─ Vibes Tab       → public read, no ownership prop received
  ├─ Photos Tab      → public read, no ownership prop
  ├─ About Tab       → public read, no ownership prop
  ├─ Rates Tab       → public read, no ownership prop
  ├─ Subscribers Tab → public read, no ownership prop
  ├─ Portfolio Tab   → public read, no ownership prop
  ├─ Reviews Tab     → ⚠️ calls useIdentity() internally (redundant re-check)
  ├─ Menu Tab        → ⚠️ calls useIdentity() internally (redundant re-check)
  ├─ Services Tab    → receives allowOwnerEditing flag (NOT isOwner directly)
  ├─ Content Tab     → receives isOwner prop, conditionally renders manage view
  ├─ Book Tab        → receives isOwner prop
  ├─ Team Tab        → receives isOwner prop (barbershop-specific)
  ├─ Gas Tab         → receives isOwner prop
  └─ Owner Tab       → receives isOwner prop, early-return if !isOwner

Mutations (all tabs):
  └─ Hook gets identityActorId from useIdentity() at call site
      └─ Controller re-verifies: callerActorId === actorId (every write)
```

---

## C. REPEATED OWNERSHIP CHECKS TABLE

| Tab | File | Independent Check | Type | Is It Redundant? |
|-----|------|-------------------|------|------------------|
| VportMenuTab | screens/menu/VportMenuView.jsx:24–28 | `deriveVportIsOwner()` via `useIdentity()` | Public + owner edit | ✅ YES — boundary already computes this |
| VportReviewsTab | screens/review/VportReviewsView.jsx:28–32 | `useIdentity()` to derive reviewAuthorActorId | Public + owner mode | ✅ YES — identity available from boundary |

**All other tabs:** Do NOT independently check ownership. They either receive the `isOwner` prop or are pure public read views.

---

## D. DIRECT actor_owners REFERENCES TABLE

| File | Usage | Layer | Risk |
|------|-------|-------|------|
| `dal/rates/actorOwners.read.dal.js:4–17` | Queries `actor_owners` table for rate ownership history | DAL | Low — DAL is the correct layer for DB queries |
| `model/vportOwnership.model.js:23–26` | Pure derivation only — no DB, no table reference | Model | None — string comparison only |

**No tab, hook, or screen directly queries `actor_owners` from the DB.** Only one DAL file touches the table, and only for rates history (not for authorization decisions).

---

## E. MUTATION SAFETY TABLE

| Mutation | File | Authorization Re-check | Layer | Verdict |
|----------|------|------------------------|-------|---------|
| Create content page | controller/content/createVportContentPage.controller.js:45–47 | `callerActorId !== actorId → throw` | Controller | ✅ SAFE |
| Update content page | controller/content/updateVportContentPage.controller.js | Same pattern | Controller | ✅ SAFE |
| Delete content page | controller/content/deleteVportContentPage.controller.js | Same pattern | Controller | ✅ SAFE |
| Toggle content publish | controller/content/toggleVportContentPagePublish.controller.js | Same pattern | Controller | ✅ SAFE |
| Save menu item | controller/menu/saveVportActorMenuItem.controller.js:49–51 | Fetches category, verifies `category.actor_id === actorId` | Controller | ✅ SAFE |
| Delete menu item | controller/menu/deleteVportActorMenuItem.controller.js | Fetches item, verifies `existing.actor_id === actorId` | Controller | ✅ SAFE |
| Create menu category | controller/menu/createVportActorMenuCategory.controller.js | Verifies `callerActorId === actorId` | Controller | ✅ SAFE |
| Update menu category | controller/menu/updateVportActorMenuCategory.controller.js | Same pattern | Controller | ✅ SAFE |
| Delete menu category | controller/menu/deleteVportActorMenuCategory.controller.js | Same pattern | Controller | ✅ SAFE |

**No mutation trusts the UI-level `isOwner` prop for write authorization.** All controllers independently verify the caller's identity from `useIdentity()` before executing.

---

## F. RECOMMENDED vportProfileContext SHAPE

The recommended context shape that consolidates what VportProfileViewScreen already computes:

```javascript
// Recommended shape — resolves ONCE at VportProfileViewScreen boundary
const vportProfileContext = {
  viewerActorId,          // from useIdentity().actorId
  vportActorId,           // from profileActorId (slug-resolved)
  vportProfileId,         // from profile.id
  mode: isOwner ? "owner" : "public",
  authorization: {
    canManage: isOwner,
    mode: isOwner ? "self" : "public",   // "actor_owner" reserved for delegated access (future)
  }
};
```

**What changes under this shape:**
- `VportMenuView` and `VportReviewsView` receive `mode` from context instead of calling `useIdentity()` for ownership derivation
- Tabs that only need `viewerActorId` for booking/attribution receive it from context, not from independent `useIdentity()` calls
- Mutation hooks still call `useIdentity()` independently at write time — this is correct and must not change

**What does NOT change:**
- Controllers always re-verify. No change here.
- DAL never decides authorization. No change here.
- Public tabs remain context-unaware if they have no mode-dependent rendering.

---

## G. PATCH PLAN (SMALL TICKETS)

### TICKET-VPORT-BOUNDARY-001 — Create vportProfileContext provider
- **Type:** ENG
- **Scope:** VportProfileViewScreen.jsx only
- **Work:** Wrap tab area in a React Context that exposes `{ viewerActorId, vportActorId, vportProfileId, mode, authorization }`
- **Risk:** Low — additive only, no existing consumers to migrate yet
- **Depends on:** None

### TICKET-VPORT-BOUNDARY-002 — Remove redundant ownership check in VportMenuView
- **Type:** ENG
- **Scope:** screens/menu/VportMenuView.jsx only
- **Work:** Remove internal `useIdentity()` + `deriveVportIsOwner()` call; consume `mode` from vportProfileContext instead
- **Risk:** Low — logic is identical, just source changes
- **Depends on:** TICKET-VPORT-BOUNDARY-001

### TICKET-VPORT-BOUNDARY-003 — Remove redundant ownership check in VportReviewsView
- **Type:** ENG
- **Scope:** screens/review/VportReviewsView.jsx only
- **Work:** Remove internal `useIdentity()` for ownership derivation; get `viewerActorId` from vportProfileContext; keep `useIdentity()` for write attribution only (reviews submit)
- **Risk:** Low — same logic, same data
- **Depends on:** TICKET-VPORT-BOUNDARY-001

### TICKET-VPORT-BOUNDARY-004 — Align VportServicesTab to use isOwner prop
- **Type:** ENG
- **Scope:** tabs/services/VportServicesTab.jsx
- **Work:** Services tab receives `allowOwnerEditing` (not `isOwner`). Evaluate if this should be standardized to `mode === "owner"` from context to match all other tabs
- **Risk:** Low — display-only flag, no mutation impact
- **Depends on:** TICKET-VPORT-BOUNDARY-001

### TICKET-VPORT-BOUNDARY-005 (FUTURE) — actor_owner delegated mode
- **Type:** ENG
- **Scope:** vportOwnership.model.js + vportProfileContext shape
- **Work:** When delegated actor ownership (non-self managers) needs to be supported, extend `authorization.mode` to include `"actor_owner"` and wire to DB lookup
- **Risk:** Medium — DB lookup required, needs RLS review
- **Depends on:** All prior tickets complete

---

## OWNERSHIP CHECK CALL SITES — Complete Reference

| Hook / Function | File | Called By | DB Query? |
|----------------|------|-----------|-----------|
| `deriveVportIsOwner()` | model/vportOwnership.model.js | VportProfileViewScreen (boundary) | No — pure string compare |
| `deriveVportIsOwner()` | model/vportOwnership.model.js | VportMenuView (re-check) | No |
| `useIdentity()` | identity feature | VportMenuView (re-check) | No |
| `useIdentity()` | identity feature | VportReviewsView (re-check) | No |
| `useIdentity()` | identity feature | useVportActorMenuItemsMutations | No (mutation prep only) |
| `useIdentity()` | identity feature | useVportContentPages | No (mutation prep only) |
| `callerActorId === actorId` | All content controllers | Each mutation | No — memory check |
| `category.actor_id === actorId` | saveVportActorMenuItem.controller.js | Menu save mutation | Yes (fetches category to verify) |

---

## BOUNDARY CLASSIFICATION SUMMARY

| Contract Rule | Current State | Verdict |
|---------------|---------------|---------|
| Authentication = valid session only | useIdentity() at boundary | ✅ PASS |
| Identity = active actorId + kind | Resolved at ActorProfileScreen | ✅ PASS |
| Authorization = actor may perform action | deriveVportIsOwner once at VportProfileViewScreen | ✅ PASS |
| VPORT boundary authorizes once | VportProfileViewScreen boundary | ✅ PASS |
| Public read tabs do not run ownership checks | Vibes, Photos, About, Rates, Subscribers, Portfolio | ✅ PASS |
| Tabs receive scoped context, not ownership authority | Props passed down; NO scoped context object yet | ⚠️ PARTIAL |
| Mutations re-check authorization in controller | All 9 mutations verified | ✅ PASS |
| DAL does not decide authorization | Only actorOwners.read.dal.js touches table (non-auth use) | ✅ PASS |
| Tabs do not query actor_owners directly | No tab or hook references actor_owners table | ✅ PASS |
