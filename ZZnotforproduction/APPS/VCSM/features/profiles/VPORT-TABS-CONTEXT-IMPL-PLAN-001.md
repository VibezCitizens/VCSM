# VPORT Profile Tabs — Boundary Context Implementation Plan

**Ticket:** VPORT-TABS-CONTEXT-IMPL-PLAN-001  
**Type:** IMPLEMENTATION PLAN — ENG  
**App:** VCSM  
**Status:** READY FOR EXECUTION  
**Date:** 2026-06-08  
**Scope:** apps/VCSM/src/features/profiles/kinds/vport/  
**Pre-read:** VPORT-TABS-BOUNDARY-AUTH-REVIEW-001.md

---

## Security Contract (Non-Negotiable)

VportProfileContext is **NOT a write-security boundary.**

| Permitted Use | Forbidden Use |
|---|---|
| Display mode branching (`owner` / `public`) | Authorizing mutations |
| Tab-level render conditionals | Bypassing controller auth checks |
| Passing `viewerActorId` for attribution | Querying actor_owners |
| Owner UI surface visibility | Replacing identity.adapter calls in mutations |

**Controllers must still re-check authorization on every write. This plan does not touch controllers.**

---

## Baseline Verified From Source

From reading the actual files before writing this plan:

```
VportProfileViewScreen.jsx
  ├─ viewerActorId         (prop — from parent identity resolution)
  ├─ profileActorId        (prop — slug-resolved)
  ├─ profile               (loaded via useProfileView)
  ├─ isOwner               (useMemo → deriveVportIsOwner — computed ONCE here)
  ├─ vportType             (derived from publicDetails / profile)
  └─ Renders VportTabRouter({ isOwner, viewerActorId, profileActorId, identity, ... })

VportTabRouter.jsx — prop distribution (actual, not assumed)
  ├─ VportMenuTab          ← receives: profile, onConsumedReviewsTab, onSetTab
  │                           ✗ NO isOwner, NO viewerActorId
  ├─ VportReviewsTab       ← receives: profile, viewerActorId, reviewsDefaultTab, onConsumedReviewsTab
  │                           ✗ NO isOwner, NO mode
  ├─ VportContentTab       ← receives: profile, isOwner               ✓
  ├─ VportBookTab          ← receives: profile, isOwner, vportType     ✓
  ├─ VportTeamTab          ← receives: profile, isOwner, vportType     ✓
  ├─ VportGasTab           ← receives: profileActorId, identity, isOwner ✓
  ├─ VportOwnerTab         ← receives: profile, profileActorId, isOwner ✓
  ├─ VportServicesTab      ← receives: profile, viewerActorId (no isOwner)
  ├─ VportPhotosTab        ← receives: profile, viewerActorId, onShare
  └─ (public tabs)         ← no ownership props needed

VportMenuView.jsx — PROBLEM
  ├─ Imports useIdentity independently
  ├─ Derives actorId from profile?.actorId
  └─ Re-computes isOwner: String(identity.actorId) === String(actorId)
     ⚠️ Redundant — boundary already has this

VportReviewsView.jsx — PARTIAL PROBLEM
  ├─ Imports useIdentity independently
  ├─ Gets sessionActorId = identity?.actorId
  ├─ Gets reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null
  │   ✓ KEEP — this is attribution logic, not ownership derivation
  ├─ mode prop defaults to "public" and is NEVER passed as "owner" from VportTabRouter
  │   ⚠️ isOwnerMode is always false — owner review analytics view never activates
  └─ mode should come from context, not prop
```

---

## Ticket 1 — Create VportProfileContext provider and hook

**Type:** ENG  
**Risk:** Low — additive only, zero consumers until Ticket 2+  
**DB/RLS:** None  
**Behavior change:** None (provider exists, nothing consumes it yet)

### New file

**Path:** `apps/VCSM/src/features/profiles/kinds/vport/context/VportProfileContext.js`

```javascript
import { createContext, useContext } from "react";

const VportProfileContext = createContext(null);

export function useVportProfileContext() {
  const ctx = useContext(VportProfileContext);
  if (!ctx) throw new Error("useVportProfileContext must be used inside VportProfileContext.Provider");
  return ctx;
}

export { VportProfileContext };
```

**Notes:**
- `createContext(null)` — intentional. Throws on use outside provider.
- No default value — callers inside the provider always get a real value.
- Named export for the context, named export for the hook. No default export.

---

### Modify: VportProfileViewScreen.jsx

**Import to add** (after the `deriveVportIsOwner` import line):
```javascript
import { VportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";
```

**After the existing `isOwner` useMemo block, add this `vportProfileCtx` memo:**
```javascript
const vportProfileCtx = useMemo(() => ({
  viewerActorId,
  vportActorId: profileActorId,
  vportProfileId: profile?.id ?? null,
  mode: isOwner ? "owner" : "public",
  authorization: {
    canManage: isOwner,
    mode: isOwner ? "self" : "public",
  },
}), [viewerActorId, profileActorId, profile?.id, isOwner]);
```

**Wrap the two `gate.canView` render blocks with the provider.**

Current (two separate blocks):
```jsx
{gate.canView && isCalendarActive && (
  <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
)}

{gate.canView && !isCalendarActive && !!profile && (
  <VportTabRouter
    tab={tab}
    profile={profile}
    ...
  />
)}
```

Replace with (single provider wrapping both):
```jsx
<VportProfileContext.Provider value={vportProfileCtx}>
  {gate.canView && isCalendarActive && (
    <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
  )}

  {gate.canView && !isCalendarActive && !!profile && (
    <VportTabRouter
      tab={tab}
      profile={profile}
      ...
    />
  )}
</VportProfileContext.Provider>
```

**What does NOT change:**
- `VportTabRouter` props are identical — no prop removals yet
- `isOwner` local variable stays — still used by `isBarbershopOwner`, `effectiveTabs`, and `VportTabRouter`
- `VportBarberShopOwnerBand` is outside the provider (above tab area) — leave it untouched
- `VportProfileHeader` is outside the provider — leave it untouched

**Verification after Ticket 1:**
- App behavior is 100% unchanged
- No consumer yet — provider wraps but nothing reads from it
- Zero risk of regression

---

## Ticket 2 — Migrate VportMenuView

**Type:** ENG  
**Risk:** Low  
**DB/RLS:** None  
**Behavior change:** None (identical derivation, different source)  
**Depends on:** Ticket 1 complete

### Modify: VportMenuView.jsx

**Current file structure (key lines):**
```javascript
import React, { useMemo } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
// ...
export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
  const { identity } = useIdentity();                // ← REMOVE

  const actorId = useMemo(() => {
    return profile?.actorId ?? profile?.actor_id ?? null;
  }, [profile]);

  const isOwner = useMemo(() => {                    // ← REMOVE (all 5 lines)
    const viewerId = identity?.actorId ?? null;
    if (!viewerId || !actorId) return false;
    return String(viewerId) === String(actorId);
  }, [identity, actorId]);
```

**Changes:**

1. **Remove** the `useIdentity` import line entirely.
2. **Add** import for context hook:
   ```javascript
   import { useVportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";
   ```
3. **Remove** `const { identity } = useIdentity();` call inside the component.
4. **Remove** the 5-line `isOwner` useMemo block.
5. **Add** context consumption (after the `actorId` memo):
   ```javascript
   const { authorization } = useVportProfileContext();
   ```
6. **Replace** `isOwner` in the render with `authorization.canManage`:
   ```jsx
   if (authorization.canManage) {
     return <VportMenuManageView actorId={actorId} />;
   }
   ```

**The `actorId` memo stays unchanged** — VportMenuManageView and VportActorMenuSection still need it for their own DAL queries.

**Result after change:**
```javascript
import React, { useMemo } from "react";
import { useVportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";
import VportMenuManageView from "...";
import VportActorMenuSection from "...";
import MenuReviewCTA from "./components/MenuReviewCTA";

export default function VportMenuView({ profile, onOpenFoodReview } = {}) {
  const actorId = useMemo(() => {
    return profile?.actorId ?? profile?.actor_id ?? null;
  }, [profile]);

  const { authorization } = useVportProfileContext();

  if (!actorId) return null;

  if (authorization.canManage) {
    return <VportMenuManageView actorId={actorId} />;
  }

  return (
    <div className="profiles-card rounded-2xl p-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {typeof onOpenFoodReview === "function" ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <MenuReviewCTA onClick={onOpenFoodReview} label="Review Food" />
        </div>
      ) : null}
      <VportActorMenuSection actorId={actorId} mode="public" />
    </div>
  );
}
```

**Mutation hooks (useVportActorMenuItemsMutations) are untouched** — they call `useIdentity()` independently for write attribution. This is correct and must not change.

**Verification:**
- Owner still sees VportMenuManageView
- Public viewer still sees read-only menu + food review CTA
- Menu save/delete mutations still pass through identity-backed callerActorId in controller

---

## Ticket 3 — Migrate VportReviewsView

**Type:** ENG  
**Risk:** Low-Medium (fixes a latent bug: owner review analytics was never activating)  
**DB/RLS:** None  
**Behavior change:** Owner now sees the owner analytics view in the reviews tab (correct behavior — was broken)  
**Depends on:** Ticket 1 complete

### Root cause of latent bug

`VportReviewsView` accepts a `mode` prop but VportTabRouter never passes `isOwner` to VportReviewsTab, so `mode` defaults to `"public"` always. The owner review analytics tab (`isOwnerMode`) was never rendering even for owners.

### What useIdentity() does in VportReviewsView (keep vs remove)

```javascript
const { identity } = useIdentity();
const sessionActorId = identity?.actorId ?? null;
useActorConsistencyCheck('reviews', sessionActorId, identity?.kind);  // debugger — KEEP
const reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null;  // attribution — KEEP
```

`reviewAuthorActorId` is gated on `identity?.kind === "user"` — this is not a simple actor ID comparison. It prevents vport actors from being recorded as review authors. This logic MUST stay in place and still needs `useIdentity()`.

**Do NOT remove `useIdentity()` from VportReviewsView.**

### Changes

**Add** context hook import:
```javascript
import { useVportProfileContext } from "@/features/profiles/kinds/vport/context/VportProfileContext";
```

**Add** context consumption inside the component (near the top, after `useIdentity`):
```javascript
const { mode: contextMode } = useVportProfileContext();
```

**Replace** the `mode` prop usage for `isOwnerMode`:
```javascript
// Before:
const isOwnerMode = mode === "owner";

// After:
const isOwnerMode = contextMode === "owner";
```

**Remove** the `mode` param from the function signature (it was defaulting to "public" and never being passed correctly — removing it removes the dead interface):
```javascript
// Before:
export default function VportReviewsView({
  targetActorId: targetActorIdProp = null,
  profile = null,
  viewerActorId: _viewerActorId = null,
  mode = "public",
}) {

// After:
export default function VportReviewsView({
  targetActorId: targetActorIdProp = null,
  profile = null,
  viewerActorId: _viewerActorId = null,
}) {
```

**`useIdentity()` call stays 100% intact** — `sessionActorId`, `reviewAuthorActorId`, `useActorConsistencyCheck` are all attribution/debugger logic, not ownership derivation.

**The `_viewerActorId` prop stays** (prefixed with `_` — it's already unused in the component body, just kept for call-site compatibility). No change to VportTabRouter needed for this prop.

**Verification:**
- Owner viewing their own VPORT profile now sees the review analytics view (tabs: Overall, Services, dimensions)
- Public viewer still sees the compose form + reviews list
- `reviewAuthorActorId` attribution is unchanged — still `identity?.kind === "user" ? sessionActorId : null`
- Review submit/delete mutations still re-check controller authorization independently

---

## Ticket 4 — Evaluate VportServicesTab flag naming

**Type:** ENG (evaluate only — may produce no code change)  
**Risk:** None until decision made  
**Depends on:** Tickets 1–3 complete

### Current state

```javascript
// VportTabRouter.jsx
{tab === "services" && (
  <VportServicesTab profile={profile} viewerActorId={viewerActorId} />
)}
```

`VportServicesTab` only passes `profile` and `viewerActorId` to `VportServicesView`. `VportServicesView` internally derives `allowOwnerEditing` — that file was not read during the review pass.

### Evaluation checklist

Before deciding, read `VportServicesView.jsx`:

1. How is `allowOwnerEditing` derived? From `viewerActorId` + DB query, or from prop?
2. Does it call `useIdentity()` internally for ownership?
3. Is the flag for display-only or does it gate a mutation?

**If `allowOwnerEditing` is derived from `viewerActorId === profile.actorId`:**  
→ Replace the derivation with `authorization.canManage` from `useVportProfileContext()`.  
→ Remove `viewerActorId` prop if that was its only use in VportServicesView.

**If `allowOwnerEditing` comes from a separate permissions system (team access, etc.):**  
→ Leave untouched. It's not the same as `isOwner`.

**Hard limit:** No behavior change if semantics differ. Rename only if the meaning is identical.

---

## Ticket 5 — Verification

**Type:** TASK  
**Depends on:** Tickets 1–4 complete

### Manual checks

| Check | Expected Result |
|---|---|
| Public user visits any VPORT profile | Menu tab shows read-only menu + food review CTA |
| Owner visits their own VPORT profile | Menu tab shows VportMenuManageView |
| Owner visits their own VPORT profile | Reviews tab shows analytics/owner view (isOwnerMode = true) |
| Public user visits VPORT profile | Reviews tab shows compose form + list |
| Owner submits menu category change | Controller still verifies `category.actor_id === actorId` |
| Owner submits review | Attribution uses `identity?.kind === "user"` check (unchanged) |
| Owner submits content page | Controller still verifies `callerActorId !== actorId → throw` |

### Grep checks to run after patching

```bash
# 1. Confirm no ownership re-derivation remains in menu or reviews
grep -n "useIdentity\|deriveVportIsOwner" \
  apps/VCSM/src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx \
  apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx

# Expected:
# VportMenuView.jsx    → 0 matches
# VportReviewsView.jsx → useIdentity (1 import + 1 usage) — ALLOWED for attribution

# 2. Confirm no tab queries actor_owners directly
grep -rn "actor_owners" \
  apps/VCSM/src/features/profiles/kinds/vport/tabs/ \
  apps/VCSM/src/features/profiles/kinds/vport/screens/

# Expected: 0 matches (only dal/rates/actorOwners.read.dal.js is allowed)

# 3. Confirm context provider is in place
grep -n "VportProfileContext.Provider" \
  apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx

# Expected: 1 match

# 4. Confirm controllers are untouched
grep -rn "callerActorId\|actor_id ===" \
  apps/VCSM/src/features/profiles/kinds/vport/controller/

# Expected: same count as before patching (all controller checks preserved)
```

---

## Files Changed Summary

| Ticket | File | Change Type |
|--------|------|-------------|
| 1 | `context/VportProfileContext.js` | **NEW** |
| 1 | `screens/VportProfileViewScreen.jsx` | ADD import, ADD useMemo, ADD Provider wrapper |
| 2 | `screens/menu/VportMenuView.jsx` | REMOVE useIdentity + isOwner, ADD useVportProfileContext |
| 3 | `screens/review/VportReviewsView.jsx` | ADD useVportProfileContext, REMOVE mode prop, derive isOwnerMode from context |
| 4 | `screens/services/view/VportServicesView.jsx` | EVALUATE (read first, change only if semantics match) |

**Files NOT touched:**
- All controllers — zero changes
- All DAL files — zero changes  
- All mutation hooks — zero changes
- VportTabRouter.jsx — zero changes (props stay as-is)
- vportOwnership.model.js — zero changes
- Any file outside `profiles/kinds/vport/` — zero changes

---

## Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Context consumed outside Provider boundary (other profile kinds) | Medium | `useVportProfileContext` throws immediately — fail-fast |
| VportReviewsView mode change activates owner view for owners — existing behavior was always "public" | Low | Correct behavior, not a regression. Owner has always been denied their own analytics view. Fixing it. |
| VportServicesView uses a different permissions model for allowOwnerEditing | Low | Ticket 4 is evaluate-first. Only change if semantics are confirmed identical. |
| review mutations use `reviewAuthorActorId` from `identity?.kind` check | None | `useIdentity()` stays in VportReviewsView — attribution path is untouched |
