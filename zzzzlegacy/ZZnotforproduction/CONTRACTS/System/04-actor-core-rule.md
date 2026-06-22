# Actor Core Rule
## Single-Source Actor Architecture Contract — Goal and Core Rule (Locked)

> **Source:** [../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md](../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md)
> **Status:** ACTIVE
> **Scope:** apps/VCSM (all screens, providers, hooks, stores, caches, actions)
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [05-actor-ten-rules.md](05-actor-ten-rules.md)
> **Cross-Links:** [Security/02-auth-authorization.md](../Security/02-auth-authorization.md) (authorization and actor identity model are related), [Security/06-platform-owners-prohibition.md](../Security/06-platform-owners-prohibition.md) (actor identity must not use platform_owners)

---

**Rule Name:** SINGLE_SOURCE_ACTOR_ARCHITECTURE
**Status:** ACTIVE
**Scope:** apps/VCSM (all screens, providers, hooks, stores, caches, actions)
**Source of truth:** `identityContext.identity` via `useIdentity()`

---

## Goal

Eliminate actor-switch desync by making one runtime actor source of truth and forcing every feature to derive from it, never copy it.

---

## Core Rule

At runtime, the only authoritative active actor state is:

```
identityContext.identity
```

Everything else must be derived, never independently stored.

These must NOT own actor state:
- feed viewer store
- screen-local `useState(actorId)`
- memoized actor snapshots that survive switches
- route-scoped viewer models
- local cache objects used as current truth
- debug stores treated as live state
