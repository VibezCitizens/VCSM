# features/authorization

## Scope

This feature owns all actor ownership and permission decisions on the VCSM platform.

Authorization answers: **what is this actor allowed to do?**

## Architectural Boundaries

| Concern | Feature |
|---------|---------|
| session / account authentication | `features/auth` |
| who is acting | `features/identity`, `state/identity` |
| **what the actor may do** | **`features/authorization` — this feature** |
| enrich actor with display data | `features/hydration` |

## Ownership Rule — Non-Negotiable

No production feature may query `vc.actor_owners` directly except:

1. `features/authorization` — all authorization decisions
2. `features/auth/onboarding` — actor-owner creation at registration only
3. DB / RLS layer
4. Dev diagnostics (never in any production code path)

## Public Surface

Consumers import exclusively through `adapters/authorization.adapter.js`.
No feature may import from `controllers/`, `dal/`, or `model/` directly.

## Layer Map

```
dal/actorOwners.read.dal.js          ← raw vc.actor_owners reads only
model/authorizationDecision.model.js ← normalizes decision return shapes
controllers/assertActorOwnsActor     ← actor-to-actor ownership gate
controllers/assertSessionOwnsActor   ← session-derived ownership gate
controllers/assertActorCanManageActor← delegation / management check
controllers/resolveActorOwnerActor   ← resolve VPORT owner's user actor
adapters/authorization.adapter.js    ← public surface — import from here only
```

## Status

**Canonical app-layer ownership authority** (adopted by IDENTITY-BOUNDARY-005).

This feature now owns all app-layer actor ownership assertions. The former booking
compatibility wrappers have been removed, and every caller imports
`assertActorOwnsActorController` / `assertSessionOwnsActorController` (and the
read-only `readActorStatusController`) from `adapters/authorization.adapter.js`.
`vc.actor_owners` is still read directly across legacy DALs (settings/vports,
vportDashboard, profiles/kinds/vport, wanders, notifications, upload, portfolio,
reviews) — consolidating those reads remains future work.

Do **not** add new `vc.actor_owners` readers outside this feature, and do **not**
reintroduce ownership assertions into other features' adapters (e.g. booking).

> Drift note (not changed by this ticket): the Layer Map above lists
> `assertActorCanManageActor` and `resolveActorOwnerActor`, which do not exist in
> `controllers/` today (only `assertActorOwnsActor` and `assertSessionOwnsActor`
> are present). Reconcile during IDENTITY-BOUNDARY-003.

Migration plan: `ZZnotforproduction/APPS/VCSM/features/authorization/AUTHORIZATION_EXTRACTION_PLAN.md`
