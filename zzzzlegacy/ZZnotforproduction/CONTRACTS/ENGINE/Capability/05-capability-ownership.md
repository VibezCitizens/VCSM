# Capability Ownership
## Capability Contract — Anti-Corruption, Ownership, Failure Rules, and Examples (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-event-contract.md](04-event-contract.md)
> **Reads Before:** [06-capability-principles.md](06-capability-principles.md)
> **Cross-Links:** [02-engine-communication.md](02-engine-communication.md), [04-event-contract.md](04-event-contract.md)

---

## Anti-Corruption Rule

If one engine needs another engine's data shape, it must consume the public capability contract, not replicate internal assumptions.

If shape translation is needed, create a translator at the boundary.

This prevents internal coupling.

---

## Notification Example

Correct pattern:

```
chat engine emits message.sent
notifications engine listens
notifications engine decides whether to create a notification
```

Wrong pattern:

```
chat controller directly imports notifications DAL
chat controller inserts notification rows itself
```

Reason:
chat must not own notification persistence.

---

## Search Example

Correct pattern:

```
chat engine emits message.sent
search engine listens
search engine updates searchable index
```

Wrong pattern:

```
chat DAL writes into search tables
```

Reason:
chat must not own search indexing logic.

---

## Analytics Example

Correct pattern:

```
chat emits conversation.read
analytics listens
analytics records event
```

Wrong pattern:

```
chat controller imports analytics controller
```

Reason:
analytics should remain optional and decoupled.

---

## Capability Ownership Rule

The engine that owns a capability is the sole authority on that domain.

Examples:

```
chat owns message lifecycle
notifications owns notification lifecycle
search owns indexing lifecycle
analytics owns metric/event lifecycle
```

No other engine may mutate another engine's domain state directly except through its published capability.

---

## Failure Rule

A consuming engine must gracefully handle capability failure.

If engine A consumes engine B:

- engine A must not assume engine B is always available
- engine A must handle errors explicitly
- engine A must not leak engine B failure details into unrelated layers

For event-driven integrations:

- event subscribers must be retry-safe
- event publishers must not block core domain completion unless explicitly required
