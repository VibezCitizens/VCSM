# VPORT Profile Tabs — Boundary Context Implementation Review

**Ticket:** TICKET-VPORT-BOUNDARY-CTX-IMPLEMENTATION-REVIEW  
**Type:** DEEP IMPLEMENTATION REVIEW — READ ONLY  
**App:** VCSM  
**Status:** COMPLETE  
**Date:** 2026-06-08  
**Scope:** apps/VCSM/src/features/profiles/kinds/vport/  
**Plan reference:** VPORT-TABS-CONTEXT-IMPL-PLAN-001.md

---

## A. Executive Verdict

**FAIL — Implementation has not been executed.**

`VportProfileContext.js` does not exist. No context provider was created. No tab migrations were applied. The codebase is in the same state as when the plan was written. All verification checks that depend on the context layer failing as a consequence.

Secondary finding: The services evaluation (Ticket 4 from the plan) would have returned **"Must remain independent"** — see Section F for the critical reason.

---

## B. Findings Table

| # | Check | Result | Reason |
|---|-------|--------|--------|
| 1 | Context boundary | FAIL | VportProfileContext.js does not exist |
| 2 | Context shape validation | FAIL | No context to validate |
| 3 | Ownership source | FAIL | Menu still re-derives independently; context absent |
| 4 | Menu migration | FAIL | useIdentity + local isOwner still present |
| 5 | Reviews migration | FAIL | mode prop still present; context never wired |
| 6 | Services evaluation | COMPLETE | Must remain independent — see Section F |
| 7 | Controller isolation | PASS | No controller references context (context doesn't exist) |
| 8 | DAL isolation | PASS | No DAL references context (context doesn't exist) |
| 9 | Mutation safety | PASS | All controller checks intact and unchanged |
| 10 | actor_owners audit | PASS | No new references; existing DAL usage unchanged |
| 11 | Prop removal audit | N/A | No props were removed |
| 12 | Regression risk | N/A | No implementation has run |

---

## C. Context Boundary Validation

**Result: FAIL**

`VportProfileContext.js` was not created. Grep across the entire vport feature returns zero matches for `VportProfileContext`, `useVportProfileContext`, and `authorization.canManage`.

```
grep -rn "VportProfileContext|useVportProfileContext|authorization\.canManage" \
  apps/VCSM/src/features/profiles/kinds/vport/
→ (no output)
```

The directory `apps/VCSM/src/features/profiles/kinds/vport/context/` does not exist.

`VportProfileViewScreen.jsx` has no Provider wrapper. The file is unchanged from the pre-plan baseline.

---

## D. Menu Migration Validation

**Result: FAIL — Pre-plan state**

`VportMenuView.jsx` is unchanged. Confirmed by source read:

```javascript
// Line 5  — still present
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

// Line 18 — still present
const { identity } = useIdentity();

// Lines 24–28 — still present, full local re-derivation
const isOwner = useMemo(() => {
  const viewerId = identity?.actorId ?? null;
  if (!viewerId || !actorId) return false;
  return String(viewerId) === String(actorId);
}, [identity, actorId]);
```

No context import. No `authorization.canManage` usage. No plan changes applied.

**Additional observation:** Because `VportMenuView` derives ownership from `useIdentity()` against `profile.actorId` (not from a boundary prop), the derivation is correct when an actor switches their active identity to be the profile actor. The redundancy is not a security issue — the check reaches the same result as the boundary. It is an architecture consistency issue only.

---

## E. Reviews Migration Validation

**Result: FAIL — Pre-plan state, latent bug still present**

`VportReviewsView.jsx` is unchanged. Confirmed:

```javascript
// Line 6 — still present
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

// Line 25 — mode prop still in signature (plan called for removal)
mode = "public",

// Line 38 — still present
const isOwnerMode = mode === "owner";
```

No context import. `mode` prop is still the source of `isOwnerMode`. Context never wired.

**Latent bug still present:** `VportTabRouter.jsx` never passes a `mode` prop to `VportReviewsTab`. `VportReviewsTab` never passes `mode` to `VportReviewsView`. Therefore `isOwnerMode` is always `false` when the VPORT profile page renders the reviews tab — even for the profile owner.

The owner review analytics view (dimension tabs, service filter, owner-targeted copy) never activates on the profile page. This is pre-existing and unrelated to the context plan, but it is a confirmed behavioral gap.

The `useIdentity()` call in `VportReviewsView` is for attribution (`reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null`) — this is correct and must remain regardless of context migration.

---

## F. Services Evaluation

**Result: Must remain independent. Do not replace with context mode.**

Source read of `VportServicesView.jsx` reveals that `allowOwnerEditing` is not a pure display flag:

```javascript
// Line 26 — prop signature
allowOwnerEditing = false

// Line 37 — display flag derived
const ownerUiEnabled = Boolean(allowOwnerEditing);

// Lines 42–45 — passed into data hook
const s = useVportServices({
  actorId,
  viewerActorId,
  asOwner: ownerUiEnabled,   // ← CHANGES DATA QUERY
});
```

The `asOwner` parameter propagates into `getVportServicesController`, which when `asOwner=true`:
1. Requires `callerActorId` to be present
2. Calls `assertActorOwnsVportActorController()` — **server-side ownership verification**
3. Returns a different data set (includes disabled services)

If `allowOwnerEditing` were replaced with `authorization.canManage` from the context:
- The display flag would activate based on a string comparison only
- The controller's server-side `assertActorOwnsVportActorController()` call would still run — but the data would be requested under owner mode without the dashboard's pre-verification flow
- This would **bypass the intended gating** where the dashboard-level `useVportOwnership()` (async, server-backed) gates access before passing `allowOwnerEditing={true}`

**Verdict: `allowOwnerEditing` must remain an explicit prop controlled by the calling screen. The profile page should not pass it at all (current behavior is correct — defaults false). The dashboard passes it only after `checkVportOwnershipController()` verifies server-side.**

This was the correct conclusion that Ticket 4 ("evaluate first") would have reached. The evaluation is done here.

---

## G. Controller Isolation Results

**Result: PASS**

No controller file imports or references `VportProfileContext`, `useVportProfileContext`, or `authorization.canManage`.

All verified controllers remain unchanged:

| Controller | Authorization Check Present | Unchanged |
|---|---|---|
| `createVportContentPage.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `updateVportContentPage.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `deleteVportContentPage.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `toggleVportContentPagePublish.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `saveVportActorMenuItem.controller.js` | Fetches category, verifies `category.actor_id === actorId` | ✓ |
| `deleteVportActorMenuItem.controller.js` | Fetches item, verifies `existing.actor_id === actorId` | ✓ |
| `createVportActorMenuCategory.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `updateVportActorMenuCategory.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `deleteVportActorMenuCategory.controller.js` | `callerActorId !== actorId → throw` | ✓ |
| `getVportServicesController` | `assertActorOwnsVportActorController()` when `asOwner=true` | ✓ |

Pass is vacuous for the context isolation check (context doesn't exist), but controller authorization integrity is confirmed independently.

---

## H. Mutation Safety Results

**Result: PASS**

All mutation controllers re-check authorization independently. No mutation trusts a UI-level ownership signal. This was true before the plan, and remains true. Unchanged.

The `useIdentity()` calls in mutation hooks (`useVportActorMenuItemsMutations`, `useVportContentPages`) are for collecting `callerActorId` at write time — these are untouched and correct.

---

## I. actor_owners Audit Results

**Result: PASS**

Two references confirmed in the feature. Both pre-existing. Neither introduced by any plan change:

| File | Line | Type | Content |
|------|------|------|---------|
| `model/vportOwnership.model.js` | 14 | Comment only | Documents server-side enforcement via `actor_owners + checkVportOwnershipController` |
| `dal/rates/actorOwners.read.dal.js` | 9 | DAL query | Queries `vc.actor_owners` for rates history — not for authorization decisions |

No tab, screen, hook, or controller queries `actor_owners` for authorization. No new references added.

---

## J. Regression Risk Assessment

**All tickets are pending. No regressions introduced because no code was changed.**

When the implementation is executed, the risk profile per ticket is:

| Ticket | Work | Risk Level | Reason |
|--------|------|------------|--------|
| 1 — Context file + Provider | New file + wrapper in VportProfileViewScreen | **LOW** | Additive only. Provider wraps tab area. No consumer yet. Zero behavior change until Ticket 2/3. |
| 2 — Menu migration | Remove useIdentity re-check in VportMenuView | **LOW** | Logic is identical — string comparison of same two values. Only source changes. Mutations untouched. |
| 3 — Reviews migration | Wire context mode, remove mode prop | **LOW-MEDIUM** | Fixes latent bug (owner now sees analytics view on profile). Previously-broken path activating is the only behavior change. Attribution logic (useIdentity) stays intact. |
| 4 — Services evaluation | No code change recommended | **NONE** | Evaluation complete: must remain independent. No code touch. |

**Ticket 3 elevated to LOW-MEDIUM because it activates previously-dead code path (owner analytics view on profile page).** The code itself is correct — it was always intended to work for owners — but activating a dormant path warrants manual verification that the owner analytics view renders correctly for a vport profile owner.

---

## K. Final Recommendation

**The plan is architecturally correct. Execute Tickets 1–3 in order. Close Ticket 4 as complete (finding: must remain independent).**

**Ticket 4 closure note:**  
`allowOwnerEditing` must not be replaced with context `authorization.canManage`. The flag triggers a different data fetch path (`asOwner: true` in `getVportServicesController`) with server-side `assertActorOwnsVportActorController()` verification. Replacing it with a display-layer context value would decouple the data-fetch mode from the server-verified ownership check. The profile page should never pass `allowOwnerEditing={true}` — this is dashboard-only, gated by `useVportOwnership()`.

**Execution order:**
1. Ticket 1 — context file + VportProfileViewScreen provider. Deploy and verify app loads.
2. Ticket 2 — VportMenuView migration. Verify owner sees manage UI, public sees read-only.
3. Ticket 3 — VportReviewsView migration. Verify owner sees analytics tabs; public sees compose form. This is the only ticket that activates new behavior — test manually.
4. Ticket 4 — closed, no code change.

**Pre-existing issues confirmed but out of scope for this plan:**
- Reviews owner mode was never activating on the profile page (Ticket 3 fixes this as a side effect)
- VportTabRouter does not forward `mode` or `isOwner` to VportReviewsTab (resolved by context approach in Ticket 3)
