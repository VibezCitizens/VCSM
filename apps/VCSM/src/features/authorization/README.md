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

**Implemented but NOT adopted** (recorded by IDENTITY-BOUNDARY-002, 2026-06-08).

The controllers, DALs, and model are fully implemented — but **no production code
imports this feature**. The only importers are internal (controller → dal,
adapter → controller) plus two SPIDER-MAN tests asserting other features do not
import it. Live ownership gates still exist elsewhere — notably
`features/booking/controllers/assertActorOwnsVportActor.controller.js` — and
`vc.actor_owners` is read directly across 35+ files (settings/vports,
vportDashboard, profiles/kinds/vport, wanders, notifications, upload, portfolio,
reviews).

Do **not** edit authorization behavior, wire callers, or delete this feature until
the adoption/freeze decision ticket (IDENTITY-BOUNDARY-003). Do **not** add new
`vc.actor_owners` readers outside this feature.

> Drift note (not changed by this ticket): the Layer Map above lists
> `assertActorCanManageActor` and `resolveActorOwnerActor`, which do not exist in
> `controllers/` today (only `assertActorOwnsActor` and `assertSessionOwnsActor`
> are present). Reconcile during IDENTITY-BOUNDARY-003.

Migration plan: `ZZnotforproduction/APPS/VCSM/features/authorization/AUTHORIZATION_EXTRACTION_PLAN.md`
