# Identity Contract
## VCSM Architecture Contract — Actor Identity Model + §1.3–1.4 Identity Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 156–190
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-core-principles.md](01-core-principles.md)
> **Reads Before:** [03-layer-contracts.md](03-layer-contracts.md), [04-resolver-contract.md](04-resolver-contract.md)

---

## Actor Identity Model

### First-Class Actors

The VCSM platform is actor-first.

All platform entities operate through actors.

Current actor kinds:

- `user` — Citizen Actor
- `vport` — VPORT Actor

Future actor kinds:

- `void` — Reserved

### Actor Equality

Citizen actors and VPORT actors are first-class actors.

Neither actor type is secondary.

Neither actor type is represented by the other.

Both possess:

- `actorId`
- `kind`
- `realmId`
- lifecycle state

Both may become the active actor.

Citizen actors and VPORT actors currently share the same public realm.
`realmId` is not the current separator between Citizen and VPORT.
The current separators are `actorId` and `kind`.
`realmId` is future-ready infrastructure — see Current Realm State.

### Canonical Identity

`actorId` is the canonical identity of an actor.

`actorId` refers exclusively to:

```
vc.actors.id
```

No other identifier may be used as actor identity.

The following are NOT actor identities:

- `auth.users.id`
- `public.profiles.id`
- `vport.profiles.id`
- `owner_user_id`

### Active Actor Rule

The active actor determines:

- authorship
- permissions
- dashboard scope
- inbox scope
- profile scope

If the active actor is `kind = user`, actor-scoped contexts operate as Citizen.

If the active actor is `kind = vport`, actor-scoped contexts operate as VPORT.

### Feed Participation Rule

The public feed is actor-agnostic.

Actor kind does not determine feed membership.

Citizen actors and VPORT actors may both publish content into the same public feed.

The active actor determines:

- authorship
- permissions
- dashboard scope
- inbox scope
- profile scope

The active actor does not determine feed membership.

Feed membership is determined by feed rules, not identity rules.

---

### Ownership Rule

Identity and ownership are separate concerns.

**Actor** = who is acting

**Owner** = who has authority

Ownership is resolved through `vc.actor_owners`.

Ownership must never be inferred from:

- `profileId`
- `vportId`
- `userId`
- `owner_user_id`

### Void Actor Reservation

Void is a reserved first-class actor kind.

Future actor kind: `kind = void`

Void actors must follow the same actor contract:

- `actorId`
- `kind`
- `realmId`

The Void actor's `realmId` will point to a separate void realm, distinct from the
public realm shared by Citizen and VPORT actors today. This is the primary purpose
of `realmId` in the actor contract: to make future realm separation possible without
schema changes.

Void actors are not special-case identities. They participate in the actor system as first-class actors. Future capabilities and permissions are defined separately.

### Current Realm State

Citizen actors and VPORT actors currently share the public realm.

Both resolve to the same `realmId` value.

`realmId` is not the current separator between Citizen and VPORT.

The current separators are `actorId` and `kind`.

`realmId` becomes a meaningful separator when a new actor kind requires its own
distinct realm space. Until then, treat `realmId` as future-ready infrastructure,
not as a current boundary mechanism.

---

## Surface Rules

### 1.3 Identity Surface Rule

The identity object returned by `useIdentity()` is actor-first only.

It may contain:

- `identity.actorId`
- `identity.kind`

It must never expose:

- `profileId`
- `vportId`

`identity.actorId` is the only canonical ID used by the app to scope data.

`identity.kind` is the only canonical discriminator:

```
'user' | 'vport'
```

Any profile or vport lookup must remain internal to the provider and must not be exposed.

---

### 1.4 Owner Meaning Rule

In this system, Owner means Actor Owner.

The authoritative ownership model is actor-based because all meaningful domain entities are tied to `vc.actors`.

Ownership semantics must follow `actor_owners`.
