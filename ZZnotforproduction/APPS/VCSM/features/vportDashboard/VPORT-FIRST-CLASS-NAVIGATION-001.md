# VPORT-FIRST-CLASS-NAVIGATION-001
## Make VPORT Navigation Use Active Actor Instead of Repeated Owner Checks

**Date:** 2026-06-07
**Status:** COMPLETE
**Files Changed:** 2 (1 new, 1 edited)

---

## PHASE 1 — AUDIT CLASSIFICATION TABLE

| File | Symbol | Current Purpose | Category | Keep? | Replace With |
|---|---|---|---|---|---|
| `VportDashboardScreen.jsx:34` | `useVportOwnership(identity?.actorId, actorId)` | Block entry if not owner | NAVIGATION_OR_RENDER | Hook unchanged; fast path added inside hook | `isActiveVportActor` fast path |
| `VportSettingsFinalScreen.jsx:23` | `useVportOwnership(viewerActorId, actorId)` | Block settings if not owner | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardExchangeScreen.jsx:26` | `useVportOwnership(viewerActorId, actorId)` | Block exchange if not owner | NAVIGATION_OR_RENDER | Same | Same |
| `useCalendarDashboard.js:18` | `useVportOwnership(viewerActorId, actorId)` | Gate data queries on isOwner | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardCalendarScreen.jsx:22` | `isOwner` from `useCalendarDashboard` | Block calendar render | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardBookingHistoryScreen.jsx:12` | `useVportOwnership(viewerActorId, targetActorId)` | Block booking history | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardLeadsFinalScreen.jsx:26` | `useVportOwnership(viewerActorId, actorId)` | Block leads if not owner | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardLocksmithScreen.jsx:27` | `useVportOwnership(viewerActorId, targetActorId)` | Block locksmith render | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardTeamScreen.jsx:23` | `useVportOwnership(viewerActorId, actorId)` | Block team screen | NAVIGATION_OR_RENDER | Same | Same |
| `BarberTeamRequestsScreen.jsx:81` | `useVportOwnership(viewerActorId, actorId)` | Block team requests | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardGasScreen.jsx:18` | `useVportOwnership(viewerActorId, actorId)` | Block gas dashboard | NAVIGATION_OR_RENDER | Same | Same |
| `VportGasPricesScreen.jsx:19` | `useVportOwnership(viewerActorId, actorId)` | Pass isOwner to view | NAVIGATION_OR_RENDER | Same | Same |
| `VportDashboardPortfolioScreen.jsx:48` | `useVportOwnership(viewerActorId, targetActorId)` | Block portfolio | NAVIGATION_OR_RENDER | Same | Same |
| `useVportServices.js:7` | `useVportOwnership(viewerActorId, actorId)` | Pass isOwner to screen | NAVIGATION_OR_RENDER | Same | Same |
| `useVportReviews.js:7` | `useVportOwnership(viewerActorId, actorId)` | Pass isOwner to screen | NAVIGATION_OR_RENDER | Same | Same |
| `VportActorMenuFlyerScreen.jsx:22` | `useVportOwnership(viewerActorId, actorId)` | Block flyer access | NAVIGATION_OR_RENDER | Same | Same |
| `VportActorMenuFlyerEditorScreen.jsx:20` | `useVportOwnership(viewerActorId, actorId)` | Block flyer editor | NAVIGATION_OR_RENDER | Same | Same |
| `GasPricesPanel.jsx` | `isOwner` prop | Show/hide bulk update button | UI_CONVENIENCE | Unchanged | No change |
| `VportDashboardGasPanels.jsx` | `isOwner` prop | Show/hide edit controls | UI_CONVENIENCE | Unchanged | No change |
| `TeamMemberCards.jsx:74` | `isOwner` prop | Show edit controls | UI_CONVENIENCE | Unchanged | No change |
| All `assertActorOwnsVportActorController` callers (30+) | write/delete gates | Protect mutations | MUTATION_SECURITY_GATE | ALL KEPT | No change |
| `checkVportOwnershipController` in gas price controllers | mutation-level check | Verify ownership before write | MUTATION_SECURITY_GATE | ALL KEPT | No change |
| `resolveVportOwnerActor.controller.js` | `readActorOwnerUserDAL` | Resolve citizen owner for notifications | OWNER_RESOLUTION | Kept | No change |
| `dev/diagnostics/**` | `actor_owners`, `ownerActorId` | Dev-only probes | DEV_DIAGNOSTIC | Unchanged | No change |

---

## PHASE 2 — `isActiveVportActor` HELPER

**File:** `apps/VCSM/src/features/vportDashboard/model/vportAccess.model.js` *(NEW)*

```js
export function isActiveVportActor(identity, targetActorId) {
  return Boolean(
    identity?.kind === "vport" &&
    identity?.actorId &&
    targetActorId &&
    identity.actorId === targetActorId
  );
}
```

**Semantics:**
- True only when the active actor IS the target VPORT
- `identity.kind` is trustworthy: switchActiveActor verified link ownership + active status + is_switchable in DB before identity was committed
- Navigation/render gate only — not a security boundary for mutations

---

## PHASE 3 — NAVIGATION OWNER CHECKS REPLACED

**File:** `apps/VCSM/src/features/vportDashboard/hooks/useVportOwnership.js` *(EDITED)*

**Before (all calls followed this path):**
```
useVportOwnership(callerActorId, targetActorId)
  → useEffect fires
  → setOwnershipLoading(true)
  → checkVportOwnershipController({ callerActorId, targetActorId })
    → if callerActorId === targetActorId:
        → getActorByIdDAL(callerActorId)   ← DB ROUND-TRIP
        → if kind === "vport": return true
    → else: assertActorOwnsVportActorController → actor_owners DB query
  → setIsOwner(result)
  → setOwnershipLoading(false)
```

**After (VPORT mode takes fast path, citizen-owner mode unchanged):**
```
useVportOwnership(callerActorId, targetActorId)
  → reads identity.kind from useIdentity() (context, no I/O)
  → useEffect fires

  Mode 1 — Active VPORT (identity.kind === "vport" AND actorId === targetActorId):
    → isActiveVportActor(identity, targetActorId) = true
    → setIsOwner(true)          ← synchronous, no DB
    → setOwnershipLoading(false)
    → return (no listeners registered)

  Mode 2 — Citizen-owner (identity.kind === "user"):
    → isActiveVportActor = false
    → falls through to existing async path (unchanged)
    → checkVportOwnershipController → actor_owners DB query
    → focus/visibility listeners for background re-verify
```

**API change:** None. Callers unchanged.

**Deps array change:**
```
// Before:
[callerActorId, targetActorId]

// After:
[callerActorId, targetActorId, identity?.kind, identity?.actorId]
```
`identity?.kind` added so the effect re-runs when the user switches from VPORT to citizen actor (triggering the citizen-owner path). `identity?.actorId` redundantly mirrors `callerActorId` but makes the dependency self-documenting.

---

## PHASE 4 — MUTATION GATES PRESERVED

All of these remain **unchanged**:

| File | Mutation | Gate Kept | Reason |
|---|---|---|---|
| `vportOwnerStats.controller.js` | load stats | `assertActorOwnsVportActorController` | Ownership required even for reads |
| `saveVportPublicDetailsByActorId.controller.js` | VPORT detail save | `assertActorOwnsVportActorController` | Write gate |
| `loadDaySchedule.controller.js` | schedule read | `assertActorOwnsVportActorController` | Owner-only read |
| `createOwnerBooking.controller.js` | booking create | `assertActorOwnsVportActorController` | Write gate |
| `updateVportBooking.controller.js` (×2) | booking update | `assertActorOwnsVportActorController` | Write gate |
| `vportLeads.controller.js` (×3) | leads CRUD | `assertActorOwnsVportActorController` | Write gate |
| `probeVportPortfolio.controller.js` | portfolio probe | `assertActorOwnsVportActorController` | Diagnostic write gate |
| `vportTeam.controller.js` (×4) | team CRUD | `assertActorOwnsVportActorController` | Write gate |
| `vportTeamAccess.controller.js` (×5) | team access | `assertActorOwnsVportActorController` | Write gate |
| `vportTeamInvite.controller.js` (×5) | team invites | `assertActorOwnsVportActorController` | Write gate |
| `submitOwnerFuelPriceUpdate.controller.js` | gas price update | `checkVportOwnershipController` | Mutation-level; wrapper calls `assertActorOwnsVportActor` |
| `updateStationFuelUnit.controller.js` | fuel unit update | `checkVportOwnershipController` | Same |
| `reviewFuelPriceSuggestion.controller.js` | suggestion review | `checkVportOwnershipController` | Same |
| `publishFuelPriceUpdateAsPost.controller.js` | post publish | `checkVportOwnershipController` | Same |

---

## PHASE 5 — SWITCH ACTOR VERIFICATION

**SWITCH_ACTOR_VERIFIED: YES**

`engines/identity/src/controller/switchActiveActor.controller.js` verifies before committing:
1. Actor link exists in DB (`dalGetActorLinkById`)
2. Link belongs to this account (`row.user_app_account_id !== userAppAccountId` → throw)
3. Status is `active` (`row.status !== 'active'` → throw)
4. Is switchable (`!row.is_switchable` → throw)

`apps/VCSM/src/state/identity/controller/switchActor.controller.js` additionally:
5. Target must be in `ctx.availableActors` — account-scoped set from engine query
6. Platform preference write via `engineSwitchActiveActor`
7. Hydrates identity (`loadIdentityForActorId`) — identity only committed on `hydrationSucceeded`

Therefore: when `identity.kind === "vport"`, the identity was committed after a DB-verified actor link switch. The `isActiveVportActor` fast path is safe for navigation/render decisions.

Revocation detection: handled by `isBlockedVportIdentity` + auto-switch-to-citizen in `identityContext.jsx:178-183`. A revoked VPORT actor is caught on next identity resolve and the identity context switches away automatically.

---

## PHASE 6 — VALIDATION GREP RESULTS

```
grep -R "useVportOwnership" apps/VCSM/src/features/vportDashboard
  → 17 call sites in screens/hooks — ALL UNCHANGED (signatures identical)
  → 1 adapter export — unchanged

grep -R "checkVportOwnershipController" apps/VCSM/src/features/vportDashboard
  → 6 mutation-level usages — ALL UNCHANGED
  → 1 usage inside useVportOwnership (citizen-owner path, preserved)

grep -R "assertActorOwnsVportActorController" apps/VCSM/src/features/vportDashboard
  → 30+ mutation gate usages — ALL UNCHANGED

grep -R "identity.ownerActorId" apps/VCSM/src → 0 ✓
grep -R "ownerUserId" (new files only) → 0 ✓
grep -R "toPublicIdentity.*owner" → 0 ✓
```

---

## FILES CHANGED

| File | Change | Why |
|---|---|---|
| `apps/VCSM/src/features/vportDashboard/model/vportAccess.model.js` | NEW — `isActiveVportActor` helper | Pure function encapsulates the fast-path logic, reusable, testable |
| `apps/VCSM/src/features/vportDashboard/hooks/useVportOwnership.js` | EDITED — adds fast path, imports `useIdentity` and `isActiveVportActor`, extends deps | Eliminates DB round-trip for VPORT-self navigation |

---

## BEHAVIOR BEFORE / AFTER

| Scenario | Before | After |
|---|---|---|
| VPORT actor navigates to own dashboard | `ownershipLoading=true` → async DB call → `ownershipLoading=false` (≥1 render cycle + DB) | `ownershipLoading=true` → effect fires → `isOwner=true, ownershipLoading=false` (synchronous, no DB) |
| Citizen actor navigates to own VPORT dashboard | Async DB call via `actor_owners` | Unchanged — same async path |
| VPORT actor performs a mutation (e.g., save settings) | `assertActorOwnsVportActorController` (DB) | Unchanged — mutation gate preserved |
| User switches from VPORT to citizen | Effect re-runs (`identity.kind` dep changed) → falls to citizen-owner path | Correct — fast path only fires when kind === "vport" |
| Identity null / loading | Falls to async path (no change) | Falls to async path (no change) — safe |

---

## PLACES WHERE VPORT IS STILL TREATED AS SECONDARY TO CITIZEN

None found after this change for navigation. The hook now treats VPORT-self as a first-class path.

Remaining intentional asymmetry (correct by design):
- `assertActorOwnsVportActorController` requires `kind === "user"` — VPORT actors cannot mutate via the citizen-owner path. This is correct: mutations need a human owner, not an actor acting on its own behalf.
- Gas price controllers use `checkVportOwnershipController` which allows VPORT-self for those specific mutations (pre-existing, intentional).

---

*VPORT-FIRST-CLASS-NAVIGATION-001 — 2 files changed — 2026-06-07*
