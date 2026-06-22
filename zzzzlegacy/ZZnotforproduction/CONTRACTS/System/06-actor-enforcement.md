# Actor Enforcement
## Single-Source Actor Architecture Contract — Final Principle, Enforcement, and Review Check (Locked)

> **Source:** [../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md](../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md)
> **Status:** ACTIVE
> **Scope:** apps/VCSM (all screens, providers, hooks, stores, caches, actions)
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-actor-ten-rules.md](05-actor-ten-rules.md)

---

## Final Principle

**IdentityProvider owns actor truth.
Everything else derives from it.
Nothing else stores it as live state.**

---

## Enforcement

Any new code in VCSM that introduces an independent actor state store, actor ref, or actor-scoped local state that does not reset on `identity?.actorId` change is a contract violation and must be rejected in review.

---

## Review Check

Search for these patterns in new code and verify they derive from `useIdentity()`:
- `useState` with actorId initialization
- `useRef` holding actorId
- `useMemo` with empty deps building actor state
- Any store/context that holds `actorId` independently
- Query keys that omit actorId for actor-dependent data
